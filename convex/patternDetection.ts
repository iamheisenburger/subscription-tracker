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
import { normalizeMerchantName } from "./utils";

// Merchants we should never surface as active subscriptions (known false positives)
const NEGATIVE_MERCHANTS = new Set([
  "pipiads",
  "veritel",
  "opusclip inc. (f.k.a. immersively inc.)",
  "opusclip inc",
  "startup club community",
  // Aggregators / generic tokens
  "apple",
  "stripe",
  "paypal",
  "google",
  "paddle",
  "your",
  "receipt",
  "invoice",
  "payment",
  // Generic words that appear in subject lines but aren't merchants
  "final", // "Final invoice bill" - not a merchant name
  "last", // "Last invoice" - not a merchant name
  "new", // "New invoice" - not a merchant name
  "recent", // "Recent transaction" - not a merchant name
]);

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
      const textualCycle = inferCycleFromText(sortedReceipts);

      // Precedence: explicit monthly text wins; then weekly; then yearly; else AI/patterns
      const billingCycle =
        textualCycle === "monthly" ? "monthly" :
        textualCycle === "weekly" ? "weekly" :
        textualCycle === "yearly" ? "yearly" :
        (detectedCycle === "yearly" || inferredCycle === "yearly") ? "yearly" :
        (detectedCycle === "weekly" || inferredCycle === "weekly") ? "weekly" :
        detectedCycle || inferredCycle || "monthly";

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
        recentThreshold = currentTime - 45 * 24 * 60 * 60 * 1000; // 45 days
        cancelledThreshold = currentTime - 180 * 24 * 60 * 60 * 1000; // 6 months
        middleZoneConfidence = 0.75;
      }

      // RULE 1: Recent receipts based on billing cycle = ACTIVE
      if (latestReceiptDate >= recentThreshold) {
        const norm = normalizeMerchantName(merchantName);
        if (NEGATIVE_MERCHANTS.has(norm)) {
          console.log(`  ⏭️  Skipping blocked merchant: ${merchantName}`);
          continue;
        }
        // Require evidence: at least 2 receipts for the merchant to call it ACTIVE (recent)
        if (sortedReceipts.length >= 2) {
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
        } else {
          console.log(`  ⏭️  Skipping RECENT with single receipt: ${merchantName}`);
        }
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
        // Guard: recurring but stale should not be considered active for monthly
        if (latestReceiptDate < recentThreshold) {
          console.log(`  ⏭️  Skipping RECURRING but stale: ${merchantName} - ${daysAgo} days ago (${billingCycle})`);
          continue;
        }
        const norm = normalizeMerchantName(merchantName);
        if (NEGATIVE_MERCHANTS.has(norm)) {
          console.log(`  ⏭️  Skipping blocked merchant: ${merchantName}`);
          continue;
        }
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
        // Strict mode: skip uncertain (reduces false positives)
        console.log(`  ⏭️  Skipping UNCERTAIN: ${merchantName} - ${daysAgo} days ago (${billingCycle})`);
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

      // Calculate next billing date:
      // 1) Use explicit evidence date if present
      // 2) Else use calendar-accurate addMonths/addYears or 7-day week
      // 3) Clamp forward to future
      const cadenceDays = billingCycle === "weekly" ? 7 : billingCycle === "yearly" ? 365 : 30;
      // Fetch receipts for this subscription to inspect evidence
      const receiptsForSub: any[] = [];
      for (const rid of subscription.receiptIds as any[]) {
        const rec = await ctx.db.get(rid as any);
        if (rec) receiptsForSub.push(rec);
      }
      let proposedNextBilling =
        getNextBillingDateFromEvidence(receiptsForSub, subscription.lastReceiptDate, subscription.merchantName) ||
        (billingCycle === "weekly"
          ? (subscription.lastReceiptDate + cadenceDays * 24 * 60 * 60 * 1000)
          : billingCycle === "yearly"
            ? addYearsUtc(subscription.lastReceiptDate, 1)
            : addMonthsUtc(subscription.lastReceiptDate, 1));
      const nowMs = Date.now();
      let safetyIters = 0;
      while (proposedNextBilling <= nowMs && safetyIters < 24) {
        proposedNextBilling =
          billingCycle === "weekly"
            ? proposedNextBilling + cadenceDays * 24 * 60 * 60 * 1000
            : billingCycle === "yearly"
              ? addYearsUtc(proposedNextBilling, 1)
              : addMonthsUtc(proposedNextBilling, 1);
        safetyIters++;
      }

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

        // Link ALL receipts for this merchant to the existing candidate
        // This prevents the same receipts from being re-queued hourly by the cron job.
        for (const receiptId of subscription.receiptIds) {
          await ctx.db.patch(receiptId, {
            detectionCandidateId: existingCandidate._id,
          });
        }

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

    // STEP 1: Load parsed receipts that have amounts (used for amount/cadence analysis)
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

    // STEP 1b: Load recent cancellation receipts (no amount required) to suppress active status
    const cancellationReceipts = await ctx.db
      .query("emailReceipts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) =>
        q.and(
          q.eq(q.field("parsed"), true),
          q.eq(q.field("receiptType"), "cancellation"),
          q.neq(q.field("merchantName"), null)
        )
      )
      .collect();

    const latestCancellationByBase: Map<string, number> = new Map();
    const latestCancellationReceiptByBase: Map<string, any> = new Map();
    for (const r of cancellationReceipts) {
      const base = normalizeForCancellation(r.merchantName as string);
      const ts = (r as any).receivedAt as number;
      const prev = latestCancellationByBase.get(base) || 0;
      if (ts && ts > prev) {
        latestCancellationByBase.set(base, ts);
        latestCancellationReceiptByBase.set(base, r);
      }
    }

    // STEP 1c: Heuristic cancellation detection via keywords (covers providers with poor struct tagging)
    const parsedWithMerchant = await ctx.db
      .query("emailReceipts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) =>
        q.and(
          q.eq(q.field("parsed"), true),
          q.neq(q.field("merchantName"), null)
        )
      )
      .collect();
    const STRONG_CANCEL = /((your|you)[^]{0,40}?(subscription|plan)[^]{0,40}?(cancel(?:led|ed)|cancellation))|\bsubscription\s+cancel(?:led|ed)\b/i;
    const CHARGE_WORDS = /\b(receipt|invoice|charged?|billed?|payment|amount|total)\b/i;
    const latestKeywordCancellationByBase: Map<string, number> = new Map();
    for (const r of parsedWithMerchant) {
      const subject = ((r as any).subject || "") as string;
      const body = ((r as any).rawBody || "") as string;
      if (!subject && !body) continue;
      const subjectLooksCanceled = STRONG_CANCEL.test(subject);
      const bodyLooksCanceled = STRONG_CANCEL.test(body) && !CHARGE_WORDS.test(body);
      if (subjectLooksCanceled || bodyLooksCanceled) {
        const base = normalizeForCancellation((r as any).merchantName as string);
        const ts = (r as any).receivedAt as number;
        const prev = latestKeywordCancellationByBase.get(base) || 0;
        if (ts && ts > prev) latestKeywordCancellationByBase.set(base, ts);
      }
    }

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
      // Compute the latest CHARGE receipt (exclude refunds and credit/top-up)
      const latestChargeReceipt = sortedReceipts.find(r => !isRefundReceipt(r) && !isCreditOrTopUp(r));
      if (!latestChargeReceipt) {
        console.log(`  ⏭️  SKIPPED: ${merchantName} - Only refund receipts found, no charge evidence`);
        continue;
      }
      const latestReceipt = latestChargeReceipt;
      const latestReceiptDate = latestChargeReceipt.receivedAt;

      // CANCELLATION SUPPRESSION: If we have a recent cancellation for this merchant, skip as cancelled
      const baseKey = normalizeForCancellation(merchantName);
      const latestCancellation = latestCancellationByBase.get(baseKey) || latestKeywordCancellationByBase.get(baseKey);
      if (latestCancellation) {
        const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
        if (latestCancellation >= (latestReceiptDate - THREE_DAYS_MS)) {
          // If cancellation email indicates "active until" a future date, do NOT suppress.
          const cancelDoc = latestCancellationReceiptByBase.get(baseKey);
          const stillActive = cancelDoc ? isCancellationAtPeriodEnd(cancelDoc) : false;
          if (stillActive) {
            console.log(`  ℹ️ CANCEL AT PERIOD END: ${merchantName} - remains active until period end; keeping as active`);
          } else {
            console.log(`  ❌ CANCELLED (explicit): ${merchantName} - cancellation receipt at ${new Date(latestCancellation).toISOString()}`);
            continue;
          }
        }
      }

      // Find first receipt with a valid amount (exclude refunds and credit/top-up)
      const receiptWithAmount = sortedReceipts.find(r => (r.amount !== undefined && r.amount !== null) && !isRefundReceipt(r) && !isCreditOrTopUp(r));

      // Skip this merchant if no receipt has an amount - can't create valid detection candidate
      if (!receiptWithAmount) {
        console.log(`  ⏭️  SKIPPED: ${merchantName} - No receipts with valid amounts`);
        continue;
      }

      // CRITICAL: Infer billing cycle FIRST to apply appropriate time thresholds
      // Annual subscriptions need different thresholds than monthly
      const inferredCycle = inferBillingCycle(sortedReceipts);
      const detectedCycle = latestReceipt.billingCycle; // From AI parsing
      const textualCycle = inferCycleFromText(sortedReceipts);
      
      // For single receipts: Infer yearly from amount pattern if no explicit cycle
      // Annual subscriptions often have higher amounts (e.g., £26.95/year vs £9.99/month)
      let inferredYearlyFromAmount = false;
      if (sortedReceipts.length === 1 && !textualCycle && !detectedCycle && !inferredCycle) {
        const receiptAmount = receiptWithAmount.amount || 0;
        const currency = receiptWithAmount.currency || "USD";
        // If amount > $15 equivalent, might be annual (common annual pricing: $20-100/year)
        // Convert to USD roughly: GBP * 1.3, EUR * 1.1, INR / 83
        let amountUSD = receiptAmount;
        if (currency === "GBP") amountUSD = receiptAmount * 1.3;
        else if (currency === "EUR") amountUSD = receiptAmount * 1.1;
        else if (currency === "INR") amountUSD = receiptAmount / 83;
        // If amount suggests annual (>$15) and receipt is >90 days old, likely annual
        if (amountUSD > 15 && (currentTime - latestReceiptDate) > (90 * 24 * 60 * 60 * 1000)) {
          inferredYearlyFromAmount = true;
          console.log(`  💰 Inferred YEARLY from amount: ${receiptAmount} ${currency} (${amountUSD.toFixed(2)} USD) for ${merchantName}`);
        }
      }

      // Precedence: explicit monthly text wins; then weekly; then yearly; else AI/patterns; then amount inference
      const billingCycle =
        textualCycle === "monthly" ? "monthly" :
        textualCycle === "weekly" ? "weekly" :
        textualCycle === "yearly" ? "yearly" :
        (detectedCycle === "yearly" || inferredCycle === "yearly") ? "yearly" :
        (detectedCycle === "weekly" || inferredCycle === "weekly") ? "weekly" :
        inferredYearlyFromAmount ? "yearly" :
        detectedCycle || inferredCycle || "monthly";

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
        // Monthly or unknown: stricter thresholds to minimize false positives
        recentThreshold = currentTime - 45 * 24 * 60 * 60 * 1000; // 45 days
        cancelledThreshold = currentTime - 180 * 24 * 60 * 60 * 1000; // 6 months
        middleZoneConfidence = 0.75;
        console.log(`  📅 ${merchantName}: Detected as MONTHLY subscription`);
      }

      // RULE 1: Recent receipts based on billing cycle = ACTIVE only with evidence
      if (latestReceiptDate >= recentThreshold) {
        const norm = normalizeMerchantName(merchantName);
        if (NEGATIVE_MERCHANTS.has(norm)) {
          console.log(`  ⏭️  Skipping blocked merchant: ${merchantName}`);
          continue;
        }
        
        // Filter out one-time invoices/purchases - require evidence of recurring pattern
        // For single receipts, check if they indicate one-time vs recurring
        if (sortedReceipts.length === 1) {
          const receipt = sortedReceipts[0];
          const subject: string = (receipt as any).subject || "";
          const body: string = (receipt as any).rawBody || "";
          const text = `${subject}\n${body}`.toLowerCase();
          
          // One-time invoice/purchase indicators (general patterns)
          const oneTimeIndicators = [
            /(?:final|last|closing)\s+invoice/i, // "Final invoice", "Last invoice", "Closing invoice"
            /invoice\s+(?:for|#)\s+\w+.*(?:final|last|one[-\s]?time)/i, // "Invoice for X - Final"
            /\bone[-\s]?time\s+(?:payment|purchase|invoice|charge)/i, // "One-time payment"
            /\bsingle\s+(?:payment|purchase|invoice)/i, // "Single payment"
            /\bnon[-\s]?recurring/i, // "Non-recurring"
            /\bfinal\s+bill/i, // "Final bill"
          ];
          
          // Check if receipt indicates one-time purchase
          const isOneTimeInvoice = oneTimeIndicators.some(pattern => pattern.test(text));
          
          // Require subscription/recurring evidence for single receipts
          const hasRecurringEvidence = 
            /\b(?:recurring|subscription|auto[\s-]?renew|renewal|billing\s+cycle|next\s+(?:payment|charge|billing))/i.test(text) ||
            /\b(?:monthly|yearly|annual|weekly)\s+(?:subscription|plan|billing)/i.test(text);
          
          // If it's a one-time invoice AND lacks recurring evidence, skip it
          if (isOneTimeInvoice && !hasRecurringEvidence) {
            console.log(`  ⏭️  Skipping one-time invoice: ${merchantName} - One-time purchase pattern detected without recurring evidence`);
            continue;
          }
        }
        // Allow single recent receipt for YEARLY plans.
        // By the time we label something YEARLY we already have strong textual
        // cadence evidence (\"annual plan\", etc.). We still require
        // `hasChargeEvidence` below so we don't treat non‑payment emails as
        // subscriptions.
        const allowSingleForYearly =
          billingCycle === "yearly" &&
          sortedReceipts.length >= 1;
        // Allow single recent monthly only if strong subject/body evidence AND subscription keywords present
        const strongSubjectEvidence = hasStrongSubjectEvidence(sortedReceipts, merchantName);
        const allowSingleForMonthly =
          billingCycle !== "yearly" &&
          (
            (strongSubjectEvidence && hasSubscriptionKeywords(sortedReceipts)) ||
            isTrustedMerchantForSingleMonthly(merchantName)
          );
        const hasChargeEvidence =
          hasChargeConfirmationReceipt(sortedReceipts) ||
          (isTrustedMerchantForSingleMonthly(merchantName) && hasPurchaseLikeEvidence(sortedReceipts));
        if ((sortedReceipts.length >= 2 || allowSingleForYearly || allowSingleForMonthly) && hasChargeEvidence) {
          const daysAgo = Math.floor((currentTime - latestReceiptDate) / (24 * 60 * 60 * 1000));
          console.log(`  ✅ ACTIVE (recent): ${merchantName} - Last receipt ${daysAgo} days ago (${billingCycle} cycle)`);
          activeSubscriptions.push({
            merchantName,
            amount: receiptWithAmount.amount!,
            currency: receiptWithAmount.currency || "USD",
            billingCycle,
            lastReceiptDate: latestReceiptDate,
            receiptCount: sortedReceipts.length,
            confidence: billingCycle === "yearly" ? 0.9 : 0.95,
            patternType: "recent",
            receiptIds: sortedReceipts.map(r => r._id),
          });
          continue;
        } else {
          console.log(`  ⏭️  Skipping RECENT with single receipt: ${merchantName}`);
        }
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

      if (hasRecurringPattern && hasChargeConfirmationReceipt(sortedReceipts)) {
        if (latestReceiptDate < recentThreshold) {
          console.log(`  ⏭️  Skipping RECURRING but stale: ${merchantName} - Last receipt ${daysAgo} days ago (${billingCycle})`);
          continue;
        }
        const norm = normalizeMerchantName(merchantName);
        if (NEGATIVE_MERCHANTS.has(norm)) {
          console.log(`  ⏭️  Skipping blocked merchant: ${merchantName}`);
          continue;
        }
        console.log(`  ✅ ACTIVE (recurring pattern): ${merchantName} - ${sortedReceipts.length} receipts, last ${daysAgo} days ago (${billingCycle} cycle)`);
        activeSubscriptions.push({
          merchantName,
          amount: receiptWithAmount.amount!,
          currency: receiptWithAmount.currency || "USD",
          billingCycle,
          lastReceiptDate: latestReceiptDate,
          receiptCount: sortedReceipts.length,
          confidence: middleZoneConfidence,
          patternType: "recurring",
          receiptIds: sortedReceipts.map(r => r._id),
        });
      } else {
        // Strict mode: skip uncertain
        console.log(`  ⏭️  Skipping UNCERTAIN: ${merchantName} - Last receipt ${daysAgo} days ago, no clear pattern (${billingCycle} cycle)`);
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
      // Fetch receipts for this subscription to inspect evidence
      const receiptsForCandidate: any[] = [];
      for (const rid of subscription.receiptIds as any[]) {
        const rec = await ctx.db.get(rid as any);
        if (rec) receiptsForCandidate.push(rec);
      }
      let proposedNextBilling =
        getNextBillingDateFromEvidence(receiptsForCandidate, subscription.lastReceiptDate, subscription.merchantName) ||
        (billingCycle === "weekly"
          ? (subscription.lastReceiptDate + cadenceDays * 24 * 60 * 60 * 1000)
          : billingCycle === "yearly"
            ? addYearsUtc(subscription.lastReceiptDate, 1)
            : addMonthsUtc(subscription.lastReceiptDate, 1));
      const nowMs2 = Date.now();
      let iter2 = 0;
      while (proposedNextBilling <= nowMs2 && iter2 < 24) {
        proposedNextBilling =
          billingCycle === "weekly"
            ? proposedNextBilling + cadenceDays * 24 * 60 * 60 * 1000
            : billingCycle === "yearly"
              ? addYearsUtc(proposedNextBilling, 1)
              : addMonthsUtc(proposedNextBilling, 1);
        iter2++;
      }

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
          evidenceSnippet: detectionReason.substring(0, 240),
          evidenceType: "pattern",
        });

        // Link ALL receipts to the existing candidate to avoid repeated cron processing
        for (const receiptId of subscription.receiptIds) {
          await ctx.db.patch(receiptId, {
            detectionCandidateId: existingCandidate._id,
          });
        }

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
          evidenceSnippet: detectionReason.substring(0, 240),
          evidenceType: "pattern",
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
    console.log(`   Total merchants: ${merchantGroups.size}`);
    console.log(`   Active subscriptions: ${activeSubscriptions.length}`);
    console.log(`   Created: ${createdCount} new candidates`);
    console.log(`   Updated: ${updatedCount} existing candidates`);
    console.log(`   Skipped: ${skippedCount} (already tracked as subscriptions)`);

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
 * Determine if subjects strongly indicate a paid receipt from the same merchant
 * Example: "Your receipt from Cursor #1234-5678" or "Receipt from Vercel"
 */
function hasStrongSubjectEvidence(
  receipts: Array<{ [key: string]: any }>,
  merchantName: string
): boolean {
  const normalizedMerchant = normalizeMerchantName(merchantName);
  for (const r of receipts) {
    const subject: string = (r as any).subject || "";
    const body: string = (r as any).rawBody || "";
    if (!subject) continue;

    const m1 = subject.match(/(?:your\s+receipt|receipt|payment\s+receipt)\s+from\s+([^#\n]+?)(?:\s*#|\s*$)/i);
    const m2 = subject.match(/(?:your\s+invoice|invoice)\s+from\s+([^#\n]+?)(?:\s*#|\s*$)/i);
    const m3 = subject.match(/^your\s+([A-Za-z0-9 .,&-]{2,60})\s+(?:receipt|invoice|payment)/i);
    const candidate = (m1?.[1] || m2?.[1] || m3?.[1])?.trim();
    if (candidate) {
      const normCandidate = normalizeMerchantName(candidate);
      if (normCandidate && normCandidate === normalizedMerchant) {
        return true;
      }
    }

    // Body evidence: presence of merchant near subscription/payment keywords
    const bodyText = body.toLowerCase();
    const normMerchantLower = normalizedMerchant.toLowerCase();
    const hasMerchantInBody = normMerchantLower.length > 1 && bodyText.includes(normMerchantLower);
    const hasPaymentKeywords = /\b(subscription|plan|renew|billed|charged|payment|invoice|receipt|statement\s+descriptor|descriptor)\b/.test(bodyText);
    if (hasMerchantInBody && hasPaymentKeywords) {
      return true;
    }
  }
  return false;
}

/**
 * Infer billing cycle from subject/body cues
 * Looks for explicit textual indicators like "annual", "yearly", "weekly"
 */
function inferCycleFromText(receipts: Array<{ [key: string]: any }>): "weekly" | "monthly" | "yearly" | null {
  for (const r of receipts) {
    const subject: string = (r as any).subject || "";
    const body: string = (r as any).rawBody || "";
    const text = `${subject}\n${body}`.toLowerCase();
    // Stricter: require strong phrases indicating billing cadence, not generic "annual/yearly" words
    if (/\b(billed\s+annually|annual\s+plan|per\s+year|yearly\s+plan|annual\s+subscription|12[-\s]*month\s+subscription|1\s*year|one\s*year|12\s*month(s)?)\b/.test(text)) return "yearly";
  if (/\b(weekly|per\s+week|every\s+week)\b/.test(text)) return "weekly";
  if (/\b(billed\s+monthly|monthly\s+plan|per\s+month|every\s+month|monthly\s+subscription|paid\s+monthly|annual\s+plan,\s*paid\s+monthly)\b/.test(text)) return "monthly";
  }
  return null;
}

/**
 * Normalize merchant name for cancellation comparison by collapsing trivial
 * plan/tier suffixes that often differ between charge vs cancellation emails.
 */
function normalizeForCancellation(name: string): string {
  const n = normalizeMerchantName(name);
  return n.replace(/\s+(ai|pro|premium|plus|blue|plan|subscription)\b/i, "").trim();
}

/**
 * Allow-list of merchants where a single recent monthly receipt is reliable evidence.
 * These providers have consistent receipt templates and low false-positive risk.
 */
function isTrustedMerchantForSingleMonthly(merchantName: string): boolean {
  const norm = normalizeMerchantName(merchantName);
  return norm === "playstation" || norm === "spotify" || norm === "x";
}

/**
 * Detect explicit auto-renew/recurring cues in text, required for single-yearly inclusion.
 */
function hasAutoRenewEvidence(receipts: Array<{ [key: string]: any }>): boolean {
  for (const r of receipts) {
    const subject: string = (r as any).subject || "";
    const body: string = (r as any).rawBody || "";
    const text = `${subject}\n${body}`.toLowerCase();
    // Allow both explicit auto‑renew phrasing and Apple's shorter "Renews <date>" format.
    if (/\b(auto[-\s]?renew|renews\b|renews\s+(each|every)\s+(year|month|week)|will\s+renew\s+on|next\s+billing|next\s+charge|next\s+payment)\b/.test(text)) {
      return true;
    }
  }
  return false;
}

/**
 * Ensure the auto-renew/next-billing mention is adjacent to the specific merchant.
 * We consider "adjacent" as within 120 characters in the same local snippet.
 */
function hasMerchantAdjacentRenewal(
  receipts: Array<{ [key: string]: any }>,
  merchantName: string
): boolean {
  const normMerchant = normalizeMerchantName(merchantName).toLowerCase();
  for (const r of receipts) {
    const subject: string = (r as any).subject || "";
    const body: string = (r as any).rawBody || "";
    const combined = `${subject}\n${body}`;
    // Treat both "renews on <date>" and "renews <date>" as valid renewal cues.
    const m = combined.match(/(auto[-\s]?renew|renews\b|renews\s+(each|every)\s+(year|month|week)|will\s+renew\s+on|next\s+(billing|charge|payment))/i);
    if (m && m.index !== undefined) {
      const start = Math.max(0, m.index - 120);
      const end = Math.min(combined.length, m.index + 200);
      const window = combined.substring(start, end).toLowerCase();
      if (normMerchant.length > 1 && window.includes(normMerchant)) {
        return true;
      }
    }
  }
  return false;
}
/**
 * Extract a credible next billing/renewal date from the text.
 * Returns true if a date-like string is found and parses to a valid date
 * that is after the last receipt date and within 18 months.
 */
function hasNextBillingDateEvidence(
  receipts: Array<{ [key: string]: any }>,
  latestReceiptDate: number,
  merchantName: string
): boolean {
  const MAX_AHEAD_MS = 430 * 24 * 60 * 60 * 1000; // ~14 months upper bound
  const MIN_AHEAD_MS = 300 * 24 * 60 * 60 * 1000; // ~10 months lower bound
  const normMerchant = normalizeMerchantName(merchantName).toLowerCase();

  const datePatterns: RegExp[] = [
    // e.g., Dec 12, 2025 or September 7, 2025
    /\b(?:on|by|until|next\s+(?:billing|payment|charge|renewal)\s+date[:\s-]*)?\b([A-Z][a-z]{2,8}\s+\d{1,2},\s+\d{4})\b/,
    // e.g., 12 Dec 2025
    /\b(\d{1,2}\s+[A-Z][a-z]{2,8}\s+\d{4})\b/,
    // e.g., 2025-12-12 or 12/12/2025
    /\b(\d{4}-\d{2}-\d{2}|\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})\b/,
  ];

  for (const r of receipts) {
    const subject: string = (r as any).subject || "";
    const body: string = (r as any).rawBody || "";
    const combined = `${subject}\n${body}`;

    // Look for renewal wording ("renews", "next billing", etc.) near a date.
    // Supports Apple's \"Renews 13 August 2026\" format (no \"on\").
    const windowRegex = /(renews\b|next\s+(?:billing|payment|charge)|will\s+renew\s+on|renewal\s+date)[\s\S]{0,120}?/i;
    const windowMatch = combined.match(windowRegex);
    if (windowMatch) {
      const snippetStart = Math.max(0, windowMatch.index!);
      const snippet = combined.substring(snippetStart, snippetStart + 200);
      // Merchant adjacency requirement
      if (!(normMerchant.length > 1 && snippet.toLowerCase().includes(normMerchant))) {
        continue;
      }
      // Prefer explicit yearly phrasing if present, but do not require it.
      // Some Apple invoices show only "Renews <date>" without "yearly/annual".
      // Require charge confirmation words to avoid newsletters/promotions without a real charge
      if (!/\b(charged?|paid|billed?|invoice|receipt)\b/i.test(snippet)) {
        continue;
      }
      for (const p of datePatterns) {
        const m = snippet.match(p);
        const dateStr = m?.[1];
        if (dateStr) {
          const parsed = Date.parse(dateStr);
          if (!Number.isNaN(parsed)) {
            const dt = parsed;
            const diff = dt - latestReceiptDate;
            // Accept if the next billing date is ~10–14 months ahead,
            // which strongly implies an annual cadence even if the word "yearly" isn't present.
            if (dt > latestReceiptDate && diff >= MIN_AHEAD_MS && diff <= MAX_AHEAD_MS) {
              return true;
            }
          }
        }
      }
    }
  }

  return false;
}

/**
 * Require at least one receipt showing explicit charge confirmation words
 * alongside a positive amount. This avoids newsletter/promotional emails
 * being treated as paid subscriptions.
 */
function hasChargeConfirmationReceipt(
  receipts: Array<{ [key: string]: any }>
): boolean {
  // Charge confirmation patterns: explicit charge words OR purchase confirmation patterns
  const chargeWords = /\b(charged?|paid|billed?|invoice|receipt|order\s+#?|purchase|transaction)\b/i;
  const purchaseConfirmation = /\b(thank\s+you\s+for\s+your\s+purchase|purchase\s+confirmation|transaction\s+(id|#)|order\s+confirmation)\b/i;
  
  for (const r of receipts) {
    if (isCreditOrTopUp(r)) continue;
    if (r.amount === null || r.amount === undefined || r.amount <= 0) continue;
    const subject: string = (r as any).subject || "";
    const body: string = (r as any).rawBody || "";
    const text = `${subject}\n${body}`;
    
    // Check for charge words OR purchase confirmation patterns
    const hasChargeWords = chargeWords.test(text);
    const hasPurchaseConfirmation = purchaseConfirmation.test(text);
    const isRefund = /\b(refund|refunded|reversal|credited)\b/i.test(text);
    
    if ((hasChargeWords || hasPurchaseConfirmation) && !isRefund) {
      return true;
    }
  }
  return false;
}

/**
 * Identify refund receipts so they don't count as charges.
 */
function isRefundReceipt(r: { [key: string]: any }): boolean {
  const subject: string = (r as any).subject || "";
  const body: string = (r as any).rawBody || "";
  const subj = subject.toLowerCase();
  const txt = body.toLowerCase();
  // Strong refund indicators
  const subjectRefund = /\b(refund|refunded)\b/.test(subj);
  const bodyRefund = /\b(your\s+refund|has\s+been\s+refunded|refund\s+issued|refunded\s+amount|we\s+issued\s+a\s+refund|refund\s+processed)\b/.test(txt);
  // Avoid false matches like "non-refundable"
  const falsePositive = /\b(non[-\s]?refundable|no\s+refunds?)\b/.test(txt);
  return (subjectRefund || bodyRefund) && !falsePositive;
}

/**
 * Identify credit/top-up or API usage receipts to exclude from subscription evidence.
 */
function isCreditOrTopUp(r: { [key: string]: any }): boolean {
  const subject: string = (r as any).subject || "";
  const body: string = (r as any).rawBody || "";
  const text = `${subject}\n${body}`.toLowerCase();
  const patterns: RegExp[] = [
    /\bone[-\s]?time\s+(credit|purchase)\b/i,
    /\bcredit(s)?\s+(purchase|top[-\s]?up|topup)\b/i,
    /\bapi\b.*\b(usage|credits?|balance|billing)\b/i,
    /\bfunded\s+your\s+account\b/i,
    /\baccount\s+funded\b/i,
    /\bpay[-\s]?as[-\s]?you[-\s]?go\b/i,
    /\bPAYG\b/i,
    /\busage\s+charges?\b/i,
  ];
  return patterns.some((p) => p.test(text));
}

/**
 * Detect purchase-like language used by some merchants (e.g., PlayStation)
 * that indicates a successful charge without explicit "receipt/invoice" words.
 */
function hasPurchaseLikeEvidence(
  receipts: Array<{ [key: string]: any }>
): boolean {
  const purchaseWords = /\b(thank\s+you\s+for\s+your\s+purchase|your\s+purchase|purchase\s+was\s+successful|transaction\s+was\s+successful)\b/i;
  for (const r of receipts) {
    if (r.amount === null || r.amount === undefined || r.amount <= 0) continue;
    const subject: string = (r as any).subject || "";
    const body: string = (r as any).rawBody || "";
    const text = `${subject}\n${body}`;
    if (purchaseWords.test(text)) return true;
  }
  return false;
}
/**
 * Check if a cancellation email states the subscription remains active
 * until a future end date (cancel at period end).
 */
function isCancellationAtPeriodEnd(r: { [key: string]: any }): boolean {
  const subject: string = (r as any).subject || "";
  const body: string = (r as any).rawBody || "";
  const combined = `${subject}\n${body}`;
  // Phrases like "will remain active until", "will be canceled on", "ends on"
  const windowRegex = /(remain[s]?\s+active\s+until|will\s+be\s+cancell?ed\s+on|ends?\s+on|expires?\s+on)[\s\S]{0,120}?/i;
  const datePatterns: RegExp[] = [
    /\b([A-Z][a-z]{2,8}\s+\d{1,2},\s+\d{4})\b/,
    /\b(\d{1,2}\s+[A-Z][a-z]{2,8}\s+\d{4})\b/,
    /\b(\d{4}-\d{2}-\d{2}|\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})\b/,
  ];
  const m = combined.match(windowRegex);
  if (!m) return false;
  const snippetStart = Math.max(0, m.index!);
  const snippet = combined.substring(snippetStart, snippetStart + 160);
  for (const p of datePatterns) {
    const dm = snippet.match(p);
    const dateStr = dm?.[1];
    if (dateStr) {
      const parsed = Date.parse(dateStr);
      if (!Number.isNaN(parsed)) {
        if (parsed > Date.now()) {
          return true;
        }
      }
    }
  }
  return false;
}
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
 * Check for explicit subscription/renewal cues.
 * Used to allow single-monthly inclusion only when clearly a subscription (not one-off credits).
 */
function hasSubscriptionKeywords(receipts: Array<{ [key: string]: any }>): boolean {
  const keywordRegex = /\b(subscription|subscribed|membership|plan|renews?|auto[-\s]?renew|recurring|billed\s+monthly|charged\s+monthly|every\s+month)\b/i;
  for (const r of receipts) {
    const subject: string = (r as any).subject || "";
    const body: string = (r as any).rawBody || "";
    if (keywordRegex.test(subject) || keywordRegex.test(body)) {
      return true;
    }
  }
  return false;
}

/**
 * Infer billing cycle from receipt intervals
 */
function inferBillingCycle(receipts: Array<{ receivedAt: number; [key: string]: any }>): string | null {
  // Use only successful/charge-like receipts to infer cadence.
  // Exclude refunds, cancellations, and failed/unsuccessful payment attempts which skew intervals.
  const chargeLike = receipts.filter((r) => {
    const subject: string = (r as any).subject || "";
    const body: string = (r as any).rawBody || "";
    const text = `${subject}\n${body}`.toLowerCase();
    const amount: number | undefined = (r as any).amount;
    if (amount == null || amount <= 0) return false;
    if (isCreditOrTopUp(r)) return false;
    if (/\b(refund|refunded|reversal|credited)\b/.test(text)) return false;
    if (/\b(unsuccessful|failed|declined|payment\s+failed|was\s+unsuccessful)\b/.test(text)) return false;
    // Require some charge/receipt evidence words
    if (/\b(receipt|invoice|charged?|billed?|payment|amount|total)\b/.test(text)) return true;
    // Or purchase-like phrasing (PlayStation style)
    if (/\b(thank\s+you\s+for\s+your\s+purchase|purchase\s+was\s+successful|transaction\s+was\s+successful)\b/.test(text)) return true;
    return false;
  });

  if (chargeLike.length < 2) return null;

  const sorted = chargeLike.sort((a, b) => (b.receivedAt as number) - (a.receivedAt as number));
  const intervals: number[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const interval = (sorted[i].receivedAt as number) - (sorted[i + 1].receivedAt as number);
    if (interval > 0) intervals.push(interval);
  }
  if (intervals.length === 0) return null;

  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;

  const WEEK = 7 * 24 * 60 * 60 * 1000;
  const MONTH = 30 * 24 * 60 * 60 * 1000;
  const YEAR = 365 * 24 * 60 * 60 * 1000;

  if (Math.abs(avgInterval - WEEK) < WEEK * 0.2) return "weekly";
  if (Math.abs(avgInterval - MONTH) < MONTH * 0.2) return "monthly";
  if (Math.abs(avgInterval - YEAR) < YEAR * 0.2) return "yearly";

  return null;
}

/**
 * Try to extract an explicit next billing/renewal date from receipts.
 * Returns the first credible future date within 18 months, otherwise null.
 */
function getNextBillingDateFromEvidence(
  receipts: Array<{ [key: string]: any }>,
  latestReceiptDate: number,
  merchantName?: string
): number | null {
  const MAX_AHEAD_MS = 18 * 30 * 24 * 60 * 60 * 1000; // ~18 months
  const normMerchant = merchantName ? normalizeMerchantName(merchantName).toLowerCase() : "";
  const datePatterns: RegExp[] = [
    /\b(?:on|by|until|next\s+(?:billing|payment|charge|renewal)\s+date[:\s-]*)?\b([A-Z][a-z]{2,8}\s+\d{1,2},\s+\d{4})\b/,
    /\b(\d{1,2}\s+[A-Z][a-z]{2,8}\s+\d{4})\b/,
    /\b(\d{4}-\d{2}-\d{2}|\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})\b/,
  ];
  for (const r of receipts) {
    const subject: string = (r as any).subject || "";
    const body: string = (r as any).rawBody || "";
    const combined = `${subject}\n${body}`;
    // Look for renewal window near phrases, including Apple's \"Renews <date>\" pattern.
    const windowRegex = /(renews\b|next\s+(?:billing|payment|charge)|will\s+renew\s+on|renewal\s+date)[\s\S]{0,160}?/i;
    const windowMatch = combined.match(windowRegex);
    if (!windowMatch) continue;
    const snippetStart = Math.max(0, windowMatch.index!);
    const snippet = combined.substring(snippetStart, snippetStart + 220);
    // If we know merchant, require adjacency to avoid cross-merchant confusion
    if (normMerchant && !snippet.toLowerCase().includes(normMerchant)) continue;
    // Require charge-like wording to avoid newsletters
    if (!/\b(charged?|paid|billed?|invoice|receipt|payment)\b/i.test(snippet)) continue;
    for (const p of datePatterns) {
      const m = snippet.match(p);
      const dateStr = m?.[1];
      if (!dateStr) continue;
      const parsed = Date.parse(dateStr);
      if (Number.isNaN(parsed)) continue;
      if (parsed > latestReceiptDate && parsed - latestReceiptDate <= MAX_AHEAD_MS) {
        return parsed;
      }
    }
  }
  return null;
}

// Calendar-accurate time helpers (UTC) to avoid 30-day drift
function addMonthsUtc(ts: number, months: number): number {
  const d = new Date(ts);
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  const day = d.getUTCDate();
  // Compute target year/month
  const targetMonthIndex = m + months;
  const targetYear = y + Math.floor(targetMonthIndex / 12);
  const targetMonth = ((targetMonthIndex % 12) + 12) % 12;
  // Clamp day to last day of target month
  const lastDayOfTargetMonth = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
  const targetDay = Math.min(day, lastDayOfTargetMonth);
  return Date.UTC(targetYear, targetMonth, targetDay, d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds(), d.getUTCMilliseconds());
}
function addYearsUtc(ts: number, years: number): number {
  const d = new Date(ts);
  return Date.UTC(d.getUTCFullYear() + years, d.getUTCMonth(), d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds(), d.getUTCMilliseconds());
}
