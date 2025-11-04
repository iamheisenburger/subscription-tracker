/**
 * Diagnostic functions to check scan state
 */

import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get diagnostic information about scan state
 */
export const getScanDiagnostics = query({
  args: {
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkUserId))
      .first();

    if (!user) {
      return { error: "User not found" };
    }

    // Get email connections
    const connections = await ctx.db
      .query("emailConnections")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Get receipts (LIMIT to prevent 16MB error)
    const allReceipts = await ctx.db
      .query("emailReceipts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .take(1000);

    // Get detection candidates (LIMIT to prevent 16MB error)
    const candidates = await ctx.db
      .query("detectionCandidates")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .take(100);

    const connection = connections[0];

    return {
      user: {
        email: user.email,
        tier: user.tier,
      },
      connection: connection ? {
        email: connection.email,
        status: connection.status,
        scanStatus: connection.scanStatus,
        totalEmailsScanned: connection.totalEmailsScanned,
        totalReceiptsFound: connection.totalReceiptsFound,
        aiProcessingStatus: connection.aiProcessingStatus,
        aiProcessedCount: connection.aiProcessedCount,
        aiTotalCount: connection.aiTotalCount,
        lastSyncedAt: connection.lastSyncedAt,
        pageToken: connection.pageToken,
      } : null,
      receipts: {
        total: allReceipts.length,
        parsed: allReceipts.filter(r => r.parsed).length,
        unparsed: allReceipts.filter(r => !r.parsed).length,
        withMerchant: allReceipts.filter(r => r.merchantName).length,
        withAmount: allReceipts.filter(r => r.amount).length,
        parsedButNoData: allReceipts.filter(r => r.parsed && !r.merchantName && !r.amount).length,
      },
      candidates: {
        total: candidates.length,
        pending: candidates.filter(c => c.status === "pending").length,
        accepted: candidates.filter(c => c.status === "accepted").length,
        dismissed: candidates.filter(c => c.status === "dismissed").length,
        fromEmail: candidates.filter(c => c.source === "email").length,
      },
    };
  },
});
