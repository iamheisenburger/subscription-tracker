import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Email Connections Management
 * Handles Gmail/Outlook OAuth connections
 */

/**
 * Create or update Gmail connection for a user
 */
export const createGmailConnection = mutation({
  args: {
    clerkUserId: v.string(),
    email: v.string(),
    accessToken: v.string(),
    refreshToken: v.string(),
    expiresIn: v.number(), // Seconds until token expires
  },
  handler: async (ctx, args) => {
    // Find user by Clerk ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkUserId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const now = Date.now();
    const tokenExpiresAt = now + args.expiresIn * 1000;

    // Check if connection already exists
    const existing = await ctx.db
      .query("emailConnections")
      .withIndex("by_user_provider", (q) =>
        q.eq("userId", user._id).eq("provider", "gmail")
      )
      .first();

    if (existing) {
      // Update existing connection
      await ctx.db.patch(existing._id, {
        email: args.email,
        accessToken: args.accessToken,
        refreshToken: args.refreshToken,
        tokenExpiresAt,
        status: "active",
        errorCode: undefined,
        errorMessage: undefined,
        updatedAt: now,
      });

      return { connectionId: existing._id, updated: true };
    }

    // Create new connection
    const connectionId = await ctx.db.insert("emailConnections", {
      userId: user._id,
      provider: "gmail",
      email: args.email,
      accessToken: args.accessToken,
      refreshToken: args.refreshToken,
      tokenExpiresAt,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    return { connectionId, updated: false };
  },
});

/**
 * Get user's email connections
 */
export const getUserConnections = query({
  args: {
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkUserId))
      .first();

    if (!user) return [];

    const connections = await ctx.db
      .query("emailConnections")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Don't return tokens to client
    return connections.map((conn) => ({
      _id: conn._id,
      provider: conn.provider,
      email: conn.email,
      status: conn.status,
      lastSyncedAt: conn.lastSyncedAt,
      errorMessage: conn.errorMessage,
      createdAt: conn.createdAt,
    }));
  },
});

/**
 * Disconnect (delete) an email connection
 */
export const disconnectEmail = mutation({
  args: {
    clerkUserId: v.string(),
    connectionId: v.id("emailConnections"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkUserId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Verify connection belongs to user
    const connection = await ctx.db.get(args.connectionId);
    if (!connection || connection.userId !== user._id) {
      throw new Error("Connection not found or unauthorized");
    }

    // Delete the connection
    await ctx.db.delete(args.connectionId);

    // Optionally: delete associated email receipts
    // (or mark them as orphaned)

    return { success: true };
  },
});

/**
 * Get connection with tokens (internal use only - for scanning)
 */
export const getConnectionWithTokens = query({
  args: {
    connectionId: v.id("emailConnections"),
  },
  handler: async (ctx, args) => {
    const connection = await ctx.db.get(args.connectionId);
    if (!connection) return null;

    // Check if token is expired
    const now = Date.now();
    const isExpired = connection.tokenExpiresAt < now;

    return {
      ...connection,
      isExpired,
    };
  },
});

/**
 * Update connection status (after scanning attempt)
 */
export const updateConnectionStatus = mutation({
  args: {
    connectionId: v.id("emailConnections"),
    status: v.union(
      v.literal("active"),
      v.literal("disconnected"),
      v.literal("error"),
      v.literal("requires_reauth")
    ),
    errorCode: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
    lastSyncedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { connectionId, ...updates } = args;

    await ctx.db.patch(connectionId, {
      ...updates,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});
