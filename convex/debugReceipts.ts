/**
 * Debug: Get sample receipts to see parsing issues
 */

import { query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

export const getSampleReceipts = query({
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

    // Get receipts with merchant data
    const withMerchant = await ctx.db
      .query("emailReceipts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.and(
        q.eq(q.field("parsed"), true),
        q.neq(q.field("merchantName"), undefined)
      ))
      .take(10);

    // Get receipts WITHOUT merchant data (these are failing)
    const withoutMerchant = await ctx.db
      .query("emailReceipts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.and(
        q.eq(q.field("parsed"), true),
        q.or(
          q.eq(q.field("merchantName"), undefined),
          q.eq(q.field("merchantName"), null),
          q.eq(q.field("merchantName"), "")
        )
      ))
      .take(20);

    return {
      withMerchant: withMerchant.map(r => ({
        subject: r.subject,
        from: r.from,
        merchantName: r.merchantName,
        amount: r.amount,
      })),
      withoutMerchant: withoutMerchant.map(r => ({
        subject: r.subject,
        from: r.from,
        merchantName: r.merchantName || "NULL",
        amount: r.amount || "NULL",
      })),
    };
  },
});

/**
 * Debug: Check what the parser filter would catch
 */
export const checkParserFilter = query({
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
      .take(500);

    // Apply the same filter as parseUnparsedReceipts
    const receiptsToProcess = allReceipts.filter(
      (receipt) =>
        !receipt.parsed ||
        !receipt.merchantName ||
        receipt.merchantName === "" ||
        receipt.merchantName === null ||
        receipt.merchantName === "NULL"
    );

    // Sample some receipts that would be processed
    const sampleToProcess = receiptsToProcess.slice(0, 10).map(r => ({
      subject: r.subject,
      from: r.from,
      merchantName: r.merchantName === undefined ? "UNDEFINED" : r.merchantName === null ? "NULL_VALUE" : r.merchantName === "" ? "EMPTY_STRING" : r.merchantName,
      parsed: r.parsed,
      parsingConfidence: r.parsingConfidence,
    }));

    // Sample some receipts that would NOT be processed
    const notToProcess = allReceipts.filter(
      (receipt) => !(
        !receipt.parsed ||
        !receipt.merchantName ||
        receipt.merchantName === "" ||
        receipt.merchantName === null ||
        receipt.merchantName === "NULL"
      )
    );

    const sampleNotToProcess = notToProcess.slice(0, 5).map(r => ({
      subject: r.subject,
      merchantName: r.merchantName,
      parsed: r.parsed,
    }));

    return {
      totalReceipts: allReceipts.length,
      wouldProcess: receiptsToProcess.length,
      wouldNotProcess: notToProcess.length,
      sampleToProcess,
      sampleNotToProcess,
    };
  },
});
