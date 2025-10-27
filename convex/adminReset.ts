import { v } from "convex/values";
import { mutation } from "./_generated/server";

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
