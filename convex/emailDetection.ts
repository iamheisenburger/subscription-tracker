/**
 * Email Detection Service
 * Converts parsed email receipts into subscription detection candidates
 */

import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * Create detection candidates from parsed receipts
 * Only creates candidates for high-confidence receipts
 */
export const createDetectionCandidatesFromReceipts = internalMutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get parsed receipts that haven't been converted to candidates yet
    const parsedReceipts = await ctx.db
      .query("emailReceipts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) =>
        q.and(
          q.eq(q.field("parsed"), true),
          q.eq(q.field("detectionCandidateId"), undefined),
          q.gte(q.field("parsingConfidence"), 0.6) // Only high confidence
        )
      )
      .take(50);

    if (parsedReceipts.length === 0) {
      return { created: 0, message: "No new parsed receipts to process" };
    }

    const now = Date.now();
    let createdCount = 0;

    for (const receipt of parsedReceipts) {
      // Skip if no merchant or amount
      if (!receipt.merchantName || !receipt.amount) {
        continue;
      }

      // Check if subscription already exists for this merchant
      const existingSubscription = await ctx.db
        .query("subscriptions")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .filter((q) => q.eq(q.field("name"), receipt.merchantName!))
        .first();

      if (existingSubscription) {
        // Subscription already exists - link receipt and skip candidate creation
        await ctx.db.patch(receipt._id, {
          subscriptionId: existingSubscription._id,
        });

        // If this is a price change, track it
        if (existingSubscription.cost !== receipt.amount) {
          await trackPriceChange(ctx, existingSubscription._id, receipt.amount!, receipt.currency!);
        }

        continue;
      }

      // Check if candidate already exists for this merchant
      const existingCandidate = await ctx.db
        .query("detectionCandidates")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .filter((q) =>
          q.and(
            q.eq(q.field("proposedName"), receipt.merchantName!),
            q.eq(q.field("status"), "pending")
          )
        )
        .first();

      if (existingCandidate) {
        // Candidate already exists - just link receipt
        await ctx.db.patch(receipt._id, {
          detectionCandidateId: existingCandidate._id,
        });

        // Update candidate confidence if this receipt has higher confidence
        if (receipt.parsingConfidence! > existingCandidate.confidence) {
          // Validate billing cycle
          const billingCycle = receipt.billingCycle === "weekly" ||
                              receipt.billingCycle === "monthly" ||
                              receipt.billingCycle === "yearly"
            ? receipt.billingCycle
            : "monthly";

          await ctx.db.patch(existingCandidate._id, {
            confidence: receipt.parsingConfidence!,
            proposedAmount: receipt.amount,
            proposedCurrency: receipt.currency!,
            proposedCadence: billingCycle,
          });
        }

        continue;
      }

      // Validate billing cycle
      const billingCycle = receipt.billingCycle === "weekly" ||
                          receipt.billingCycle === "monthly" ||
                          receipt.billingCycle === "yearly"
        ? receipt.billingCycle
        : "monthly";

      // Create new detection candidate
      const candidateId = await ctx.db.insert("detectionCandidates", {
        userId: args.userId,
        source: "email",
        emailReceiptId: receipt._id,
        proposedName: receipt.merchantName,
        proposedAmount: receipt.amount,
        proposedCurrency: receipt.currency || "USD",
        proposedCadence: billingCycle,
        proposedNextBilling: receipt.nextChargeDate || now + 30 * 24 * 60 * 60 * 1000,
        confidence: receipt.parsingConfidence!,
        detectionReason: `Detected from email receipt: ${receipt.subject}`,
        status: "pending",
        rawData: {
          from: receipt.from,
          subject: receipt.subject,
          orderId: receipt.orderId,
        },
        createdAt: now,
      });

      // Link receipt to candidate
      await ctx.db.patch(receipt._id, {
        detectionCandidateId: candidateId,
      });

      createdCount++;

      // TODO: Create notification for user once notifications table is added to schema
      console.log(`New detection candidate: ${receipt.merchantName} (${receipt.amount} ${receipt.currency}/${billingCycle})`);
    }

    console.log(`Created ${createdCount} detection candidates from email receipts`);

    return {
      created: createdCount,
      processed: parsedReceipts.length,
      message: `Created ${createdCount} new detection candidate(s)`,
    };
  },
});

/**
 * Track price change for existing subscription
 */
async function trackPriceChange(
  ctx: any,
  subscriptionId: any,
  newAmount: number,
  currency: string
) {
  const subscription = await ctx.db.get(subscriptionId);
  if (!subscription) return;

  const oldAmount = subscription.cost;
  const percentChange = ((newAmount - oldAmount) / oldAmount) * 100;

  const now = Date.now();

  // Create price history entry
  await ctx.db.insert("priceHistory", {
    subscriptionId,
    userId: subscription.userId,
    oldPrice: oldAmount,
    newPrice: newAmount,
    currency,
    percentChange,
    detectedAt: now,
    createdAt: now,
  });

  // Update subscription with new price
  await ctx.db.patch(subscriptionId, {
    cost: newAmount,
    updatedAt: now,
  });

  // TODO: Create notification if price increased (once notifications table is added)
  if (newAmount > oldAmount) {
    console.log(
      `Price increased for ${subscription.name}: ${oldAmount} → ${newAmount} ${currency} (+${percentChange.toFixed(1)}%)`
    );
  }
}

/**
 * Manually trigger detection candidate creation for a user
 */
export const triggerEmailDetection = mutation({
  args: {
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkUserId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.scheduler.runAfter(0, internal.emailDetection.createDetectionCandidatesFromReceipts, {
      userId: user._id,
    });

    return { message: "Scheduled email detection processing" };
  },
});

/**
 * Get detection statistics for a user
 */
export const getEmailDetectionStats = query({
  args: {
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkUserId))
      .first();

    if (!user) {
      return null;
    }

    // Get email-sourced detection candidates
    const emailCandidates = await ctx.db
      .query("detectionCandidates")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("source"), "email"))
      .collect();

    const pending = emailCandidates.filter((c) => c.status === "pending").length;
    const accepted = emailCandidates.filter((c) => c.status === "accepted").length;
    const dismissed = emailCandidates.filter((c) => c.status === "dismissed").length;

    // Get receipts linked to subscriptions
    const receipts = await ctx.db
      .query("emailReceipts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const linkedReceipts = receipts.filter((r) => r.subscriptionId !== undefined).length;

    return {
      totalEmailDetections: emailCandidates.length,
      pending,
      accepted,
      dismissed,
      linkedReceipts,
      totalReceipts: receipts.length,
    };
  },
});

/**
 * Get recent email detections for a user (for UI display)
 */
export const getRecentEmailDetections = query({
  args: {
    clerkUserId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkUserId))
      .first();

    if (!user) {
      return [];
    }

    const candidates = await ctx.db
      .query("detectionCandidates")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("source"), "email"))
      .order("desc")
      .take(args.limit || 10);

    return candidates;
  },
});

/**
 * Get receipts for a specific subscription
 */
export const getSubscriptionReceipts = query({
  args: {
    clerkUserId: v.string(),
    subscriptionId: v.id("subscriptions"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkUserId))
      .first();

    if (!user) {
      return [];
    }

    const receipts = await ctx.db
      .query("emailReceipts")
      .withIndex("by_subscription", (q) => q.eq("subscriptionId", args.subscriptionId))
      .order("desc")
      .collect();

    return receipts.map((r) => ({
      _id: r._id,
      merchantName: r.merchantName,
      amount: r.amount,
      currency: r.currency,
      receivedAt: r.receivedAt,
      from: r.from,
      subject: r.subject,
    }));
  },
});

/**
 * Full email detection pipeline (scan → parse → detect)
 * Useful for testing the complete flow
 */
export const runFullEmailDetectionPipeline = mutation({
  args: {
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkUserId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Step 1: Trigger email scan
    const connections = await ctx.db
      .query("emailConnections")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    if (connections.length === 0) {
      throw new Error("No active email connections found");
    }

    // Schedule scans
    for (const connection of connections) {
      await ctx.scheduler.runAfter(0, internal.emailScanner.scanGmailForReceipts, {
        connectionId: connection._id,
      });
    }

    // Step 2: Schedule parsing (with 10s delay to allow scanning to complete)
    await ctx.scheduler.runAfter(10000, internal.receiptParser.parseReceipt, {
      receiptId: connections[0]._id as any, // Will be updated in actual implementation
    });

    // Step 3: Schedule detection (with 20s delay to allow parsing to complete)
    await ctx.scheduler.runAfter(20000, internal.emailDetection.createDetectionCandidatesFromReceipts, {
      userId: user._id,
    });

    return {
      message: "Full email detection pipeline scheduled",
      steps: [
        `Scanning ${connections.length} email connection(s)`,
        "Parsing receipts (in 10s)",
        "Creating detection candidates (in 20s)",
      ],
    };
  },
});
