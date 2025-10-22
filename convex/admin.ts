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
 * TESTING HELPER: Clear everything for fresh scan
 * Deletes receipts AND detection candidates for a user
 */
export const resetForTesting = mutation({
  args: {
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkUserId))
      .first();

    if (!user) {
      throw new Error(`User not found: ${args.clerkUserId}`);
    }

    console.log(`🧹 Resetting data for user: ${user.email}`);

    // Delete all email receipts
    const receipts = await ctx.db
      .query("emailReceipts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    for (const receipt of receipts) {
      await ctx.db.delete(receipt._id);
    }

    // Delete all detection candidates
    const candidates = await ctx.db
      .query("detectionCandidates")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    for (const candidate of candidates) {
      await ctx.db.delete(candidate._id);
    }

    // Reset connection scan progress
    const connections = await ctx.db
      .query("emailConnections")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    for (const conn of connections) {
      await ctx.db.patch(conn._id, {
        totalEmailsScanned: 0,
        totalReceiptsFound: 0,
        syncCursor: undefined,
        pageToken: undefined,
        scanStatus: "not_started",
      });
    }

    console.log(`✅ Reset complete:`);
    console.log(`   - Deleted ${receipts.length} receipts`);
    console.log(`   - Deleted ${candidates.length} detection candidates`);
    console.log(`   - Reset ${connections.length} connection(s)`);

    return {
      success: true,
      deleted: {
        receipts: receipts.length,
        candidates: candidates.length,
      },
      resetConnections: connections.length,
      message: "Ready for fresh scan!",
    };
  },
});

/**
 * NUCLEAR OPTION: Delete ALL detection candidates in database
 */
export const deleteAllCandidatesNuclear = mutation({
  args: {},
  handler: async (ctx) => {
    const allCandidates = await ctx.db.query("detectionCandidates").take(500);

    console.log(`🗑️  Deleting ALL ${allCandidates.length} detection candidates`);

    for (const candidate of allCandidates) {
      await ctx.db.delete(candidate._id);
    }

    console.log(`✅ Deleted ${allCandidates.length} candidates`);

    return {
      success: true,
      deleted: allCandidates.length,
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

/**
 * Delete ALL email receipts in database (NUCLEAR OPTION)
 * Use this to completely reset and start fresh
 */
export const deleteAllReceiptsNuclear = mutation({
  args: {},
  handler: async (ctx) => {
    const allReceipts = await ctx.db.query("emailReceipts").take(500);

    console.log(`🗑️  Deleting ALL ${allReceipts.length} receipts from database`);

    for (const receipt of allReceipts) {
      await ctx.db.delete(receipt._id);
    }

    console.log(`✅ Deleted ${allReceipts.length} receipts - database is now clean`);

    return {
      success: true,
      message: `Deleted ALL ${allReceipts.length} receipts`,
      deletedCount: allReceipts.length,
    };
  },
});

/**
 * Get cleanup preview - shows what will be deleted (READ ONLY - SAFE)
 */
export const getCleanupPreview = mutation({
  args: {},
  handler: async (ctx) => {
    const allUsers = await ctx.db.query("users").collect();

    // Group users by email to find duplicates
    const emailGroups = new Map<string, typeof allUsers>();
    allUsers.forEach(user => {
      if (!user.email) return;
      const group = emailGroups.get(user.email) || [];
      group.push(user);
      emailGroups.set(user.email, group);
    });

    // Find duplicates
    const duplicates = Array.from(emailGroups.entries())
      .filter(([_, users]) => users.length > 1)
      .map(([email, users]) => ({
        email,
        totalAccounts: users.length,
        willDelete: users.length - 1, // Keep newest
        accountIds: users.map(u => u.clerkId),
      }));

    // Find test accounts
    const testPatterns = [
      "tiktokburner", "devansharma", "sattar.louay",
      "chiragpanjwani", "aevrlystore", "kingoftiktok",
      "1callumreid", "isabellacarterai"
    ];

    const testAccounts = allUsers.filter(u =>
      u.email && testPatterns.some(p => u.email!.toLowerCase().includes(p))
    );

    const totalToDelete =
      duplicates.reduce((sum, d) => sum + d.willDelete, 0) +
      testAccounts.length;

    return {
      currentUsers: allUsers.length,
      duplicateEmails: duplicates,
      totalDuplicatesToDelete: duplicates.reduce((sum, d) => sum + d.willDelete, 0),
      testAccounts: testAccounts.map(u => ({ email: u.email, clerkId: u.clerkId })),
      testAccountsCount: testAccounts.length,
      totalUsersToDelete: totalToDelete,
      usersAfterCleanup: allUsers.length - totalToDelete,
    };
  },
});

/**
 * Clean up duplicate user accounts - keeps newest account per email
 * SAFE: Requires confirmation password
 */
export const cleanupDuplicateUsers = mutation({
  args: {
    password: v.string(), // Must be "DELETE_DUPLICATES_NOW"
  },
  handler: async (ctx, args) => {
    if (args.password !== "DELETE_DUPLICATES_NOW") {
      throw new Error("Invalid password - operation cancelled for safety");
    }

    const allUsers = await ctx.db.query("users").collect();

    const emailGroups = new Map<string, typeof allUsers>();
    allUsers.forEach(user => {
      if (!user.email) return;
      const group = emailGroups.get(user.email) || [];
      group.push(user);
      emailGroups.set(user.email, group);
    });

    const deletedUsers: Array<{ email: string; clerkId: string }> = [];

    for (const [email, users] of Array.from(emailGroups.entries())) {
      if (users.length <= 1) continue;

      // Sort by creation time - keep newest
      users.sort((a, b) => b._creationTime - a._creationTime);

      // Delete all except first (newest)
      for (let i = 1; i < users.length; i++) {
        const user = users[i];

        // Delete user's data first
        const connections = await ctx.db
          .query("emailConnections")
          .withIndex("by_user", q => q.eq("userId", user._id))
          .collect();

        for (const conn of connections) {
          await ctx.db.delete(conn._id);
        }

        const subscriptions = await ctx.db
          .query("subscriptions")
          .withIndex("by_user", q => q.eq("userId", user._id))
          .collect();

        for (const sub of subscriptions) {
          await ctx.db.delete(sub._id);
        }

        const receipts = await ctx.db
          .query("emailReceipts")
          .withIndex("by_user", q => q.eq("userId", user._id))
          .take(500);

        for (const receipt of receipts) {
          await ctx.db.delete(receipt._id);
        }

        const candidates = await ctx.db
          .query("detectionCandidates")
          .withIndex("by_user", q => q.eq("userId", user._id))
          .collect();

        for (const candidate of candidates) {
          await ctx.db.delete(candidate._id);
        }

        // Finally delete user
        await ctx.db.delete(user._id);

        deletedUsers.push({ email, clerkId: user.clerkId });
      }
    }

    return {
      success: true,
      deletedCount: deletedUsers.length,
      deletedUsers,
      message: `Cleaned up ${deletedUsers.length} duplicate user accounts`,
    };
  },
});

/**
 * Delete test accounts by email pattern
 */
export const deleteTestAccounts = mutation({
  args: {
    password: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.password !== "DELETE_DUPLICATES_NOW") {
      throw new Error("Invalid password");
    }

    const testPatterns = [
      "tiktokburner", "devansharma", "sattar.louay",
      "chiragpanjwani", "aevrlystore", "kingoftiktok",
      "1callumreid", "isabellacarterai"
    ];

    const allUsers = await ctx.db.query("users").collect();
    const deletedUsers: Array<{ email: string; clerkId: string }> = [];

    for (const user of allUsers) {
      if (!user.email) continue;

      const isTestAccount = testPatterns.some(pattern =>
        user.email!.toLowerCase().includes(pattern)
      );

      if (isTestAccount) {
        // Delete all user data
        const connections = await ctx.db
          .query("emailConnections")
          .withIndex("by_user", q => q.eq("userId", user._id))
          .collect();

        for (const conn of connections) {
          await ctx.db.delete(conn._id);
        }

        const subscriptions = await ctx.db
          .query("subscriptions")
          .withIndex("by_user", q => q.eq("userId", user._id))
          .collect();

        for (const sub of subscriptions) {
          await ctx.db.delete(sub._id);
        }

        const receipts = await ctx.db
          .query("emailReceipts")
          .withIndex("by_user", q => q.eq("userId", user._id))
          .take(500);

        for (const receipt of receipts) {
          await ctx.db.delete(receipt._id);
        }

        await ctx.db.delete(user._id);
        deletedUsers.push({ email: user.email, clerkId: user.clerkId });
      }
    }

    return {
      success: true,
      deletedCount: deletedUsers.length,
      deletedUsers,
    };
  },
});
