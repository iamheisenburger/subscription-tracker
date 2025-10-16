/**
 * API Route: Plaid Webhook Handler
 * POST /api/plaid/webhook
 *
 * Handles webhook events from Plaid for transaction updates
 */

import { NextRequest, NextResponse } from "next/server";
import { syncTransactions } from "@/lib/plaid-client";
import { api } from "../../../../../convex/_generated/api";
import { fetchMutation, fetchQuery } from "convex/nextjs";

export async function POST(request: NextRequest) {
  try {
    // Parse webhook payload
    const body = await request.json();
    const { webhook_type, webhook_code, item_id } = body;

    console.log(`[Plaid Webhook] Type: ${webhook_type}, Code: ${webhook_code}, Item: ${item_id}`);

    // Handle different webhook types
    switch (webhook_type) {
      case "TRANSACTIONS":
        await handleTransactionsWebhook(webhook_code, item_id, body);
        break;

      case "ITEM":
        await handleItemWebhook(webhook_code, item_id, body);
        break;

      default:
        console.log(`[Plaid Webhook] Unhandled webhook type: ${webhook_type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing Plaid webhook:", error);
    // Return 200 anyway to prevent Plaid from retrying
    return NextResponse.json({ received: true, error: "Processing failed" });
  }
}

/**
 * Handle TRANSACTIONS webhooks
 */
async function handleTransactionsWebhook(code: string, itemId: string, payload: Record<string, unknown>) {
  switch (code) {
    case "SYNC_UPDATES_AVAILABLE":
    case "DEFAULT_UPDATE":
    case "INITIAL_UPDATE":
    case "HISTORICAL_UPDATE":
      await syncTransactionsForItem(itemId);
      break;

    case "TRANSACTIONS_REMOVED":
      // Handle removed transactions
      const removedTransactions = (payload.removed_transactions as string[]) || [];
      for (const txId of removedTransactions) {
        await fetchMutation(api.transactions.deleteByPlaidId, {
          plaidTransactionId: txId,
        });
      }
      break;

    default:
      console.log(`[Plaid Webhook] Unhandled transactions webhook code: ${code}`);
  }
}

/**
 * Handle ITEM webhooks (connection status changes)
 */
async function handleItemWebhook(code: string, itemId: string, payload: Record<string, unknown>) {
  switch (code) {
    case "ERROR":
      // Update connection status to error
      const errorObj = payload.error as { error_code?: string; error_message?: string } | undefined;
      await fetchMutation(api.bankConnections.updateStatus, {
        plaidItemId: itemId,
        status: "error",
        errorCode: errorObj?.error_code,
        errorMessage: errorObj?.error_message,
      });
      break;

    case "PENDING_EXPIRATION":
      // Warn user that connection will expire soon
      await fetchMutation(api.bankConnections.updateStatus, {
        plaidItemId: itemId,
        status: "requires_reauth",
        errorMessage: "Connection requires re-authentication",
      });
      break;

    case "USER_PERMISSION_REVOKED":
      // User revoked access
      await fetchMutation(api.bankConnections.updateStatus, {
        plaidItemId: itemId,
        status: "disconnected",
        errorMessage: "User revoked bank access",
      });
      break;

    default:
      console.log(`[Plaid Webhook] Unhandled item webhook code: ${code}`);
  }
}

/**
 * Sync transactions for a specific item
 */
async function syncTransactionsForItem(itemId: string) {
  try {
    // Get bank connection from Convex
    const connection = await fetchQuery(api.bankConnections.getByPlaidItemId, {
      plaidItemId: itemId,
    });

    if (!connection || !connection.accessToken) {
      console.error(`[Plaid Webhook] No connection found for item ${itemId}`);
      return;
    }

    // Get current sync cursor
    const cursor = connection.syncCursor;

    // Sync transactions
    const syncResult = await syncTransactions(connection.accessToken, cursor);

    // Process added transactions
    if (syncResult.added.length > 0) {
      await fetchMutation(api.transactions.bulkCreate, {
        transactions: syncResult.added.map((tx) => ({
          plaidAccountId: tx.account_id,
          plaidTransactionId: tx.transaction_id,
          amount: tx.amount,
          currency: tx.iso_currency_code || "USD",
          date: tx.date,
          authorizedDate: tx.authorized_date || undefined,
          merchantName: tx.merchant_name || tx.name,
          category: tx.category || undefined,
          pending: tx.pending,
          paymentChannel: tx.payment_channel || undefined,
        })),
        bankConnectionId: connection._id,
      });
    }

    // Process modified transactions
    if (syncResult.modified.length > 0) {
      for (const tx of syncResult.modified) {
        await fetchMutation(api.transactions.updateByPlaidId, {
          plaidTransactionId: tx.transaction_id,
          updates: {
            amount: tx.amount,
            date: tx.date,
            pending: tx.pending,
            merchantName: tx.merchant_name || tx.name,
          },
        });
      }
    }

    // Process removed transactions
    if (syncResult.removed.length > 0) {
      for (const removedTx of syncResult.removed) {
        await fetchMutation(api.transactions.deleteByPlaidId, {
          plaidTransactionId: removedTx.transaction_id,
        });
      }
    }

    // Update sync cursor and last synced time
    await fetchMutation(api.bankConnections.updateSyncCursor, {
      connectionId: connection._id,
      cursor: syncResult.nextCursor,
    });

    // Trigger detection for new transactions
    if (syncResult.added.length > 0) {
      // Run subscription detection
      await fetchMutation(api.detection.runDetection, {
        connectionId: connection._id,
      }).catch((err) => {
        console.error("[Plaid Webhook] Detection failed:", err);
      });

      // Run duplicate charge detection
      await fetchMutation(api.detection.detectDuplicateCharges, {
        connectionId: connection._id,
      }).catch((err) => {
        console.error("[Plaid Webhook] Duplicate detection failed:", err);
      });
    }

    console.log(
      `[Plaid Webhook] Synced ${syncResult.added.length} added, ${syncResult.modified.length} modified, ${syncResult.removed.length} removed for item ${itemId}`
    );
  } catch (error) {
    console.error(`[Plaid Webhook] Error syncing transactions for item ${itemId}:`, error);
  }
}
