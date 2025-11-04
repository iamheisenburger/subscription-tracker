/**
 * Debug queries for production issues
 */

import { query, action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

/**
 * Get comprehensive debug info for a user
 */
export const getDebugInfo = query({
  args: {
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkUserId))
      .first();

    if (!user) {
      return { error: "User not found" };
    }

    // Get all receipts
    const allReceipts = await ctx.db
      .query("emailReceipts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Count by status
    const parsed = allReceipts.filter(r => r.parsed === true);
    const unparsed = allReceipts.filter(r => r.parsed !== true);
    const withMerchant = parsed.filter(r => r.merchantName && r.merchantName.trim() !== "");
    const withoutMerchant = parsed.filter(r => !r.merchantName || r.merchantName.trim() === "");

    // Get all detection candidates
    const allCandidates = await ctx.db
      .query("detectionCandidates")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const pendingCandidates = allCandidates.filter(c => c.status === "pending");
    const dismissedCandidates = allCandidates.filter(c => c.status === "dismissed");

    // Search for specific subscriptions in receipts
    const searchTerms = ["chatgpt", "openai", "perplexity", "spotify", "surfshark", "brandon", "fpl", "patreon"];
    const foundReceipts: Record<string, any[]> = {};

    for (const term of searchTerms) {
      const matches = allReceipts.filter(r =>
        r.subject?.toLowerCase().includes(term) ||
        r.from?.toLowerCase().includes(term) ||
        r.merchantName?.toLowerCase().includes(term)
      );
      if (matches.length > 0) {
        foundReceipts[term] = matches.map(r => ({
          subject: r.subject,
          from: r.from,
          merchantName: r.merchantName,
          amount: r.amount,
          parsed: r.parsed,
          receivedAt: new Date(r.receivedAt).toISOString(),
        }));
      }
    }

    // Check for PlayStation duplicates
    const playstationCandidates = pendingCandidates.filter(c =>
      c.proposedName.toLowerCase().includes("playstation")
    );

    return {
      user: {
        email: user.email,
        tier: user.tier,
      },
      receipts: {
        total: allReceipts.length,
        parsed: parsed.length,
        unparsed: unparsed.length,
        withMerchantData: withMerchant.length,
        withoutMerchantData: withoutMerchant.length,
      },
      candidates: {
        total: allCandidates.length,
        pending: pendingCandidates.length,
        dismissed: dismissedCandidates.length,
        playstationDuplicates: playstationCandidates.length,
        playstationDetails: playstationCandidates.map(c => ({
          name: c.proposedName,
          amount: c.proposedAmount,
          status: c.status,
        })),
      },
      missingSubscriptions: foundReceipts,
      pendingCandidateNames: pendingCandidates.map(c => c.proposedName).sort(),
    };
  },
});

/**
 * Test Gmail API directly to see what's being returned
 */
export const testGmailQuery = action({
  args: {
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get user's email connections directly
    const connections: any[] = await ctx.runQuery(internal.emailScanner.getUserConnectionsInternal, {
      clerkUserId: args.clerkUserId,
    });

    if (connections.length === 0) {
      return { error: "No email connections found" };
    }

    const connection = connections[0];

    // Test 1: Query for emails from vercel.com (known to exist)
    const testQuery1 = "from:vercel.com after:2024/01/01";
    console.log(`🧪 Testing query: ${testQuery1}`);

    try {
      const response1 = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(testQuery1)}&maxResults=10`,
        {
          headers: {
            Authorization: `Bearer ${connection.accessToken}`,
          },
        }
      );

      const data1 = await response1.json();
      console.log(`📧 Vercel query result:`, JSON.stringify(data1, null, 2));

      // Test 2: Query for emails from anthropic.com
      const testQuery2 = "from:anthropic.com after:2024/01/01";
      console.log(`🧪 Testing query: ${testQuery2}`);

      const response2 = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(testQuery2)}&maxResults=10`,
        {
          headers: {
            Authorization: `Bearer ${connection.accessToken}`,
          },
        }
      );

      const data2 = await response2.json();
      console.log(`📧 Anthropic query result:`, JSON.stringify(data2, null, 2));

      // Test 3: Query with multiple domains (like actual scan does)
      const testQuery3 = "from:(vercel.com OR anthropic.com OR openai.com) after:2024/01/01";
      console.log(`🧪 Testing query: ${testQuery3}`);

      const response3 = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(testQuery3)}&maxResults=10`,
        {
          headers: {
            Authorization: `Bearer ${connection.accessToken}`,
          },
        }
      );

      const data3 = await response3.json();
      console.log(`📧 Multi-domain query result:`, JSON.stringify(data3, null, 2));

      return {
        connection: {
          email: connection.email,
          hasAccessToken: !!connection.accessToken,
          tokenExpiry: connection.tokenExpiresAt,
        },
        tests: {
          vercel: data1,
          anthropic: data2,
          multiDomain: data3,
        },
      };
    } catch (error: any) {
      console.error("❌ Gmail API error:", error);
      return { error: error.message, stack: error.stack };
    }
  },
});
