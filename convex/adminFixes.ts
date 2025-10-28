/**
 * Admin functions to fix production issues
 */

import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Clear all detection candidates for a user and re-run pattern detection
 * This fixes the PlayStation duplicate and other deduplication issues
 */
export const resetDetectionCandidates = internalMutation({
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
 */
export const resetAllReceiptsToParse = internalMutation({
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

    // Get ALL receipts for this user
    const allReceipts = await ctx.db
      .query("emailReceipts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    console.log(`🔄 Found ${allReceipts.length} total receipts`);

    const parsed = allReceipts.filter(r => r.parsed === true);
    const unparsed = allReceipts.filter(r => r.parsed !== true);

    console.log(`   ${parsed.length} already parsed`);
    console.log(`   ${unparsed.length} never parsed (filtered out)`);

    // Reset ALL receipts to unparsed state
    let resetCount = 0;
    for (const receipt of allReceipts) {
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

    console.log(`✅ Reset ${resetCount} receipts to unparsed state - ready for reprocessing`);

    return {
      success: true,
      totalReceipts: allReceipts.length,
      previouslyParsed: parsed.length,
      neverParsed: unparsed.length,
      reset: resetCount,
    };
  },
});
