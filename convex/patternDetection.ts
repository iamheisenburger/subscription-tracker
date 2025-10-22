/**
 * Pattern-Based Subscription Detection
 *
 * This approach analyzes MULTIPLE receipts over time to determine if a subscription is active.
 * Unlike single-receipt analysis, this looks at patterns and recency to make accurate decisions.
 *
 * Algorithm:
 * 1. Group all receipts by merchant (normalized)
 * 2. For each merchant group, analyze temporal patterns:
 *    - Recent receipts (last 3 months) = ACTIVE
 *    - Last receipt >6 months + no pattern = CANCELLED
 *    - Regular recurring pattern = ACTIVE SUBSCRIPTION
 * 3. Use AI for merchant/amount extraction, NOT for determining if active
 *
 * This is how successful apps like Truebill and Rocket Money work.
 */

import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

/**
 * Analyze receipt patterns to determine active subscriptions
 * Groups receipts by merchant and analyzes temporal patterns
 */
export const detectActiveSubscriptionsFromPatterns = internalQuery({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get all parsed receipts for this user
    const receipts = await ctx.db
      .query("emailReceipts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) =>
        q.and(
          q.eq(q.field("parsed"), true),
          q.neq(q.field("merchantName"), null),
          q.neq(q.field("amount"), null)
        )
      )
      .collect();

    console.log(`📊 Pattern Detection: Analyzing ${receipts.length} parsed receipts...`);

    // Group receipts by normalized merchant name
    const merchantGroups = groupReceiptsByMerchant(receipts);

    console.log(`📦 Grouped into ${merchantGroups.size} unique merchants`);

    // Analyze each merchant group for patterns
    const activeSubscriptions: Array<{
      merchantName: string;
      amount: number;
      currency: string;
      billingCycle: string | null;
      lastReceiptDate: number;
      receiptCount: number;
      confidence: number;
      patternType: "recent" | "recurring" | "high_confidence_recent";
      receiptIds: Array<any>; // Will be Id<"emailReceipts">[] when returned
    }> = [];

    const currentTime = Date.now();
    const threeMonthsAgo = currentTime - 90 * 24 * 60 * 60 * 1000;
    const sixMonthsAgo = currentTime - 180 * 24 * 60 * 60 * 1000;

    for (const [merchantName, merchantReceipts] of merchantGroups) {
      // Sort receipts by date (most recent first)
      const sortedReceipts = merchantReceipts.sort((a, b) => b.receivedAt - a.receivedAt);
      const latestReceipt = sortedReceipts[0];
      const latestReceiptDate = latestReceipt.receivedAt;

      // RULE 1: Recent receipts (last 3 months) = ACTIVE SUBSCRIPTION
      if (latestReceiptDate >= threeMonthsAgo) {
        console.log(`  ✅ ACTIVE (recent): ${merchantName} - Last receipt ${new Date(latestReceiptDate).toLocaleDateString()}`);

        activeSubscriptions.push({
          merchantName,
          amount: latestReceipt.amount!,
          currency: latestReceipt.currency || "USD",
          billingCycle: latestReceipt.billingCycle || inferBillingCycle(sortedReceipts),
          lastReceiptDate: latestReceiptDate,
          receiptCount: sortedReceipts.length,
          confidence: 0.95, // Very high confidence for recent receipts
          patternType: "recent",
          receiptIds: sortedReceipts.map(r => r._id),
        });
        continue;
      }

      // RULE 2: Old receipts (>6 months) = CANCELLED SUBSCRIPTION
      if (latestReceiptDate < sixMonthsAgo) {
        console.log(`  ❌ CANCELLED (old): ${merchantName} - Last receipt ${new Date(latestReceiptDate).toLocaleDateString()}`);
        continue; // Skip - subscription is cancelled
      }

      // RULE 3: Middle zone (3-6 months) - Check for recurring pattern
      // If there's a clear recurring pattern (multiple receipts with regular intervals), it's likely still active
      const hasRecurringPattern = detectRecurringPattern(sortedReceipts);

      if (hasRecurringPattern) {
        console.log(`  ✅ ACTIVE (recurring pattern): ${merchantName} - ${sortedReceipts.length} receipts with regular intervals`);

        activeSubscriptions.push({
          merchantName,
          amount: latestReceipt.amount!,
          currency: latestReceipt.currency || "USD",
          billingCycle: latestReceipt.billingCycle || inferBillingCycle(sortedReceipts),
          lastReceiptDate: latestReceiptDate,
          receiptCount: sortedReceipts.length,
          confidence: 0.80, // High confidence for recurring patterns
          patternType: "recurring",
          receiptIds: sortedReceipts.map(r => r._id),
        });
      } else {
        // No recurring pattern and in middle zone - likely cancelled but show with lower confidence
        console.log(`  ⚠️  UNCERTAIN: ${merchantName} - Last receipt ${new Date(latestReceiptDate).toLocaleDateString()}, no clear pattern`);

        activeSubscriptions.push({
          merchantName,
          amount: latestReceipt.amount!,
          currency: latestReceipt.currency || "USD",
          billingCycle: latestReceipt.billingCycle || null,
          lastReceiptDate: latestReceiptDate,
          receiptCount: sortedReceipts.length,
          confidence: 0.60, // Lower confidence - might be cancelled
          patternType: "high_confidence_recent",
          receiptIds: sortedReceipts.map(r => r._id),
        });
      }
    }

    console.log(`🎯 Pattern Detection Summary:`);
    console.log(`   Total merchants: ${merchantGroups.size}`);
    console.log(`   Active subscriptions: ${activeSubscriptions.length}`);
    console.log(`   Recent: ${activeSubscriptions.filter(s => s.patternType === "recent").length}`);
    console.log(`   Recurring: ${activeSubscriptions.filter(s => s.patternType === "recurring").length}`);
    console.log(`   Uncertain: ${activeSubscriptions.filter(s => s.patternType === "high_confidence_recent").length}`);

    return { activeSubscriptions };
  },
});

/**
 * Create detection candidates from pattern analysis
 * Replaces the old single-receipt detection logic
 */
export const createDetectionCandidatesFromPatterns = internalMutation({
  args: {
    userId: v.id("users"),
    activeSubscriptions: v.array(
      v.object({
        merchantName: v.string(),
        amount: v.number(),
        currency: v.string(),
        billingCycle: v.union(v.string(), v.null()),
        lastReceiptDate: v.number(),
        receiptCount: v.number(),
        confidence: v.number(),
        patternType: v.union(
          v.literal("recent"),
          v.literal("recurring"),
          v.literal("high_confidence_recent")
        ),
        receiptIds: v.array(v.id("emailReceipts")),
      })
    ),
  },
  handler: async (ctx, args) => {
    console.log(`📝 Creating ${args.activeSubscriptions.length} detection candidates from patterns...`);

    const now = Date.now();

    // Load ALL user subscriptions once (optimization)
    const allUserSubscriptions = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const subscriptionsByName = new Map(
      allUserSubscriptions.map(sub => [normalizeMerchantName(sub.name), sub])
    );

    // Load existing pending candidates
    const existingCandidates = await ctx.db
      .query("detectionCandidates")
      .withIndex("by_user_status", (q) => q.eq("userId", args.userId).eq("status", "pending"))
      .collect();

    // Create a set of current merchant names (normalized)
    const currentMerchants = new Set(
      args.activeSubscriptions.map(s => normalizeMerchantName(s.merchantName))
    );

    // Delete candidates for merchants that are no longer active
    for (const candidate of existingCandidates) {
      const normalizedExisting = normalizeMerchantName(candidate.proposedName);
      if (!currentMerchants.has(normalizedExisting)) {
        console.log(`  🗑️  Dismissing old candidate (no longer active): ${candidate.proposedName}`);
        await ctx.db.patch(candidate._id, {
          status: "dismissed",
          reviewedAt: now,
        });
      }
    }

    // Create or update candidates for active subscriptions
    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const subscription of args.activeSubscriptions) {
      const normalizedName = normalizeMerchantName(subscription.merchantName);

      // Check if subscription already exists
      const existingSubscription = subscriptionsByName.get(normalizedName);

      if (existingSubscription) {
        console.log(`  ⏭️  Skipping: ${subscription.merchantName} - already tracked`);

        // Link all receipts to existing subscription
        for (const receiptId of subscription.receiptIds) {
          await ctx.db.patch(receiptId, {
            subscriptionId: existingSubscription._id,
          });
        }

        skippedCount++;
        continue;
      }

      // Check if candidate already exists
      const existingCandidate = existingCandidates.find(
        c => normalizeMerchantName(c.proposedName) === normalizedName
      );

      // Validate billing cycle
      const billingCycle = subscription.billingCycle === "weekly" ||
                          subscription.billingCycle === "monthly" ||
                          subscription.billingCycle === "yearly"
        ? subscription.billingCycle
        : "monthly";

      // Calculate next billing date (estimate based on last receipt + cadence)
      const cadenceDays = billingCycle === "weekly" ? 7 : billingCycle === "yearly" ? 365 : 30;
      const proposedNextBilling = subscription.lastReceiptDate + (cadenceDays * 24 * 60 * 60 * 1000);

      // Build detection reason
      const detectionReason = buildDetectionReason(
        subscription.patternType,
        subscription.receiptCount,
        subscription.lastReceiptDate
      );

      if (existingCandidate) {
        // Update existing candidate with new data
        await ctx.db.patch(existingCandidate._id, {
          proposedAmount: subscription.amount,
          proposedCurrency: subscription.currency,
          proposedCadence: billingCycle,
          proposedNextBilling,
          confidence: subscription.confidence,
          detectionReason,
        });

        // Link the most recent receipt to candidate
        const mostRecentReceiptId = subscription.receiptIds[0];
        await ctx.db.patch(mostRecentReceiptId, {
          detectionCandidateId: existingCandidate._id,
        });

        console.log(`  ✏️  Updated candidate: ${subscription.merchantName}`);
        updatedCount++;
      } else {
        // Create new detection candidate
        const candidateId = await ctx.db.insert("detectionCandidates", {
          userId: args.userId,
          proposedName: subscription.merchantName,
          proposedAmount: subscription.amount,
          proposedCurrency: subscription.currency,
          proposedCadence: billingCycle,
          proposedNextBilling,
          confidence: subscription.confidence,
          detectionReason,
          status: "pending",
          source: "email",
          emailReceiptId: subscription.receiptIds[0], // Link to most recent receipt
          createdAt: now,
        });

        // Link all receipts to this candidate
        for (const receiptId of subscription.receiptIds) {
          await ctx.db.patch(receiptId, {
            detectionCandidateId: candidateId,
          });
        }

        console.log(`  ➕ Created candidate: ${subscription.merchantName} ($${subscription.amount}/${billingCycle})`);
        createdCount++;
      }
    }

    console.log(`✅ Pattern-based detection candidates processed:`);
    console.log(`   Created: ${createdCount}`);
    console.log(`   Updated: ${updatedCount}`);
    console.log(`   Skipped (already tracked): ${skippedCount}`);

    return { created: createdCount, updated: updatedCount, skipped: skippedCount };
  },
});

/**
 * Orchestrate pattern-based detection - combines query + mutation
 * This is the main entry point for pattern-based detection
 */
export const runPatternBasedDetection = internalMutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    console.log(`🔍 Running pattern-based detection for user ${args.userId}...`);

    // STEP 1: Analyze patterns (using runQuery to call the query)
    const patternResult = await ctx.db
      .query("emailReceipts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) =>
        q.and(
          q.eq(q.field("parsed"), true),
          q.neq(q.field("merchantName"), null),
          q.neq(q.field("amount"), null)
        )
      )
      .collect();

    console.log(`📊 Pattern Detection: Analyzing ${patternResult.length} parsed receipts...`);

    // Group receipts by normalized merchant name
    const merchantGroups = groupReceiptsByMerchant(patternResult);
    console.log(`📦 Grouped into ${merchantGroups.size} unique merchants`);

    // Analyze each merchant group for patterns
    const activeSubscriptions: Array<{
      merchantName: string;
      amount: number;
      currency: string;
      billingCycle: string | null;
      lastReceiptDate: number;
      receiptCount: number;
      confidence: number;
      patternType: "recent" | "recurring" | "high_confidence_recent";
      receiptIds: Array<any>;
    }> = [];

    const currentTime = Date.now();
    const threeMonthsAgo = currentTime - 90 * 24 * 60 * 60 * 1000;
    const sixMonthsAgo = currentTime - 180 * 24 * 60 * 60 * 1000;

    for (const [merchantName, merchantReceipts] of merchantGroups) {
      const sortedReceipts = merchantReceipts.sort((a, b) => b.receivedAt - a.receivedAt);
      const latestReceipt = sortedReceipts[0];
      const latestReceiptDate = latestReceipt.receivedAt;

      // RULE 1: Recent receipts (last 3 months) = ACTIVE SUBSCRIPTION
      if (latestReceiptDate >= threeMonthsAgo) {
        console.log(`  ✅ ACTIVE (recent): ${merchantName} - Last receipt ${new Date(latestReceiptDate).toLocaleDateString()}`);
        activeSubscriptions.push({
          merchantName,
          amount: latestReceipt.amount!,
          currency: latestReceipt.currency || "USD",
          billingCycle: latestReceipt.billingCycle || inferBillingCycle(sortedReceipts),
          lastReceiptDate: latestReceiptDate,
          receiptCount: sortedReceipts.length,
          confidence: 0.95,
          patternType: "recent",
          receiptIds: sortedReceipts.map(r => r._id),
        });
        continue;
      }

      // RULE 2: Old receipts (>6 months) = CANCELLED SUBSCRIPTION
      if (latestReceiptDate < sixMonthsAgo) {
        console.log(`  ❌ CANCELLED (old): ${merchantName} - Last receipt ${new Date(latestReceiptDate).toLocaleDateString()}`);
        continue;
      }

      // RULE 3: Middle zone (3-6 months) - Check for recurring pattern
      const hasRecurringPattern = detectRecurringPattern(sortedReceipts);

      if (hasRecurringPattern) {
        console.log(`  ✅ ACTIVE (recurring pattern): ${merchantName} - ${sortedReceipts.length} receipts with regular intervals`);
        activeSubscriptions.push({
          merchantName,
          amount: latestReceipt.amount!,
          currency: latestReceipt.currency || "USD",
          billingCycle: latestReceipt.billingCycle || inferBillingCycle(sortedReceipts),
          lastReceiptDate: latestReceiptDate,
          receiptCount: sortedReceipts.length,
          confidence: 0.80,
          patternType: "recurring",
          receiptIds: sortedReceipts.map(r => r._id),
        });
      } else {
        console.log(`  ⚠️  UNCERTAIN: ${merchantName} - Last receipt ${new Date(latestReceiptDate).toLocaleDateString()}, no clear pattern`);
        activeSubscriptions.push({
          merchantName,
          amount: latestReceipt.amount!,
          currency: latestReceipt.currency || "USD",
          billingCycle: latestReceipt.billingCycle || null,
          lastReceiptDate: latestReceiptDate,
          receiptCount: sortedReceipts.length,
          confidence: 0.60,
          patternType: "high_confidence_recent",
          receiptIds: sortedReceipts.map(r => r._id),
        });
      }
    }

    console.log(`🎯 Pattern Detection Summary:`);
    console.log(`   Total merchants: ${merchantGroups.size}`);
    console.log(`   Active subscriptions: ${activeSubscriptions.length}`);

    // STEP 2: Create detection candidates from active subscriptions
    const now = Date.now();

    // Load ALL user subscriptions once
    const allUserSubscriptions = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const subscriptionsByName = new Map(
      allUserSubscriptions.map(sub => [normalizeMerchantName(sub.name), sub])
    );

    // Load existing pending candidates
    const existingCandidates = await ctx.db
      .query("detectionCandidates")
      .withIndex("by_user_status", (q) => q.eq("userId", args.userId).eq("status", "pending"))
      .collect();

    // Create a set of current merchant names
    const currentMerchants = new Set(
      activeSubscriptions.map(s => normalizeMerchantName(s.merchantName))
    );

    // Dismiss candidates for merchants that are no longer active
    for (const candidate of existingCandidates) {
      const normalizedExisting = normalizeMerchantName(candidate.proposedName);
      if (!currentMerchants.has(normalizedExisting)) {
        console.log(`  🗑️  Dismissing old candidate: ${candidate.proposedName}`);
        await ctx.db.patch(candidate._id, {
          status: "dismissed",
          reviewedAt: now,
        });
      }
    }

    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const subscription of activeSubscriptions) {
      const normalizedName = normalizeMerchantName(subscription.merchantName);

      // Check if subscription already exists
      const existingSubscription = subscriptionsByName.get(normalizedName);

      if (existingSubscription) {
        // Link all receipts to existing subscription
        for (const receiptId of subscription.receiptIds) {
          await ctx.db.patch(receiptId, {
            subscriptionId: existingSubscription._id,
          });
        }
        skippedCount++;
        continue;
      }

      // Check if candidate already exists
      const existingCandidate = existingCandidates.find(
        c => normalizeMerchantName(c.proposedName) === normalizedName
      );

      const billingCycle = subscription.billingCycle === "weekly" ||
                          subscription.billingCycle === "monthly" ||
                          subscription.billingCycle === "yearly"
        ? subscription.billingCycle
        : "monthly";

      const cadenceDays = billingCycle === "weekly" ? 7 : billingCycle === "yearly" ? 365 : 30;
      const proposedNextBilling = subscription.lastReceiptDate + (cadenceDays * 24 * 60 * 60 * 1000);

      const detectionReason = buildDetectionReason(
        subscription.patternType,
        subscription.receiptCount,
        subscription.lastReceiptDate
      );

      if (existingCandidate) {
        await ctx.db.patch(existingCandidate._id, {
          proposedAmount: subscription.amount,
          proposedCurrency: subscription.currency,
          proposedCadence: billingCycle,
          proposedNextBilling,
          confidence: subscription.confidence,
          detectionReason,
        });

        const mostRecentReceiptId = subscription.receiptIds[0];
        await ctx.db.patch(mostRecentReceiptId, {
          detectionCandidateId: existingCandidate._id,
        });

        updatedCount++;
      } else {
        const candidateId = await ctx.db.insert("detectionCandidates", {
          userId: args.userId,
          proposedName: subscription.merchantName,
          proposedAmount: subscription.amount,
          proposedCurrency: subscription.currency,
          proposedCadence: billingCycle,
          proposedNextBilling,
          confidence: subscription.confidence,
          detectionReason,
          status: "pending",
          source: "email",
          emailReceiptId: subscription.receiptIds[0],
          createdAt: now,
        });

        for (const receiptId of subscription.receiptIds) {
          await ctx.db.patch(receiptId, {
            detectionCandidateId: candidateId,
          });
        }

        createdCount++;
      }
    }

    console.log(`✅ Pattern-based detection complete:`);
    console.log(`   Created: ${createdCount}, Updated: ${updatedCount}, Skipped: ${skippedCount}`);

    return { created: createdCount, updated: updatedCount, skipped: skippedCount };
  },
});

/**
 * Build human-readable detection reason
 */
function buildDetectionReason(
  patternType: "recent" | "recurring" | "high_confidence_recent",
  receiptCount: number,
  lastReceiptDate: number
): string {
  const lastReceiptAge = Math.floor((Date.now() - lastReceiptDate) / (24 * 60 * 60 * 1000)); // days ago

  if (patternType === "recent") {
    return `Recent subscription receipt (${lastReceiptAge} days ago) with ${receiptCount} total receipt${receiptCount > 1 ? "s" : ""} detected`;
  }

  if (patternType === "recurring") {
    return `Recurring payment pattern detected across ${receiptCount} receipts (last ${lastReceiptAge} days ago)`;
  }

  return `Subscription detected from ${receiptCount} receipt${receiptCount > 1 ? "s" : ""} (last ${lastReceiptAge} days ago)`;
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Group receipts by normalized merchant name
 * Handles variations like "Netflix", "netflix", "Netflix, Inc."
 */
function groupReceiptsByMerchant(receipts: Array<{
  _id: any;
  merchantName?: string;
  amount?: number;
  currency?: string;
  billingCycle?: string;
  receivedAt: number;
}>): Map<string, Array<typeof receipts[0]>> {
  const groups = new Map<string, Array<typeof receipts[0]>>();

  for (const receipt of receipts) {
    if (!receipt.merchantName) continue;

    const normalized = normalizeMerchantName(receipt.merchantName);

    if (!groups.has(normalized)) {
      groups.set(normalized, []);
    }
    groups.get(normalized)!.push(receipt);
  }

  return groups;
}

/**
 * Normalize merchant name for grouping
 * Removes common suffixes, converts to lowercase, trims whitespace
 */
function normalizeMerchantName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ") // Normalize whitespace
    .replace(/[,.]?\s*(inc|llc|ltd|limited|corp|corporation)\.?$/i, "") // Remove legal suffixes
    .replace(/\s*\([^)]*\)$/, "") // Remove parenthetical info
    .trim();
}

/**
 * Detect if receipts show a recurring pattern
 * Looks for regular intervals (monthly, yearly, etc.)
 */
function detectRecurringPattern(receipts: Array<{ receivedAt: number }>): boolean {
  if (receipts.length < 2) return false;

  // Calculate intervals between consecutive receipts
  const intervals: number[] = [];
  for (let i = 0; i < receipts.length - 1; i++) {
    const interval = receipts[i].receivedAt - receipts[i + 1].receivedAt;
    intervals.push(interval);
  }

  // Check if intervals are roughly consistent (within 20% variance)
  // This accounts for slight variations in billing dates
  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;

  // Define expected intervals for common billing cycles (in milliseconds)
  const WEEK = 7 * 24 * 60 * 60 * 1000;
  const MONTH = 30 * 24 * 60 * 60 * 1000;
  const YEAR = 365 * 24 * 60 * 60 * 1000;

  // Check if average interval matches common patterns (with 20% tolerance)
  const matchesWeekly = Math.abs(avgInterval - WEEK) < WEEK * 0.2;
  const matchesMonthly = Math.abs(avgInterval - MONTH) < MONTH * 0.2;
  const matchesYearly = Math.abs(avgInterval - YEAR) < YEAR * 0.2;

  if (matchesWeekly || matchesMonthly || matchesYearly) {
    // Verify consistency: at least 70% of intervals should be within 20% of average
    const consistentIntervals = intervals.filter(
      interval => Math.abs(interval - avgInterval) < avgInterval * 0.2
    );
    const consistencyRatio = consistentIntervals.length / intervals.length;

    return consistencyRatio >= 0.7;
  }

  return false;
}

/**
 * Infer billing cycle from receipt intervals
 */
function inferBillingCycle(receipts: Array<{ receivedAt: number }>): string | null {
  if (receipts.length < 2) return null;

  const intervals: number[] = [];
  for (let i = 0; i < receipts.length - 1; i++) {
    const interval = receipts[i].receivedAt - receipts[i + 1].receivedAt;
    intervals.push(interval);
  }

  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;

  const WEEK = 7 * 24 * 60 * 60 * 1000;
  const MONTH = 30 * 24 * 60 * 60 * 1000;
  const YEAR = 365 * 24 * 60 * 60 * 1000;

  if (Math.abs(avgInterval - WEEK) < WEEK * 0.2) return "weekly";
  if (Math.abs(avgInterval - MONTH) < MONTH * 0.2) return "monthly";
  if (Math.abs(avgInterval - YEAR) < YEAR * 0.2) return "yearly";

  return null;
}
