import { v } from "convex/values";
import { mutation, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

// ADMIN ONLY: Reset email detection system for a user
export const resetEmailDetectionForUser = mutation({
  args: {
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    console.log(`🔧 ADMIN RESET: Resetting email detection for user ${args.clerkUserId}`);

    // Get the user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkUserId))
      .unique();

    if (!user) {
      throw new Error(`User not found: ${args.clerkUserId}`);
    }

    console.log(`👤 Found user: ${user.email}, tier: ${user.tier}`);

    // 1. Delete all email connections for this user
    const connections = await ctx.db
      .query("emailConnections")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    console.log(`📧 Found ${connections.length} email connections to delete`);
    for (const conn of connections) {
      await ctx.db.delete(conn._id);
    }

    // 2. Delete all receipts for this user's email
    const receipts = await ctx.db
      .query("emailReceipts")
      .filter((q) => q.eq(q.field("userId"), user._id))
      .collect();

    console.log(`📄 Found ${receipts.length} receipts to delete`);
    for (const receipt of receipts) {
      await ctx.db.delete(receipt._id);
    }

    // 3. Delete all detection candidates for this user
    const candidates = await ctx.db
      .query("detectionCandidates")
      .filter((q) => q.eq(q.field("userId"), user._id))
      .collect();

    console.log(`🎯 Found ${candidates.length} detection candidates to delete`);
    for (const candidate of candidates) {
      await ctx.db.delete(candidate._id);
    }

    // 4. Reset the user's lifetime connection counter
    await ctx.db.patch(user._id, {
      emailConnectionsUsedLifetime: 0,
    });

    console.log(`✅ RESET COMPLETE`);
    console.log(`   - Deleted ${connections.length} email connections`);
    console.log(`   - Deleted ${receipts.length} receipts`);
    console.log(`   - Deleted ${candidates.length} detection candidates`);
    console.log(`   - Reset lifetime counter to 0`);

    return {
      success: true,
      deleted: {
        connections: connections.length,
        receipts: receipts.length,
        candidates: candidates.length,
      },
      message: "Email detection system reset successfully. User can now reconnect Gmail and test fresh.",
    };
  },
});

// ADMIN ONLY: Reset parsed flags for receipts to allow reprocessing
export const resetParsedFlagsForUser = mutation({
  args: {
    clerkUserId: v.string(),
    resetOnlyFiltered: v.optional(v.boolean()), // If true, only reset receipts with confidence 0.1
  },
  handler: async (ctx, args) => {
    console.log(`🔧 ADMIN RESET: Resetting parsed flags for user ${args.clerkUserId}`);

    // Get the user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkUserId))
      .unique();

    if (!user) {
      throw new Error(`User not found: ${args.clerkUserId}`);
    }

    console.log(`👤 Found user: ${user.email}, tier: ${user.tier}`);

    // Get all parsed receipts
    const receipts = await ctx.db
      .query("emailReceipts")
      .filter((q) => q.eq(q.field("userId"), user._id))
      .filter((q) => q.eq(q.field("parsed"), true))
      .collect();

    console.log(`📄 Found ${receipts.length} parsed receipts`);

    // Filter receipts if needed
    const receiptsToReset = args.resetOnlyFiltered
      ? receipts.filter(r => !r.merchantName && r.parsingConfidence === 0.1)
      : receipts;

    console.log(`🔄 Resetting ${receiptsToReset.length} receipts`);

    // Reset parsed flags
    let resetCount = 0;
    for (const receipt of receiptsToReset) {
      await ctx.db.patch(receipt._id, {
        parsed: false,
        merchantName: undefined,
        amount: undefined,
        currency: undefined,
        billingCycle: undefined,
        parsingConfidence: undefined,
        parsingMethod: undefined,
      });
      resetCount++;
    }

    // Also delete detection candidates so they can be recreated
    const candidates = await ctx.db
      .query("detectionCandidates")
      .filter((q) => q.eq(q.field("userId"), user._id))
      .collect();

    console.log(`🎯 Deleting ${candidates.length} detection candidates`);
    for (const candidate of candidates) {
      await ctx.db.delete(candidate._id);
    }

    // Update connection scan state to allow reprocessing
    const connections = await ctx.db
      .query("emailConnections")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    for (const conn of connections) {
      await ctx.db.patch(conn._id, {
        scanState: "complete", // Reset to complete so user can trigger new scan
        currentBatch: 0,
        batchProgress: 0,
      });
    }

    console.log(`✅ RESET COMPLETE`);
    console.log(`   - Reset ${resetCount} receipts`);
    console.log(`   - Deleted ${candidates.length} detection candidates`);
    console.log(`   - Reset ${connections.length} connection scan states`);

    return {
      success: true,
      reset: {
        receipts: resetCount,
        candidates: candidates.length,
        connections: connections.length,
      },
      message: `Reset ${resetCount} receipts. User can now trigger a new scan to reprocess.`,
    };
  },
});

// ADMIN ONLY: Batch-safe reset of parsed flags to handle large datasets without hitting Convex limits
export const resetParsedFlagsBatchSafe = mutation({
  args: {
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    console.log(`🔧 BATCH-SAFE RESET: Starting for user ${args.clerkUserId}`);

    // Get the user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkUserId))
      .unique();

    if (!user) {
      throw new Error(`User not found: ${args.clerkUserId}`);
    }

    console.log(`👤 Found user: ${user.email}, tier: ${user.tier}`);

    // Count total receipts to process
    const allReceipts = await ctx.db
      .query("emailReceipts")
      .filter((q) => q.eq(q.field("userId"), user._id))
      .collect();

    const totalReceipts = allReceipts.length;
    console.log(`📄 Found ${totalReceipts} total receipts`);

    // Delete detection candidates first (smaller dataset)
    const candidates = await ctx.db
      .query("detectionCandidates")
      .filter((q) => q.eq(q.field("userId"), user._id))
      .collect();

    console.log(`🎯 Deleting ${candidates.length} detection candidates`);
    for (const candidate of candidates) {
      await ctx.db.delete(candidate._id);
    }

    // Reset connection scan states
    const connections = await ctx.db
      .query("emailConnections")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    for (const conn of connections) {
      await ctx.db.patch(conn._id, {
        scanState: "idle", // Reset to idle so user can trigger new scan
        scanStatus: "not_started",
        aiProcessingStatus: "not_started",
        currentBatch: 0,
        batchProgress: 0,
        overallProgress: 0,
        totalBatches: 0,
        estimatedTimeRemaining: 0,
        lastFullScanAt: undefined, // Clear to force full scan instead of incremental
        pageToken: undefined, // Clear pagination token
        totalEmailsScanned: 0,
        totalReceiptsFound: 0,
      });
    }

    // Schedule batch processing of receipts (100 at a time to stay under limits)
    console.log(`🔄 Scheduling batch reset of ${totalReceipts} receipts...`);
    await ctx.scheduler.runAfter(0, internal.adminReset.resetReceiptsBatch, {
      userId: user._id,
      batchNumber: 1,
      batchSize: 100,
    });

    return {
      success: true,
      message: `Reset initiated for ${totalReceipts} receipts. Processing in batches of 100. Check logs for progress.`,
      totalReceipts,
      candidates: candidates.length,
      connections: connections.length,
    };
  },
});

// INTERNAL: Process a batch of receipt resets
export const resetReceiptsBatch = internalMutation({
  args: {
    userId: v.id("users"),
    batchNumber: v.number(),
    batchSize: v.number(),
  },
  handler: async (ctx, args) => {
    console.log(`🔄 Processing batch ${args.batchNumber} (size: ${args.batchSize})`);

    // Get next batch of receipts
    const receipts = await ctx.db
      .query("emailReceipts")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();

    const startIdx = (args.batchNumber - 1) * args.batchSize;
    const batchReceipts = receipts.slice(startIdx, startIdx + args.batchSize);

    console.log(`📄 Resetting ${batchReceipts.length} receipts (batch ${args.batchNumber})`);

    // Reset parsed flags for this batch
    for (const receipt of batchReceipts) {
      await ctx.db.patch(receipt._id, {
        parsed: false,
        merchantName: undefined,
        amount: undefined,
        currency: undefined,
        billingCycle: undefined,
        parsingConfidence: undefined,
        parsingMethod: undefined,
      });
    }

    // If there are more receipts, schedule next batch
    const hasMore = receipts.length > startIdx + args.batchSize;
    if (hasMore) {
      console.log(`➡️  Scheduling batch ${args.batchNumber + 1}`);
      await ctx.scheduler.runAfter(1000, internal.adminReset.resetReceiptsBatch, {
        userId: args.userId,
        batchNumber: args.batchNumber + 1,
        batchSize: args.batchSize,
      });
    } else {
      console.log(`✅ BATCH RESET COMPLETE! Reset ${receipts.length} receipts across ${args.batchNumber} batches`);
    }

    return {
      batchNumber: args.batchNumber,
      processed: batchReceipts.length,
      hasMore,
    };
  },
});

// ADMIN ONLY: Cancel a running scan for a user
export const cancelScan = mutation({
  args: {
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    console.log(`🛑 CANCEL SCAN: Stopping scan for user ${args.clerkUserId}`);

    // Get the user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkUserId))
      .unique();

    if (!user) {
      throw new Error(`User not found: ${args.clerkUserId}`);
    }

    // Get all email connections
    const connections = await ctx.db
      .query("emailConnections")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    console.log(`📧 Found ${connections.length} email connections`);

    // Reset all connections to idle state
    for (const conn of connections) {
      await ctx.db.patch(conn._id, {
        scanState: "idle",
        scanStatus: "not_started",
        aiProcessingStatus: "not_started",
        currentBatch: 0,
        batchProgress: 0,
        overallProgress: 0,
        totalBatches: 0,
        estimatedTimeRemaining: 0,
        errorMessage: undefined,
      });
    }

    console.log(`✅ SCAN CANCELLED - All connections reset to idle state`);

    return {
      success: true,
      message: `Scan cancelled for ${user.email}. All connections reset to idle.`,
      connectionsReset: connections.length,
    };
  },
});
