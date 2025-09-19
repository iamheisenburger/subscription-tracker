import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create or update user from Clerk webhook
export const createOrUpdateUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    const now = Date.now();

    if (existingUser) {
      // Update existing user
      await ctx.db.patch(existingUser._id, {
        email: args.email,
        updatedAt: now,
      });
      return existingUser._id;
    } else {
      // Create new user with free tier
      const userId = await ctx.db.insert("users", {
        clerkId: args.clerkId,
        email: args.email,
        tier: "free_user",
        subscriptionLimit: 3, // Free tier limit
        trialEndsAt: now + (7 * 24 * 60 * 60 * 1000), // 7 days from now
        createdAt: now,
        updatedAt: now,
      });
      return userId;
    }
  },
});

// Get user by Clerk ID
export const getUserByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();
  },
});

// Upgrade user to premium
export const upgradeTopremium = mutation({
  args: {
    clerkId: v.string(),
    isAnnual: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const now = Date.now();
    const expirationTime = args.isAnnual
      ? now + (365 * 24 * 60 * 60 * 1000) // 1 year
      : now + (30 * 24 * 60 * 60 * 1000); // 1 month

    await ctx.db.patch(user._id, {
      tier: "premium_user",
      subscriptionLimit: -1, // Unlimited
      premiumExpiresAt: expirationTime,
      updatedAt: now,
    });

    return user._id;
  },
});

// Check if user can add more subscriptions
export const canAddSubscription = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    if (user.tier === "premium_user") {
      return { canAdd: true, limit: -1, current: 0 };
    }

    // Count current active subscriptions
    const currentSubs = await ctx.db
      .query("subscriptions")
      .withIndex("by_user_active", (q) => q.eq("userId", user._id).eq("isActive", true))
      .collect();

    const canAdd = currentSubs.length < user.subscriptionLimit;

    return {
      canAdd,
      limit: user.subscriptionLimit,
      current: currentSubs.length,
    };
  },
});

