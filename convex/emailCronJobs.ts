/**
 * Email Cron Job Handlers
 * Background tasks that run on schedule
 */

import { internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

// Centralized kill switch for all cron-driven automations.
// If either SUBWISE_DISABLE_CRONS or SUBWISE_SAFE_MODE is truthy ('true'|'1'|'yes'),
// the cron handlers will no-op to prevent any background charges.
function isAutomationDisabled(): boolean {
  const flag =
    process.env.SUBWISE_DISABLE_CRONS ??
    process.env.SUBWISE_SAFE_MODE ??
    "";
  const normalized = String(flag).trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes";
}

async function getGlobalSettings(ctx: any) {
  const existing = await ctx.db
    .query("systemSettings")
    .withIndex("by_key", (q: any) => q.eq("key", "global"))
    .first();
  if (existing) return existing;
  const now = Date.now();
  const _id = await ctx.db.insert("systemSettings", {
    key: "global",
    safeMode: false,
    cronsDisabled: false,
    detectionCountStreak: 0,
    lastHeuristicsUpdateAt: now,
  });
  return await ctx.db.get(_id);
}

async function isAutomationDisabledAsync(ctx: any): Promise<boolean> {
  if (isAutomationDisabled()) return true;
  const settings = await getGlobalSettings(ctx);
  return Boolean(settings?.safeMode || settings?.cronsDisabled);
}

/**
 * Scan all active email connections
 * Called by cron every 6 hours
 */
export const scanAllActiveConnections = internalMutation({
  handler: async (ctx) => {
    if (await isAutomationDisabledAsync(ctx)) {
      console.log("🛑 SAFE MODE: scanAllActiveConnections skipped (crons disabled).");
      return { message: "SAFE MODE: crons disabled", skipped: true };
    }
    console.log("🔍 Starting scheduled email scan...");

    // Get all active email connections
    const connections = await ctx.db
      .query("emailConnections")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    console.log(`Found ${connections.length} active email connection(s)`);

    if (connections.length === 0) {
      return { message: "No active connections to scan" };
    }

    // Schedule scan for each connection using Actions
    for (const connection of connections) {
      await ctx.scheduler.runAfter(0, internal.emailScannerActions.scanGmailForReceipts, {
        connectionId: connection._id,
      });
    }

    return {
      message: `Scheduled scans for ${connections.length} connection(s)`,
      connectionCount: connections.length,
    };
  },
});

/**
 * Parse all unparsed receipts
 * Called by cron every hour
 */
export const parseAllUnparsedReceipts = internalMutation({
  handler: async (ctx) => {
    if (await isAutomationDisabledAsync(ctx)) {
      console.log("🛑 SAFE MODE: parseAllUnparsedReceipts skipped (crons disabled).");
      return { message: "SAFE MODE: crons disabled", skipped: true };
    }
    console.log("📧 Starting scheduled receipt parsing...");

    // Get unparsed receipts (limit to 100 per run to avoid timeout)
    const unparsedReceipts = await ctx.db
      .query("emailReceipts")
      .filter((q) => q.eq(q.field("parsed"), false))
      .take(100);

    console.log(`Found ${unparsedReceipts.length} unparsed receipt(s)`);

    if (unparsedReceipts.length === 0) {
      return { message: "No unparsed receipts" };
    }

    // Schedule parsing for each receipt
    for (const receipt of unparsedReceipts) {
      await ctx.scheduler.runAfter(0, internal.receiptParser.parseReceipt, {
        receiptId: receipt._id,
      });
    }

    return {
      message: `Scheduled parsing for ${unparsedReceipts.length} receipt(s)`,
      receiptCount: unparsedReceipts.length,
    };
  },
});

/**
 * Create detection candidates from parsed receipts
 * Called by cron every hour
 */
export const createDetectionCandidates = internalMutation({
  handler: async (ctx) => {
    if (await isAutomationDisabledAsync(ctx)) {
      console.log("🛑 SAFE MODE: createDetectionCandidates skipped (crons disabled).");
      return { message: "SAFE MODE: crons disabled", skipped: true };
    }
    console.log("🎯 Starting detection candidate creation...");

    // Get all users with parsed receipts that haven't been converted to candidates
    const receiptsNeedingDetection = await ctx.db
      .query("emailReceipts")
      .filter((q) =>
        q.and(
          q.eq(q.field("parsed"), true),
          q.eq(q.field("detectionCandidateId"), undefined),
          // Avoid endless re-processing: if linked to a subscription,
          // this receipt no longer needs detection.
          q.eq(q.field("subscriptionId"), undefined),
          q.gte(q.field("parsingConfidence"), 0.6)
        )
      )
      .take(100);

    const count = receiptsNeedingDetection.length;
    console.log(`Found ${count} receipt(s) needing detection`);

    // ================= AUTO KILL SWITCH HEURISTICS =================
    const settings = await getGlobalSettings(ctx);
    const now = Date.now();
    const previousCount = settings.lastDetectionCount ?? 0;
    const previousStreak = settings.detectionCountStreak ?? 0;

    const roughlyEqual =
      Math.abs((count ?? 0) - (previousCount ?? 0)) <= Math.max(2, Math.round((previousCount ?? 0) * 0.05));

    let nextStreak = roughlyEqual && count > 0 ? previousStreak + 1 : 0;

    // Thresholds:
    // - If queue size >= 150 in any single run -> safe mode
    // - If queue is nonzero and hasn't dropped meaningfully for 3+ consecutive runs -> safe mode
    const queueTooLarge = count >= 150;
    const looksStuck = nextStreak >= 3 && count > 0;

    if (queueTooLarge || looksStuck) {
      await ctx.db.patch(settings._id, {
        safeMode: true,
        cronsDisabled: true,
        autoKillReason: queueTooLarge ? "detection_queue_large" : "detection_queue_stuck",
        autoKillAt: now,
        lastDetectionCount: count,
        detectionCountStreak: nextStreak,
        lastHeuristicsUpdateAt: now,
      });
      console.log(
        `🛑 AUTO SAFE MODE: Cron disabled due to ${
          queueTooLarge ? "large detection queue" : "stuck detection queue"
        } (count=${count}, previous=${previousCount}, streak=${nextStreak}).`
      );
      return { message: "AUTO SAFE MODE engaged", skipped: true };
    }

    // Persist heuristics for next run
    await ctx.db.patch(settings._id, {
      lastDetectionCount: count,
      detectionCountStreak: nextStreak,
      lastHeuristicsUpdateAt: now,
    });
    // ===============================================================

    if (count === 0) {
      return { message: "No receipts needing detection" };
    }

    // Group by user and schedule pattern-based detection
    const userIds = new Set(receiptsNeedingDetection.map((r) => r.userId));

    for (const userId of userIds) {
      await ctx.scheduler.runAfter(0, internal.patternDetection.runPatternBasedDetection, {
        userId,
      });
    }

    return {
      message: `Scheduled pattern-based detection for ${userIds.size} user(s)`,
      userCount: userIds.size,
      receiptCount: receiptsNeedingDetection.length,
    };
  },
});

/**
 * Weekly incremental scans per user (cost-safe)
 *
 * NOTE: This is an internalMutation (not action) to match the original
 * snapshot behavior. We deliberately cast to `any` for the one place we need
 * `runAction` to keep TypeScript happy while preserving the runtime pattern
 * used in the stable repo.
 */
export const scheduleWeeklyIncrementalScans = internalMutation({
  handler: async (ctx) => {
    if (await isAutomationDisabledAsync(ctx)) {
      console.log("🛑 SAFE MODE: scheduleWeeklyIncrementalScans skipped (crons disabled).");
      return { message: "SAFE MODE: crons disabled", skipped: true };
    }
    console.log("📅 Scheduling weekly incremental scans for active users...");

    // Collect active connections
    const activeConnections = await ctx.db
      .query("emailConnections")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    // Preflight token health per connection
    const healthyUserIds = new Set<string>();
    for (const conn of activeConnections) {
      const preflight = await (ctx as any).runAction(internal.emailScannerActions.preflightGmailToken, {
        connectionId: conn._id,
      });
      if (preflight.ok) healthyUserIds.add(String(conn.userId));
    }
    const userIds = Array.from(healthyUserIds);
    console.log(`👥 Found ${userIds.length} user(s) with at least one healthy connection`);

    for (const userId of userIds) {
      const user = await ctx.db.get(userId as Id<"users">);
      if (!user?.clerkId) continue;
      await ctx.scheduler.runAfter(0, (internal.scanning.orchestrator as any).startScan, {
        clerkUserId: user.clerkId,
        forceFullScan: false,
        overrideManualCooldown: true,
      });
    }

    return { message: `Scheduled weekly incremental scans for ${userIds.length} user(s)`, userCount: userIds.length };
  },
});

/**
 * Send renewal reminder notifications
 * Called by cron daily at 9 AM
 */
export const sendRenewalReminders = internalMutation({
  handler: async (ctx) => {
    if (await isAutomationDisabledAsync(ctx)) {
      console.log("🛑 SAFE MODE: sendRenewalReminders skipped (crons disabled).");
      return { message: "SAFE MODE: crons disabled", skipped: true };
    }
    console.log("🔔 Starting renewal reminder notifications...");

    const now = Date.now();
    const oneDayFromNow = now + 24 * 60 * 60 * 1000;
    const threeDaysFromNow = now + 3 * 24 * 60 * 60 * 1000;
    const sevenDaysFromNow = now + 7 * 24 * 60 * 60 * 1000;

    // Get all active subscriptions
    const subscriptions = await ctx.db
      .query("subscriptions")
      .withIndex("by_user_active")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    let notificationCount = 0;

    for (const subscription of subscriptions) {
      if (!subscription.nextBillingDate) continue;

      const daysUntilRenewal = Math.floor((subscription.nextBillingDate - now) / (24 * 60 * 60 * 1000));

      // Send notifications at 7, 3, and 1 day before renewal
      if (
        daysUntilRenewal === 7 ||
        daysUntilRenewal === 3 ||
        daysUntilRenewal === 1
      ) {
        // TODO: Create notification once notifications table is added to schema
        console.log(`Renewal reminder for ${subscription.name}: ${daysUntilRenewal} days until renewal`);
        notificationCount++;
      }
    }

    console.log(`Created ${notificationCount} renewal reminder notification(s)`);

    return {
      message: `Sent ${notificationCount} renewal reminder(s)`,
      notificationCount,
    };
  },
});
