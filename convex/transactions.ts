/**
 * Convex Functions: Transactions
 * Manages bank transactions with deduplication and merchant normalization
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Create transaction hash for deduplication
 * Simple hash function that works in Convex runtime
 */
function createTransactionHash(
  accountId: string,
  amount: number,
  date: string,
  merchantName: string
): string {
  const data = `${accountId}:${amount}:${date}:${merchantName}`;
  // Simple string hash that works without crypto module
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Bulk create transactions
 */
export const bulkCreate = mutation({
  args: {
    transactions: v.array(
      v.object({
        plaidAccountId: v.string(),
        plaidTransactionId: v.string(),
        amount: v.number(),
        currency: v.string(),
        date: v.string(),
        authorizedDate: v.optional(v.string()),
        merchantName: v.optional(v.string()),
        category: v.optional(v.array(v.string())),
        pending: v.boolean(),
        paymentChannel: v.optional(v.string()),
      })
    ),
    bankConnectionId: v.id("bankConnections"),
  },
  handler: async (ctx, args) => {
    const created = [];
    const skipped = [];

    for (const tx of args.transactions) {
      // Get account
      const account = await ctx.db
        .query("accounts")
        .withIndex("by_plaid_id", (q) => q.eq("plaidAccountId", tx.plaidAccountId))
        .first();

      if (!account) {
        console.warn(`Account not found for Plaid ID: ${tx.plaidAccountId}`);
        skipped.push(tx.plaidTransactionId);
        continue;
      }

      // Check if transaction already exists
      const existing = await ctx.db
        .query("transactions")
        .withIndex("by_plaid_id", (q) => q.eq("plaidTransactionId", tx.plaidTransactionId))
        .first();

      if (existing) {
        skipped.push(tx.plaidTransactionId);
        continue;
      }

      // Create hash for deduplication
      const hash = createTransactionHash(
        account._id,
        tx.amount,
        tx.date,
        tx.merchantName || "Unknown"
      );

      // Normalize merchant name (basic normalization, enhanced later)
      const merchantNameNormalized = normalizeMerchantName(tx.merchantName || "");

      // Insert transaction
      const transactionId = await ctx.db.insert("transactions", {
        accountId: account._id,
        plaidTransactionId: tx.plaidTransactionId,
        amount: tx.amount,
        currency: tx.currency,
        date: tx.date,
        authorizedDate: tx.authorizedDate,
        postedDate: tx.date, // Use date as posted date by default
        merchantName: tx.merchantName,
        merchantNameNormalized,
        category: tx.category,
        pending: tx.pending,
        paymentChannel: tx.paymentChannel,
        hash,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      created.push(transactionId);
    }

    return {
      created: created.length,
      skipped: skipped.length,
      createdIds: created,
    };
  },
});

/**
 * Basic merchant name normalization
 */
function normalizeMerchantName(name: string): string {
  if (!name) return "";

  let normalized = name.toUpperCase();

  // Remove common patterns
  normalized = normalized.replace(/\s+/g, " "); // Multiple spaces
  normalized = normalized.replace(/\*\d+$/, ""); // Trailing *1234
  normalized = normalized.replace(/\s+#\d+$/, ""); // Trailing #123
  normalized = normalized.replace(/\s+\d{2}\/\d{2}$/, ""); // Trailing dates
  normalized = normalized.replace(/^TST\s+/, ""); // TST prefix
  normalized = normalized.replace(/\.COM$/, ""); // .COM suffix

  normalized = normalized.trim();

  return normalized;
}

/**
 * Get transactions for an account
 */
export const getByAccount = query({
  args: {
    accountId: v.id("accounts"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const query = ctx.db
      .query("transactions")
      .withIndex("by_account", (q) => q.eq("accountId", args.accountId))
      .order("desc");

    if (args.limit) {
      return await query.take(args.limit);
    }

    return await query.collect();
  },
});

/**
 * Get transactions by date range
 */
export const getByDateRange = query({
  args: {
    accountId: v.id("accounts"),
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_account_date", (q) =>
        q.eq("accountId", args.accountId).gte("date", args.startDate).lte("date", args.endDate)
      )
      .collect();

    return transactions;
  },
});

/**
 * Update transaction by Plaid ID
 */
export const updateByPlaidId = mutation({
  args: {
    plaidTransactionId: v.string(),
    updates: v.object({
      amount: v.optional(v.number()),
      date: v.optional(v.string()),
      pending: v.optional(v.boolean()),
      merchantName: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const transaction = await ctx.db
      .query("transactions")
      .withIndex("by_plaid_id", (q) => q.eq("plaidTransactionId", args.plaidTransactionId))
      .first();

    if (!transaction) {
      throw new Error("Transaction not found");
    }

    await ctx.db.patch(transaction._id, {
      ...args.updates,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Delete transaction by Plaid ID
 */
export const deleteByPlaidId = mutation({
  args: { plaidTransactionId: v.string() },
  handler: async (ctx, args) => {
    const transaction = await ctx.db
      .query("transactions")
      .withIndex("by_plaid_id", (q) => q.eq("plaidTransactionId", args.plaidTransactionId))
      .first();

    if (transaction) {
      await ctx.db.delete(transaction._id);
    }
  },
});

/**
 * Get transactions for a user (across all accounts)
 */
export const getUserTransactions = query({
  args: {
    clerkUserId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Get user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkUserId))
      .first();

    if (!user) {
      return [];
    }

    // Get all bank connections
    const connections = await ctx.db
      .query("bankConnections")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Get all accounts
    const accounts = [];
    for (const conn of connections) {
      const connAccounts = await ctx.db
        .query("accounts")
        .withIndex("by_connection", (q) => q.eq("bankConnectionId", conn._id))
        .collect();
      accounts.push(...connAccounts);
    }

    // Get transactions for all accounts
    const allTransactions = [];
    for (const account of accounts) {
      const accountTxs = await ctx.db
        .query("transactions")
        .withIndex("by_account", (q) => q.eq("accountId", account._id))
        .order("desc")
        .take(args.limit || 100);

      allTransactions.push(...accountTxs.map((tx) => ({ ...tx, account })));
    }

    // Sort by date desc
    allTransactions.sort((a, b) => b.date.localeCompare(a.date));

    return args.limit ? allTransactions.slice(0, args.limit) : allTransactions;
  },
});
