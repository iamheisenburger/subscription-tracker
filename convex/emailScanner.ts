/**
 * Email Scanner Service
 * Scans connected email accounts (Gmail) for subscription receipts and invoices
 */

import { v } from "convex/values";
import { mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";

/**
 * Scan Gmail for receipts and store raw email data
 * Called by scheduled cron job for Automate tier users
 * NOTE: This temporarily uses placeholder data until Convex Actions are properly implemented
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

      // TODO: Move to Convex Action - fetch() not allowed in mutations
      // Temporarily disabled until proper Action implementation
      console.log("Gmail scanning temporarily disabled - needs Convex Action refactor");

      /*
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
      */

      // Temporary return while fetch() is disabled
      await ctx.db.patch(activeConnection._id, {
        lastSyncedAt: now,
        updatedAt: now,
      });

      return {
        success: true,
        receiptsFound: 0,
        totalProcessed: 0,
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
 * NOTE: Also temporarily disabled - uses fetch()
 */
async function refreshGmailToken(
  ctx: any,
  connection: Doc<"emailConnections">
): Promise<{ success: boolean }> {
  // TODO: Move to Convex Action
  console.log("Token refresh temporarily disabled");
  return { success: true };

  /*
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
  */
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
    // Add padding if needed
    const padding = "=".repeat((4 - (base64.length % 4)) % 4);
    const paddedBase64 = base64 + padding;
    // Use atob (Convex-compatible, no Buffer needed)
    const decoded = atob(paddedBase64);
    // Convert to UTF-8 (handle special characters)
    return decodeURIComponent(escape(decoded));
  } catch (error) {
    console.error("Error decoding base64:", error);
    return "";
  }
}

/**
 * HELPER MUTATIONS FOR ACTIONS
 * These are called by emailScannerActions.ts
 */

/**
 * Get connection by ID (for actions)
 */
export const getConnectionById = internalQuery({
  args: {
    connectionId: v.id("emailConnections"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.connectionId);
  },
});

/**
 * Get user's connections (internal query for actions)
 */
export const getUserConnectionsInternal = internalQuery({
  args: {
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    console.log(`🔍 getUserConnectionsInternal called with clerkUserId: ${args.clerkUserId}`);

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkUserId))
      .first();

    if (!user) {
      console.log(`❌ No user found for clerkId: ${args.clerkUserId}`);
      return [];
    }

    console.log(`✅ Found user: ${user.email} (internal ID: ${user._id})`);

    const connections = await ctx.db
      .query("emailConnections")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    console.log(`📧 Found ${connections.length} connections for user ${user.email}`);

    return connections;
  },
});

/**
 * Get user by Clerk ID (for actions)
 */
export const getUserByClerkId = internalQuery({
  args: {
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkUserId))
      .first();
  },
});

/**
 * Update connection status (for actions)
 */
export const updateConnectionStatus = internalMutation({
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

/**
 * Update connection tokens after refresh (for actions)
 */
export const updateConnectionTokens = internalMutation({
  args: {
    connectionId: v.id("emailConnections"),
    accessToken: v.string(),
    tokenExpiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.connectionId, {
      accessToken: args.accessToken,
      tokenExpiresAt: args.tokenExpiresAt,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Update connection last sync time (for actions)
 */
export const updateConnectionLastSync = internalMutation({
  args: {
    connectionId: v.id("emailConnections"),
    syncCursor: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.connectionId, {
      lastSyncedAt: Date.now(),
      syncCursor: args.syncCursor,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Update connection data (for incremental scan tracking, etc.)
 * COST OPTIMIZATION: Save lastFullScanAt for incremental mode
 */
export const updateConnectionData = internalMutation({
  args: {
    connectionId: v.id("emailConnections"),
    lastFullScanAt: v.optional(v.number()),
    lastScannedInternalDate: v.optional(v.number()),
    lastSyncedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const updateData: any = {
      updatedAt: Date.now(),
    };

    if (args.lastFullScanAt !== undefined) {
      updateData.lastFullScanAt = args.lastFullScanAt;
    }

    if (args.lastScannedInternalDate !== undefined) {
      updateData.lastScannedInternalDate = args.lastScannedInternalDate;
    }

    if (args.lastSyncedAt !== undefined) {
      updateData.lastSyncedAt = args.lastSyncedAt;
    }

    await ctx.db.patch(args.connectionId, updateData);

    console.log(`📝 Updated connection data for ${args.connectionId}`);
    if (args.lastFullScanAt) {
      console.log(`   lastFullScanAt: ${new Date(args.lastFullScanAt).toISOString()}`);
      console.log(`   💰 Future scans will be incremental (only NEW emails after this date)`);
    }

    return { success: true };
  },
});

/**
 * Update scan progress (Phase 3: Pagination support)
 */
export const updateScanProgress = internalMutation({
  args: {
    connectionId: v.id("emailConnections"),
    scanStatus: v.union(
      v.literal("not_started"),
      v.literal("scanning"),
      v.literal("paused"),
      v.literal("complete")
    ),
    pageToken: v.optional(v.string()),
    totalEmailsScanned: v.optional(v.number()),
    totalReceiptsFound: v.optional(v.number()),
    syncCursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updateData: any = {
      scanStatus: args.scanStatus,
      updatedAt: Date.now(),
    };

    // Only update pageToken if provided (undefined means clear it)
    if (args.pageToken !== undefined) {
      updateData.pageToken = args.pageToken;
    }

    // Update progress counters if provided
    if (args.totalEmailsScanned !== undefined) {
      updateData.totalEmailsScanned = args.totalEmailsScanned;
    }
    if (args.totalReceiptsFound !== undefined) {
      updateData.totalReceiptsFound = args.totalReceiptsFound;
    }

    // Update sync cursor if provided (for incremental scans)
    if (args.syncCursor !== undefined) {
      updateData.syncCursor = args.syncCursor;
      updateData.lastSyncedAt = Date.now();
    }

    await ctx.db.patch(args.connectionId, updateData);

    return { success: true };
  },
});

/**
 * Store email receipt (for actions)
 */
export const storeEmailReceipt = internalMutation({
  args: {
    userId: v.id("users"),
    connectionId: v.id("emailConnections"),
    gmailMessageId: v.string(),
    subject: v.string(),
    from: v.string(),
    receivedAt: v.number(),
    rawBody: v.string(),
  },
  handler: async (ctx, args) => {
    // Check for duplicates
    const existing = await ctx.db
      .query("emailReceipts")
      .withIndex("by_message_id", (q) => q.eq("messageId", args.gmailMessageId))
      .first();

    if (existing) {
      console.log("Skipping duplicate receipt:", args.gmailMessageId);
      return { success: false, error: "Duplicate" };
    }

    const now = Date.now();

    await ctx.db.insert("emailReceipts", {
      emailConnectionId: args.connectionId,
      userId: args.userId,
      messageId: args.gmailMessageId,
      from: args.from,
      subject: args.subject,
      receivedAt: args.receivedAt,
      parsed: false,
      rawBody: args.rawBody,
      createdAt: now,
    });

    return { success: true };
  },
});

/**
 * Update scan state machine (FIX #2 from audit - explicit state tracking)
 */
export const updateScanStateMachine = internalMutation({
  args: {
    connectionId: v.id("emailConnections"),
    scanState: v.optional(v.string()),
    totalBatches: v.optional(v.number()),
    currentBatch: v.optional(v.number()),
    batchProgress: v.optional(v.number()),
    batchTotal: v.optional(v.number()),
    overallProgress: v.optional(v.number()),
    overallTotal: v.optional(v.number()),
    estimatedTimeRemaining: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { connectionId, ...updates } = args;

    console.log(`🎯 Scan State Update: ${updates.scanState}`);
    if (updates.currentBatch && updates.totalBatches) {
      console.log(`   Batch ${updates.currentBatch}/${updates.totalBatches}`);
    }
    if (updates.overallProgress && updates.overallTotal) {
      console.log(`   Overall: ${updates.overallProgress}/${updates.overallTotal} receipts`);
    }
    if (updates.estimatedTimeRemaining) {
      console.log(`   ETA: ${updates.estimatedTimeRemaining} minutes`);
    }

    await ctx.db.patch(connectionId, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Update AI processing progress for real-time UI updates
 */
export const updateAIProgress = internalMutation({
  args: {
    connectionId: v.id("emailConnections"),
    status: v.union(v.literal("not_started"), v.literal("processing"), v.literal("complete")),
    processed: v.number(),
    total: v.number(),
  },
  handler: async (ctx, args) => {
    console.log(`📊 updateAIProgress called: ${args.processed}/${args.total}`);
    console.log(`   ConnectionId: ${args.connectionId}`);
    console.log(`   Status: ${args.status}`);

    await ctx.db.patch(args.connectionId, {
      aiProcessingStatus: args.status,
      aiProcessedCount: args.processed,
      aiTotalCount: args.total,
      updatedAt: Date.now(),
    });

    console.log(`✅ Progress updated in database`);
  },
});
