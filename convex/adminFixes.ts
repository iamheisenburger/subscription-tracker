/**
 * Admin functions to fix production issues
 */

import { mutation } from "./_generated/server";
import { v } from "convex/values";

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
