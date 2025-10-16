/**
 * Convex Functions: Accounts
 * Manages bank accounts within connections
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Create a new account
 */
export const create = mutation({
  args: {
    bankConnectionId: v.id("bankConnections"),
    plaidAccountId: v.string(),
    name: v.string(),
    officialName: v.optional(v.string()),
    type: v.string(),
    subtype: v.optional(v.string()),
    mask: v.optional(v.string()),
    currency: v.string(),
    balanceCurrent: v.optional(v.number()),
    balanceAvailable: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Check if account already exists
    const existing = await ctx.db
      .query("accounts")
      .withIndex("by_plaid_id", (q) => q.eq("plaidAccountId", args.plaidAccountId))
      .first();

    if (existing) {
      // Update existing account
      await ctx.db.patch(existing._id, {
        name: args.name,
        officialName: args.officialName,
        balanceCurrent: args.balanceCurrent,
        balanceAvailable: args.balanceAvailable,
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    // Create new account
    const accountId = await ctx.db.insert("accounts", {
      bankConnectionId: args.bankConnectionId,
      plaidAccountId: args.plaidAccountId,
      name: args.name,
      officialName: args.officialName,
      type: args.type,
      subtype: args.subtype,
      mask: args.mask,
      currency: args.currency,
      balanceCurrent: args.balanceCurrent,
      balanceAvailable: args.balanceAvailable,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return accountId;
  },
});

/**
 * Get accounts for a connection
 */
export const getByConnection = query({
  args: { bankConnectionId: v.id("bankConnections") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("accounts")
      .withIndex("by_connection", (q) => q.eq("bankConnectionId", args.bankConnectionId))
      .collect();
  },
});

/**
 * Get account by Plaid ID
 */
export const getByPlaidId = query({
  args: { plaidAccountId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("accounts")
      .withIndex("by_plaid_id", (q) => q.eq("plaidAccountId", args.plaidAccountId))
      .first();
  },
});

/**
 * Update account balances
 */
export const updateBalances = mutation({
  args: {
    accountId: v.id("accounts"),
    balanceCurrent: v.optional(v.number()),
    balanceAvailable: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.accountId, {
      balanceCurrent: args.balanceCurrent,
      balanceAvailable: args.balanceAvailable,
      updatedAt: Date.now(),
    });
  },
});
