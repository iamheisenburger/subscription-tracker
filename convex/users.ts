import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

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

// Set user tier explicitly (used by server-side sync)
export const setTier = mutation({
  args: {
    clerkId: v.string(),
    tier: v.union(v.literal("free_user"), v.literal("premium_user")),
    subscriptionType: v.optional(v.union(v.literal("monthly"), v.literal("annual"))),
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
    const isPremium = args.tier === "premium_user";
    const wasAlreadyPremium = user.tier === "premium_user";

    const updateData: any = {
      tier: args.tier,
      subscriptionLimit: isPremium ? -1 : 3,
      updatedAt: now,
    };

    // Only set subscriptionType for premium users
    if (isPremium && args.subscriptionType) {
      updateData.subscriptionType = args.subscriptionType;
    } else if (!isPremium) {
      updateData.subscriptionType = undefined;
    }

    await ctx.db.patch(user._id, updateData);

    // Auto-add SubWise subscription when user FIRST upgrades to premium
    if (isPremium && !wasAlreadyPremium) {
      await addSubWiseSubscription(ctx, user._id, args.subscriptionType || "monthly");
    }

    return user._id;
  },
});

// Helper function to auto-add SubWise subscription
async function addSubWiseSubscription(
  ctx: any, 
  userId: Id<"users">, 
  subscriptionType: "monthly" | "annual"
) {
  // Check if SubWise subscription already exists  
  const subscriptions = await ctx.db
    .query("subscriptions")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .collect();
  
  const existingSubWise = subscriptions.find((sub: any) => sub.name === "SubWise");

  if (existingSubWise) {
    console.log("✅ SubWise subscription already exists for user");
    return;
  }

  const now = Date.now();
  const cost = subscriptionType === "annual" ? 42.00 : 5.00; // $42/year ($3.50/month) or $5/month
  const billingCycle = subscriptionType === "annual" ? "yearly" : "monthly";
  
  // Calculate next billing date (30 days or 365 days from now)
  const daysToAdd = subscriptionType === "annual" ? 365 : 30;
  const nextBillingDate = now + (daysToAdd * 24 * 60 * 60 * 1000);

  // Add SubWise subscription
  const subscriptionId = await ctx.db.insert("subscriptions", {
    userId: userId,
    name: "SubWise",
    cost: cost,
    currency: "USD",
    billingCycle: billingCycle,
    nextBillingDate: nextBillingDate,
    category: "Productivity", // Category for organization
    description: "Subscription tracking and management platform",
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });

  console.log(`✅ Auto-added SubWise ${subscriptionType} subscription ($${cost}/${billingCycle}) for user`);
  return subscriptionId;
}

// Update user's preferred currency
export const updatePreferredCurrency = mutation({
  args: {
    clerkId: v.string(),
    preferredCurrency: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, {
      preferredCurrency: args.preferredCurrency,
      updatedAt: Date.now(),
    });

    return user._id;
  },
});

// Store push notification subscription
export const storePushSubscription = mutation({
  args: {
    clerkId: v.string(),
    subscription: v.record(v.string(), v.any()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, {
      pushSubscription: args.subscription,
      pushEnabled: true,
      updatedAt: Date.now(),
    });

    console.log(`✅ Stored push subscription for user ${user.email}`);
    return user._id;
  },
});

// Remove push notification subscription
export const removePushSubscription = mutation({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, {
      pushSubscription: undefined,
      pushEnabled: false,
      updatedAt: Date.now(),
    });

    console.log(`✅ Removed push subscription for user ${user.email}`);
    return user._id;
  },
});

// Update push notification preference (without changing subscription)
export const updatePushEnabled = mutation({
  args: {
    clerkId: v.string(),
    pushEnabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, {
      pushEnabled: args.pushEnabled,
      updatedAt: Date.now(),
    });

    return user._id;
  },
});

// Add SubWise subscription for existing premium users who don't have it
export const addMissingSubWiseSubscription = mutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    if (user.tier !== "premium_user") {
      throw new Error("Only premium users get SubWise subscription");
    }

    // Check if SubWise already exists
    const subscriptions = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .collect();
    
    const existingSubWise = subscriptions.find((sub: any) => sub.name === "SubWise");

    if (existingSubWise) {
      return { message: "SubWise subscription already exists", subscriptionId: existingSubWise._id };
    }

    // Add SubWise subscription (default to monthly for existing users)
    const subscriptionType = user.subscriptionType || "monthly";
    const subscriptionId = await addSubWiseSubscription(ctx, user._id, subscriptionType);

    return { 
      message: `Added SubWise ${subscriptionType} subscription`, 
      subscriptionId,
      cost: subscriptionType === "annual" ? 42.00 : 5.00
    };
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

