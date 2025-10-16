/**
 * API Route: Exchange Plaid Public Token
 * POST /api/plaid/exchange-token
 *
 * Exchanges a public_token from Plaid Link for an access_token
 * Creates bank connection, fetches institution info, accounts, and initial transactions
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  exchangePublicToken,
  getInstitution,
  getItem,
  getAccounts,
  syncTransactions,
} from "@/lib/plaid-client";
import { api } from "../../../../../convex/_generated/api";
import { fetchMutation } from "convex/nextjs";

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get public token from request
    const body = await request.json();
    const { publicToken, metadata } = body;

    if (!publicToken) {
      return NextResponse.json(
        { error: "Missing public_token" },
        { status: 400 }
      );
    }

    // Exchange public token for access token
    const { accessToken, itemId } = await exchangePublicToken(publicToken);

    // Get item info to fetch institution ID
    const item = await getItem(accessToken);
    const institutionId = item.institution_id;

    if (!institutionId) {
      return NextResponse.json(
        { error: "No institution ID found" },
        { status: 500 }
      );
    }

    // Get institution information
    const institutionInfo = await getInstitution(institutionId);

    // Get accounts
    const accounts = await getAccounts(accessToken);

    // Create or update institution in Convex
    const convexInstitutionId = await fetchMutation(api.institutions.createOrUpdate, {
      plaidInstitutionId: institutionInfo.institutionId,
      name: institutionInfo.name,
      logoUrl: institutionInfo.logoUrl,
      primaryColor: institutionInfo.primaryColor,
      url: institutionInfo.url,
      countryCode: "US", // TODO: Make dynamic based on metadata
    });

    // Create bank connection in Convex
    const bankConnectionId = await fetchMutation(api.bankConnections.create, {
      clerkUserId: userId,
      institutionId: convexInstitutionId,
      plaidItemId: itemId,
      accessToken, // Will be encrypted by Convex
    });

    // Create accounts in Convex
    const accountIds = await Promise.all(
      accounts.map((account) =>
        fetchMutation(api.accounts.create, {
          bankConnectionId,
          plaidAccountId: account.account_id,
          name: account.name,
          officialName: account.official_name || undefined,
          type: account.type,
          subtype: account.subtype || undefined,
          mask: account.mask || undefined,
          currency: account.balances.iso_currency_code || "USD",
          balanceCurrent: account.balances.current || undefined,
          balanceAvailable: account.balances.available || undefined,
        })
      )
    );

    // Start initial transaction sync (async)
    // Use transactions/sync endpoint for incremental updates
    const syncResult = await syncTransactions(accessToken);

    // Process transactions in Convex
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
        bankConnectionId,
      });
    }

    // Update connection with sync cursor
    await fetchMutation(api.bankConnections.updateSyncCursor, {
      connectionId: bankConnectionId,
      cursor: syncResult.nextCursor,
    });

    // Log audit event
    await fetchMutation(api.auditLogs.log, {
      clerkUserId: userId,
      action: "bank_connected",
      resourceType: "bank_connection",
      resourceId: bankConnectionId,
      metadata: {
        institutionName: institutionInfo.name,
        accountCount: accounts.length,
        transactionCount: syncResult.added.length,
      },
    });

    return NextResponse.json({
      success: true,
      bankConnectionId,
      institution: institutionInfo,
      accountCount: accounts.length,
      transactionCount: syncResult.added.length,
    });
  } catch (error) {
    console.error("Error exchanging public token:", error);
    return NextResponse.json(
      { error: "Failed to exchange token and setup connection" },
      { status: 500 }
    );
  }
}
