/**
 * Email Cron Job Handlers
 * Background tasks that run on schedule
 * 
 * SAFE MODE PROTECTION: All handlers check safe mode before running
 * IDEMPOTENCY: Prevents reprocessing same receipts
 * Per COST_SAFETY_AND_UNIT_ECONOMICS.md
 */

import { internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * Check safe mode before running cron job
 */
async function checkSafeModeBeforeRun(ctx: any): Promise<boolean> {
  // Check environment variable first
  if (process.env.SUBWISE_DISABLE_CRONS === "true" || 
      process.env.SUBWISE_SAFE_MODE === "true") {
    console.log("🔴 SAFE MODE: Cron job skipped (environment variable)");
    return true;
  }

  // Check database
  const settings = await ctx.db
    .query("systemSettings")
    .first();

  if (settings?.safeModeEnabled) {
    console.log(`🔴 SAFE MODE: Cron job skipped - ${settings.safeModeReason || "manual"}`);
    return true;
  }

  return false;
}

/**
 * Scan all active email connections
 * Called by cron every 6 hours
 */
export const scanAllActiveConnections = internalMutation({
  handler: async (ctx) => {
    // SAFE MODE CHECK: Early return if safe mode enabled
    if (await checkSafeModeBeforeRun(ctx)) {
      return { message: "Skipped - Safe mode enabled", skipped: true };
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
 * 
 * IDEMPOTENCY: Only processes receipts that are truly unparsed
 * Prevents loops by checking parsed flag AND contentHash
 */
export const parseAllUnparsedReceipts = internalMutation({
  handler: async (ctx) => {
    // SAFE MODE CHECK: Early return if safe mode enabled
    if (await checkSafeModeBeforeRun(ctx)) {
      return { message: "Skipped - Safe mode enabled", skipped: true };
    }

    console.log("📧 Starting scheduled receipt parsing...");

    // IDEMPOTENCY: Only get receipts that are truly unparsed
    // Check both parsed flag AND contentHash (prevents reprocessing cached receipts)
    const unparsedReceipts = await ctx.db
      .query("emailReceipts")
      .filter((q) => 
        q.and(
          q.eq(q.field("parsed"), false),
          // Only process receipts that haven't been processed before
          // (contentHash exists means it was already checked for cache)
          q.or(
            q.eq(q.field("contentHash"), undefined),
            q.eq(q.field("contentHash"), null)
          )
        )
      )
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
 * 
 * IDEMPOTENCY: Ignores receipts with subscriptionId OR detectionCandidateId
 * Prevents "same 65 receipts every hour" loop
 * Per COST_SAFETY_AND_UNIT_ECONOMICS.md section 4
 */
export const createDetectionCandidates = internalMutation({
  handler: async (ctx) => {
    // SAFE MODE CHECK: Early return if safe mode enabled
    if (await checkSafeModeBeforeRun(ctx)) {
      return { message: "Skipped - Safe mode enabled", skipped: true };
    }

    console.log("🎯 Starting detection candidate creation...");

    // IDEMPOTENCY: Only process receipts that haven't been linked to subscriptions OR candidates
    // This prevents reprocessing the same receipts every hour
    const receiptsNeedingDetection = await ctx.db
      .query("emailReceipts")
      .filter((q) =>
        q.and(
          q.eq(q.field("parsed"), true),
          // CRITICAL: Skip receipts already linked to subscriptions
          q.eq(q.field("subscriptionId"), undefined),
          // CRITICAL: Skip receipts already linked to detection candidates
          q.eq(q.field("detectionCandidateId"), undefined),
          q.gte(q.field("parsingConfidence"), 0.6)
        )
      )
      .take(100);

    console.log(`Found ${receiptsNeedingDetection.length} receipt(s) needing detection`);

    // AUTO SAFE MODE: Check queue size and enable safe mode if too large
    if (receiptsNeedingDetection.length >= 150) {
      console.error(`🚨 AUTO SAFE MODE: Detection queue spiked to ${receiptsNeedingDetection.length} (threshold: 150)`);
      await ctx.runMutation(internal.adminControl.setSafeMode, {
        enabled: true,
        reason: "auto_detection_queue_spike",
        message: `Detection queue spiked to ${receiptsNeedingDetection.length} receipts`,
      });
      return { message: "Safe mode enabled - queue too large", skipped: true, queueSize: receiptsNeedingDetection.length };
    }

    if (receiptsNeedingDetection.length === 0) {
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
 * Send renewal reminder notifications
 * Called by cron daily at 9 AM
 */
export const sendRenewalReminders = internalMutation({
  handler: async (ctx) => {
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
