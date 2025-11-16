/**
 * Email Scanner Actions
 * Convex Actions for Gmail API integration
 * Actions can use fetch() and call mutations for database operations
 *
 * MERCHANT-BASED APPROACH (November 2025):
 * - Replaced broad keyword search with targeted merchant domains
 * - Reduced emails from 1,465 to ~150-200 (90% reduction)
 * - Improved detection accuracy from 12.5% to expected 70-80%
 * - Industry standard approach used by Rocket Money, Trim, etc.
 */

import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { isSubscriptionEmail } from "./scanning/smartFilter";

/**
 * Lightweight token preflight to avoid auto-scan failures.
 */
export const preflightGmailToken = internalAction({
  args: {
    connectionId: v.id("emailConnections"),
  },
  handler: async (ctx, args): Promise<{ ok: boolean; status?: number }> => {
    try {
      const connection: any = await ctx.runQuery(internal.emailScanner.getConnectionById, {
        connectionId: args.connectionId,
      });
      if (!connection || connection.status !== "active") {
        return { ok: false };
      }
      const resp = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/profile", {
        headers: { Authorization: `Bearer ${connection.accessToken}` },
      });
      if (!resp.ok) {
        if (resp.status === 401 || resp.status === 403) {
          await ctx.runMutation(internal.emailScanner.updateConnectionStatus, {
            connectionId: connection._id,
            status: "requires_reauth",
            errorCode: "unauthorized",
            errorMessage: "Gmail token no longer valid",
          });
        }
        return { ok: false, status: resp.status };
      }
      return { ok: true, status: resp.status };
    } catch (e) {
      console.error("Preflight token check failed:", e);
      return { ok: false };
    }
  },
});

/**
 * Scan Gmail for receipts using Gmail API
 * This is an ACTION (not mutation) because it uses fetch()
 */
export const scanGmailForReceipts = internalAction({
  args: {
    connectionId: v.id("emailConnections"),
    forceFullScan: v.optional(v.boolean()), // Force full inbox scan (ignore incremental mode)
    // Incremental scan knobs (optional)
    sinceTs: v.optional(v.number()),
    capPages: v.optional(v.number()),
    capMessages: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<{ success: boolean; receiptsFound?: number; totalProcessed?: number; scanComplete?: boolean; hasMorePages?: boolean; totalScanned?: number; totalReceipts?: number; error?: string }> => {
    try {
      // Get connection data from database via query
      const connection: any = await ctx.runQuery(internal.emailScanner.getConnectionById, {
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
      // MERCHANT-BASED APPROACH (Industry Standard)
      // ============================================================================
      // OLD: category:purchases OR keywords (1,465 emails, 87.5% false positives)
      // NEW: Targeted merchant domains (150-200 emails, 80%+ true positives)
      //
      // This approach is used by Rocket Money, Trim, and other successful apps.
      // We search for emails from KNOWN subscription merchants only.

      // Get all merchant domains from database
      const allDomains = await ctx.runQuery(internal.merchants.getAllDomains, {});

      if (allDomains.length === 0) {
        console.log("⚠️ No merchant domains found. Please seed merchants first.");
        return { success: false, error: "No merchant domains configured" };
      }

      console.log(`📊 Found ${allDomains.length} merchant domains to search`);

      // Build time-range filter for incremental vs full scans
      const hasEverScannedFully = connection.lastFullScanAt && connection.lastFullScanAt > 0;
      const lastIncrementalCheckpoint: number | undefined =
        (typeof args.sinceTs === "number" && args.sinceTs > 0 ? args.sinceTs : undefined) ??
        (typeof connection.lastScannedInternalDate === "number" ? connection.lastScannedInternalDate : undefined) ??
        (typeof connection.lastFullScanAt === "number" ? connection.lastFullScanAt : undefined);
      const isIncrementalScan = !args.forceFullScan && !!lastIncrementalCheckpoint && connection.scanStatus === "complete";

      let timeFilter = "";
      if (isIncrementalScan) {
        const afterSeconds = Math.floor(lastIncrementalCheckpoint! / 1000);
        timeFilter = ` after:${afterSeconds}`;
        console.log(`💰 INCREMENTAL SCAN: Only fetching NEW emails after ${new Date(lastIncrementalCheckpoint!).toISOString()}`);
      } else {
        // FULL SCAN: Get subscription emails from last 12 MONTHS (captures annual subscriptions!)
        const twelveMonthsAgo = Math.floor((now - 12 * 30 * 24 * 60 * 60 * 1000) / 1000);
        timeFilter = ` after:${twelveMonthsAgo}`;
        console.log(`📧 FULL INBOX SCAN: Merchant-based search from last 12 MONTHS${args.forceFullScan ? " (FORCED by user)" : ""}`);
      }

      // Split domains into batches of 15 (Gmail limit: ~1,500 chars, <20 OR terms)
      const DOMAINS_PER_BATCH = 15;
      const domainBatches: string[][] = [];
      for (let i = 0; i < allDomains.length; i += DOMAINS_PER_BATCH) {
        domainBatches.push(allDomains.slice(i, i + DOMAINS_PER_BATCH));
      }

      console.log(`📦 Split into ${domainBatches.length} query batches (${DOMAINS_PER_BATCH} domains each)`);

      // Collect all unique message IDs from all batches
      const allMessageIds = new Set<string>();
      const maxPages = Math.max(1, Math.min(args.capPages ?? 3, domainBatches.length));
      const maxMessages = Math.max(50, Math.min(args.capMessages ?? 500, 5000));

      for (let batchIndex = 0; batchIndex < domainBatches.length && batchIndex < maxPages; batchIndex++) {
        const batch = domainBatches[batchIndex];

        // Build Gmail query: from:(domain1.com OR domain2.com OR ...)
        const domainQuery = `from:(${batch.join(" OR ")})${timeFilter}`;

        // Build Gmail API URL
        const batchGmailApiUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(domainQuery)}&maxResults=500`;

        console.log(`🔍 Batch ${batchIndex + 1}/${domainBatches.length}: Searching ${batch.length} domains...`);

        try {
          // Fetch messages from Gmail API
          const messagesResponse = await fetch(batchGmailApiUrl, {
            headers: {
              Authorization: `Bearer ${connection.accessToken}`,
            },
          });

          if (!messagesResponse.ok) {
            console.error(`❌ Batch ${batchIndex + 1} failed: ${messagesResponse.status}`);
            continue; // Skip this batch, continue with others
          }

          const messagesData = await messagesResponse.json();
          const messages = messagesData.messages || [];

          // Add message IDs to set (automatically deduplicates)
          for (const message of messages) {
            allMessageIds.add(message.id);
            if (allMessageIds.size >= maxMessages) break;
          }

          console.log(`✅ Batch ${batchIndex + 1}: Found ${messages.length} emails (${allMessageIds.size} unique total)`);
        } catch (error) {
          console.error(`❌ Batch ${batchIndex + 1} error:`, error);
          // Continue with next batch
        }

        // Rate limiting: 2 second delay between batches
        if (batchIndex < domainBatches.length - 1 && allMessageIds.size < maxMessages) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        if (allMessageIds.size >= maxMessages) {
          console.log(`🛑 Reached capMessages=${maxMessages}. Stopping domain batch loop early.`);
          break;
        }
      }

      console.log(`🎯 MERCHANT-BASED SEARCH COMPLETE: ${allMessageIds.size} unique emails found`);
      console.log(`📊 Comparison: Old approach = 1,465 emails | New approach = ${allMessageIds.size} emails`);

      // FALLBACK: Add payment processor keyword search to catch Stripe, PayPal, etc.
      // This catches subscriptions paid through processors not in merchant list
      // Also catches PlayStation transaction emails which use subdomain @txn-email.playstation.com
      const fallbackQuery = `(from:stripe.com OR from:paypal.com OR from:paddle.com OR from:substack.com OR from:gumroad.com OR from:txn-email.playstation.com OR from:txn-email03.playstation.com OR from:payments.google.com OR from:google.com OR from:receipt.google.com OR from:email.apple.com OR from:spotify.com OR from:email.spotify.com OR from:no-reply@spotify.com OR subject:"Your invoice from Apple." OR subject:"Google Pay" OR subject:"Google Play" OR subject:"Spotify Premium" OR subject:"Spotify receipt" OR subject:"payment receipt" OR subject:"subscription receipt" OR subject:"Thank You For Your Purchase" OR subject:"invoice" OR subject:"subscription")${timeFilter}`;
      const fallbackUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(fallbackQuery)}&maxResults=500`;

      console.log(`🔄 FALLBACK: Searching payment processors and receipt keywords...`);

      try {
        const fallbackResponse = await fetch(fallbackUrl, {
          headers: { Authorization: `Bearer ${connection.accessToken}` },
        });

        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          const fallbackMessages = fallbackData.messages || [];
          const beforeFallback = allMessageIds.size;

          for (const message of fallbackMessages) {
            allMessageIds.add(message.id);
          }

          console.log(`✅ FALLBACK: Added ${allMessageIds.size - beforeFallback} new receipts (${fallbackMessages.length} found, ${allMessageIds.size - beforeFallback} unique)`);
        }
      } catch (error) {
        console.error(`⚠️ Fallback search failed (continuing with merchant results):`, error);
      }

      // Convert Set to array for processing
      const messages = Array.from(allMessageIds).map(id => ({ id }));

      console.log(`📧 Downloading ${messages.length} emails...`);
      console.log(`🧠 Smart filter will reduce these to subscription-likely emails only`);

      // For now, we process all messages in one go (no pagination between batches)
      // Future optimization: Could implement pagination if message count exceeds threshold
      const nextPageToken = undefined;
      let lastInternalDateMax = 0;

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
          const internalDateStr = messageData.internalDate;
          const internalDate = internalDateStr ? Number(internalDateStr) : undefined;

          // Parse date
          let receivedAt = now;
          if (date) {
            const parsedDate = new Date(date);
            if (!isNaN(parsedDate.getTime())) {
              receivedAt = parsedDate.getTime();
            }
          }
          if (typeof internalDate === "number" && !Number.isNaN(internalDate)) {
            receivedAt = internalDate;
          }
          if (receivedAt > lastInternalDateMax) lastInternalDateMax = receivedAt;

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

          // ============================================================================
          // SMART PRE-FILTER: Check if this looks like a subscription email
          // Reduces 2,000 emails → 200-300 subscription-likely emails
          // Cost savings: ~$4-5 per scan (skip non-subscription emails)
          // ============================================================================
          const filterResult = isSubscriptionEmail({
            subject,
            body,
            from,
          });

          processedCount++; // Count all downloaded emails

          // ONLY store if subscription-likely (high or medium confidence)
          if (!filterResult.isSubscriptionLikely) {
            console.log(`⏭️  Skipped (${filterResult.reason}): ${subject.substring(0, 50)}`);
            continue; // Skip this email - don't store
          }

          console.log(`✅ Kept (${filterResult.confidence}): ${subject.substring(0, 50)}`);

          // Store subscription-likely email in database
          await ctx.runMutation(internal.emailScanner.storeEmailReceipt, {
            userId: connection.userId,
            connectionId: connection._id,
            gmailMessageId: message.id,
            subject,
            from,
            receivedAt,
            rawBody: body.substring(0, 50000), // Limit to 50KB
          });

          newReceiptsCount++; // Count subscription-likely emails

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
        if (lastInternalDateMax > 0) {
          await ctx.runMutation(internal.emailScanner.updateConnectionData, {
            connectionId: connection._id,
            lastScannedInternalDate: lastInternalDateMax,
            lastSyncedAt: now,
          });
          console.log(`⏭️ Updated lastScannedInternalDate to ${new Date(lastInternalDateMax).toISOString()}`);
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
    // SAFE MODE CHECK: Block BACKGROUND batch processing if safe mode enabled
    // This prevents runaway costs from background automations
    const safeModeEnabled = await ctx.runQuery(internal.adminControl.isSafeModeEnabled, {});
    if (safeModeEnabled) {
      console.log(`🔴 SAFE MODE: Batch ${args.batchNumber} skipped - safe mode enabled (background processing blocked)`);
      return { success: false, error: "Safe mode enabled - background batch processing stopped" };
    }

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

      // Parse next batch of receipts using the DUAL-PROVIDER AI parser
      console.log(`🤖 Parsing receipts (batch ${args.batchNumber}) with dual providers...`);

      // Resolve user for userId
      const userForBatch = await ctx.runQuery(internal.emailScanner.getUserByClerkId, {
        clerkUserId: args.clerkUserId,
      });
      if (!userForBatch) {
        console.error("❌ User not found during batch parsing");
        return { success: false, error: "User not found" };
      }

      // Get up to 80 unparsed receipts for AI (increased for speed - 40 per provider in parallel)
      // Larger batches = fewer API calls = faster overall processing
      const receiptsToParse: any[] = await ctx.runQuery(internal.receiptParser.getUnparsedReceipts, {
        userId: userForBatch._id,
        limit: 80,
      });

      let parsedCount = 0;
      if (receiptsToParse.length > 0) {
        const formattedReceipts = receiptsToParse.map((r: any) => ({
          _id: r._id,
          subject: r.subject || "No subject",
          rawBody: r.rawBody || "",
          from: r.from || "unknown",
        }));

        const aiResult: any = await ctx.runAction(internal.aiReceiptParser.parseReceiptsWithAI, {
          receipts: formattedReceipts,
          connectionId: firstConnection?._id,
        });
        parsedCount = aiResult?.processed || formattedReceipts.length;
      } else {
        console.log("📋 No unparsed receipts available for this batch");
      }

      console.log(`🤖 Parse result (batch ${args.batchNumber}): ${parsedCount} receipts processed`);

      // Check if more batches needed - fetch remaining count
      const remainingResult = await ctx.runMutation(internal.receiptParser.countUnparsedReceipts, {
        clerkUserId: args.clerkUserId,
      });

      // Update overall progress after parsing (DISABLED scanState to bypass validation bug)
      if (firstConnection) {
        // Recalculate total batches based on remaining receipts to keep UI accurate
        const BATCH_SIZE = 80; // Match the limit above
        const processedSoFar = (args.batchNumber - 1) * BATCH_SIZE + parsedCount;
        const estimatedTotal = processedSoFar + remainingResult.count;
        const updatedTotalBatches = Math.ceil(estimatedTotal / BATCH_SIZE);
        
        await ctx.runMutation(internal.emailScanner.updateScanStateMachine, {
          connectionId: firstConnection._id,
          // scanState: `processing_batch_${args.batchNumber}` as any, // DISABLED: Schema validation broken
          currentBatch: args.batchNumber,
          totalBatches: updatedTotalBatches, // Update total batches dynamically
          batchProgress: parsedCount,
          overallProgress: processedSoFar,
          overallTotal: estimatedTotal,
        });
      }

      const hasMoreBatches = remainingResult.count > 0;

      if (hasMoreBatches) {
        console.log(`📊 ${remainingResult.count} receipts remain - scheduling batch ${args.batchNumber + 1}`);

        // DUAL PROVIDER: 80 receipts per batch with NO DELAYS (independent rate limits)
        // Increased batch size for faster processing (40 Claude + 40 OpenAI in parallel)
        if (args.batchNumber < 50) {
          console.log(`⚡ No delays needed - dual providers have independent rate limits!`);
          await ctx.scheduler.runAfter(
            0, // NO DELAY: Different providers = no rate limit conflicts
            internal.emailScannerActions.processNextBatch,
            {
              clerkUserId: args.clerkUserId,
              batchNumber: args.batchNumber + 1,
            }
          );
        } else {
          console.warn(`⚠️  Reached batch limit (50 batches) - stopping auto-batching. ${remainingResult.count} receipts may remain unprocessed.`);
        }
      } else {
        console.log(`✅ Auto-batching complete! All receipts processed after ${args.batchNumber} batches`);

        // One-time repair + detection AFTER all parsing completes (snapshot gating)
        const user = await ctx.runQuery(internal.emailScanner.getUserByClerkId, {
          clerkUserId: args.clerkUserId,
        });
        if (!user) {
          console.error("❌ User not found during final detection");
          return { success: false, error: "User not found" };
        }

        try {
          console.log("🧰 Final repair pass before detection...");
          await ctx.runMutation(internal.repair.repairParsedReceipts, {
            userId: user._id,
            limit: 800,
          });
        } catch (e) {
          console.warn("Repair pass failed (continuing to detection):", e);
        }

        console.log("🎯 Running final pattern detection...");
        const detectionResult = await ctx.runMutation(internal.patternDetection.runPatternBasedDetection, {
          userId: user._id,
        });
        console.log(`🎯 Final detection: Created: ${detectionResult.created}, Updated: ${detectionResult.updated || 0}, Skipped: ${detectionResult.skipped || 0}`);

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
 * Finalization guard: ensure detection runs after parsing completes.
 * Retries until no unparsed receipts remain, then runs repair + detection once.
 */
export const finalizeAfterParsing = internalAction({
  args: {
    clerkUserId: v.string(),
    attempt: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<{ success: boolean; message?: string }> => {
    const attempt = args.attempt ?? 1;
    const MAX_ATTEMPTS = 20;
    const RETRY_DELAY_MS = 5000;

    try {
      const user = await ctx.runQuery(internal.emailScanner.getUserByClerkId, {
        clerkUserId: args.clerkUserId,
      });
      if (!user) return { success: false, message: "User not found" };

      // Check remaining unparsed receipts
      const remaining = await ctx.runMutation(internal.receiptParser.countUnparsedReceipts, {
        clerkUserId: args.clerkUserId,
      });
      if (remaining.count > 0 && attempt < MAX_ATTEMPTS) {
        console.log(`⏳ finalizeAfterParsing waiting: ${remaining.count} receipts remain (attempt ${attempt}/${MAX_ATTEMPTS})`);
        await ctx.scheduler.runAfter(RETRY_DELAY_MS, internal.emailScannerActions.finalizeAfterParsing, {
          clerkUserId: args.clerkUserId,
          attempt: attempt + 1,
        });
        return { success: true, message: "Waiting for parsing to finish" };
      }

      // Run one-time repair
      try {
        console.log("🧰 Final repair pass (finalizeAfterParsing)...");
        await ctx.runMutation(internal.repair.repairParsedReceipts, {
          userId: user._id,
          limit: 800,
        });
      } catch (e) {
        console.warn("Repair pass failed in finalizeAfterParsing:", e);
      }

      // Run detection
      console.log("🎯 Final detection (finalizeAfterParsing)...");
      const det = await ctx.runMutation(internal.patternDetection.runPatternBasedDetection, {
        userId: user._id,
      });
      console.log(`🎯 Final detection complete: Created ${det.created}, Updated ${det.updated || 0}`);

      // Mark connection state complete if available
      const connections: any[] = await ctx.runQuery(internal.emailScanner.getUserConnectionsInternal, {
        clerkUserId: args.clerkUserId,
      });
      const firstConnection = connections.find((c) => c.status === "active");
      if (firstConnection) {
        await ctx.runMutation(internal.emailScanner.updateScanStateMachine, {
          connectionId: firstConnection._id,
          scanState: "complete",
          estimatedTimeRemaining: 0,
        });
      }

      return { success: true, message: "Final detection executed" };
    } catch (error) {
      console.error("❌ finalizeAfterParsing failed:", error);
      return { success: false, message: "Finalize failed" };
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
    // NOTE: Manual scans are NOT blocked by safe mode
    // Safe mode only blocks BACKGROUND cron jobs (per COST_SAFETY_AND_UNIT_ECONOMICS.md)
    // Manual scans respect 24h cooldown but are allowed even when safe mode is active
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
        // DUAL PROVIDER: 80 receipts per batch (40 Claude + 40 OpenAI in parallel)
        const BATCH_SIZE = 80; // 40 receipts per provider, processed in parallel for faster scans
        const totalBatches = Math.ceil(totalReceipts / BATCH_SIZE);
        // DYNAMIC TIME ESTIMATE: 80 receipts in parallel = ~60-90 seconds per batch
        const estimatedTime = Math.ceil(totalBatches * 0.75); // 45 seconds per batch (optimized parallel processing)

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
      // Sequential batch processing - batches process one after another
      console.log(`🔄 Scheduling AI parsing in background...`);
      await ctx.scheduler.runAfter(
        0,
        internal.emailScannerActions.processNextBatch,
        {
          clerkUserId: args.clerkUserId,
          batchNumber: 1,
        }
      );

      console.log(`✅ Scan initiated! Receipts are being analyzed in the background.`);

      // Schedule finalization guard (no-op if parsing keeps going; will retry until done)
      await ctx.scheduler.runAfter(
        0,
        internal.emailScannerActions.finalizeAfterParsing,
        {
          clerkUserId: args.clerkUserId,
          attempt: 1,
        }
      );

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


