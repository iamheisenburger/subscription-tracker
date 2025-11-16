/**
 * Admin functions to fix production issues
 */

import { mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

/**
 * Clear all detection candidates for a user and re-run pattern detection
 * This fixes the PlayStation duplicate and other deduplication issues
 */
export const resetDetectionCandidates = mutation({
  args: {
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    // Find user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkUserId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Get all detection candidates for this user
    const candidates = await ctx.db
      .query("detectionCandidates")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    console.log(`🧹 Found ${candidates.length} detection candidates to clear`);

    // Delete all candidates
    for (const candidate of candidates) {
      await ctx.db.delete(candidate._id);
    }

    // Clear detectionCandidateId from all receipts
    const receipts = await ctx.db
      .query("emailReceipts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.neq(q.field("detectionCandidateId"), undefined))
      .collect();

    console.log(`🧹 Clearing detectionCandidateId from ${receipts.length} receipts`);

    for (const receipt of receipts) {
      await ctx.db.patch(receipt._id, {
        detectionCandidateId: undefined,
      });
    }

    console.log(`✅ Cleared all detection candidates and receipt links for user ${user.email}`);

    return {
      success: true,
      candidatesDeleted: candidates.length,
      receiptsUnlinked: receipts.length,
    };
  },
});

/**
 * Reset all receipts to unparsed state to force reprocessing
 * USE THIS after fixing the pre-filter to reprocess all 908 filtered receipts
 * Processes in batches to avoid Convex memory limits
 */
export const resetAllReceiptsToParse = mutation({
  args: {
    clerkUserId: v.string(),
    batchSize: v.optional(v.number()), // Default 100 receipts per call
  },
  handler: async (ctx, args) => {
    const batchSize = args.batchSize || 100;

    // Find user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkUserId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Get UNPARSED receipts that still need resetting (batched)
    const receiptsToReset = await ctx.db
      .query("emailReceipts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.neq(q.field("parsed"), false)) // Find receipts that are NOT already false
      .take(batchSize);

    console.log(`   Processing ${receiptsToReset.length} receipts in this batch...`);

    // Reset this batch
    let resetCount = 0;
    for (const receipt of receiptsToReset) {
      await ctx.db.patch(receipt._id, {
        parsed: false,
        merchantName: undefined,
        amount: undefined,
        currency: undefined,
        billingCycle: undefined,
        parsingConfidence: undefined,
        parsingMethod: undefined,
        detectionCandidateId: undefined,
      });
      resetCount++;
    }

    const isComplete = resetCount < batchSize; // If we reset fewer than batchSize, we're done

    if (isComplete) {
      console.log(`✅ Batch complete! Reset ${resetCount} receipts. All receipts should now be unparsed.`);
    } else {
      console.log(`   ⏳ Batch complete. Reset ${resetCount} receipts. More remaining - call again to continue.`);
    }

    return {
      success: true,
      resetThisBatch: resetCount,
      isComplete,
      message: isComplete
        ? "All receipts reset successfully!"
        : `Call this function again to reset remaining receipts`,
    };
  },
});

/**
 * Run repair and detection on existing data (for investigation)
 */
export const runRepairAndDetection = action({
  args: {
    clerkUserId: v.string(),
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    repair?: any;
    detection?: any;
    error?: string;
  }> => {
    // Find user
    const user = await ctx.runQuery((internal as any).emailScanner.getUserByClerkId, {
      clerkUserId: args.clerkUserId,
    });

    if (!user) {
      throw new Error("User not found");
    }

    console.log(`🔧 Running repair and detection for user ${user.email}...`);

    // Run repair
    let repairResult;
    try {
      console.log("🧰 Running repair pass...");
      repairResult = await ctx.runMutation((internal as any).repair.repairParsedReceipts, {
        userId: user._id,
        limit: 800,
      });
      console.log(`✅ Repair complete:`, repairResult);
    } catch (e) {
      console.error("❌ Repair failed:", e);
      repairResult = { error: String(e) };
    }

    // Run detection
    let detectionResult;
    try {
      console.log("🎯 Running pattern detection...");
      detectionResult = await ctx.runMutation((internal as any).patternDetection.runPatternBasedDetection, {
        userId: user._id,
      });
      console.log(`✅ Detection complete:`, detectionResult);
    } catch (e) {
      console.error("❌ Detection failed:", e);
      detectionResult = { error: String(e) };
    }

    return {
      success: true,
      repair: repairResult,
      detection: detectionResult,
    };
  },
});
