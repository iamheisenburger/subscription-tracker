/**
 * AI Admin Functions
 * Simple admin functions to manually trigger AI parsing
 */

import { action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

/**
 * Parse unparsed receipts with AI (bypasses orchestrator)
 */
export const parseReceipts = action({
  args: {
    clerkUserId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<{ error?: string; message?: string; count: number; results?: any[] }> => {
    // Get user
    const user: any = await ctx.runQuery(internal.emailScanner.getUserByClerkId, {
      clerkUserId: args.clerkUserId,
    });

    if (!user) {
      return { error: "User not found", count: 0 };
    }

    // Get unparsed receipts
    const receipts: any[] = await ctx.runQuery(internal.receiptParser.getUnparsedReceipts, {
      userId: user._id,
      limit: args.limit || 100,
    });

    console.log(`📧 Found ${receipts.length} unparsed receipts for ${user.email}`);

    if (receipts.length === 0) {
      return { message: "No unparsed receipts found", count: 0 };
    }

    // Format receipts - filter out any invalid ones
    const formattedReceipts: any[] = receipts
      .map((r: any) => ({
        _id: r._id,
        subject: r.subject || "No subject",
        rawBody: r.rawBody || "",
        from: r.from || "unknown",
      }))
      .filter((r: any) => r && r._id && r.subject);

    console.log(`🤖 Sending ${formattedReceipts.length} valid receipts to AI parser...`);

    // Call the internal AI parser
    const results: any = await ctx.runAction(internal.aiReceiptParser.parseReceiptsWithAI, {
      receipts: formattedReceipts,
    });

    console.log(`✅ AI parsing complete: ${results.results.length} receipts processed`);

    return {
      message: `Parsed ${results.results.length} receipts with AI`,
      count: results.results.length,
      results: results.results.slice(0, 10), // Show first 10
    };
  },
});
