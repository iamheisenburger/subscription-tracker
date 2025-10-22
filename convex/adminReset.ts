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
