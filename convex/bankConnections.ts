/**
 * Convex Functions: Bank Connections
 * Manages Plaid bank connections with encrypted access tokens
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Create a new bank connection
 */
export const create = mutation({
  args: {
    clerkUserId: v.string(),
    institutionId: v.id("institutions"),
    plaidItemId: v.string(),
    accessToken: v.string(),
    orgId: v.optional(v.id("organizations")),
  },
  handler: async (ctx, args) => {
    // Get user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkUserId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Create connection (access token will be encrypted by Convex)
    const connectionId = await ctx.db.insert("bankConnections", {
      userId: user._id,
      orgId: args.orgId,
      institutionId: args.institutionId,
      plaidItemId: args.plaidItemId,
      accessToken: args.accessToken,
      status: "active",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Update user's connections count
    const currentConnections = user.connectionsUsed || 0;
    await ctx.db.patch(user._id, {
      connectionsUsed: currentConnections + 1,
    });

    return connectionId;
  },
});

/**
 * Get connection by ID
 */
export const getById = query({
  args: { connectionId: v.id("bankConnections") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.connectionId);
  },
});

/**
 * Get connection by Plaid item ID
 */
export const getByPlaidItemId = query({
  args: { plaidItemId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("bankConnections")
      .withIndex("by_plaid_item", (q) => q.eq("plaidItemId", args.plaidItemId))
      .first();
  },
});

/**
 * Get all connections for a user
 */
export const getUserConnections = query({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    // Get user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkUserId))
      .first();

    if (!user) {
      return [];
    }

    // Get connections
    const connections = await ctx.db
      .query("bankConnections")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Enrich with institution data
    const enrichedConnections = await Promise.all(
      connections.map(async (conn) => {
        const institution = await ctx.db.get(conn.institutionId);
        return {
          ...conn,
          accessToken: undefined, // Never send access token to client
          institution,
        };
      })
    );

    return enrichedConnections;
  },
});

/**
 * Get active connections count for a user
 */
export const getActiveConnectionsCount = query({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkUserId))
      .first();

    if (!user) {
      return 0;
    }

    const connections = await ctx.db
      .query("bankConnections")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", user._id).eq("status", "active")
      )
      .collect();

    return connections.length;
  },
});

/**
 * Update connection status (supports both connectionId and plaidItemId)
 */
export const updateStatus = mutation({
  args: {
    connectionId: v.optional(v.id("bankConnections")),
    plaidItemId: v.optional(v.string()),
    status: v.union(
      v.literal("active"),
      v.literal("disconnected"),
      v.literal("error"),
      v.literal("requires_reauth")
    ),
    error: v.optional(v.string()),
    errorCode: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let connection;

    if (args.connectionId) {
      connection = await ctx.db.get(args.connectionId);
    } else if (args.plaidItemId) {
      connection = await ctx.db
        .query("bankConnections")
        .withIndex("by_plaid_item", (q) => q.eq("plaidItemId", args.plaidItemId!))
        .first();
    } else {
      throw new Error("Either connectionId or plaidItemId must be provided");
    }

    if (!connection) {
      throw new Error("Connection not found");
    }

    await ctx.db.patch(connection._id, {
      status: args.status,
      errorCode: args.errorCode,
      errorMessage: args.errorMessage || args.error,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Update sync cursor
 */
export const updateSyncCursor = mutation({
  args: {
    connectionId: v.id("bankConnections"),
    cursor: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.connectionId, {
      syncCursor: args.cursor,
      lastSyncedAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

/**
 * Disconnect (soft delete) a connection
 */
export const disconnect = mutation({
  args: {
    connectionId: v.id("bankConnections"),
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify ownership
    const connection = await ctx.db.get(args.connectionId);
    if (!connection) {
      throw new Error("Connection not found");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkUserId))
      .first();

    if (!user || connection.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    // Update status to disconnected
    await ctx.db.patch(args.connectionId, {
      status: "disconnected",
      updatedAt: Date.now(),
    });

    // Decrement user's connections count
    const currentConnections = user.connectionsUsed || 0;
    await ctx.db.patch(user._id, {
      connectionsUsed: Math.max(0, currentConnections - 1),
    });

    // Mark all associated subscriptions as inactive (if they were auto-detected)
    const accounts = await ctx.db
      .query("accounts")
      .withIndex("by_connection", (q) => q.eq("bankConnectionId", args.connectionId))
      .collect();

    for (const account of accounts) {
      // Mark account inactive
      await ctx.db.patch(account._id, {
        isActive: false,
        updatedAt: Date.now(),
      });
    }

    // Note: We keep the transactions for historical purposes
    // Subscriptions detected from this connection remain but are marked with source

    return true;
  },
});

/**
 * Delete connection and all associated data
 */
export const deleteConnection = mutation({
  args: {
    connectionId: v.id("bankConnections"),
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify ownership
    const connection = await ctx.db.get(args.connectionId);
    if (!connection) {
      throw new Error("Connection not found");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkUserId))
      .first();

    if (!user || connection.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    // Get all accounts
    const accounts = await ctx.db
      .query("accounts")
      .withIndex("by_connection", (q) => q.eq("bankConnectionId", args.connectionId))
      .collect();

    // Delete all transactions for each account
    for (const account of accounts) {
      const transactions = await ctx.db
        .query("transactions")
        .withIndex("by_account", (q) => q.eq("accountId", account._id))
        .collect();

      for (const tx of transactions) {
        await ctx.db.delete(tx._id);
      }

      // Delete account
      await ctx.db.delete(account._id);
    }

    // Delete connection
    await ctx.db.delete(args.connectionId);

    // Decrement user's connections count
    const currentConnections = user.connectionsUsed || 0;
    await ctx.db.patch(user._id, {
      connectionsUsed: Math.max(0, currentConnections - 1),
    });

    return true;
  },
});
