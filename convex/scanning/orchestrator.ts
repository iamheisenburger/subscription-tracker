import { v } from "convex/values";
import { action, internalAction, mutation, query, internalQuery } from "../_generated/server";
import { internal, api } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import { LockManager } from "../core/distributedLock";
import { ScanState, calculateProgress, getStateInfo } from "../core/stateMachine";
import { categorizeError, ErrorRecovery, CircuitBreaker } from "../core/errorHandler";
import { projectScanCost } from "../monitoring/costTracker";
import { api as publicApi } from "../_generated/api";

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

// ===== Helper: Global Safe Mode =====
async function isSafeModeEnabled(ctx: any): Promise<boolean> {
  // Env-level kill switch
  const envFlag =
    (process.env.SUBWISE_DISABLE_CRONS || process.env.SUBWISE_SAFE_MODE || "").trim().toLowerCase();
  if (envFlag === "true" || envFlag === "1" || envFlag === "yes") return true;

  // DB-level kill switch
  try {
    const settings = await ctx.runQuery(publicApi.adminControl.getSafeModeStatus, {});
    return Boolean(settings?.safeMode || settings?.cronsDisabled);
  } catch {
    // If control API missing, default to not blocked
    return false;
  }
}

/**
 * Main entry point: Start a new scan for a user
 */
export const startScan = mutation({
  args: {
    clerkUserId: v.string(),
    forceFullScan: v.optional(v.boolean()),
    overrideManualCooldown: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<any> => {
    // Behavior in Safe Mode:
    // - Background crons remain blocked by guards in cron handlers.
    // - Manual scans are allowed to proceed, under existing per-phase caps and idempotent logic,
    //   so we can run controlled scans without ever toggling the global kill switch.
    const safeMode = await isSafeModeEnabled(ctx);
    if (safeMode) {
      console.log("⚠️ SAFE MODE: Proceeding with controlled manual scan. Crons remain disabled; caps and idempotency apply.");
    }
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
    const now = Date.now();
    for (const connection of connections) {
      // Manual scan abuse control: enforce 24h cooldown unless overridden
      const cooldownActive =
        !args.overrideManualCooldown &&
        typeof connection.nextEligibleManualScanAt === "number" &&
        now < connection.nextEligibleManualScanAt;
      if (cooldownActive) {
        const nextEligible = connection.nextEligibleManualScanAt as number;
        const retryInMs = nextEligible - now;
        console.log(`⏳ Cooldown active for ${connection.email}. Retry in ${Math.ceil(retryInMs / 60000)} min.`);
        continue;
      }
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

      // Set next eligible time for manual scans (24h cooldown)
      await ctx.runMutation(internal.emailScanner.updateConnectionData, {
        connectionId: connection._id,
        lastManualScanAt: now,
        nextEligibleManualScanAt: now + 24 * 60 * 60 * 1000,
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
    // In Safe Mode, we still allow this manual, one-shot execution path.
    // Background crons remain blocked by their own guards.
    if (await isSafeModeEnabled(ctx)) {
      console.log("⚠️ SAFE MODE: executeScan proceeding (manual path). Crons remain disabled.");
    }
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
      // Acquire distributed lock with backoff retries (short TTL)
      let lockAcquired = false;
      const maxAttempts = 3;
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        lockAcquired = await lockManager.acquire(2 * 60 * 1000);
        if (lockAcquired) break;
        const backoffMs = attempt * 750 + Math.floor(Math.random() * 250);
        console.log(`🔒 Lock attempt ${attempt}/${maxAttempts} failed. Retrying in ${backoffMs}ms...`);
        await new Promise((r) => setTimeout(r, backoffMs));
      }
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
        sinceTs: session.type === "incremental"
          ? (typeof connection.lastScannedInternalDate === "number"
              ? connection.lastScannedInternalDate
              : (typeof connection.lastFullScanAt === "number" ? connection.lastFullScanAt : undefined))
          : undefined,
        capPages: 3,
        capMessages: 500,
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

  // Log total receipts to process
  console.log(`📋 Starting batch parsing: ${unparsedReceipts.length} total receipts to process`);

  // Schedule first parsing batch (will chain subsequent batches)
  // Once all batches complete, the batch processor will continue to DETECTING phase
  await ctx.scheduler.runAfter(0, internal.scanning.orchestrator.processParsingBatch, {
    sessionId,
    totalEmailsCollected,
    startTime,
  });

  // Note: Remaining phases (DETECTING, REVIEWING, COMPLETE) are handled
  // by the batch processor after all parsing batches finish
  console.log(`📋 Parsing batches scheduled - scan will continue asynchronously`);
}

/**
 * Process a single batch of receipts for parsing
 * Called recursively until all receipts are parsed
 */
export const processParsingBatch = internalAction({
  args: {
    sessionId: v.id("scanSessions"),
    totalEmailsCollected: v.number(),
    startTime: v.number(),
    iteration: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Guard against runaway loops
    const currentIteration = (args.iteration ?? 1);
    const MAX_ITERATIONS = 20;
    if (currentIteration > MAX_ITERATIONS) {
      console.warn(`🛑 MAX_ITERATIONS reached for parsing (>${MAX_ITERATIONS}). Aborting parsing phase.`);
      await ctx.runMutation(internal.core.stateMachine.transitionState, {
        sessionId: args.sessionId,
        newState: ScanState.FAILED,
        error: {
          type: "transient",
          message: "Parsing exceeded max iterations safeguard",
          code: "MAX_ITERATIONS_EXCEEDED",
        },
      });
      return;
    }

    const session = await ctx.runQuery(internal.scanning.orchestrator.getSessionDetails, {
      sessionId: args.sessionId,
    });

    if (!session) {
      console.error(`❌ Session not found: ${args.sessionId}`);
      return;
    }

    // Get ALL unparsed receipts - parallel AI processing handles them efficiently
    const unparsedReceipts = await ctx.runQuery(
      internal.receiptParser.getUnparsedReceipts,
      {
        userId: session.userId,
        limit: 1000, // Process all receipts at once with parallel AI
      }
    );

    // If no more receipts to parse, move to DETECTING phase
    if (unparsedReceipts.length === 0) {
      console.log(`✅ All receipts parsed! Moving to DETECTING phase...`);
      await completeParsingPhase(ctx, args.sessionId, args.totalEmailsCollected, session, args.startTime);
      return;
    }

    console.log(`🤖 Processing batch: ${unparsedReceipts.length} receipts`);

    try {
      // Parse this batch with AI
      const parseResult = await circuitBreaker.execute(
        "AI_PARSING",
        async () => {
          return await ctx.runAction(
            internal.aiReceiptParser.parseReceiptsWithAI,
            {
              receipts: unparsedReceipts.map((r: any) => ({
                _id: r._id,
                from: r.from,
                subject: r.subject,
                rawBody: r.rawBody || null,
              })),
            }
          );
        }
      );

      const processedCount = (session.checkpoint?.receiptsProcessed || 0) + (parseResult.processed || unparsedReceipts.length);

      // Update checkpoint
      const prevProcessedIds = session.checkpoint?.processedReceiptIds || [];
      const newProcessedIds = unparsedReceipts.map((r: any) => r._id);
      const mergedProcessedIds = Array.from(new Set([...prevProcessedIds, ...newProcessedIds]));
      await ctx.runMutation(internal.core.stateMachine.updateCheckpoint, {
        sessionId: args.sessionId,
        checkpoint: {
          emailsCollected: args.totalEmailsCollected,
          receiptsProcessed: processedCount,
          candidatesCreated: 0,
          lastProcessedReceiptId: unparsedReceipts[unparsedReceipts.length - 1]._id,
          processedReceiptIds: mergedProcessedIds,
        },
      });

      // Record API costs
      if (parseResult.cost) {
        await ctx.runMutation(internal.monitoring.costTracker.recordAPICall, {
          sessionId: args.sessionId,
          provider: "AI_AGGREGATE",
          model: "mixed",
          inputTokens: parseResult.tokensUsed || 0,
          outputTokens: 0,
          duration: Date.now() - args.startTime,
          success: true,
        });
      }

      console.log(`✅ Batch complete: ${unparsedReceipts.length} receipts parsed (${processedCount} total)`);

      // Schedule next batch
      await ctx.scheduler.runAfter(0, internal.scanning.orchestrator.processParsingBatch, {
        sessionId: args.sessionId,
        totalEmailsCollected: args.totalEmailsCollected,
        startTime: args.startTime,
        iteration: currentIteration + 1,
      });

    } catch (error) {
      console.error(`❌ Batch parsing failed:`, error);

      // Schedule retry of same batch after delay
      await ctx.scheduler.runAfter(5000, internal.scanning.orchestrator.processParsingBatch, {
        sessionId: args.sessionId,
        totalEmailsCollected: args.totalEmailsCollected,
        startTime: args.startTime,
        iteration: currentIteration + 1,
      });
    }
  },
});

/**
 * Complete parsing phase and continue to DETECTING/REVIEWING/COMPLETE
 */
async function completeParsingPhase(
  ctx: any,
  sessionId: Id<"scanSessions">,
  totalEmailsCollected: number,
  session: any,
  startTime: number
) {
  // Phase 5: DETECTING
  await ctx.runMutation(internal.core.stateMachine.transitionState, {
    sessionId,
    newState: ScanState.DETECTING,
  });

  // Optional non-AI repair pass to normalize aggregator receipts and fill missing fields
  try {
    await ctx.runMutation(internal.repair.repairParsedReceipts, {
      userId: session.userId,
      limit: 800,
    });
    console.log("🧰 Repair pass complete before pattern detection.");
  } catch (e) {
    console.warn("Repair pass failed (continuing to detection):", e);
  }

  // Run pattern-based detection
  const detectionResult = await ctx.runMutation(
    internal.patternDetection.runPatternBasedDetection,
    {
      userId: session.userId,
    }
  );

  const candidatesCreated = detectionResult.candidatesCreated || 0;
  const receiptsProcessed = session.checkpoint?.receiptsProcessed || 0;

  // Update final checkpoint
  await ctx.runMutation(internal.core.stateMachine.updateCheckpoint, {
    sessionId,
    checkpoint: {
      emailsCollected: totalEmailsCollected,
      receiptsProcessed,
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
  const parsedCountTotal = receiptsProcessed;
  const estimatedCostPerReceipt = 0.0004;
  const apiCostEstimated = Math.max(0, Math.round(parsedCountTotal * estimatedCostPerReceipt * 1e6) / 1e6);
  const tokensPerReceiptEstimate = 1;
  await ctx.runMutation(internal.core.stateMachine.updateStats, {
    sessionId,
    stats: {
      totalEmailsFound: totalEmailsCollected,
      receiptsIdentified: totalEmailsCollected, // Use collected count
      subscriptionsDetected: candidatesCreated,
      tokensUsed: tokensPerReceiptEstimate * parsedCountTotal,
      apiCost: apiCostEstimated,
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
  } else if (session.type === "incremental") {
    await ctx.runMutation(internal.emailScanner.updateConnectionData, {
      connectionId: session.connectionId,
      lastSyncedAt: Date.now(),
    });
  }

  console.log(`🎉 Scan completed successfully!`);
  console.log(`📊 Results: ${totalEmailsCollected} emails → ${receiptsProcessed} receipts parsed → ${candidatesCreated} subscriptions detected`);
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