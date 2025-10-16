/**
 * Convex Internal Function: Daily Bank Sync
 * Automatically syncs transactions from Plaid for all active Automate tier users
 * Runs daily via cron job
 */

import { v } from "convex/values";
import { internalMutation, internalAction } from "./_generated/server";
import { internal, api } from "./_generated/api";

/**
 * Main daily sync function
 * Called by cron job daily at 3 AM UTC
 */
export const runDailyBankSync = internalMutation({
  args: {},
  handler: async (ctx) => {
    console.log("[Daily Sync] Starting daily bank sync for Automate users");

    // Get all Automate tier users
    const automateUsers = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tier"), "automate_1"))
      .collect();

    console.log(`[Daily Sync] Found ${automateUsers.length} Automate users`);

    let totalConnections = 0;
    let totalSynced = 0;
    let totalErrors = 0;

    // For each Automate user, sync their active bank connections
    for (const user of automateUsers) {
      // Get active bank connections
      const connections = await ctx.db
        .query("bankConnections")
        .withIndex("by_user_status", (q) => q.eq("userId", user._id).eq("status", "active"))
        .collect();

      console.log(`[Daily Sync] User ${user.clerkId}: ${connections.length} active connections`);

      for (const connection of connections) {
        totalConnections++;

        try {
          // Schedule individual connection sync
          // This will be called via action (actions can make external API calls)
          await ctx.scheduler.runAfter(0, internal.dailyBankSync.syncSingleConnection, {
            connectionId: connection._id,
          });

          totalSynced++;
        } catch (error) {
          console.error(`[Daily Sync] Error scheduling sync for connection ${connection._id}:`, error);
          totalErrors++;
        }
      }
    }

    console.log(
      `[Daily Sync] Completed: ${totalSynced}/${totalConnections} connections scheduled, ${totalErrors} errors`
    );

    return {
      automateUsers: automateUsers.length,
      totalConnections,
      synced: totalSynced,
      errors: totalErrors,
    };
  },
});

/**
 * Sync a single bank connection
 * Scheduled by runDailyBankSync, executed as separate job
 */
export const syncSingleConnection = internalMutation({
  args: {
    connectionId: v.id("bankConnections"),
  },
  handler: async (ctx, args) => {
    try {
      const connection = await ctx.db.get(args.connectionId);

      if (!connection) {
        console.error(`[Daily Sync] Connection ${args.connectionId} not found`);
        return { success: false, error: "Connection not found" };
      }

      // Skip if not active
      if (connection.status !== "active") {
        console.log(`[Daily Sync] Skipping connection ${args.connectionId} - status: ${connection.status}`);
        return { success: false, error: "Connection not active" };
      }

      console.log(`[Daily Sync] Scheduling sync action for connection ${args.connectionId}`);

      // Schedule the sync action (actions can call external APIs)
      await ctx.scheduler.runAfter(0, internal.dailyBankSync.syncConnectionAction, {
        connectionId: args.connectionId,
      });

      return { success: true, message: "Sync scheduled" };
    } catch (error) {
      console.error(`[Daily Sync] Error syncing connection ${args.connectionId}:`, error);
      return { success: false, error: String(error) };
    }
  },
});

/**
 * Internal action to sync a single bank connection
 * Actions can make external API calls (Plaid)
 */
export const syncConnectionAction = internalAction({
  args: {
    connectionId: v.id("bankConnections"),
  },
  handler: async (ctx, args) => {
    console.log(`[Daily Sync Action] Starting sync for connection ${args.connectionId}`);

    try {
      // Get connection details
      const connection = await ctx.runQuery(api.bankConnections.getById, {
        connectionId: args.connectionId,
      });

      if (!connection) {
        console.error(`[Daily Sync Action] Connection ${args.connectionId} not found`);
        return { success: false, error: "Connection not found" };
      }

      if (connection.status !== "active") {
        console.log(`[Daily Sync Action] Connection ${args.connectionId} not active, skipping`);
        return { success: false, error: "Connection not active" };
      }

      // Call Plaid API to sync transactions
      const { syncTransactions } = await import("../src/lib/plaid-client");

      let hasMore = true;
      let currentCursor: string | undefined = connection.syncCursor || undefined;
      let totalAdded = 0;
      let totalModified = 0;
      let totalRemoved = 0;

      // Keep syncing until we've retrieved all updates
      while (hasMore) {
        console.log(`[Daily Sync Action] Fetching transactions with cursor: ${currentCursor || "initial"}`);

        const syncResult = await syncTransactions(connection.accessToken, currentCursor);

        // Process added transactions
        if (syncResult.added.length > 0) {
          console.log(`[Daily Sync Action] Processing ${syncResult.added.length} new transactions`);

          const formattedTransactions = syncResult.added.map((tx) => ({
            plaidAccountId: tx.account_id,
            plaidTransactionId: tx.transaction_id,
            amount: tx.amount,
            currency: tx.iso_currency_code || "USD",
            date: tx.date,
            authorizedDate: tx.authorized_date || undefined,
            merchantName: tx.merchant_name || tx.name || undefined,
            category: tx.category || undefined,
            pending: tx.pending,
            paymentChannel: tx.payment_channel || undefined,
          }));

          // Bulk create transactions via mutation
          const createResult = await ctx.runMutation(api.transactions.bulkCreate, {
            transactions: formattedTransactions,
            bankConnectionId: args.connectionId,
          });

          totalAdded += createResult.created;
          console.log(`[Daily Sync Action] Created ${createResult.created} transactions, skipped ${createResult.skipped}`);
        }

        // Process modified transactions
        if (syncResult.modified.length > 0) {
          console.log(`[Daily Sync Action] Processing ${syncResult.modified.length} modified transactions`);

          for (const tx of syncResult.modified) {
            try {
              await ctx.runMutation(api.transactions.updateByPlaidId, {
                plaidTransactionId: tx.transaction_id,
                updates: {
                  amount: tx.amount,
                  date: tx.date,
                  pending: tx.pending,
                  merchantName: tx.merchant_name || tx.name || undefined,
                },
              });
              totalModified++;
            } catch (error) {
              console.warn(`[Daily Sync Action] Failed to update transaction ${tx.transaction_id}:`, error);
            }
          }
        }

        // Process removed transactions
        if (syncResult.removed.length > 0) {
          console.log(`[Daily Sync Action] Processing ${syncResult.removed.length} removed transactions`);

          for (const removedTx of syncResult.removed) {
            try {
              await ctx.runMutation(api.transactions.deleteByPlaidId, {
                plaidTransactionId: removedTx.transaction_id,
              });
              totalRemoved++;
            } catch (error) {
              console.warn(`[Daily Sync Action] Failed to delete transaction ${removedTx.transaction_id}:`, error);
            }
          }
        }

        // Update cursor and check if more data available
        currentCursor = syncResult.nextCursor;
        hasMore = syncResult.hasMore;
      }

      // Update connection with new cursor and last sync time
      if (currentCursor) {
        await ctx.runMutation(api.bankConnections.updateSyncCursor, {
          connectionId: args.connectionId,
          cursor: currentCursor,
        });
      }

      console.log(
        `[Daily Sync Action] Sync complete for ${args.connectionId}: +${totalAdded} ~${totalModified} -${totalRemoved}`
      );

      // Run detection on new transactions
      if (totalAdded > 0) {
        console.log(`[Daily Sync Action] Running detection for user`);
        const user = await ctx.runQuery(api.users.getByInternalId, {
          userId: connection.userId,
        });

        if (user) {
          await ctx.runMutation(api.detection.runDetection, {
            connectionId: args.connectionId,
          });

          // Also run duplicate detection
          await ctx.runMutation(api.detection.detectDuplicateCharges, {
            connectionId: args.connectionId,
          });
        }
      }

      return {
        success: true,
        added: totalAdded,
        modified: totalModified,
        removed: totalRemoved,
      };
    } catch (error) {
      console.error(`[Daily Sync Action] Error syncing connection ${args.connectionId}:`, error);

      // Mark connection as error if Plaid returns auth error
      const errorMessage = String(error);
      if (errorMessage.includes("ITEM_LOGIN_REQUIRED") || errorMessage.includes("ITEM_LOCKED")) {
        await ctx.runMutation(api.bankConnections.updateStatus, {
          connectionId: args.connectionId,
          status: "requires_reauth",
          error: errorMessage,
        });
      }

      return { success: false, error: errorMessage };
    }
  },
});
