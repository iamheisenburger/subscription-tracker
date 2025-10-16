/**
 * Convex Functions: Subscription Detection Engine
 * Automatically detects recurring subscriptions from transaction data
 */

import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

/**
 * Run detection for a bank connection
 * Called after transaction sync
 */
export const runDetection = mutation({
  args: {
    connectionId: v.id("bankConnections"),
  },
  handler: async (ctx, args) => {
    // Get connection
    const connection = await ctx.db.get(args.connectionId);
    if (!connection) {
      throw new Error("Bank connection not found");
    }

    // Get all accounts for this connection
    const accounts = await ctx.db
      .query("accounts")
      .withIndex("by_connection", (q) => q.eq("bankConnectionId", args.connectionId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Get all transactions for these accounts (last 12 months for detection)
    const twelveMonthsAgo = Date.now() - 365 * 24 * 60 * 60 * 1000;
    const allTransactions: Doc<"transactions">[] = [];

    for (const account of accounts) {
      const txs = await ctx.db
        .query("transactions")
        .withIndex("by_account", (q) => q.eq("accountId", account._id))
        .filter((q) => q.gte(q.field("createdAt"), twelveMonthsAgo))
        .collect();
      allTransactions.push(...txs);
    }

    console.log(`[Detection] Processing ${allTransactions.length} transactions`);

    // Group transactions by merchant
    const merchantGroups = await groupTransactionsByMerchant(ctx, allTransactions);

    // Generate candidates from each merchant group
    const candidates: Array<{
      userId: Id<"users">;
      merchantId: Id<"merchants">;
      transactionIds: Id<"transactions">[];
      proposedName: string;
      proposedAmount: number;
      proposedCurrency: string;
      proposedCadence: "weekly" | "monthly" | "yearly";
      proposedNextBilling: number;
      confidence: number;
      detectionReason: string;
    }> = [];

    for (const [merchantId, transactions] of Object.entries(merchantGroups)) {
      const candidate = await analyzeTransactionGroup(
        ctx,
        merchantId as Id<"merchants">,
        transactions,
        connection.userId
      );

      if (candidate && candidate.confidence >= 0.5) {
        candidates.push(candidate);
      }
    }

    console.log(`[Detection] Generated ${candidates.length} candidates with confidence >= 0.5`);

    // Check if candidates already exist or have been dismissed
    const newCandidates: typeof candidates = [];

    for (const candidate of candidates) {
      // Check if already exists (pending or accepted)
      const existing = await ctx.db
        .query("detectionCandidates")
        .withIndex("by_user_status", (q) =>
          q.eq("userId", candidate.userId).eq("status", "pending")
        )
        .filter((q) => q.eq(q.field("merchantId"), candidate.merchantId))
        .first();

      // Check if previously dismissed
      const dismissed = await ctx.db
        .query("detectionCandidates")
        .withIndex("by_user_status", (q) =>
          q.eq("userId", candidate.userId).eq("status", "dismissed")
        )
        .filter((q) => q.eq(q.field("merchantId"), candidate.merchantId))
        .first();

      // Only add if not exists and not dismissed
      if (!existing && !dismissed) {
        newCandidates.push(candidate);
      }
    }

    // Insert new candidates
    const insertedIds: Id<"detectionCandidates">[] = [];
    for (const candidate of newCandidates) {
      const id = await ctx.db.insert("detectionCandidates", {
        ...candidate,
        status: "pending",
        createdAt: Date.now(),
      });
      insertedIds.push(id);
    }

    console.log(`[Detection] Created ${insertedIds.length} new detection candidates`);

    // Schedule notifications for new detections (if user has preference enabled)
    if (insertedIds.length > 0) {
      const user = await ctx.db.get(connection.userId);
      if (user) {
        const prefs = await ctx.db
          .query("notificationPreferences")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .first();

        if (prefs?.newSubscriptionDetected) {
          // Queue notification
          await ctx.db.insert("notificationQueue", {
            userId: user._id,
            type: "new_subscription_detected",
            scheduledFor: Date.now(), // Send immediately
            status: "pending",
            emailData: {
              subject: `${insertedIds.length} new subscription${insertedIds.length > 1 ? "s" : ""} detected`,
              template: "new_subscription_detected",
              templateData: {
                count: insertedIds.length,
              },
            },
            attempts: 0,
            createdAt: Date.now(),
          });
        }
      }
    }

    return {
      totalTransactions: allTransactions.length,
      merchantGroups: Object.keys(merchantGroups).length,
      candidatesGenerated: candidates.length,
      newCandidatesCreated: insertedIds.length,
    };
  },
});

/**
 * Group transactions by merchant (normalized)
 */
async function groupTransactionsByMerchant(
  ctx: any,
  transactions: Doc<"transactions">[]
): Promise<Record<string, Doc<"transactions">[]>> {
  const groups: Record<string, Doc<"transactions">[]> = {};

  for (const tx of transactions) {
    // Skip pending transactions
    if (tx.pending) continue;

    // Skip credits (refunds)
    if (tx.amount < 0) continue;

    let merchantId = tx.merchantId;

    // If no merchant ID, try to normalize
    if (!merchantId && tx.merchantName) {
      const foundMerchantId = await findOrCreateMerchant(ctx, tx.merchantName);
      if (foundMerchantId) {
        merchantId = foundMerchantId;
      }
    }

    if (merchantId) {
      const key = merchantId;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(tx);
    }
  }

  return groups;
}

/**
 * Find or create merchant based on name
 */
async function findOrCreateMerchant(
  ctx: any,
  merchantName: string
): Promise<Id<"merchants"> | null> {
  const normalized = merchantName.toUpperCase().trim();

  // Check if merchant exists in known directory
  const merchants = await ctx.db.query("merchants").collect();

  for (const merchant of merchants) {
    // Check display name
    if (merchant.displayName.toUpperCase() === normalized) {
      return merchant._id;
    }

    // Check aliases
    if (merchant.aliases) {
      for (const alias of merchant.aliases) {
        if (normalized.includes(alias.toUpperCase()) || alias.toUpperCase().includes(normalized)) {
          return merchant._id;
        }
      }
    }
  }

  // Create new merchant
  const merchantId = await ctx.db.insert("merchants", {
    displayName: merchantName,
    aliases: [normalized],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  return merchantId;
}

/**
 * Analyze a group of transactions for subscription patterns
 */
async function analyzeTransactionGroup(
  ctx: any,
  merchantId: Id<"merchants">,
  transactions: Doc<"transactions">[],
  userId: Id<"users">
): Promise<{
  userId: Id<"users">;
  merchantId: Id<"merchants">;
  transactionIds: Id<"transactions">[];
  proposedName: string;
  proposedAmount: number;
  proposedCurrency: string;
  proposedCadence: "weekly" | "monthly" | "yearly";
  proposedNextBilling: number;
  confidence: number;
  detectionReason: string;
} | null> {
  // Need at least 2 transactions to detect pattern
  if (transactions.length < 2) {
    return null;
  }

  // Sort by date
  const sorted = transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Calculate intervals between transactions (in days)
  const intervals: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const prevDate = new Date(sorted[i - 1].date).getTime();
    const currDate = new Date(sorted[i].date).getTime();
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
  } else if (medianInterval >= 28 && medianInterval <= 33) {
    cadence = "monthly";
    expectedInterval = 30;
  } else if (medianInterval >= 350 && medianInterval <= 380) {
    cadence = "yearly";
    expectedInterval = 365;
  } else {
    // Not a recognized pattern
    return null;
  }

  // Calculate periodicity score (how consistent are the intervals?)
  const periodicityScore = calculatePeriodicityScore(intervals, expectedInterval);

  // Minimum periodicity threshold
  if (periodicityScore < 0.6) {
    return null;
  }

  // Analyze amounts
  const amounts = sorted.map((tx) => tx.amount);
  const medianAmount = calculateMedian(amounts);
  const amountVariance = calculateVariance(amounts, medianAmount);

  // Amount consistency score (lower variance = higher score)
  const amountScore = Math.max(0, 1 - amountVariance / medianAmount);

  // Get merchant info
  const merchant = await ctx.db.get(merchantId);
  if (!merchant) return null;

  // Calculate overall confidence
  let confidence = (periodicityScore * 0.6) + (amountScore * 0.3);

  // Bonus points for known merchants
  if (merchant.knownProviderKey) {
    confidence += 0.1;
  }

  // Bonus for more transactions
  if (sorted.length >= 4) {
    confidence += 0.05;
  }

  // Cap at 1.0
  confidence = Math.min(1.0, confidence);

  // Estimate next billing date
  const lastTransaction = sorted[sorted.length - 1];
  const lastDate = new Date(lastTransaction.date).getTime();
  const proposedNextBilling = lastDate + expectedInterval * 24 * 60 * 60 * 1000;

  // Build detection reason
  const detectionReason = buildDetectionReason(
    sorted.length,
    cadence,
    periodicityScore,
    amountScore,
    merchant.knownProviderKey
  );

  return {
    userId,
    merchantId,
    transactionIds: sorted.map((tx) => tx._id),
    proposedName: merchant.displayName,
    proposedAmount: medianAmount,
    proposedCurrency: sorted[0].currency,
    proposedCadence: cadence,
    proposedNextBilling,
    confidence,
    detectionReason,
  };
}

/**
 * Build human-readable detection reason
 */
function buildDetectionReason(
  txCount: number,
  cadence: string,
  periodicityScore: number,
  amountScore: number,
  knownProvider?: string
): string {
  const reasons: string[] = [];

  reasons.push(`${txCount} ${cadence} charges detected`);

  if (periodicityScore >= 0.9) {
    reasons.push("highly consistent timing");
  } else if (periodicityScore >= 0.7) {
    reasons.push("consistent timing");
  }

  if (amountScore >= 0.9) {
    reasons.push("identical amounts");
  } else if (amountScore >= 0.7) {
    reasons.push("similar amounts");
  }

  if (knownProvider) {
    reasons.push("known subscription service");
  }

  return reasons.join(", ");
}

/**
 * Calculate median
 */
function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/**
 * Calculate variance
 */
function calculateVariance(values: number[], mean: number): number {
  if (values.length === 0) return 0;
  const squareDiffs = values.map((value) => Math.pow(value - mean, 2));
  return Math.sqrt(squareDiffs.reduce((sum, val) => sum + val, 0) / values.length);
}

/**
 * Calculate periodicity score (0-1, how consistent are intervals?)
 */
function calculatePeriodicityScore(intervals: number[], expectedInterval: number): number {
  if (intervals.length === 0) return 0;

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
 * Get pending detection candidates for a user
 */
export const getPendingCandidates = query({
  args: {
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkUserId))
      .first();

    if (!user) {
      return [];
    }

    // Get pending candidates
    const candidates = await ctx.db
      .query("detectionCandidates")
      .withIndex("by_user_status", (q) => q.eq("userId", user._id).eq("status", "pending"))
      .order("desc")
      .collect();

    // Enrich with merchant data
    const enriched = await Promise.all(
      candidates.map(async (candidate) => {
        const merchant = await ctx.db.get(candidate.merchantId);
        return {
          ...candidate,
          merchant,
        };
      })
    );

    return enriched;
  },
});

/**
 * Accept a detection candidate (create subscription)
 */
export const acceptCandidate = mutation({
  args: {
    candidateId: v.id("detectionCandidates"),
    clerkUserId: v.string(),
    overrides: v.optional(
      v.object({
        name: v.optional(v.string()),
        amount: v.optional(v.number()),
        cadence: v.optional(v.union(v.literal("weekly"), v.literal("monthly"), v.literal("yearly"))),
        nextBilling: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Get candidate
    const candidate = await ctx.db.get(args.candidateId);
    if (!candidate) {
      throw new Error("Candidate not found");
    }

    // Verify ownership
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkUserId))
      .first();

    if (!user || user._id !== candidate.userId) {
      throw new Error("Unauthorized");
    }

    // Get merchant for category/description
    const merchant = await ctx.db.get(candidate.merchantId);

    // Get transactions to calculate accurate predictions
    const transactions = await Promise.all(
      candidate.transactionIds.map((txId) => ctx.db.get(txId))
    );
    const validTransactions = transactions.filter((tx) => tx !== null) as Doc<"transactions">[];

    // Calculate renewal prediction
    const prediction = calculateRenewalPrediction(
      validTransactions,
      args.overrides?.cadence || candidate.proposedCadence,
      candidate.confidence
    );

    // Create subscription with overrides and predictions
    const subscriptionId = await ctx.db.insert("subscriptions", {
      userId: user._id,
      name: args.overrides?.name || candidate.proposedName,
      cost: args.overrides?.amount || candidate.proposedAmount,
      currency: candidate.proposedCurrency,
      billingCycle: args.overrides?.cadence || candidate.proposedCadence,
      nextBillingDate: args.overrides?.nextBilling || candidate.proposedNextBilling,
      category: merchant?.knownProviderKey || "Other",
      isActive: true,
      source: "detected",
      detectionConfidence: candidate.confidence,
      merchantId: candidate.merchantId,
      lastChargeAt: candidate.proposedNextBilling - 30 * 24 * 60 * 60 * 1000, // Approximate
      // Renewal prediction fields
      predictedCadence: prediction.cadence,
      predictedNextRenewal: prediction.nextRenewal,
      predictionConfidence: prediction.confidence,
      predictionLastUpdated: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Update candidate status
    await ctx.db.patch(args.candidateId, {
      status: "accepted",
      acceptedSubscriptionId: subscriptionId,
      reviewedAt: Date.now(),
    });

    // Log audit event
    await ctx.db.insert("auditLogs", {
      userId: user._id,
      action: "subscription_detected_accepted",
      resourceType: "subscription",
      resourceId: subscriptionId,
      metadata: {
        candidateId: args.candidateId,
        confidence: candidate.confidence,
        merchantName: candidate.proposedName,
      },
      createdAt: Date.now(),
    });

    return subscriptionId;
  },
});

/**
 * Dismiss a detection candidate
 */
export const dismissCandidate = mutation({
  args: {
    candidateId: v.id("detectionCandidates"),
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get candidate
    const candidate = await ctx.db.get(args.candidateId);
    if (!candidate) {
      throw new Error("Candidate not found");
    }

    // Verify ownership
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkUserId))
      .first();

    if (!user || user._id !== candidate.userId) {
      throw new Error("Unauthorized");
    }

    // Update status
    await ctx.db.patch(args.candidateId, {
      status: "dismissed",
      reviewedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Calculate renewal prediction based on transaction history
 * Returns predicted cadence, next renewal date, and confidence score
 */
function calculateRenewalPrediction(
  transactions: Doc<"transactions">[],
  detectedCadence: "weekly" | "monthly" | "yearly",
  detectionConfidence: number
): {
  cadence: "weekly" | "monthly" | "yearly";
  nextRenewal: number;
  confidence: number;
} {
  // If less than 2 transactions, use detected values with lower confidence
  if (transactions.length < 2) {
    const now = Date.now();
    const daysToAdd = detectedCadence === "weekly" ? 7 : detectedCadence === "monthly" ? 30 : 365;
    return {
      cadence: detectedCadence,
      nextRenewal: now + daysToAdd * 24 * 60 * 60 * 1000,
      confidence: detectionConfidence * 0.7, // Lower confidence with insufficient data
    };
  }

  // Sort transactions by date
  const sorted = [...transactions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Calculate intervals between transactions
  const intervals: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const prevDate = new Date(sorted[i - 1].date).getTime();
    const currDate = new Date(sorted[i].date).getTime();
    const daysDiff = (currDate - prevDate) / (1000 * 60 * 60 * 24);
    intervals.push(daysDiff);
  }

  // Calculate median interval for prediction
  const medianInterval = calculateMedian(intervals);

  // Determine predicted cadence based on median interval
  let predictedCadence: "weekly" | "monthly" | "yearly";
  let expectedDays: number;

  if (medianInterval >= 6 && medianInterval <= 8) {
    predictedCadence = "weekly";
    expectedDays = 7;
  } else if (medianInterval >= 28 && medianInterval <= 33) {
    predictedCadence = "monthly";
    expectedDays = 30;
  } else if (medianInterval >= 350 && medianInterval <= 380) {
    predictedCadence = "yearly";
    expectedDays = 365;
  } else {
    // Fallback to detected cadence
    predictedCadence = detectedCadence;
    expectedDays = detectedCadence === "weekly" ? 7 : detectedCadence === "monthly" ? 30 : 365;
  }

  // Calculate next renewal based on last transaction + median interval
  const lastTransaction = sorted[sorted.length - 1];
  const lastDate = new Date(lastTransaction.date).getTime();
  const predictedNextRenewal = lastDate + expectedDays * 24 * 60 * 60 * 1000;

  // Calculate prediction confidence based on interval consistency
  const periodicityScore = calculatePeriodicityScore(intervals, expectedDays);

  // Combine detection confidence with periodicity
  const predictionConfidence = Math.min(
    1.0,
    (detectionConfidence * 0.6) + (periodicityScore * 0.4)
  );

  return {
    cadence: predictedCadence,
    nextRenewal: predictedNextRenewal,
    confidence: predictionConfidence,
  };
}

/**
 * Detect price changes for existing subscriptions
 * Called periodically via cron
 */
export const detectPriceChanges = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Get all active subscriptions that came from detection
    const subscriptions = await ctx.db
      .query("subscriptions")
      .withIndex("by_source", (q) => q.eq("source", "detected"))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const priceChanges: Array<{
      subscriptionId: Id<"subscriptions">;
      oldAmount: number;
      newAmount: number;
      percentChange: number;
    }> = [];

    for (const subscription of subscriptions) {
      if (!subscription.merchantId) continue;

      // Get recent transactions for this merchant
      const recentTxs = await ctx.db
        .query("transactions")
        .withIndex("by_merchant", (q) => q.eq("merchantId", subscription.merchantId))
        .filter((q) => q.eq(q.field("pending"), false))
        .order("desc")
        .take(3);

      if (recentTxs.length === 0) continue;

      // Check if amount changed significantly
      const latestAmount = recentTxs[0].amount;
      const percentChange = ((latestAmount - subscription.cost) / subscription.cost) * 100;

      // Threshold: 8% change or $2 absolute
      if (Math.abs(percentChange) >= 8 || Math.abs(latestAmount - subscription.cost) >= 2) {
        priceChanges.push({
          subscriptionId: subscription._id,
          oldAmount: subscription.cost,
          newAmount: latestAmount,
          percentChange,
        });

        // Create price history entry
        await ctx.db.insert("priceHistory", {
          subscriptionId: subscription._id,
          userId: subscription.userId,
          oldPrice: subscription.cost,
          newPrice: latestAmount,
          currency: subscription.currency,
          percentChange,
          detectedAt: Date.now(),
          transactionId: recentTxs[0]._id,
          createdAt: Date.now(),
        });

        // Update subscription amount
        await ctx.db.patch(subscription._id, {
          cost: latestAmount,
          updatedAt: Date.now(),
        });

        // Queue price change alert
        const prefs = await ctx.db
          .query("notificationPreferences")
          .withIndex("by_user", (q) => q.eq("userId", subscription.userId))
          .first();

        if (prefs?.priceChangeAlerts) {
          await ctx.db.insert("notificationQueue", {
            userId: subscription.userId,
            subscriptionId: subscription._id,
            type: "price_change",
            scheduledFor: Date.now(),
            status: "pending",
            emailData: {
              subject: `Price change: ${subscription.name}`,
              template: "price_change",
              templateData: {
                subscriptionName: subscription.name,
                oldAmount: subscription.cost,
                newAmount: latestAmount,
                percentChange: percentChange.toFixed(1),
              },
            },
            attempts: 0,
            createdAt: Date.now(),
          });
        }
      }
    }

    console.log(`[Detection] Found ${priceChanges.length} price changes`);
    return { priceChanges: priceChanges.length };
  },
});

/**
 * Detect duplicate charges
 * Called after each transaction sync
 */
export const detectDuplicateCharges = mutation({
  args: {
    connectionId: v.id("bankConnections"),
  },
  handler: async (ctx, args) => {
    // Get connection
    const connection = await ctx.db.get(args.connectionId);
    if (!connection) {
      throw new Error("Connection not found");
    }

    // Get accounts
    const accounts = await ctx.db
      .query("accounts")
      .withIndex("by_connection", (q) => q.eq("bankConnectionId", args.connectionId))
      .collect();

    const duplicates: Array<{
      transaction1: Id<"transactions">;
      transaction2: Id<"transactions">;
      merchantName: string;
      amount: number;
    }> = [];

    // Check last 7 days for duplicates
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    for (const account of accounts) {
      const recentTxs = await ctx.db
        .query("transactions")
        .withIndex("by_account", (q) => q.eq("accountId", account._id))
        .filter((q) => q.gte(q.field("createdAt"), sevenDaysAgo))
        .filter((q) => q.eq(q.field("pending"), false))
        .collect();

      // Group by merchant and date
      const grouped: Record<string, Doc<"transactions">[]> = {};
      for (const tx of recentTxs) {
        const key = `${tx.merchantId || tx.merchantName}_${tx.date}_${tx.amount}`;
        if (!grouped[key]) {
          grouped[key] = [];
        }
        grouped[key].push(tx);
      }

      // Find duplicates (same merchant, date, amount)
      for (const [key, txs] of Object.entries(grouped)) {
        if (txs.length >= 2) {
          duplicates.push({
            transaction1: txs[0]._id,
            transaction2: txs[1]._id,
            merchantName: txs[0].merchantName || "Unknown",
            amount: txs[0].amount,
          });

          // Queue duplicate charge alert
          const prefs = await ctx.db
            .query("notificationPreferences")
            .withIndex("by_user", (q) => q.eq("userId", connection.userId))
            .first();

          if (prefs?.duplicateChargeAlerts) {
            await ctx.db.insert("notificationQueue", {
              userId: connection.userId,
              type: "duplicate_charge",
              scheduledFor: Date.now(),
              status: "pending",
              emailData: {
                subject: `Duplicate charge detected: ${txs[0].merchantName}`,
                template: "duplicate_charge",
                templateData: {
                  merchantName: txs[0].merchantName || "Unknown",
                  amount: txs[0].amount,
                  date: txs[0].date,
                  count: txs.length,
                },
              },
              attempts: 0,
              createdAt: Date.now(),
            });
          }
        }
      }
    }

    console.log(`[Detection] Found ${duplicates.length} duplicate charges`);
    return { duplicates: duplicates.length };
  },
});
