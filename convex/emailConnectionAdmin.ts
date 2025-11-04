/**
 * Admin utilities for email connection management
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Get all email connections (admin only)
 */
export const getAllEmailConnections = query({
  handler: async (ctx) => {
    const connections = await ctx.db.query("emailConnections").collect();

    return connections.map((conn) => ({
      _id: conn._id,
      userId: conn.userId,
      email: conn.email,
      provider: conn.provider,
      status: conn.status,
      scanStatus: conn.scanStatus,
      pageToken: conn.pageToken,
      totalEmailsScanned: conn.totalEmailsScanned,
      totalReceiptsFound: conn.totalReceiptsFound,
      lastSyncedAt: conn.lastSyncedAt,
      errorCode: conn.errorCode,
      errorMessage: conn.errorMessage,
      createdAt: conn.createdAt,
    }));
  },
});

/**
 * Delete email connection by email address (admin only)
 */
export const deleteConnectionByEmail = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const connection = await ctx.db
      .query("emailConnections")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!connection) {
      return { success: false, message: "Connection not found" };
    }

    // Delete all associated receipts
    const receipts = await ctx.db
      .query("emailReceipts")
      .withIndex("by_connection", (q) => q.eq("emailConnectionId", connection._id))
      .collect();

    for (const receipt of receipts) {
      await ctx.db.delete(receipt._id);
    }

    // Delete connection
    await ctx.db.delete(connection._id);

    return {
      success: true,
      message: `Deleted connection for ${args.email} and ${receipts.length} associated receipts`,
      receiptsDeleted: receipts.length,
    };
  },
});

/**
 * Reset email connection scan progress
 */
export const resetScanProgress = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const connection = await ctx.db
      .query("emailConnections")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!connection) {
      return { success: false, message: "Connection not found" };
    }

    await ctx.db.patch(connection._id, {
      scanStatus: "not_started",
      pageToken: undefined,
      totalEmailsScanned: 0,
      totalReceiptsFound: 0,
      syncCursor: undefined,
      lastSyncedAt: undefined,
      errorCode: undefined,
      errorMessage: undefined,
      status: "active",
      updatedAt: Date.now(),
    });

    return {
      success: true,
      message: `Reset scan progress for ${args.email}. Ready to scan from scratch.`,
    };
  },
});

/**
 * Reset lifetime email connection limit (TESTING ONLY)
 * This allows re-testing Gmail connections during development
 */
export const resetLifetimeLimit = mutation({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      throw new Error(`User not found with clerkId: ${args.clerkId}`);
    }

    const previousLimit = user.emailConnectionsUsedLifetime || 0;

    await ctx.db.patch(user._id, {
      emailConnectionsUsedLifetime: 0,
      updatedAt: Date.now(),
    });

    return {
      success: true,
      message: `Reset lifetime limit for ${args.clerkId} (was ${previousLimit}, now 0)`,
      previousLimit,
      currentLimit: 0,
    };
  },
});

/**
 * Fix email connection by adding missing userId field
 * Use this when connection exists but is missing userId
 */
export const fixConnectionUserId = mutation({
  args: {
    email: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const connection = await ctx.db
      .query("emailConnections")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!connection) {
      return { success: false, message: "Connection not found" };
    }

    await ctx.db.patch(connection._id, {
      userId: args.userId,
      updatedAt: Date.now(),
    });

    return {
      success: true,
      message: `Added userId ${args.userId} to connection for ${args.email}`,
      connectionId: connection._id,
    };
  },
});
