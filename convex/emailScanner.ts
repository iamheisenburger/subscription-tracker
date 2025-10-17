/**
 * Email Scanner Service
 * Scans connected email accounts (Gmail) for subscription receipts and invoices
 */

import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";

/**
 * Scan Gmail for receipts and store raw email data
 * Called by scheduled cron job for Automate tier users
 */
export const scanGmailForReceipts = internalMutation({
  args: {
    connectionId: v.id("emailConnections"),
  },
  handler: async (ctx, args) => {
    // Get the email connection
    const connection = await ctx.db.get(args.connectionId);
    if (!connection) {
      console.error("Email connection not found:", args.connectionId);
      return { success: false, error: "Connection not found" };
    }

    // Verify connection is active and token is valid
    if (connection.status !== "active") {
      console.log("Skipping inactive connection:", connection.email);
      return { success: false, error: "Connection not active" };
    }

    // Check if token needs refresh
    const now = Date.now();
    if (connection.tokenExpiresAt <= now) {
      console.log("Token expired for connection:", connection.email);

      // Attempt to refresh token
      const refreshResult = await refreshGmailToken(ctx, connection);
      if (!refreshResult.success) {
        // Update connection status to require reauth
        await ctx.db.patch(connection._id, {
          status: "requires_reauth",
          errorCode: "token_expired",
          errorMessage: "OAuth token expired and refresh failed",
          updatedAt: now,
        });
        return { success: false, error: "Token refresh failed" };
      }

      // Refresh successful, get updated connection
      const updatedConnection = await ctx.db.get(connection._id);
      if (!updatedConnection) {
        return { success: false, error: "Connection lost after refresh" };
      }
    }

    // Refresh connection data after potential token refresh
    const activeConnection = await ctx.db.get(connection._id);
    if (!activeConnection) {
      return { success: false, error: "Connection lost" };
    }

    try {
      // Build Gmail API query
      // Search for: purchases, receipts, invoices, subscription confirmations
      const query = [
        "category:purchases",
        "OR subject:receipt",
        "OR subject:invoice",
        "OR subject:payment",
        "OR subject:subscription",
        "OR from:noreply@",
        "OR from:receipts@",
        "OR from:billing@",
      ].join(" ");

      // Use syncCursor if available for incremental scanning
      let searchQuery = query;
      if (activeConnection.syncCursor) {
        // Gmail API uses historyId for incremental sync
        searchQuery = `${query} after:${activeConnection.syncCursor}`;
      } else {
        // First scan - get last 30 days
        const thirtyDaysAgo = Math.floor((now - 30 * 24 * 60 * 60 * 1000) / 1000);
        searchQuery = `${query} after:${thirtyDaysAgo}`;
      }

      // Fetch messages from Gmail API
      const messagesResponse = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(searchQuery)}&maxResults=100`,
        {
          headers: {
            Authorization: `Bearer ${activeConnection.accessToken}`,
          },
        }
      );

      if (!messagesResponse.ok) {
        const errorText = await messagesResponse.text();
        console.error("Gmail API error:", messagesResponse.status, errorText);

        // Check for auth errors
        if (messagesResponse.status === 401 || messagesResponse.status === 403) {
          await ctx.db.patch(connection._id, {
            status: "requires_reauth",
            errorCode: "auth_failed",
            errorMessage: "Gmail API authentication failed",
            updatedAt: now,
          });
        }

        return { success: false, error: "Gmail API request failed" };
      }

      const messagesData = await messagesResponse.json();
      const messages = messagesData.messages || [];

      console.log(`Found ${messages.length} potential receipt emails for ${activeConnection.email}`);

      // Fetch full message details for each message
      let processedCount = 0;
      let newReceiptsCount = 0;

      for (const message of messages) {
        const messageId = message.id;

        // Check if we already have this message
        const existing = await ctx.db
          .query("emailReceipts")
          .withIndex("by_message_id", (q) => q.eq("messageId", messageId))
          .first();

        if (existing) {
          console.log("Skipping duplicate message:", messageId);
          continue;
        }

        // Fetch full message data
        const messageResponse = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
          {
            headers: {
              Authorization: `Bearer ${activeConnection.accessToken}`,
            },
          }
        );

        if (!messageResponse.ok) {
          console.error("Failed to fetch message:", messageId);
          continue;
        }

        const messageData = await messageResponse.json();

        // Extract headers
        const headers = messageData.payload?.headers || [];
        const from = headers.find((h: { name: string }) => h.name === "From")?.value || "";
        const subject = headers.find((h: { name: string }) => h.name === "Subject")?.value || "";
        const dateHeader = headers.find((h: { name: string }) => h.name === "Date")?.value || "";

        // Parse date
        const receivedAt = dateHeader ? new Date(dateHeader).getTime() : now;

        // Extract body (try plain text first, then HTML)
        let body = "";
        const parts = messageData.payload?.parts || [];

        // Try to find text/plain part
        const textPart = findPartByMimeType(parts, "text/plain");
        if (textPart?.body?.data) {
          body = decodeBase64(textPart.body.data);
        } else {
          // Fall back to HTML if no plain text
          const htmlPart = findPartByMimeType(parts, "text/html");
          if (htmlPart?.body?.data) {
            body = decodeBase64(htmlPart.body.data);
          }
        }

        // If no parts, check main payload body
        if (!body && messageData.payload?.body?.data) {
          body = decodeBase64(messageData.payload.body.data);
        }

        // Store raw email in database for parsing
        await ctx.db.insert("emailReceipts", {
          emailConnectionId: activeConnection._id,
          userId: activeConnection.userId,
          messageId,
          from,
          subject,
          receivedAt,
          parsed: false, // Will be parsed in next step
          rawBody: body.substring(0, 50000), // Limit to 50KB
          createdAt: now,
        });

        newReceiptsCount++;
        processedCount++;

        // Avoid rate limits - process max 50 per scan
        if (processedCount >= 50) {
          console.log("Reached batch limit, will continue in next scan");
          break;
        }
      }

      // Update connection with last sync time
      await ctx.db.patch(activeConnection._id, {
        lastSyncedAt: now,
        syncCursor: String(Math.floor(now / 1000)), // Store as Unix timestamp for "after:" query
        updatedAt: now,
      });

      console.log(`Gmail scan complete for ${activeConnection.email}: ${newReceiptsCount} new receipts`);

      return {
        success: true,
        receiptsFound: newReceiptsCount,
        totalProcessed: processedCount,
      };
    } catch (error) {
      console.error("Error scanning Gmail:", error);

      await ctx.db.patch(connection._id, {
        status: "error",
        errorCode: "scan_failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        updatedAt: now,
      });

      return { success: false, error: "Scan failed" };
    }
  },
});

/**
 * Refresh expired Gmail OAuth token
 */
async function refreshGmailToken(
  ctx: any,
  connection: Doc<"emailConnections">
): Promise<{ success: boolean }> {
  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: connection.refreshToken,
        grant_type: "refresh_token",
      }).toString(),
    });

    if (!tokenResponse.ok) {
      console.error("Token refresh failed:", await tokenResponse.text());
      return { success: false };
    }

    const tokens = await tokenResponse.json();
    const { access_token, expires_in } = tokens;

    const now = Date.now();
    const tokenExpiresAt = now + expires_in * 1000;

    // Update connection with new access token
    await ctx.db.patch(connection._id, {
      accessToken: access_token,
      tokenExpiresAt,
      updatedAt: now,
    });

    console.log("Token refreshed successfully for:", connection.email);
    return { success: true };
  } catch (error) {
    console.error("Error refreshing token:", error);
    return { success: false };
  }
}

/**
 * Get all active email connections that need scanning
 */
export const getConnectionsNeedingSync = query({
  handler: async (ctx) => {
    const connections = await ctx.db
      .query("emailConnections")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    return connections;
  },
});

/**
 * Trigger email scan for a specific user (for testing)
 */
export const triggerUserEmailScan = mutation({
  args: {
    clerkUserId: v.string(),
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

    // Get user's active email connections
    const connections = await ctx.db
      .query("emailConnections")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    if (connections.length === 0) {
      throw new Error("No active email connections found");
    }

    // Schedule scan for each connection
    const results = [];
    for (const connection of connections) {
      const result = await ctx.scheduler.runAfter(0, internal.emailScanner.scanGmailForReceipts, {
        connectionId: connection._id,
      });
      results.push({ connectionId: connection._id, scheduled: true });
    }

    return {
      message: `Scheduled email scan for ${connections.length} connection(s)`,
      results,
    };
  },
});

/**
 * Get scan statistics for a user
 */
export const getUserScanStats = query({
  args: {
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkUserId))
      .first();

    if (!user) {
      return null;
    }

    // Get connections
    const connections = await ctx.db
      .query("emailConnections")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Get total receipts
    const receipts = await ctx.db
      .query("emailReceipts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Count parsed vs unparsed
    const parsedCount = receipts.filter((r) => r.parsed).length;
    const unparsedCount = receipts.filter((r) => !r.parsed).length;

    // Get last scan time
    const lastScan = connections.reduce((latest, conn) => {
      if (!conn.lastSyncedAt) return latest;
      return conn.lastSyncedAt > latest ? conn.lastSyncedAt : latest;
    }, 0);

    return {
      totalConnections: connections.length,
      activeConnections: connections.filter((c) => c.status === "active").length,
      totalReceipts: receipts.length,
      parsedReceipts: parsedCount,
      unparsedReceipts: unparsedCount,
      lastScanAt: lastScan || null,
    };
  },
});

// Helper functions

function findPartByMimeType(parts: any[], mimeType: string): any {
  for (const part of parts) {
    if (part.mimeType === mimeType) {
      return part;
    }
    if (part.parts) {
      const found = findPartByMimeType(part.parts, mimeType);
      if (found) return found;
    }
  }
  return null;
}

function decodeBase64(encoded: string): string {
  try {
    // Gmail uses URL-safe base64 (- and _ instead of + and /)
    const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    return Buffer.from(base64, "base64").toString("utf-8");
  } catch (error) {
    console.error("Error decoding base64:", error);
    return "";
  }
}
