import { v } from "convex/values";
import { internalMutation, internalQuery } from "../_generated/server";
import { Id } from "../_generated/dataModel";

/**
 * STATE MACHINE FOR SCAN LIFECYCLE
 *
 * Manages atomic state transitions with validation and recovery.
 * Ensures system never gets stuck in invalid states.
 *
 * Key features:
 * - Atomic state transitions
 * - Valid transition validation
 * - Automatic recovery from failures
 * - Progress tracking and checkpointing
 */

// Scan states enum
export enum ScanState {
  QUEUED = "queued",
  CONNECTING = "connecting",
  COLLECTING = "collecting",
  FILTERING = "filtering",
  PARSING = "parsing",
  DETECTING = "detecting",
  REVIEWING = "reviewing",
  COMPLETE = "complete",
  FAILED = "failed",
  PAUSED = "paused",
}

// Valid state transitions
export const STATE_TRANSITIONS: Record<ScanState, ScanState[]> = {
  [ScanState.QUEUED]: [ScanState.CONNECTING],
  [ScanState.CONNECTING]: [ScanState.COLLECTING, ScanState.FAILED],
  [ScanState.COLLECTING]: [ScanState.FILTERING, ScanState.FAILED, ScanState.PAUSED],
  [ScanState.FILTERING]: [ScanState.PARSING, ScanState.FAILED],
  [ScanState.PARSING]: [ScanState.DETECTING, ScanState.FAILED, ScanState.PAUSED],
  [ScanState.DETECTING]: [ScanState.REVIEWING, ScanState.FAILED],
  [ScanState.REVIEWING]: [ScanState.COMPLETE, ScanState.FAILED],
  [ScanState.COMPLETE]: [], // Terminal state
  [ScanState.FAILED]: [ScanState.QUEUED], // Can retry
  [ScanState.PAUSED]: [ScanState.COLLECTING, ScanState.PARSING], // Can resume
};

// State metadata
export const STATE_METADATA = {
  [ScanState.QUEUED]: {
    displayName: "Queued",
    description: "Scan is waiting to start",
    icon: "⏳",
  },
  [ScanState.CONNECTING]: {
    displayName: "Connecting",
    description: "Verifying Gmail connection and refreshing tokens",
    icon: "🔌",
  },
  [ScanState.COLLECTING]: {
    displayName: "Collecting Emails",
    description: "Fetching emails from Gmail",
    icon: "📧",
  },
  [ScanState.FILTERING]: {
    displayName: "Filtering",
    description: "Identifying receipts and subscriptions",
    icon: "🔍",
  },
  [ScanState.PARSING]: {
    displayName: "Analyzing",
    description: "Using AI to extract subscription details",
    icon: "🤖",
  },
  [ScanState.DETECTING]: {
    displayName: "Detecting Patterns",
    description: "Finding recurring subscriptions",
    icon: "🔮",
  },
  [ScanState.REVIEWING]: {
    displayName: "Ready for Review",
    description: "Subscriptions detected and ready for your review",
    icon: "✅",
  },
  [ScanState.COMPLETE]: {
    displayName: "Complete",
    description: "Scan finished successfully",
    icon: "🎉",
  },
  [ScanState.FAILED]: {
    displayName: "Failed",
    description: "Scan encountered an error",
    icon: "❌",
  },
  [ScanState.PAUSED]: {
    displayName: "Paused",
    description: "Scan temporarily paused",
    icon: "⏸️",
  },
};

/**
 * Create a new scan session
 */
export const createScanSession = internalMutation({
  args: {
    userId: v.id("users"),
    connectionId: v.id("emailConnections"),
    type: v.union(v.literal("full"), v.literal("incremental")),
  },
  handler: async (ctx, args) => {
    const sessionId = await ctx.db.insert("scanSessions", {
      userId: args.userId,
      connectionId: args.connectionId,
      type: args.type,
      status: ScanState.QUEUED,
      startedAt: Date.now(),
      checkpoint: {
        emailsCollected: 0,
        receiptsProcessed: 0,
        candidatesCreated: 0,
      },
    });

    console.log(`📋 Created scan session: ${sessionId} (${args.type} scan)`);
    return sessionId;
  },
});

/**
 * Transition to a new state (atomic operation)
 */
export const transitionState = internalMutation({
  args: {
    sessionId: v.id("scanSessions"),
    newState: v.string(),
    error: v.optional(v.object({
      type: v.union(
        v.literal("transient"),
        v.literal("permanent"),
        v.literal("partial"),
        v.literal("critical")
      ),
      message: v.string(),
      code: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error(`Session not found: ${args.sessionId}`);
    }

    const currentState = session.status as ScanState;
    const newState = args.newState as ScanState;

    // Validate transition
    if (!isValidTransition(currentState, newState)) {
      console.error(`Invalid state transition: ${currentState} → ${newState}`);
      throw new Error(`Cannot transition from ${currentState} to ${newState}`);
    }

    // Prepare update
    const updates: any = {
      status: newState,
    };

    // Handle failure state
    if (newState === ScanState.FAILED && args.error) {
      updates.error = {
        ...args.error,
        retryCount: (session.error?.retryCount || 0) + 1,
        lastRetryAt: Date.now(),
      };
    }

    // Mark completion time
    if (newState === ScanState.COMPLETE) {
      updates.completedAt = Date.now();
    }

    // Perform atomic update
    await ctx.db.patch(args.sessionId, updates);

    const metadata = STATE_METADATA[newState];
    console.log(
      `${metadata.icon} State transition: ${currentState} → ${newState} for session ${args.sessionId}`
    );

    return { success: true, previousState: currentState, newState };
  },
});

/**
 * Update session checkpoint for crash recovery
 */
export const updateCheckpoint = internalMutation({
  args: {
    sessionId: v.id("scanSessions"),
    checkpoint: v.object({
      pageToken: v.optional(v.string()),
      lastProcessedMessageId: v.optional(v.string()),
      lastProcessedReceiptId: v.optional(v.id("emailReceipts")),
      emailsCollected: v.number(),
      receiptsProcessed: v.number(),
      candidatesCreated: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error(`Session not found: ${args.sessionId}`);
    }

    // Merge with existing checkpoint
    const updatedCheckpoint = {
      ...session.checkpoint,
      ...args.checkpoint,
    };

    await ctx.db.patch(args.sessionId, {
      checkpoint: updatedCheckpoint,
    });

    console.log(
      `💾 Checkpoint updated: ${args.checkpoint.emailsCollected} emails, ` +
      `${args.checkpoint.receiptsProcessed} receipts, ` +
      `${args.checkpoint.candidatesCreated} candidates`
    );

    return { success: true };
  },
});

/**
 * Update session statistics
 */
export const updateStats = internalMutation({
  args: {
    sessionId: v.id("scanSessions"),
    stats: v.object({
      totalEmailsFound: v.number(),
      receiptsIdentified: v.number(),
      subscriptionsDetected: v.number(),
      tokensUsed: v.number(),
      apiCost: v.number(),
      processingTimeMs: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error(`Session not found: ${args.sessionId}`);
    }

    // Merge with existing stats
    const updatedStats = {
      ...session.stats,
      ...args.stats,
    };

    await ctx.db.patch(args.sessionId, {
      stats: updatedStats,
    });

    console.log(
      `📊 Stats updated: ${args.stats.totalEmailsFound} emails, ` +
      `${args.stats.receiptsIdentified} receipts, ` +
      `${args.stats.subscriptionsDetected} subscriptions, ` +
      `$${args.stats.apiCost.toFixed(4)} cost`
    );

    return { success: true };
  },
});

/**
 * Get active session for a connection
 */
export const getActiveSession = internalQuery({
  args: {
    connectionId: v.id("emailConnections"),
  },
  handler: async (ctx, args) => {
    // Look for non-terminal sessions
    const activeSession = await ctx.db
      .query("scanSessions")
      .withIndex("by_connection", (q) => q.eq("connectionId", args.connectionId))
      .filter((q) =>
        q.and(
          q.neq(q.field("status"), ScanState.COMPLETE),
          q.neq(q.field("status"), ScanState.FAILED)
        )
      )
      .order("desc")
      .first();

    return activeSession;
  },
});

/**
 * Get latest session for a user
 */
export const getLatestUserSession = internalQuery({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("scanSessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .first();

    return session;
  },
});

/**
 * Resume a paused or failed session
 */
export const resumeSession = internalMutation({
  args: {
    sessionId: v.id("scanSessions"),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error(`Session not found: ${args.sessionId}`);
    }

    const currentState = session.status as ScanState;

    // Determine resume state based on checkpoint
    let resumeState: ScanState;
    if (currentState === ScanState.PAUSED) {
      // Resume from where we paused
      if (session.checkpoint?.receiptsProcessed && session.checkpoint.receiptsProcessed > 0) {
        resumeState = ScanState.PARSING;
      } else {
        resumeState = ScanState.COLLECTING;
      }
    } else if (currentState === ScanState.FAILED) {
      // Retry from beginning
      resumeState = ScanState.QUEUED;
    } else {
      throw new Error(`Cannot resume session in state: ${currentState}`);
    }

    // Validate and perform transition
    if (!isValidTransition(currentState, resumeState)) {
      throw new Error(`Cannot resume from ${currentState} to ${resumeState}`);
    }

    await ctx.db.patch(args.sessionId, {
      status: resumeState,
      error: undefined, // Clear error on resume
    });

    console.log(`▶️ Resumed session ${args.sessionId}: ${currentState} → ${resumeState}`);

    return { success: true, resumedState: resumeState };
  },
});

/**
 * Cancel an active session
 */
export const cancelSession = internalMutation({
  args: {
    sessionId: v.id("scanSessions"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error(`Session not found: ${args.sessionId}`);
    }

    const currentState = session.status as ScanState;

    // Can't cancel terminal states
    if (currentState === ScanState.COMPLETE || currentState === ScanState.FAILED) {
      return { success: false, reason: "Session already terminated" };
    }

    await ctx.db.patch(args.sessionId, {
      status: ScanState.FAILED,
      completedAt: Date.now(),
      error: {
        type: "permanent",
        message: args.reason || "Session cancelled by user",
        code: "USER_CANCELLED",
        retryCount: 0,
      },
    });

    console.log(`🛑 Cancelled session ${args.sessionId}: ${args.reason || "User request"}`);

    return { success: true };
  },
});

/**
 * Clean up old sessions (maintenance)
 */
export const cleanupOldSessions = internalMutation({
  args: {
    olderThanDays: v.number(),
  },
  handler: async (ctx, args) => {
    const cutoffTime = Date.now() - args.olderThanDays * 24 * 60 * 60 * 1000;

    const oldSessions = await ctx.db
      .query("scanSessions")
      .filter((q) => q.lt(q.field("startedAt"), cutoffTime))
      .collect();

    let cleanedCount = 0;
    for (const session of oldSessions) {
      // Only clean up completed/failed sessions
      if (session.status === ScanState.COMPLETE || session.status === ScanState.FAILED) {
        await ctx.db.delete(session._id);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} old scan sessions`);
    }

    return { cleanedCount };
  },
});

/**
 * Helper: Validate state transition
 */
function isValidTransition(from: ScanState, to: ScanState): boolean {
  const validTransitions = STATE_TRANSITIONS[from];
  return validTransitions ? validTransitions.includes(to) : false;
}

/**
 * Helper: Get human-readable state info
 */
export function getStateInfo(state: ScanState) {
  return STATE_METADATA[state] || {
    displayName: state,
    description: "",
    icon: "❓",
  };
}

/**
 * Helper: Calculate progress percentage
 */
export function calculateProgress(state: ScanState): number {
  const progressMap = {
    [ScanState.QUEUED]: 0,
    [ScanState.CONNECTING]: 10,
    [ScanState.COLLECTING]: 30,
    [ScanState.FILTERING]: 50,
    [ScanState.PARSING]: 70,
    [ScanState.DETECTING]: 85,
    [ScanState.REVIEWING]: 95,
    [ScanState.COMPLETE]: 100,
    [ScanState.FAILED]: -1,
    [ScanState.PAUSED]: -1,
  };

  return progressMap[state] ?? 0;
}