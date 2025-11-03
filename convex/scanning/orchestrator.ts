import { v } from "convex/values";
import { action, internalAction, mutation, query, internalQuery } from "../_generated/server";
import { internal, api } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import { LockManager } from "../core/distributedLock";
import { ScanState, calculateProgress, getStateInfo } from "../core/stateMachine";
import { categorizeError, ErrorRecovery, CircuitBreaker } from "../core/errorHandler";
import { projectScanCost } from "../monitoring/costTracker";

/**
 * SCAN ORCHESTRATOR
 *
 * Central coordinator for the entire subscription detection pipeline.
 * Manages the scan lifecycle from email collection to subscription detection.
 *
 * Key responsibilities:
 * - Coordinate between all scanning components
 * - Manage state transitions and checkpointing
 * - Handle errors and recovery
 * - Track costs and performance
 * - Ensure atomic operations with distributed locking
 */

// Circuit breaker for external services
const circuitBreaker = new CircuitBreaker();

/**
 * Main entry point: Start a new scan for a user
 */
export const startScan = mutation({
  args: {
    clerkUserId: v.string(),
    forceFullScan: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<any> => {
    console.log(`🚀 Starting scan for user: ${args.clerkUserId}`);

    // Get user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkUserId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Get active email connections
    const connections = await ctx.db
      .query("emailConnections")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    if (connections.length === 0) {
      throw new Error("No active email connections found. Please connect your Gmail account first.");
    }

    // Check for existing active sessions
    for (const connection of connections) {
      const activeSession = await ctx.runQuery(
        internal.core.stateMachine.getActiveSession,
        { connectionId: connection._id }
      );

      if (activeSession) {
        console.log(`⚠️ Active scan already in progress for connection ${connection.email}`);
        return {
          success: false,
          message: `A scan is already in progress for ${connection.email}`,
          sessionId: activeSession._id,
        };
      }
    }

    // Create scan sessions for each connection
    const sessions = [];
    for (const connection of connections) {
      // Determine scan type
      const hasCompletedScan = connection.lastFullScanAt && connection.lastFullScanAt > 0;
      const scanType = args.forceFullScan || !hasCompletedScan ? "full" : "incremental";

      // Project cost
      const estimatedCost = projectScanCost(1000, scanType); // Estimate for 1000 emails

      console.log(`📧 Creating ${scanType} scan for ${connection.email} (estimated cost: $${estimatedCost.toFixed(4)})`);

      // Create scan session
      const sessionId = await ctx.runMutation(
        internal.core.stateMachine.createScanSession,
        {
          userId: user._id,
          connectionId: connection._id,
          type: scanType,
        }
      );

      // Schedule the scan action
      await ctx.scheduler.runAfter(0, internal.scanning.orchestrator.executeScan, {
        sessionId,
      });

      sessions.push({
        sessionId,
        connectionId: connection._id,
        email: connection.email,
        type: scanType,
        estimatedCost,
      });
    }

    return {
      success: true,
      message: `Started ${sessions.length} scan(s)`,
      sessions,
    };
  },
});

/**
 * Execute the scan (internal action with external API calls)
 */
export const executeScan = internalAction({
  args: {
    sessionId: v.id("scanSessions"),
  },
  handler: async (ctx, args) => {
    const session = await ctx.runQuery(
      internal.scanning.orchestrator.getSessionDetails,
      { sessionId: args.sessionId }
    );

    if (!session) {
      throw new Error(`Session not found: ${args.sessionId}`);
    }

    // Create lock manager for this scan
    const lockManager = new LockManager(
      ctx,
      "emailConnection",
      session.connectionId,
      `scan_${args.sessionId}`
    );

    try {
      // Acquire distributed lock
      const lockAcquired = await lockManager.acquire(10 * 60 * 1000); // 10 minute timeout
      if (!lockAcquired) {
        console.log(`🔒 Could not acquire lock for connection ${session.connectionId}`);
        await ctx.runMutation(internal.core.stateMachine.transitionState, {
          sessionId: args.sessionId,
          newState: ScanState.FAILED,
          error: {
            type: "transient",
            message: "Could not acquire lock - another scan is in progress",
            code: "LOCK_ACQUISITION_FAILED",
          },
        });
        return;
      }

      // Execute scan phases
      await executeScanPhases(ctx, session, args.sessionId);

    } catch (error: any) {
      console.error(`❌ Scan failed:`, error);

      // Categorize and handle error
      const errorMetadata = categorizeError(error);

      await ctx.runMutation(internal.core.stateMachine.transitionState, {
        sessionId: args.sessionId,
        newState: ScanState.FAILED,
        error: {
          type: errorMetadata.type as any,
          message: errorMetadata.message,
          code: errorMetadata.code,
        },
      });

      // Log error
      await ctx.runMutation(internal.core.errorHandler.logError, {
        sessionId: args.sessionId,
        errorType: errorMetadata.type,
        errorCode: errorMetadata.code,
        message: errorMetadata.message,
        stackTrace: error.stack,
      });

    } finally {
      // Always release lock
      await lockManager.release();
    }
  },
});

/**
 * Execute all scan phases in sequence
 */
async function executeScanPhases(ctx: any, session: any, sessionId: Id<"scanSessions">) {
  const startTime = Date.now();

  // Phase 1: CONNECTING
  await ctx.runMutation(internal.core.stateMachine.transitionState, {
    sessionId,
    newState: ScanState.CONNECTING,
  });

  // Verify connection and refresh token if needed
  const connection = await ctx.runQuery(
    internal.emailScanner.getConnectionById,
    { connectionId: session.connectionId }
  );

  if (!connection || connection.status !== "active") {
    throw new Error("Email connection is not active");
  }

  // Phase 2: COLLECTING
  await ctx.runMutation(internal.core.stateMachine.transitionState, {
    sessionId,
    newState: ScanState.COLLECTING,
  });

  // Execute email collection via Gmail API with pagination
  // Gmail API returns max 500 results per page - loop until all pages fetched
  let collectionResult;
  let totalEmailsCollected = 0;
  let totalReceiptsCollected = 0;
  let pageCount = 0;

  do {
    pageCount++;
    console.log(`📄 Fetching page ${pageCount}...`);

    collectionResult = await ctx.runAction(
      internal.emailScannerActions.scanGmailForReceipts,
      {
        connectionId: session.connectionId,
        forceFullScan: session.type === "full",
      }
    );

    if (!collectionResult.success) {
      throw new Error(collectionResult.error || "Email collection failed");
    }

    totalEmailsCollected = collectionResult.totalScanned || 0;
    totalReceiptsCollected = collectionResult.totalReceipts || 0;

    if (collectionResult.hasMorePages) {
      console.log(`📄 Page ${pageCount} complete: ${totalEmailsCollected} emails collected so far, fetching next page...`);
    } else {
      console.log(`✅ Collection complete: ${totalEmailsCollected} total emails in ${pageCount} page(s)`);
    }
  } while (collectionResult.hasMorePages);

  // Update checkpoint with collection stats
  await ctx.runMutation(internal.core.stateMachine.updateCheckpoint, {
    sessionId,
    checkpoint: {
      emailsCollected: totalEmailsCollected,
      receiptsProcessed: 0,
      candidatesCreated: 0,
    },
  });

  // Phase 3: FILTERING
  await ctx.runMutation(internal.core.stateMachine.transitionState, {
    sessionId,
    newState: ScanState.FILTERING,
  });

  // Get unparsed receipts for filtering
  const unparsedReceipts = await ctx.runQuery(
    internal.receiptParser.getUnparsedReceipts,
    {
      userId: session.userId,
      limit: 1000, // Process in batches
    }
  );

  console.log(`📋 Found ${unparsedReceipts.length} receipts to process`);

  // Phase 4: PARSING
  await ctx.runMutation(internal.core.stateMachine.transitionState, {
    sessionId,
    newState: ScanState.PARSING,
  });

  // Process receipts with AI in batches
  const batchSize = 40;
  let processedCount = 0;
  let totalTokens = 0;
  let totalCost = 0;

  for (let i = 0; i < unparsedReceipts.length; i += batchSize) {
    const batch = unparsedReceipts.slice(i, i + batchSize);

    try {
      // Use circuit breaker for AI calls
      const parseResult = await circuitBreaker.execute(
        "AI_PARSING",
        async () => {
          return await ctx.runAction(
            internal.aiReceiptParser.parseReceiptsWithAI,
            {
              receiptIds: batch.map((r: any) => r._id),
              provider: "dual", // Use both Claude and OpenAI
            }
          );
        }
      );

      processedCount += parseResult.processed || batch.length;
      totalTokens += parseResult.tokensUsed || 0;
      totalCost += parseResult.cost || 0;

      // Update checkpoint
      await ctx.runMutation(internal.core.stateMachine.updateCheckpoint, {
        sessionId,
        checkpoint: {
          emailsCollected: totalEmailsCollected,
          receiptsProcessed: processedCount,
          candidatesCreated: 0,
          lastProcessedReceiptId: batch[batch.length - 1]._id,
        },
      });

      // Record API costs
      if (parseResult.cost) {
        await ctx.runMutation(internal.monitoring.costTracker.recordAPICall, {
          sessionId,
          provider: "AI_AGGREGATE",
          model: "mixed",
          inputTokens: parseResult.tokensUsed || 0,
          outputTokens: 0,
          duration: Date.now() - startTime,
          success: true,
        });
      }

      console.log(`✅ Processed batch ${Math.floor(i / batchSize) + 1}: ${batch.length} receipts`);
    } catch (error) {
      console.error(`❌ Failed to process batch ${Math.floor(i / batchSize) + 1}:`, error);
      // Continue with next batch on partial failure
    }
  }

  // Phase 5: DETECTING
  await ctx.runMutation(internal.core.stateMachine.transitionState, {
    sessionId,
    newState: ScanState.DETECTING,
  });

  // Run pattern-based detection
  const detectionResult = await ctx.runMutation(
    internal.patternDetection.runPatternBasedDetection,
    {
      userId: session.userId,
    }
  );

  const candidatesCreated = detectionResult.candidatesCreated || 0;

  // Update final checkpoint
  await ctx.runMutation(internal.core.stateMachine.updateCheckpoint, {
    sessionId,
    checkpoint: {
      emailsCollected: totalEmailsCollected,
      receiptsProcessed: processedCount,
      candidatesCreated,
    },
  });

  // Phase 6: REVIEWING
  await ctx.runMutation(internal.core.stateMachine.transitionState, {
    sessionId,
    newState: ScanState.REVIEWING,
  });

  // Update session stats
  const endTime = Date.now();
  await ctx.runMutation(internal.core.stateMachine.updateStats, {
    sessionId,
    stats: {
      totalEmailsFound: totalEmailsCollected,
      receiptsIdentified: totalReceiptsCollected,
      subscriptionsDetected: candidatesCreated,
      tokensUsed: totalTokens,
      apiCost: totalCost,
      processingTimeMs: endTime - startTime,
    },
  });

  // Phase 7: COMPLETE
  await ctx.runMutation(internal.core.stateMachine.transitionState, {
    sessionId,
    newState: ScanState.COMPLETE,
  });

  // Update connection with scan completion time
  if (session.type === "full") {
    await ctx.runMutation(internal.emailScanner.updateConnectionData, {
      connectionId: session.connectionId,
      lastFullScanAt: Date.now(),
    });
  }

  console.log(`🎉 Scan completed successfully!`);
  console.log(`📊 Results: ${totalEmailsCollected} emails → ${totalReceiptsCollected} receipts → ${candidatesCreated} subscriptions detected`);
  console.log(`💰 Cost: $${totalCost.toFixed(4)} for ${totalTokens} tokens`);
  console.log(`⏱️ Duration: ${((endTime - startTime) / 1000).toFixed(1)}s`);
}

/**
 * Get session details (internal query)
 */
export const getSessionDetails = internalQuery({
  args: {
    sessionId: v.id("scanSessions"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.sessionId);
  },
});

/**
 * Get scan progress for a user
 */
export const getScanProgress = query({
  args: {
    clerkUserId: v.string(),
  },
  handler: async (ctx, args): Promise<any> => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkUserId))
      .first();

    if (!user) {
      return null;
    }

    // Get latest scan session
    const session = await ctx.runQuery(
      internal.core.stateMachine.getLatestUserSession,
      { userId: user._id }
    );

    if (!session) {
      return null;
    }

    // Calculate progress percentage
    const progress = calculateProgress(session.status as ScanState);
    const stateInfo = getStateInfo(session.status as ScanState);

    return {
      sessionId: session._id,
      status: session.status,
      stateInfo,
      progress,
      startedAt: session.startedAt,
      completedAt: session.completedAt,
      checkpoint: session.checkpoint,
      stats: session.stats,
      error: session.error,
    };
  },
});

/**
 * Resume a failed or paused scan
 */
export const resumeScan = mutation({
  args: {
    sessionId: v.id("scanSessions"),
  },
  handler: async (ctx, args): Promise<any> => {
    // Resume the session
    const result = await ctx.runMutation(
      internal.core.stateMachine.resumeSession,
      { sessionId: args.sessionId }
    );

    if (result.success) {
      // Schedule the scan to continue
      await ctx.scheduler.runAfter(0, internal.scanning.orchestrator.executeScan, {
        sessionId: args.sessionId,
      });
    }

    return result;
  },
});

/**
 * Cancel an active scan
 */
export const cancelScan = mutation({
  args: {
    sessionId: v.id("scanSessions"),
  },
  handler: async (ctx, args): Promise<any> => {
    return await ctx.runMutation(
      internal.core.stateMachine.cancelSession,
      {
        sessionId: args.sessionId,
        reason: "User requested cancellation",
      }
    );
  },
});