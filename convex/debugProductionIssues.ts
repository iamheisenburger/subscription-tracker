/**
 * Debug queries for production issues
 */

import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get comprehensive debug info for a user
 */
export const getDebugInfo = query({
  args: {
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkUserId))
      .first();

    if (!user) {
      return { error: "User not found" };
    }

    // Get all receipts
    const allReceipts = await ctx.db
      .query("emailReceipts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Count by status
    const parsed = allReceipts.filter(r => r.parsed === true);
    const unparsed = allReceipts.filter(r => r.parsed !== true);
    const withMerchant = parsed.filter(r => r.merchantName && r.merchantName.trim() !== "");
    const withoutMerchant = parsed.filter(r => !r.merchantName || r.merchantName.trim() === "");

    // Get all detection candidates
    const allCandidates = await ctx.db
      .query("detectionCandidates")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const pendingCandidates = allCandidates.filter(c => c.status === "pending");
    const dismissedCandidates = allCandidates.filter(c => c.status === "dismissed");

    // Search for specific subscriptions in receipts
    const searchTerms = ["chatgpt", "openai", "perplexity", "spotify", "surfshark", "brandon", "fpl", "patreon"];
    const foundReceipts: Record<string, any[]> = {};

    for (const term of searchTerms) {
      const matches = allReceipts.filter(r =>
        r.subject?.toLowerCase().includes(term) ||
        r.from?.toLowerCase().includes(term) ||
        r.merchantName?.toLowerCase().includes(term)
      );
      if (matches.length > 0) {
        foundReceipts[term] = matches.map(r => ({
          subject: r.subject,
          from: r.from,
          merchantName: r.merchantName,
          amount: r.amount,
          parsed: r.parsed,
          receivedAt: new Date(r.receivedAt).toISOString(),
        }));
      }
    }

    // Check for PlayStation duplicates
    const playstationCandidates = pendingCandidates.filter(c =>
      c.proposedName.toLowerCase().includes("playstation")
    );

    return {
      user: {
        email: user.email,
        tier: user.tier,
      },
      receipts: {
        total: allReceipts.length,
        parsed: parsed.length,
        unparsed: unparsed.length,
        withMerchantData: withMerchant.length,
        withoutMerchantData: withoutMerchant.length,
      },
      candidates: {
        total: allCandidates.length,
        pending: pendingCandidates.length,
        dismissed: dismissedCandidates.length,
        playstationDuplicates: playstationCandidates.length,
        playstationDetails: playstationCandidates.map(c => ({
          name: c.proposedName,
          amount: c.proposedAmount,
          status: c.status,
        })),
      },
      missingSubscriptions: foundReceipts,
      pendingCandidateNames: pendingCandidates.map(c => c.proposedName).sort(),
    };
  },
});
