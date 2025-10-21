/**
 * Email Scanner Actions
 * Convex Actions for Gmail API integration
 * Actions can use fetch() and call mutations for database operations
 */

import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

/**
 * Scan Gmail for receipts using Gmail API
 * This is an ACTION (not mutation) because it uses fetch()
 */
export const scanGmailForReceipts = internalAction({
  args: {
    connectionId: v.id("emailConnections"),
  },
  handler: async (ctx, args) => {
    try {
      // Get connection data from database via mutation
      const connection = await ctx.runMutation(internal.emailScanner.getConnectionById, {
        connectionId: args.connectionId,
      });

      if (!connection) {
        console.error("Email connection not found:", args.connectionId);
        return { success: false, error: "Connection not found" };
      }

      // Verify connection is active
      if (connection.status !== "active") {
        console.log("Skipping inactive connection:", connection.email);
        return { success: false, error: "Connection not active" };
      }

      const now = Date.now();

      // Check if token needs refresh
      if (connection.tokenExpiresAt <= now) {
        console.log("Token expired for connection:", connection.email);

        // Attempt to refresh token
        const refreshResult = await refreshGmailToken(ctx, connection);
        if (!refreshResult.success) {
          // Update connection status to require reauth via mutation
          await ctx.runMutation(internal.emailScanner.updateConnectionStatus, {
            connectionId: connection._id,
            status: "requires_reauth",
            errorCode: "token_expired",
            errorMessage: "OAuth token expired and refresh failed",
          });
          return { success: false, error: "Token refresh failed" };
        }

        // Use refreshed token
        connection.accessToken = refreshResult.accessToken!;
        connection.tokenExpiresAt = refreshResult.tokenExpiresAt!;
      }

      // Build Gmail API search query
      let searchQuery = "from:(noreply OR billing OR receipt OR invoice OR payment OR subscription)";

      // If we have a sync cursor, only get emails after that timestamp
      if (connection.syncCursor) {
        searchQuery = `${searchQuery} after:${connection.syncCursor}`;
      } else {
        // First scan: get emails from last 2 YEARS to catch all historical subscriptions
        // This ensures we find all active and past subscriptions, not just recent ones
        const twoYearsAgo = Math.floor((now - 2 * 365 * 24 * 60 * 60 * 1000) / 1000);
        searchQuery = `${searchQuery} after:${twoYearsAgo}`;
      }

      // Fetch messages from Gmail API
      // Use maxResults=500 (Gmail's maximum) to scan more emails per run
      const messagesResponse = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(searchQuery)}&maxResults=500`,
        {
          headers: {
            Authorization: `Bearer ${connection.accessToken}`,
          },
        }
      );

      if (!messagesResponse.ok) {
        const errorText = await messagesResponse.text();
        console.error("Gmail API error:", errorText);

        // If unauthorized, mark for reauth
        if (messagesResponse.status === 401) {
          await ctx.runMutation(internal.emailScanner.updateConnectionStatus, {
            connectionId: connection._id,
            status: "requires_reauth",
            errorCode: "unauthorized",
            errorMessage: "Gmail API returned 401 Unauthorized",
          });
        }

        return { success: false, error: "Gmail API request failed" };
      }

      const messagesData = await messagesResponse.json();
      const messages = messagesData.messages || [];

      console.log(`Found ${messages.length} potential receipt emails for ${connection.email}`);

      if (messages.length === 0) {
        // Update last synced time even if no new messages
        await ctx.runMutation(internal.emailScanner.updateConnectionLastSync, {
          connectionId: connection._id,
          syncCursor: String(Math.floor(now / 1000)),
        });

        return {
          success: true,
          receiptsFound: 0,
          totalProcessed: 0,
        };
      }

      let newReceiptsCount = 0;
      let processedCount = 0;

      // Fetch and store each message
      for (const message of messages) {
        try {
          // Get full message details
          const messageResponse = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}`,
            {
              headers: {
                Authorization: `Bearer ${connection.accessToken}`,
              },
            }
          );

          if (!messageResponse.ok) {
            console.error(`Failed to fetch message ${message.id}`);
            continue;
          }

          const messageData = await messageResponse.json();

          // Extract relevant fields
          const headers = messageData.payload?.headers || [];
          const subject = headers.find((h: any) => h.name.toLowerCase() === "subject")?.value || "No Subject";
          const from = headers.find((h: any) => h.name.toLowerCase() === "from")?.value || "Unknown";
          const date = headers.find((h: any) => h.name.toLowerCase() === "date")?.value;

          // Parse date
          let receivedAt = now;
          if (date) {
            const parsedDate = new Date(date);
            if (!isNaN(parsedDate.getTime())) {
              receivedAt = parsedDate.getTime();
            }
          }

          // Extract email body
          let body = "";
          const parts = messageData.payload?.parts || [];

          // Try to get plain text version first
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

          // Store raw email in database via mutation
          await ctx.runMutation(internal.emailScanner.storeEmailReceipt, {
            userId: connection.userId,
            connectionId: connection._id,
            gmailMessageId: message.id,
            subject,
            from,
            receivedAt,
            rawBody: body.substring(0, 50000), // Limit to 50KB
          });

          newReceiptsCount++;
          processedCount++;

          // Avoid rate limits - process max 50 per scan
          if (processedCount >= 50) {
            console.log("Reached batch limit, will continue in next scan");
            break;
          }
        } catch (messageError) {
          console.error(`Error processing message ${message.id}:`, messageError);
          // Continue with next message
        }
      }

      // Update connection with last sync time
      await ctx.runMutation(internal.emailScanner.updateConnectionLastSync, {
        connectionId: connection._id,
        syncCursor: String(Math.floor(now / 1000)),
      });

      console.log(`Gmail scan complete for ${connection.email}: ${newReceiptsCount} new receipts`);

      return {
        success: true,
        receiptsFound: newReceiptsCount,
        totalProcessed: processedCount,
      };
    } catch (error) {
      console.error("Error scanning Gmail:", error);

      // Update connection status via mutation
      await ctx.runMutation(internal.emailScanner.updateConnectionStatus, {
        connectionId: args.connectionId,
        status: "error",
        errorCode: "scan_failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
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
  connection: any
): Promise<{ success: boolean; accessToken?: string; tokenExpiresAt?: number }> {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID!;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: connection.refreshToken,
        grant_type: "refresh_token",
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error("Token refresh failed:", errorData);
      return { success: false };
    }

    const tokens = await tokenResponse.json();
    const { access_token, expires_in } = tokens;

    const now = Date.now();
    const tokenExpiresAt = now + expires_in * 1000;

    // Update tokens in database via mutation
    await ctx.runMutation(internal.emailScanner.updateConnectionTokens, {
      connectionId: connection._id,
      accessToken: access_token,
      tokenExpiresAt,
    });

    console.log("Token refreshed successfully for:", connection.email);
    return { success: true, accessToken: access_token, tokenExpiresAt };
  } catch (error) {
    console.error("Error refreshing token:", error);
    return { success: false };
  }
}

/**
 * Helper: Find email part by MIME type
 */
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

/**
 * Helper: Decode base64url encoded string
 */
function decodeBase64(base64url: string): string {
  // Replace URL-safe characters
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");

  // Add padding if needed
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const paddedBase64 = base64 + padding;

  try {
    // Decode from base64
    return Buffer.from(paddedBase64, "base64").toString("utf-8");
  } catch (error) {
    console.error("Error decoding base64:", error);
    return "";
  }
}

/**
 * User-triggered email scan (manual scan button)
 */
export const triggerUserEmailScan = action({
  args: {
    clerkUserId: v.string(),
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    error?: string;
    scannedConnections?: number;
    results?: any[];
  }> => {
    // Get user's email connections via mutation
    const connections: any[] = await ctx.runMutation(internal.emailScanner.getUserConnectionsInternal, {
      clerkUserId: args.clerkUserId,
    });

    if (!connections || connections.length === 0) {
      return { success: false, error: "No email connections found" };
    }

    // Trigger scan for each active connection
    const results: any[] = [];
    for (const connection of connections) {
      if (connection.status === "active") {
        const result: any = await ctx.runAction(internal.emailScannerActions.scanGmailForReceipts, {
          connectionId: connection._id,
        });
        results.push(result);
      }
    }

    // IMMEDIATELY parse receipts and create detection candidates
    // Don't wait for hourly cron jobs - user expects instant results
    console.log("📋 Parsing receipts immediately after scan...");
    const parseResult = await ctx.runMutation(internal.receiptParser.parseUnparsedReceipts, {
      clerkUserId: args.clerkUserId,
    });
    console.log(`📋 Parse result: ${parseResult.parsed} receipts successfully parsed out of ${parseResult.count} total`);

    console.log("🎯 Creating detection candidates immediately after parsing...");
    // Get user ID for detection creation
    const user = await ctx.runMutation(internal.emailScanner.getUserByClerkId, {
      clerkUserId: args.clerkUserId,
    });

    let detectionsCreated = 0;
    if (user) {
      const detectionResult = await ctx.runMutation(internal.emailDetection.createDetectionCandidatesFromReceipts, {
        userId: user._id,
      });
      detectionsCreated = detectionResult.created || 0;
      console.log(`🎯 Detection result: ${detectionsCreated} new candidates created`);
    }

    console.log(`✨ Scan complete: ${parseResult.parsed || 0} parsed, ${detectionsCreated} detections created`);

    return {
      success: true,
      scannedConnections: results.length,
      results,
    };
  },
});
