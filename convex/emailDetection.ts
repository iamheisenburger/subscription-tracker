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
        // Subscription already exists - link receipt and handle based on receipt type
        await ctx.db.patch(receipt._id, {
          subscriptionId: existingSubscription._id,
        });

        // HANDLE CANCELLATION RECEIPTS
        if (receipt.receiptType === "cancellation") {
          console.log(`🔴 Cancellation detected for ${receipt.merchantName} - marking subscription as inactive`);

          await ctx.db.patch(existingSubscription._id, {
            isActive: false,
            updatedAt: now,
          });

          // Add to notification history
          await ctx.db.insert("notificationHistory", {
            userId: args.userId,
            type: "subscription_cancelled",
            title: `Subscription Cancelled: ${receipt.merchantName}`,
            message: `Your ${receipt.merchantName} subscription has been cancelled`,
            read: false,
            metadata: {
              subscriptionId: existingSubscription._id,
              cancelledAt: receipt.receivedAt,
            },
            createdAt: now,
          });

          continue;
        }

        // HANDLE RENEWAL RECEIPTS
        if (receipt.receiptType === "renewal") {
          // Update last charge date
          await ctx.db.patch(existingSubscription._id, {
            lastChargeAt: receipt.receivedAt,
            updatedAt: now,
          });
        }

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

      // ============================================================================
      // SKIP CANDIDATE CREATION for non-active receipts
      // ============================================================================

      // Don't create candidates for cancellation, trial started, or trial ending receipts
      if (
        receipt.receiptType === "cancellation" ||
        receipt.receiptType === "trial_started" ||
        receipt.receiptType === "trial_ending" ||
        receipt.receiptType === "payment_failed"
      ) {
        console.log(`⏭️  Skipping candidate creation for ${receipt.receiptType} receipt: ${receipt.merchantName}`);
        continue;
      }

      // ============================================================================
      // SIMPLE RENEWAL PREDICTION - Use single receipt data (no pattern analysis)
      // FIX: Pattern analysis was causing byte limit errors with large receipt histories
      // ============================================================================

      // Create simple prediction from single receipt data
      const prediction = createSimplePrediction(receipt);

      // Create new detection candidate with smart predictions
      const candidateId = await ctx.db.insert("detectionCandidates", {
        userId: args.userId,
        source: "email",
        emailReceiptId: receipt._id,
        proposedName: receipt.merchantName,
        proposedAmount: receipt.amount,
        proposedCurrency: receipt.currency || "USD",
        proposedCadence: prediction.cadence,
        proposedNextBilling: prediction.nextRenewal,
        confidence: prediction.confidence,
        detectionReason: prediction.reason,
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
      console.log(`New detection candidate: ${receipt.merchantName} (${receipt.amount} ${receipt.currency}/${prediction.cadence}) - Confidence: ${Math.round(prediction.confidence * 100)}%`);
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

// ============================================================================
// RENEWAL PREDICTION FUNCTIONS
// ============================================================================

/**
 * Create simple prediction from single receipt data (no pattern analysis)
 * FIX: Avoids byte limit errors by not querying receipt history
 */
function createSimplePrediction(receipt: any): {
  cadence: "weekly" | "monthly" | "yearly";
  nextRenewal: number;
  confidence: number;
  reason: string;
} {
  // Validate and normalize cadence
  const cadence = validateCadence(receipt.billingCycle);

  // Calculate next renewal date
  const daysToAdd = cadence === "weekly" ? 7 : cadence === "monthly" ? 30 : 365;
  const nextRenewal = receipt.nextChargeDate ||
                     receipt.receivedAt + daysToAdd * 24 * 60 * 60 * 1000;

  // Use parsing confidence as base, but cap at 0.75 for single receipt
  const confidence = Math.min(0.75, receipt.parsingConfidence || 0.6);

  // Build reason
  const reason = `Single ${cadence} receipt detected from ${receipt.merchantName}`;

  return {
    cadence,
    nextRenewal,
    confidence,
    reason,
  };
}

/**
 * Analyze receipt patterns to predict billing cycle and next renewal
 * Adapted from bank transaction detection logic
 * NOTE: Currently DISABLED to avoid byte limit errors - kept for future use
 */
function analyzeReceiptPatterns(
  receipts: any[],
  parsedCycle: string | null | undefined
): {
  cadence: "weekly" | "monthly" | "yearly";
  nextRenewal: number;
  confidence: number;
  reason: string;
} {
  const now = Date.now();

  // Single receipt: use parsed cycle with low confidence
  if (receipts.length === 1) {
    const receipt = receipts[0];
    const cadence = validateCadence(parsedCycle);
    const daysToAdd = cadence === "weekly" ? 7 : cadence === "monthly" ? 30 : 365;

    const nextRenewal = receipt.nextChargeDate ||
                       receipt.receivedAt + daysToAdd * 24 * 60 * 60 * 1000;

    return {
      cadence,
      nextRenewal,
      confidence: 0.5, // Low confidence with single receipt
      reason: `Single ${cadence} receipt detected`,
    };
  }

  // Multiple receipts: analyze pattern
  // Sort by received date
  const sorted = [...receipts].sort((a, b) => a.receivedAt - b.receivedAt);

  // Calculate intervals between receipts (in days)
  const intervals: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const prevDate = sorted[i - 1].receivedAt;
    const currDate = sorted[i].receivedAt;
    const daysDiff = (currDate - prevDate) / (1000 * 60 * 60 * 24);
    intervals.push(daysDiff);
  }

  // Calculate median interval
  const medianInterval = calculateMedian(intervals);

  // Determine cadence based on median interval
  let cadence: "weekly" | "monthly" | "yearly";
  let expectedInterval: number;

  if (medianInterval >= 6 && medianInterval <= 8) {
    cadence = "weekly";
    expectedInterval = 7;
  } else if (medianInterval >= 25 && medianInterval <= 35) {
    cadence = "monthly";
    expectedInterval = 30;
  } else if (medianInterval >= 350 && medianInterval <= 380) {
    cadence = "yearly";
    expectedInterval = 365;
  } else {
    // No clear pattern - fallback to parsed cycle
    cadence = validateCadence(parsedCycle);
    expectedInterval = cadence === "weekly" ? 7 : cadence === "monthly" ? 30 : 365;
  }

  // Calculate periodicity score (how consistent are intervals?)
  const periodicityScore = calculatePeriodicityScore(intervals, expectedInterval);

  // Calculate confidence based on:
  // - Number of receipts (more = higher confidence)
  // - Periodicity score (consistent intervals = higher confidence)
  // - Parsed cycle match (if parsed cycle matches detected pattern)
  let confidence = periodicityScore * 0.7;

  // Bonus for multiple receipts
  if (receipts.length >= 3) {
    confidence += 0.15;
  }
  if (receipts.length >= 5) {
    confidence += 0.1;
  }

  // Bonus if parsed cycle matches detected pattern
  if (parsedCycle && parsedCycle === cadence) {
    confidence += 0.05;
  }

  // Cap at 1.0
  confidence = Math.min(1.0, confidence);

  // Predict next renewal based on last receipt + median interval
  const lastReceipt = sorted[sorted.length - 1];
  const nextRenewal = lastReceipt.receivedAt + expectedInterval * 24 * 60 * 60 * 1000;

  // Build detection reason
  const reason = buildDetectionReason(
    receipts.length,
    cadence,
    periodicityScore,
    medianInterval,
    expectedInterval
  );

  return {
    cadence,
    nextRenewal,
    confidence,
    reason,
  };
}

/**
 * Validate and normalize cadence string
 */
function validateCadence(cadence: string | null | undefined): "weekly" | "monthly" | "yearly" {
  if (cadence === "weekly" || cadence === "monthly" || cadence === "yearly") {
    return cadence;
  }
  return "monthly"; // Default fallback
}

/**
 * Calculate median value from array
 */
function calculateMedian(values: number[]): number {
  if (values.length === 0) return 30; // Default to monthly
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

/**
 * Calculate periodicity score (0-1, how consistent are intervals?)
 */
function calculatePeriodicityScore(intervals: number[], expectedInterval: number): number {
  if (intervals.length === 0) return 0.5;

  // Calculate how close each interval is to expected
  const deviations = intervals.map((interval) => {
    const deviation = Math.abs(interval - expectedInterval);
    const percentDeviation = deviation / expectedInterval;
    return Math.max(0, 1 - percentDeviation);
  });

  // Average score
  return deviations.reduce((sum, score) => sum + score, 0) / deviations.length;
}

/**
 * Build human-readable detection reason
 */
function buildDetectionReason(
  receiptCount: number,
  cadence: string,
  periodicityScore: number,
  medianInterval: number,
  expectedInterval: number
): string {
  const reasons: string[] = [];

  // Receipt count
  reasons.push(`${receiptCount} receipt${receiptCount > 1 ? "s" : ""} found`);

  // Pattern detection
  if (receiptCount > 1) {
    const avgDays = Math.round(medianInterval);
    if (periodicityScore >= 0.9) {
      reasons.push(`highly consistent ${cadence} pattern (~${avgDays} days apart)`);
    } else if (periodicityScore >= 0.7) {
      reasons.push(`consistent ${cadence} pattern (~${avgDays} days apart)`);
    } else if (periodicityScore >= 0.5) {
      reasons.push(`likely ${cadence} pattern (~${avgDays} days apart)`);
    } else {
      reasons.push(`estimated as ${cadence}`);
    }
  }

  return reasons.join(", ");
}
