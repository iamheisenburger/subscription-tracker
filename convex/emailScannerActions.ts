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
    forceFullScan: v.optional(v.boolean()), // Force full inbox scan (ignore incremental mode)
  },
  handler: async (ctx, args): Promise<{ success: boolean; receiptsFound?: number; totalProcessed?: number; scanComplete?: boolean; hasMorePages?: boolean; totalScanned?: number; totalReceipts?: number; error?: string }> => {
    try {
      // Get connection data from database via mutation
      const connection: any = await ctx.runMutation(internal.emailScanner.getConnectionById, {
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

      // ============================================================================
      // USE GMAIL'S BUILT-IN CATEGORIZATION
      // ============================================================================
      // Gmail automatically categorizes purchase/subscription emails using their ML
      // This is WAY better than scanning 10,000+ emails with keyword search
      // category:purchases = ~500 emails (what you see in Gmail UI)
      // vs keyword search = 10,000+ emails (insane and slow)

      // Build Gmail API search query - BROADENED to catch subscriptions Gmail doesn't categorize
      // Use both category-based AND keyword-based search to catch ChatGPT, Perplexity, etc.
      let searchQuery = "(category:purchases OR label:subscriptions OR subject:(subscription OR recurring OR billing OR renewal OR invoice OR receipt OR payment))";

      // COST OPTIMIZATION: Incremental scan mode
      // First scan: Full inbox (5 years) = expensive
      // Subsequent scans: Only NEW emails since last scan = CHEAP!
      // This reduces costs from $3.51/scan → $0.15-0.20/scan after first month

      const hasEverScannedFully = connection.lastFullScanAt && connection.lastFullScanAt > 0;
      const isIncrementalScan = !args.forceFullScan && hasEverScannedFully && connection.scanStatus === "complete";

      if (isIncrementalScan) {
        // INCREMENTAL: Only scan emails AFTER last full scan (HUGE cost savings!)
        const lastFullScanDate = Math.floor(connection.lastFullScanAt / 1000); // Convert to Unix timestamp
        searchQuery = `${searchQuery} after:${lastFullScanDate}`;
        console.log(`💰 INCREMENTAL SCAN: Only fetching NEW emails after ${new Date(connection.lastFullScanAt).toISOString()}`);
        console.log(`💰 Cost savings: ~$3.30 per scan (only analyzing ~20-50 new receipts instead of 942)`);
      } else {
        // FULL SCAN: Get all subscription emails from last 5 years
        // This is expensive ($1.50-2.00) but only happens once
        const fiveYearsAgo = Math.floor((now - 5 * 365 * 24 * 60 * 60 * 1000) / 1000);
        searchQuery = `${searchQuery} after:${fiveYearsAgo}`;
        console.log(`📧 FULL INBOX SCAN: Fetching all subscription emails from last 5 years${args.forceFullScan ? " (FORCED by user)" : ""}`);
        console.log(`📧 This will cost ~$1.50-2.00 but only happens once. Future scans will be incremental (~$0.15).`);
      }

      // Build Gmail API URL with pagination support
      let gmailApiUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(searchQuery)}&maxResults=500`;

      // If we have a pageToken, continue from where we left off
      if (connection.pageToken && !isIncrementalScan) {
        gmailApiUrl += `&pageToken=${connection.pageToken}`;
        console.log(`📄 Continuing scan from page token (${connection.totalEmailsScanned || 0} emails scanned so far)`);
      }

      // Fetch messages from Gmail API
      const messagesResponse = await fetch(gmailApiUrl, {
        headers: {
          Authorization: `Bearer ${connection.accessToken}`,
        },
      });

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
      const nextPageToken = messagesData.nextPageToken; // Gmail API pagination token
      const resultSizeEstimate = messagesData.resultSizeEstimate; // Total matching emails estimate

      console.log(`Found ${messages.length} potential receipt emails for ${connection.email}`);
      console.log(`📊 Gmail API estimates ${resultSizeEstimate} total matching emails`);
      if (nextPageToken) {
        console.log(`📄 More emails available (nextPageToken exists)`);
      } else {
        console.log(`✅ No more pages - this is the last batch`);
      }

      if (messages.length === 0) {
        // No messages in this batch - mark scan as complete
        await ctx.runMutation(internal.emailScanner.updateScanProgress, {
          connectionId: connection._id,
          scanStatus: "complete",
          pageToken: undefined, // Clear pageToken
          syncCursor: String(Math.floor(now / 1000)),
        });

        return {
          success: true,
          receiptsFound: 0,
          totalProcessed: 0,
          scanComplete: true,
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

          // Gmail API returns max 50 messages per page - process all of them
          // The while loop in triggerUserEmailScan will continue to next page
        } catch (messageError) {
          console.error(`Error processing message ${message.id}:`, messageError);
          // Continue with next message
        }
      }

      // ============================================================================
      // UPDATE PAGINATION STATE - Save progress for next batch
      // ============================================================================

      const currentTotalScanned: number = (connection.totalEmailsScanned || 0) + processedCount;
      const currentTotalReceipts: number = (connection.totalReceiptsFound || 0) + newReceiptsCount;

      if (nextPageToken) {
        // More pages to scan - save pageToken and mark as scanning
        await ctx.runMutation(internal.emailScanner.updateScanProgress, {
          connectionId: connection._id,
          scanStatus: "scanning",
          pageToken: nextPageToken,
          totalEmailsScanned: currentTotalScanned,
          totalReceiptsFound: currentTotalReceipts,
          syncCursor: undefined, // Don't update sync cursor until scan complete
        });

        console.log(`📄 Batch complete: ${newReceiptsCount} receipts found. Total progress: ${currentTotalScanned} emails scanned, ${currentTotalReceipts} receipts found`);
        console.log(`📄 More pages available - run scan again to continue`);

        return {
          success: true,
          receiptsFound: newReceiptsCount,
          totalProcessed: processedCount,
          scanComplete: false,
          hasMorePages: true,
          totalScanned: currentTotalScanned,
          totalReceipts: currentTotalReceipts,
        };
      } else {
        // No more pages - scan complete!
        // COST OPTIMIZATION: Save lastFullScanAt for incremental scans
        await ctx.runMutation(internal.emailScanner.updateScanProgress, {
          connectionId: connection._id,
          scanStatus: "complete",
          pageToken: undefined, // Clear pageToken
          totalEmailsScanned: currentTotalScanned,
          totalReceiptsFound: currentTotalReceipts,
          syncCursor: String(Math.floor(now / 1000)), // Set sync cursor for incremental scans
        });

        // If this was a full scan (not incremental), save the timestamp
        // Future scans will only fetch emails AFTER this date
        if (!isIncrementalScan) {
          await ctx.runMutation(internal.emailScanner.updateConnectionData, {
            connectionId: connection._id,
            lastFullScanAt: now, // Save when full scan completed
          });
          console.log(`💰 FULL SCAN COMPLETE - Future scans will be incremental (only NEW emails after ${new Date(now).toISOString()})`);
          console.log(`💰 Cost savings: Next scan will cost ~$0.15 instead of $1.50-2.00`);
        }

        console.log(`✅ Full inbox scan COMPLETE for ${connection.email}`);
        console.log(`📊 Final stats: ${currentTotalScanned} emails scanned, ${currentTotalReceipts} receipts found`);

        return {
          success: true,
          receiptsFound: newReceiptsCount,
          totalProcessed: processedCount,
          scanComplete: true,
          hasMorePages: false,
          totalScanned: currentTotalScanned,
          totalReceipts: currentTotalReceipts,
        };
      }
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
    // Decode from base64 using atob (Convex-compatible, no Buffer needed)
    // atob is a web standard API available in Convex runtime
    const decoded = atob(paddedBase64);
    // Convert to UTF-8 (handle special characters)
    return decodeURIComponent(escape(decoded));
  } catch (error) {
    console.error("Error decoding base64:", error);
    return "";
  }
}

/**
 * Process next batch of receipts (internal - called by scheduler for auto-batching)
 * This skips Gmail scanning and only processes already-downloaded receipts
 */
export const processNextBatch = internalAction({
  args: {
    clerkUserId: v.string(),
    batchNumber: v.number(),
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    error?: string;
    hasMoreBatches?: boolean;
  }> => {
    try {
      console.log(`🔄 Auto-batching: Processing batch ${args.batchNumber} for user ${args.clerkUserId}`);

      // Get first active connection for progress tracking
      const connections: any[] = await ctx.runQuery(internal.emailScanner.getUserConnectionsInternal, {
        clerkUserId: args.clerkUserId,
      });

      const firstConnection = connections.find((c) => c.status === "active");

      // FIX #2 from audit: Update scan state machine for batch tracking
      if (firstConnection) {
        const batchStateName = `processing_batch_${args.batchNumber}` as any;
        await ctx.runMutation(internal.emailScanner.updateScanStateMachine, {
          connectionId: firstConnection._id,
          scanState: batchStateName,
          currentBatch: args.batchNumber,
          batchProgress: 0,
        });
        console.log(`📊 Updated scan state to: ${batchStateName}`);
      }

      // Parse next batch of receipts
      console.log(`🤖 Parsing receipts (batch ${args.batchNumber})...`);
      const parseResult = await ctx.runAction(internal.receiptParser.parseUnparsedReceiptsWithAI, {
        clerkUserId: args.clerkUserId,
        connectionId: firstConnection?._id,
      });

      console.log(`🤖 Parse result (batch ${args.batchNumber}): ${parseResult.parsed} subscriptions detected`);

      // Update overall progress after parsing
      if (firstConnection) {
        await ctx.runMutation(internal.emailScanner.updateScanStateMachine, {
          connectionId: firstConnection._id,
          scanState: `processing_batch_${args.batchNumber}` as any,
          batchProgress: parseResult.count || 0,
          overallProgress: (parseResult.count || 0) + ((args.batchNumber - 1) * 150), // Approx cumulative
        });
      }

      // Run pattern-based detection
      console.log(`🎯 Running pattern detection (batch ${args.batchNumber})...`);
      const user = await ctx.runQuery(internal.emailScanner.getUserByClerkId, {
        clerkUserId: args.clerkUserId,
      });

      if (!user) {
        console.error("❌ User not found during batch processing");
        return { success: false, error: "User not found" };
      }

      const detectionResult = await ctx.runMutation(internal.patternDetection.runPatternBasedDetection, {
        userId: user._id,
      });

      console.log(`🎯 Detection result (batch ${args.batchNumber}): Created: ${detectionResult.created}, Updated: ${detectionResult.updated || 0}, Skipped: ${detectionResult.skipped || 0}`);

      // Check if more batches needed
      const remainingResult = await ctx.runMutation(internal.receiptParser.countUnparsedReceipts, {
        clerkUserId: args.clerkUserId,
      });

      const hasMoreBatches = remainingResult.count > 0;

      if (hasMoreBatches) {
        console.log(`📊 ${remainingResult.count} receipts remain - scheduling batch ${args.batchNumber + 1}`);

        // FIX #4 from audit: Increase batch limit to handle ALL 941 receipts
        // 941 receipts / 150 per batch = 7 batches needed
        // Set limit to 15 for safety margin
        if (args.batchNumber < 15) {
          await ctx.scheduler.runAfter(
            0, // Run immediately
            internal.emailScannerActions.processNextBatch,
            {
              clerkUserId: args.clerkUserId,
              batchNumber: args.batchNumber + 1,
            }
          );
        } else {
          console.warn(`⚠️  Reached batch limit (15 batches) - stopping auto-batching. ${remainingResult.count} receipts may remain unprocessed.`);
        }
      } else {
        console.log(`✅ Auto-batching complete! All receipts processed after ${args.batchNumber} batches`);

        // FIX #2 from audit: Mark scan as complete in state machine
        if (firstConnection) {
          await ctx.runMutation(internal.emailScanner.updateScanStateMachine, {
            connectionId: firstConnection._id,
            scanState: "complete",
            estimatedTimeRemaining: 0,
          });
          console.log(`📊 Updated scan state to: complete`);
        }
      }

      return {
        success: true,
        hasMoreBatches,
      };
    } catch (error) {
      console.error(`❌ Batch ${args.batchNumber} processing failed:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Batch processing failed"
      };
    }
  },
});

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
    try {
      console.log(`🚀 triggerUserEmailScan called for clerkUserId: ${args.clerkUserId}`);

      // Get user's email connections via query
      const connections: any[] = await ctx.runQuery(internal.emailScanner.getUserConnectionsInternal, {
        clerkUserId: args.clerkUserId,
      });

      console.log(`📧 Found ${connections?.length || 0} email connections`);
      connections?.forEach((c, i) => {
        console.log(`  Connection ${i + 1}: ${c.email} - Status: ${c.status}`);
      });

      if (!connections || connections.length === 0) {
        console.log(`❌ No connections found for clerkUserId: ${args.clerkUserId}`);
        return { success: false, error: "No email connections found. Please connect Gmail first." };
      }

      // Check if any connections need reauth
      const needsReauth = connections.some(c => c.status === "requires_reauth");
      if (needsReauth) {
        console.log(`❌ Connections need reauth`);
        return { success: false, error: "Gmail connection expired. Please reconnect your email." };
      }

      // Trigger scan for each active connection - LOOP until all emails scanned
      const results: any[] = [];
      for (const connection of connections) {
        console.log(`🔍 Checking connection: ${connection.email}, status: ${connection.status}`);
        if (connection.status === "active") {
          console.log(`🔄 Starting full scan for ${connection.email}...`);

          // CRITICAL FIX: Set scan status to "scanning" immediately when user clicks scan
          // This ensures the progress UI shows up right away
          await ctx.runMutation(internal.emailScanner.updateScanProgress, {
            connectionId: connection._id,
            scanStatus: "scanning",
            totalEmailsScanned: 0,
            totalReceiptsFound: 0,
            pageToken: undefined, // Clear any old page token to start fresh
          });

          // FIX #2 from audit: Set explicit scan state machine
          await ctx.runMutation(internal.emailScanner.updateScanStateMachine, {
            connectionId: connection._id,
            scanState: "scanning_gmail",
            totalBatches: 0, // Will be calculated after Gmail scan
            currentBatch: 0,
            overallProgress: 0,
            overallTotal: 0,
            estimatedTimeRemaining: 15, // Initial estimate for Gmail scan phase (~3-5 min), will update after scan
          });

          console.log(`📊 Set initial scan state to "scanning_gmail" with state machine`);

          let hasMorePages = true;
          let totalScanned = 0;
          let batchCount = 0;

          // Keep scanning until all pages are processed
          while (hasMorePages && batchCount < 20) { // Safety limit: max 20 batches (50*20 = 1000 emails)
            batchCount++;
            console.log(`  📄 Batch ${batchCount}...`);

            const result: any = await ctx.runAction(internal.emailScannerActions.scanGmailForReceipts, {
              connectionId: connection._id,
              forceFullScan: batchCount === 1, // Only first batch is "full scan", rest continue from cursor
            });

            if (!result.success) {
              console.error(`❌ Scan failed for ${connection.email}:`, result.error);
              return { success: false, error: result.error || "Scan failed. Please try again." };
            }

            totalScanned += result.totalProcessed || 0;
            hasMorePages = result.hasMorePages || false;
            results.push(result);

            // If scan is complete, break
            if (result.scanComplete) {
              console.log(`✅ Scan complete for ${connection.email}: ${totalScanned} emails processed`);
              break;
            }
          }

          if (batchCount >= 20) {
            console.log(`⚠️ Hit batch limit - processed ${totalScanned} emails. More may remain.`);
          }
        }
      }

      // =========================================================================
      // EVENT-DRIVEN PROCESSING: Schedule parsing in background to avoid timeout
      // =========================================================================
      // Don't parse synchronously - it causes 10-minute timeouts!
      // Instead, schedule parsing immediately and return success to user

      const totalReceipts = results.reduce((sum, r) => sum + (r.receiptsFound || 0), 0);
      console.log(`📧 Gmail scan complete: ${totalReceipts} receipts found`);

      // Get first active connection for progress tracking
      const firstConnection = connections.find((c) => c.status === "active");

      if (firstConnection) {
        // FIX #2 from audit: Calculate batches and update state machine
        const BATCH_SIZE = 150; // Process 150 receipts per batch (to avoid timeout)
        const totalBatches = Math.ceil(totalReceipts / BATCH_SIZE);
        // With 3 AI keys running in parallel + rate limits + overhead = ~1 second per receipt
        const estimatedTime = Math.ceil(totalReceipts / 60); // 1 second per receipt = totalReceipts / 60 minutes

        await ctx.runMutation(internal.emailScanner.updateScanStateMachine, {
          connectionId: firstConnection._id,
          scanState: totalReceipts > 0 ? "processing_batch_1" : "complete",
          totalBatches,
          currentBatch: totalReceipts > 0 ? 1 : 0,
          batchProgress: 0,
          batchTotal: Math.min(BATCH_SIZE, totalReceipts),
          overallProgress: 0,
          overallTotal: totalReceipts,
          estimatedTimeRemaining: estimatedTime,
        });

        console.log(`📊 Scan state machine updated:`);
        console.log(`   Total receipts: ${totalReceipts}`);
        console.log(`   Total batches: ${totalBatches}`);
        console.log(`   Estimated time: ${estimatedTime} minutes`);
      }

      // Schedule AI parsing + detection immediately (runs in background)
      console.log(`🔄 Scheduling AI parsing in background...`);
      await ctx.scheduler.runAfter(
        0, // Start immediately
        internal.emailScannerActions.processNextBatch,
        {
          clerkUserId: args.clerkUserId,
          batchNumber: 1, // This is the first parsing batch
        }
      );

      console.log(`✅ Scan initiated! Receipts are being analyzed in the background.`);

      return {
        success: true,
        scannedConnections: results.length,
        results,
      };
    } catch (error) {
      console.error("❌ Email scan failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Scan failed. Please try again."
      };
    }
  },
});
