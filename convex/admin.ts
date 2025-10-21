/**
 * Admin Functions for Database Cleanup and Maintenance
 * TEMPORARY FILE - Use for one-time fixes
 */

import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * EMERGENCY FIX: Delete all email receipts with empty/broken rawBody
 * These receipts were created before the Buffer.from → atob fix
 * They can't be parsed because email bodies were never extracted
 */
export const deletebrokenReceipts = mutation({
  args: {
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkUserId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Find all receipts with missing or empty rawBody
    const allReceipts = await ctx.db
      .query("emailReceipts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const brokenReceipts = allReceipts.filter(
      (receipt) => !receipt.rawBody || receipt.rawBody.trim() === ""
    );

    console.log(`🗑️  Found ${brokenReceipts.length} broken receipts (empty rawBody)`);
    console.log(`📊 Total receipts: ${allReceipts.length}`);

    // Delete each broken receipt
    for (const receipt of brokenReceipts) {
      await ctx.db.delete(receipt._id);
    }

    console.log(`✅ Deleted ${brokenReceipts.length} broken receipts`);

    return {
      deleted: brokenReceipts.length,
      totalBefore: allReceipts.length,
      remaining: allReceipts.length - brokenReceipts.length,
    };
  },
});

/**
 * EMERGENCY FIX: Reset email connection lifetime limit
 * Allows user to reconnect Gmail after disconnect
 */
export const resetEmailConnectionLimit = mutation({
  args: {
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkUserId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const before = user.emailConnectionsUsedLifetime || 0;

    await ctx.db.patch(user._id, {
      emailConnectionsUsedLifetime: 0,
    });

    console.log(`✅ Reset email connection limit: ${before} → 0`);

    return {
      before,
      after: 0,
      message: "Email connection limit reset successfully",
    };
  },
});

/**
 * Delete all detection candidates for a user
 * Use this to clear out false positives and re-scan with improved parser
 */
export const deleteAllDetectionCandidates = mutation({
  args: {
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkUserId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const candidates = await ctx.db
      .query("detectionCandidates")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    console.log(`🗑️  Found ${candidates.length} detection candidates to delete`);

    for (const candidate of candidates) {
      await ctx.db.delete(candidate._id);
    }

    console.log(`✅ Deleted ${candidates.length} detection candidates`);

    return {
      deleted: candidates.length,
      message: "All detection candidates deleted successfully",
    };
  },
});

/**
 * Delete all email receipts for a user
 * Use this to clear out receipts and start fresh scan
 */
export const deleteAllEmailReceipts = mutation({
  args: {
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkUserId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const receipts = await ctx.db
      .query("emailReceipts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    console.log(`🗑️  Found ${receipts.length} email receipts to delete`);

    for (const receipt of receipts) {
      await ctx.db.delete(receipt._id);
    }

    console.log(`✅ Deleted ${receipts.length} email receipts`);

    return {
      deleted: receipts.length,
      message: `All ${receipts.length} email receipts deleted successfully`,
    };
  },
});
