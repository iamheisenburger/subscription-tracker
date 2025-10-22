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

    for (const [merchantName, merchantReceipts] of merchantGroups) {
      // Sort receipts by date (most recent first)
      const sortedReceipts = merchantReceipts.sort((a, b) => b.receivedAt - a.receivedAt);
      const latestReceipt = sortedReceipts[0];
      const latestReceiptDate = latestReceipt.receivedAt;

      // CRITICAL: Infer billing cycle FIRST to apply appropriate time thresholds
      const inferredCycle = inferBillingCycle(sortedReceipts);
      const detectedCycle = latestReceipt.billingCycle;

      const billingCycle = detectedCycle === "yearly" || inferredCycle === "yearly"
        ? "yearly"
        : detectedCycle === "weekly" || inferredCycle === "weekly"
        ? "weekly"
        : detectedCycle || inferredCycle || "monthly";

      // Apply cycle-specific time thresholds
      let recentThreshold: number;
      let cancelledThreshold: number;
      let middleZoneConfidence: number;

      if (billingCycle === "yearly") {
        recentThreshold = currentTime - 15 * 30 * 24 * 60 * 60 * 1000; // 15 months
        cancelledThreshold = currentTime - 18 * 30 * 24 * 60 * 60 * 1000; // 18 months
        middleZoneConfidence = 0.85;
      } else if (billingCycle === "weekly") {
        recentThreshold = currentTime - 30 * 24 * 60 * 60 * 1000; // 1 month
        cancelledThreshold = currentTime - 90 * 24 * 60 * 60 * 1000; // 3 months
        middleZoneConfidence = 0.70;
      } else {
        recentThreshold = currentTime - 90 * 24 * 60 * 60 * 1000; // 3 months
        cancelledThreshold = currentTime - 180 * 24 * 60 * 60 * 1000; // 6 months
        middleZoneConfidence = 0.75;
      }

      // RULE 1: Recent receipts based on billing cycle = ACTIVE
      if (latestReceiptDate >= recentThreshold) {
        const daysAgo = Math.floor((currentTime - latestReceiptDate) / (24 * 60 * 60 * 1000));
        console.log(`  ✅ ACTIVE (recent): ${merchantName} - ${daysAgo} days ago (${billingCycle})`);

        activeSubscriptions.push({
          merchantName,
          amount: latestReceipt.amount!,
          currency: latestReceipt.currency || "USD",
          billingCycle,
          lastReceiptDate: latestReceiptDate,
          receiptCount: sortedReceipts.length,
          confidence: 0.95,
          patternType: "recent",
          receiptIds: sortedReceipts.map(r => r._id),
        });
        continue;
      }

      // RULE 2: Old receipts based on billing cycle = CANCELLED
      if (latestReceiptDate < cancelledThreshold) {
        const daysAgo = Math.floor((currentTime - latestReceiptDate) / (24 * 60 * 60 * 1000));
        console.log(`  ❌ CANCELLED (old): ${merchantName} - ${daysAgo} days ago (${billingCycle})`);
        continue;
      }

      // RULE 3: Middle zone - Check for recurring pattern
      const hasRecurringPattern = detectRecurringPattern(sortedReceipts);
      const daysAgo = Math.floor((currentTime - latestReceiptDate) / (24 * 60 * 60 * 1000));

      if (hasRecurringPattern) {
        console.log(`  ✅ ACTIVE (pattern): ${merchantName} - ${sortedReceipts.length} receipts, ${daysAgo} days ago (${billingCycle})`);

        activeSubscriptions.push({
          merchantName,
          amount: latestReceipt.amount!,
          currency: latestReceipt.currency || "USD",
          billingCycle,
          lastReceiptDate: latestReceiptDate,
          receiptCount: sortedReceipts.length,
          confidence: middleZoneConfidence,
          patternType: "recurring",
          receiptIds: sortedReceipts.map(r => r._id),
        });
      } else {
        console.log(`  ⚠️  UNCERTAIN: ${merchantName} - ${daysAgo} days ago, no pattern (${billingCycle})`);

        activeSubscriptions.push({
          merchantName,
          amount: latestReceipt.amount!,
          currency: latestReceipt.currency || "USD",
          billingCycle,
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

    for (const [merchantName, merchantReceipts] of merchantGroups) {
      const sortedReceipts = merchantReceipts.sort((a, b) => b.receivedAt - a.receivedAt);
      const latestReceipt = sortedReceipts[0];
      const latestReceiptDate = latestReceipt.receivedAt;

      // CRITICAL: Infer billing cycle FIRST to apply appropriate time thresholds
      // Annual subscriptions need different thresholds than monthly
      const inferredCycle = inferBillingCycle(sortedReceipts);
      const detectedCycle = latestReceipt.billingCycle; // From AI parsing

      // Use most permissive cycle (if either AI or pattern suggests yearly, treat as yearly)
      const billingCycle = detectedCycle === "yearly" || inferredCycle === "yearly"
        ? "yearly"
        : detectedCycle === "weekly" || inferredCycle === "weekly"
        ? "weekly"
        : detectedCycle || inferredCycle || "monthly";

      // Apply cycle-specific time thresholds
      let recentThreshold: number;
      let cancelledThreshold: number;
      let middleZoneConfidence: number;

      if (billingCycle === "yearly") {
        // Annual subscriptions: much longer thresholds
        recentThreshold = currentTime - 15 * 30 * 24 * 60 * 60 * 1000; // 15 months
        cancelledThreshold = currentTime - 18 * 30 * 24 * 60 * 60 * 1000; // 18 months
        middleZoneConfidence = 0.85; // Higher confidence for annual in middle zone
        console.log(`  📅 ${merchantName}: Detected as YEARLY subscription`);
      } else if (billingCycle === "weekly") {
        // Weekly subscriptions: shorter thresholds
        recentThreshold = currentTime - 30 * 24 * 60 * 60 * 1000; // 1 month
        cancelledThreshold = currentTime - 90 * 24 * 60 * 60 * 1000; // 3 months
        middleZoneConfidence = 0.70;
        console.log(`  📅 ${merchantName}: Detected as WEEKLY subscription`);
      } else {
        // Monthly or unknown: default thresholds
        recentThreshold = currentTime - 90 * 24 * 60 * 60 * 1000; // 3 months
        cancelledThreshold = currentTime - 180 * 24 * 60 * 60 * 1000; // 6 months
        middleZoneConfidence = 0.75;
        console.log(`  📅 ${merchantName}: Detected as MONTHLY subscription`);
      }

      // RULE 1: Recent receipts based on billing cycle = ACTIVE SUBSCRIPTION
      if (latestReceiptDate >= recentThreshold) {
        const daysAgo = Math.floor((currentTime - latestReceiptDate) / (24 * 60 * 60 * 1000));
        console.log(`  ✅ ACTIVE (recent): ${merchantName} - Last receipt ${daysAgo} days ago (${billingCycle} cycle)`);
        activeSubscriptions.push({
          merchantName,
          amount: latestReceipt.amount!,
          currency: latestReceipt.currency || "USD",
          billingCycle,
          lastReceiptDate: latestReceiptDate,
          receiptCount: sortedReceipts.length,
          confidence: 0.95,
          patternType: "recent",
          receiptIds: sortedReceipts.map(r => r._id),
        });
        continue;
      }

      // RULE 2: Old receipts based on billing cycle = CANCELLED SUBSCRIPTION
      if (latestReceiptDate < cancelledThreshold) {
        const daysAgo = Math.floor((currentTime - latestReceiptDate) / (24 * 60 * 60 * 1000));
        console.log(`  ❌ CANCELLED (old): ${merchantName} - Last receipt ${daysAgo} days ago (expected ${billingCycle} cycle)`);
        continue;
      }

      // RULE 3: Middle zone - Check for recurring pattern
      const hasRecurringPattern = detectRecurringPattern(sortedReceipts);
      const daysAgo = Math.floor((currentTime - latestReceiptDate) / (24 * 60 * 60 * 1000));

      if (hasRecurringPattern) {
        console.log(`  ✅ ACTIVE (recurring pattern): ${merchantName} - ${sortedReceipts.length} receipts, last ${daysAgo} days ago (${billingCycle} cycle)`);
        activeSubscriptions.push({
          merchantName,
          amount: latestReceipt.amount!,
          currency: latestReceipt.currency || "USD",
          billingCycle,
          lastReceiptDate: latestReceiptDate,
          receiptCount: sortedReceipts.length,
          confidence: middleZoneConfidence,
          patternType: "recurring",
          receiptIds: sortedReceipts.map(r => r._id),
        });
      } else {
        console.log(`  ⚠️  UNCERTAIN: ${merchantName} - Last receipt ${daysAgo} days ago, no clear pattern (${billingCycle} cycle)`);
        activeSubscriptions.push({
          merchantName,
          amount: latestReceipt.amount!,
          currency: latestReceipt.currency || "USD",
          billingCycle,
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
