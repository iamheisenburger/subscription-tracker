/**
 * ADMIN: One-off script to parse receipts with AI
 * Use this when orchestrator is failing
 */

import { action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

export const parseReceiptsWithAI = action({
  args: {
    clerkUserId: v.string(),
  },
  handler: async (ctx, args): Promise<any> => {
    // Get user
    const user: any = await ctx.runQuery(internal.emailScanner.getUserByClerkId, {
      clerkUserId: args.clerkUserId,
    });

    if (!user) {
      return { error: "User not found" };
    }

    // Get unparsed receipts
    const receipts: any[] = await ctx.runQuery(internal.receiptParser.getUnparsedReceipts, {
      userId: user._id,
      limit: 100,
    });

    console.log(`📧 Found ${receipts.length} unparsed receipts for ${user.email}`);

    if (receipts.length === 0) {
      return { message: "No unparsed receipts found", count: 0 };
    }

    // Parse with AI - ensure receipts have proper structure
    const formattedReceipts = receipts.map((r: any) => ({
      _id: r._id,
      subject: r.subject || "No subject",
      rawBody: r.rawBody || "",
      from: r.from || "unknown",
    })).filter((r: any) => r._id); // Filter out any receipts without IDs

    console.log(`🤖 Sending ${formattedReceipts.length} receipts to AI parser...`);

    const results: any = await ctx.runAction(internal.aiReceiptParser.parseReceiptsWithAI, {
      receipts: formattedReceipts,
    });

    console.log(`✅ AI parsing complete: ${results.results.length} receipts processed`);

    // Results are automatically saved by the AI parser
    return {
      message: `Parsed ${results.results.length} receipts with AI`,
      count: results.results.length,
      results: results.results.slice(0, 10), // Show first 10
    };
  },
});
