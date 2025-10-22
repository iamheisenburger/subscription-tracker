/**
 * Admin Cleanup Utilities
 * WARNING: These functions permanently delete data!
 */

import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Delete duplicate/test user accounts
 * Keeps the most recent account for each email
 */
export const cleanupDuplicateUsers = mutation({
  args: {
    adminPassword: v.string(), // Safety: require password
  },
  handler: async (ctx, args) => {
    // Simple password check (replace with your actual password)
    if (args.adminPassword !== "DELETE_DUPLICATES_2025") {
      throw new Error("Invalid admin password");
    }

    const allUsers = await ctx.db.query("users").collect();

    // Group by email
    const emailGroups = new Map<string, typeof allUsers>();
    allUsers.forEach(user => {
      if (!user.email) return;

      const group = emailGroups.get(user.email) || [];
      group.push(user);
      emailGroups.set(user.email, group);
    });

    const deletedUsers: string[] = [];
    let deletedCount = 0;

    // For each email with duplicates, keep the newest
    for (const [email, users] of emailGroups) {
      if (users.length <= 1) continue;

      // Sort by creation time (most recent first)
      users.sort((a, b) => b._creationTime - a._creationTime);

      // Keep first (newest), delete rest
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

        // Delete receipts
        const receipts = await ctx.db
          .query("emailReceipts")
          .filter(q => q.eq(q.field("userId"), user._id))
          .take(500);

        for (const receipt of receipts) {
          await ctx.db.delete(receipt._id);
        }

        // Delete user
        await ctx.db.delete(user._id);

        deletedUsers.push(`${email} (${user.clerkId})`);
        deletedCount++;
      }
    }

    return {
      success: true,
      deletedCount,
      deletedUsers,
      message: `Cleaned up ${deletedCount} duplicate accounts`,
    };
  },
});

/**
 * Delete test accounts by email pattern
 */
export const deleteTestAccounts = mutation({
  args: {
    adminPassword: v.string(),
    emailPatterns: v.array(v.string()), // e.g. ["tiktokburner", "devansharma"]
  },
  handler: async (ctx, args) => {
    if (args.adminPassword !== "DELETE_DUPLICATES_2025") {
      throw new Error("Invalid admin password");
    }

    const allUsers = await ctx.db.query("users").collect();
    const deletedUsers: string[] = [];

    for (const user of allUsers) {
      if (!user.email) continue;

      const shouldDelete = args.emailPatterns.some(pattern =>
        user.email!.toLowerCase().includes(pattern.toLowerCase())
      );

      if (shouldDelete) {
        // Delete user's data
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

        await ctx.db.delete(user._id);
        deletedUsers.push(`${user.email} (${user.clerkId})`);
      }
    }

    return {
      success: true,
      deletedCount: deletedUsers.length,
      deletedUsers,
    };
  },
});

/**
 * Clean up orphaned email receipts (no matching user)
 */
export const cleanupOrphanedReceipts = mutation({
  args: {
    adminPassword: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.adminPassword !== "DELETE_DUPLICATES_2025") {
      throw new Error("Invalid admin password");
    }

    const receipts = await ctx.db.query("emailReceipts").take(1000);
    const allUsers = await ctx.db.query("users").collect();
    const userIds = new Set(allUsers.map(u => u._id));

    let deletedCount = 0;

    for (const receipt of receipts) {
      if (!userIds.has(receipt.userId)) {
        await ctx.db.delete(receipt._id);
        deletedCount++;
      }
    }

    return {
      success: true,
      deletedCount,
      message: `Deleted ${deletedCount} orphaned receipts`,
    };
  },
});

/**
 * Get cleanup preview (safe, read-only)
 */
export const getCleanupPreview = mutation({
  handler: async (ctx) => {
    const allUsers = await ctx.db.query("users").collect();

    const emailGroups = new Map<string, number>();
    allUsers.forEach(user => {
      if (!user.email) return;
      emailGroups.set(user.email, (emailGroups.get(user.email) || 0) + 1);
    });

    const duplicates = Array.from(emailGroups.entries())
      .filter(([_, count]) => count > 1)
      .map(([email, count]) => ({ email, count, willDelete: count - 1 }));

    const testPatterns = ["tiktokburner", "devansharma", "sattar.louay",
                          "chiragpanjwani", "aevrlystore", "kingoftiktok",
                          "1callumreid", "isabellacarterai"];

    const testAccounts = allUsers.filter(u =>
      u.email && testPatterns.some(p => u.email!.includes(p))
    );

    return {
      totalUsers: allUsers.length,
      duplicates,
      totalDuplicatesToDelete: duplicates.reduce((sum, d) => sum + d.willDelete, 0),
      testAccounts: testAccounts.map(u => u.email),
      testAccountsCount: testAccounts.length,
      estimatedUsersAfterCleanup: allUsers.length -
        duplicates.reduce((sum, d) => sum + d.willDelete, 0) -
        testAccounts.length,
    };
  },
});
