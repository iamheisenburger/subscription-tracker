/**
 * Convex Functions: Audit Logs
 * Security and compliance audit logging
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Log an audit event
 */
export const log = mutation({
  args: {
    clerkUserId: v.string(),
    action: v.string(),
    resourceType: v.optional(v.string()),
    resourceId: v.optional(v.string()),
    metadata: v.optional(v.any()),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
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

    // Create audit log entry
    const logId = await ctx.db.insert("auditLogs", {
      userId: user._id,
      action: args.action,
      resourceType: args.resourceType,
      resourceId: args.resourceId,
      metadata: args.metadata,
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
      createdAt: Date.now(),
    });

    return logId;
  },
});

/**
 * Get audit logs for a user
 */
export const getUserLogs = query({
  args: {
    clerkUserId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkUserId))
      .first();

    if (!user) {
      return [];
    }

    const query = ctx.db
      .query("auditLogs")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc");

    return args.limit ? await query.take(args.limit) : await query.collect();
  },
});

/**
 * Get audit logs by action
 */
export const getByAction = query({
  args: {
    action: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const query = ctx.db
      .query("auditLogs")
      .withIndex("by_action", (q) => q.eq("action", args.action))
      .order("desc");

    return args.limit ? await query.take(args.limit) : await query.collect();
  },
});

/**
 * Get recent audit logs (for admin/monitoring)
 */
export const getRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const query = ctx.db.query("auditLogs").withIndex("by_created").order("desc");

    return args.limit ? await query.take(args.limit) : await query.take(100);
  },
});
