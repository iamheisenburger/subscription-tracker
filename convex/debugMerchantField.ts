/**
 * Debug: Check exact values of merchantName field
 */

import { query } from "./_generated/server";
import { v } from "convex/values";

export const checkMerchantField = query({
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

    const allReceipts = await ctx.db
      .query("emailReceipts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .take(500);

    const analysis = allReceipts.map(r => ({
      subject: r.subject?.substring(0, 50),
      parsed: r.parsed,
      merchantName: r.merchantName,
      merchantNameType: typeof r.merchantName,
      merchantNameIsUndefined: r.merchantName === undefined,
      merchantNameIsNull: r.merchantName === null,
      merchantNameIsEmpty: r.merchantName === "",
      hasAmount: !!r.amount,
    })).filter(r => r.parsed && !r.merchantName);

    return {
      totalReceipts: allReceipts.length,
      parsedWithoutMerchant: analysis.length,
      samples: analysis.slice(0, 10),
    };
  },
});
