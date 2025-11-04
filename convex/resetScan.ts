/**
 * Temporary utility to reset lastFullScanAt for testing
 */

import { mutation, action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

export const resetLastFullScan = mutation({
  args: {
    connectionId: v.id("emailConnections"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.connectionId, {
      lastFullScanAt: undefined,
    });

    return { success: true, message: "Reset lastFullScanAt - next scan will be full" };
  },
});

/**
 * Parse unparsed receipts with REGEX (not AI)
 */
export const parseReceiptsRegex = action({
  args: {
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.runMutation(internal.receiptParser.parseUnparsedReceipts, {
      clerkUserId: args.clerkUserId,
    });

    return { success: true, message: "Parsing receipts with regex" };
  },
});
