/**
 * Email Cron Job Handlers
 * Background tasks that run on schedule
 */

import { internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * Scan all active email connections
 * Called by cron every 6 hours
 */
export const scanAllActiveConnections = internalMutation({
  handler: async (ctx) => {
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

    // Schedule scan for each connection
    for (const connection of connections) {
      await ctx.scheduler.runAfter(0, internal.emailScanner.scanGmailForReceipts, {
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
    console.log("🎯 Starting detection candidate creation...");

    // Get all users with parsed receipts that haven't been converted to candidates
    const receiptsNeedingDetection = await ctx.db
      .query("emailReceipts")
      .filter((q) =>
        q.and(
          q.eq(q.field("parsed"), true),
          q.eq(q.field("detectionCandidateId"), undefined),
          q.gte(q.field("parsingConfidence"), 0.6)
        )
      )
      .take(100);

    console.log(`Found ${receiptsNeedingDetection.length} receipt(s) needing detection`);

    if (receiptsNeedingDetection.length === 0) {
      return { message: "No receipts needing detection" };
    }

    // Group by user and schedule detection
    const userIds = new Set(receiptsNeedingDetection.map((r) => r.userId));

    for (const userId of userIds) {
      await ctx.scheduler.runAfter(0, internal.emailDetection.createDetectionCandidatesFromReceipts, {
        userId,
      });
    }

    return {
      message: `Scheduled detection for ${userIds.size} user(s)`,
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
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    let notificationCount = 0;

    for (const subscription of subscriptions) {
      if (!subscription.renewalDate) continue;

      const daysUntilRenewal = Math.floor((subscription.renewalDate - now) / (24 * 60 * 60 * 1000));

      // Send notifications at 7, 3, and 1 day before renewal
      if (
        daysUntilRenewal === 7 ||
        daysUntilRenewal === 3 ||
        daysUntilRenewal === 1
      ) {
        // Check if we already sent this notification
        const existingNotification = await ctx.db
          .query("notifications")
          .filter((q) =>
            q.and(
              q.eq(q.field("userId"), subscription.userId),
              q.eq(q.field("type"), "renewal_reminder"),
              // Check if notification was created in the last 23 hours (avoid duplicates)
              q.gte(q.field("createdAt"), now - 23 * 60 * 60 * 1000)
            )
          )
          .first();

        if (existingNotification) {
          console.log(`Skipping duplicate notification for ${subscription.name}`);
          continue;
        }

        // Create notification
        await ctx.db.insert("notifications", {
          userId: subscription.userId,
          type: "renewal_reminder",
          title: `${subscription.name} renews in ${daysUntilRenewal} day${daysUntilRenewal === 1 ? "" : "s"}`,
          message: `Your ${subscription.name} subscription will renew on ${new Date(subscription.renewalDate).toLocaleDateString()} for ${subscription.cost} ${subscription.currency}`,
          data: {
            subscriptionName: subscription.name,
            renewalDate: subscription.renewalDate,
            cost: subscription.cost,
            currency: subscription.currency,
            daysUntil: daysUntilRenewal,
          },
          read: false,
          createdAt: now,
        });

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
