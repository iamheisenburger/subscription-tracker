/**
 * API Route: Create Plaid Link Token
 * POST /api/plaid/create-link-token
 *
 * Generates a link_token for initializing Plaid Link
 * Includes tier gating and connection limit checks
 */

import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { createLinkToken } from "@/lib/plaid-client";
import { getTierFromString, getPlanEntitlement } from "@/lib/plan-entitlements";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user tier from Clerk metadata
    const tierString = (user.publicMetadata?.tier as string) || "free_user";
    const tier = getTierFromString(tierString);
    const entitlement = getPlanEntitlement(tier);

    // Check if user's tier allows bank connections
    if (!entitlement.canLinkBanks) {
      return NextResponse.json(
        {
          error: "Bank connections require Automate tier",
          code: "TIER_REQUIRED",
          requiredTier: "automate_1",
        },
        { status: 403 }
      );
    }

    // Check current connection count
    const activeConnectionsCount = await convex.query(
      api.bankConnections.getActiveConnectionsCount,
      { clerkUserId: userId }
    );

    if (activeConnectionsCount >= entitlement.connectionsIncluded) {
      return NextResponse.json(
        {
          error: `Bank connection limit reached (${activeConnectionsCount}/${entitlement.connectionsIncluded})`,
          code: "LIMIT_REACHED",
          currentCount: activeConnectionsCount,
          maxCount: entitlement.connectionsIncluded,
        },
        { status: 403 }
      );
    }

    // Get user info from request body (optional)
    const body = await request.json().catch(() => ({}));
    const { redirectUri } = body;

    // Create link token
    const linkToken = await createLinkToken({
      userId,
      userName: user.firstName
        ? `${user.firstName} ${user.lastName || ""}`.trim()
        : "SubWise User",
      webhookUrl: `${process.env.NEXT_PUBLIC_SITE_URL || process.env.PUBLIC_SITE_URL || "https://app.subwise.com"}/api/plaid/webhook`,
      redirectUri,
    });

    return NextResponse.json({
      linkToken,
    });
  } catch (error) {
    console.error("Error creating link token:", error);
    return NextResponse.json(
      { error: "Failed to create link token" },
      { status: 500 }
    );
  }
}
