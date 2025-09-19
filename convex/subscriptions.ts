import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create new subscription
export const createSubscription = mutation({
  args: {
    clerkId: v.string(),
    name: v.string(),
    cost: v.number(),
    currency: v.string(),
    billingCycle: v.union(v.literal("monthly"), v.literal("yearly"), v.literal("weekly")),
    nextBillingDate: v.number(),
    category: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // Check subscription limits for free tier
    if (user.tier === "free_user") {
      const currentSubs = await ctx.db
        .query("subscriptions")
        .withIndex("by_user_active", (q) => q.eq("userId", user._id).eq("isActive", true))
        .collect();

      if (currentSubs.length >= user.subscriptionLimit) {
        throw new Error("Subscription limit reached. Upgrade to premium for unlimited subscriptions.");
      }
    }

    const now = Date.now();
    const subscriptionId = await ctx.db.insert("subscriptions", {
      userId: user._id,
      name: args.name,
      cost: args.cost,
      currency: args.currency,
      billingCycle: args.billingCycle,
      nextBillingDate: args.nextBillingDate,
      category: args.category,
      description: args.description,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    return subscriptionId;
  },
});

// Get all subscriptions for a user
export const getUserSubscriptions = query({
  args: { 
    clerkId: v.string(),
    activeOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      return [];
    }

    if (args.activeOnly) {
      return await ctx.db
        .query("subscriptions")
        .withIndex("by_user_active", (q) => q.eq("userId", user._id).eq("isActive", true))
        .order("desc")
        .collect();
    }

    return await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();
  },
});

// Update subscription
export const updateSubscription = mutation({
  args: {
    subscriptionId: v.id("subscriptions"),
    clerkId: v.string(),
    name: v.optional(v.string()),
    cost: v.optional(v.number()),
    currency: v.optional(v.string()),
    billingCycle: v.optional(v.union(v.literal("monthly"), v.literal("yearly"), v.literal("weekly"))),
    nextBillingDate: v.optional(v.number()),
    category: v.optional(v.string()),
    description: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Verify user owns this subscription
    const subscription = await ctx.db.get(args.subscriptionId);
    if (!subscription) {
      throw new Error("Subscription not found");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user || subscription.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    const updateData: any = {
      updatedAt: Date.now(),
    };

    // Only include provided fields
    if (args.name !== undefined) updateData.name = args.name;
    if (args.cost !== undefined) updateData.cost = args.cost;
    if (args.currency !== undefined) updateData.currency = args.currency;
    if (args.billingCycle !== undefined) updateData.billingCycle = args.billingCycle;
    if (args.nextBillingDate !== undefined) updateData.nextBillingDate = args.nextBillingDate;
    if (args.category !== undefined) updateData.category = args.category;
    if (args.description !== undefined) updateData.description = args.description;
    if (args.isActive !== undefined) updateData.isActive = args.isActive;

    await ctx.db.patch(args.subscriptionId, updateData);
    return args.subscriptionId;
  },
});

// Delete subscription
export const deleteSubscription = mutation({
  args: {
    subscriptionId: v.id("subscriptions"),
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify user owns this subscription
    const subscription = await ctx.db.get(args.subscriptionId);
    if (!subscription) {
      throw new Error("Subscription not found");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user || subscription.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.delete(args.subscriptionId);
    return args.subscriptionId;
  },
});

// Get subscription analytics
export const getSubscriptionAnalytics = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      return null;
    }

    const subscriptions = await ctx.db
      .query("subscriptions")
      .withIndex("by_user_active", (q) => q.eq("userId", user._id).eq("isActive", true))
      .collect();

    // Calculate totals
    const monthlyTotal = subscriptions.reduce((total, sub) => {
      let monthlyAmount = sub.cost;
      if (sub.billingCycle === "yearly") {
        monthlyAmount = sub.cost / 12;
      } else if (sub.billingCycle === "weekly") {
        monthlyAmount = sub.cost * 4.33; // Average weeks per month
      }
      return total + monthlyAmount;
    }, 0);

    const yearlyTotal = monthlyTotal * 12;

    // Group by category
    const byCategory = subscriptions.reduce((acc, sub) => {
      const category = sub.category || "Uncategorized";
      if (!acc[category]) {
        acc[category] = { total: 0, count: 0 };
      }
      
      let monthlyAmount = sub.cost;
      if (sub.billingCycle === "yearly") {
        monthlyAmount = sub.cost / 12;
      } else if (sub.billingCycle === "weekly") {
        monthlyAmount = sub.cost * 4.33;
      }
      
      acc[category].total += monthlyAmount;
      acc[category].count += 1;
      return acc;
    }, {} as Record<string, { total: number; count: number }>);

    // Upcoming renewals (next 30 days)
    const thirtyDaysFromNow = Date.now() + (30 * 24 * 60 * 60 * 1000);
    const upcomingRenewals = subscriptions.filter(
      sub => sub.nextBillingDate <= thirtyDaysFromNow
    );

    return {
      totalSubscriptions: subscriptions.length,
      monthlyTotal,
      yearlyTotal,
      byCategory,
      upcomingRenewals: upcomingRenewals.length,
    };
  },
});

