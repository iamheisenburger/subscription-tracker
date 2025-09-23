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

          if (currentSubs.length >= 3) {
            throw new Error("Free plan allows maximum 3 subscriptions. Upgrade to Premium for unlimited subscriptions.");
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

// Get all subscriptions for a user with filtering
export const getUserSubscriptions = query({
  args: { 
    clerkId: v.string(),
    activeOnly: v.optional(v.boolean()),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"))),
    search: v.optional(v.string()),
    category: v.optional(v.string()),
    billingCycle: v.optional(v.union(v.literal("monthly"), v.literal("yearly"), v.literal("weekly"))),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      return [];
    }

    let subscriptions;
    if (args.activeOnly || args.status === "active") {
      subscriptions = await ctx.db
        .query("subscriptions")
        .withIndex("by_user_active", (q) => q.eq("userId", user._id).eq("isActive", true))
        .order("desc")
        .collect();
    } else {
      subscriptions = await ctx.db
        .query("subscriptions")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .order("desc")
        .collect();
    }

    // Client-side filtering for search, category, billing cycle
    return subscriptions.filter(sub => {
      // Status filter (inactive handled here)
      if (args.status === "inactive" && sub.isActive) {
        return false;
      }
      // Search filter
      if (args.search) {
        const searchLower = args.search.toLowerCase();
        const matchesName = sub.name.toLowerCase().includes(searchLower);
        const matchesCategory = sub.category?.toLowerCase().includes(searchLower);
        if (!matchesName && !matchesCategory) return false;
      }

      // Category filter
      if (args.category && args.category !== "all") {
        if (args.category === "uncategorized") {
          if (sub.category) return false;
        } else {
          if (sub.category !== args.category) return false;
        }
      }

      // Billing cycle filter
      if (args.billingCycle && sub.billingCycle !== args.billingCycle) {
        return false;
      }

      return true;
    });
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

// Toggle active status (pause/resume)
export const toggleSubscriptionStatus = mutation({
  args: {
    clerkId: v.string(),
    subscriptionId: v.id("subscriptions"),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) throw new Error("User not found");

    const subscription = await ctx.db.get(args.subscriptionId);
    if (!subscription || subscription.userId !== user._id) throw new Error("Unauthorized");

    await ctx.db.patch(args.subscriptionId, {
      isActive: args.isActive,
      updatedAt: Date.now(),
    });

    return args.subscriptionId;
  },
});


// Get subscription statistics with raw currency data
export const getSubscriptionStats = query({
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

    // Return raw subscription data for client-side currency conversion
    const subscriptionCosts = subscriptions.map(sub => ({
      amount: sub.cost,
      currency: sub.currency,
      billingCycle: sub.billingCycle
    }));

    // Find next renewal
    let nextRenewal: number | null = null;
    subscriptions.forEach((sub) => {
      if (!nextRenewal || sub.nextBillingDate < nextRenewal) {
        nextRenewal = sub.nextBillingDate;
      }
    });

    return {
      totalSubscriptions: subscriptions.length,
      activeSubscriptions: subscriptions.filter(s => s.isActive).length,
      subscriptionCosts, // Raw data for client-side conversion
      nextRenewal,
    };
  },
});

// Get subscription analytics with spending trends
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

    // Calculate spending trends (last 6 months)
    const now = new Date();
    const spendingTrends = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = date.toLocaleDateString('en-US', { month: 'short' });
      
      // Calculate total for this month
      let monthlySpend = 0;
      subscriptions.forEach(sub => {
        // Only count subscriptions that existed during this month
        const subCreated = new Date(sub.createdAt);
        if (subCreated <= date) {
          let monthlyAmount = sub.cost;
          if (sub.billingCycle === "yearly") {
            monthlyAmount = sub.cost / 12;
          } else if (sub.billingCycle === "weekly") {
            monthlyAmount = sub.cost * 4.33;
          }
          monthlySpend += monthlyAmount;
        }
      });
      
      spendingTrends.push({
        month,
        spending: Math.round(monthlySpend * 100) / 100,
      });
    }

    // Calculate current totals
    const monthlyTotal = subscriptions.reduce((total, sub) => {
      let monthlyAmount = sub.cost;
      if (sub.billingCycle === "yearly") {
        monthlyAmount = sub.cost / 12;
      } else if (sub.billingCycle === "weekly") {
        monthlyAmount = sub.cost * 4.33;
      }
      return total + monthlyAmount;
    }, 0);

    const yearlyTotal = monthlyTotal * 12;

    // Group by category for pie chart
    const categoryData = subscriptions.reduce((acc, sub) => {
      const category = sub.category || "Uncategorized";
      if (!acc[category]) {
        acc[category] = { total: 0, count: 0, subscriptions: [] };
      }
      
      let monthlyAmount = sub.cost;
      if (sub.billingCycle === "yearly") {
        monthlyAmount = sub.cost / 12;
      } else if (sub.billingCycle === "weekly") {
        monthlyAmount = sub.cost * 4.33;
      }
      
      acc[category].total += monthlyAmount;
      acc[category].count += 1;
      acc[category].subscriptions.push(sub.name);
      return acc;
    }, {} as Record<string, { total: number; count: number; subscriptions: string[] }>);

    // Convert to array format for charts
    const categoryBreakdown = Object.entries(categoryData).map(([category, data]) => ({
      category,
      amount: Math.round(data.total * 100) / 100,
      count: data.count,
      subscriptions: data.subscriptions,
      fill: `var(--chart-${Object.keys(categoryData).indexOf(category) + 1})`,
    }));

    // Billing cycle breakdown
    const billingCycleData = subscriptions.reduce((acc, sub) => {
      const cycle = sub.billingCycle;
      if (!acc[cycle]) {
        acc[cycle] = { count: 0, amount: 0 };
      }
      
      let monthlyAmount = sub.cost;
      if (sub.billingCycle === "yearly") {
        monthlyAmount = sub.cost / 12;
      } else if (sub.billingCycle === "weekly") {
        monthlyAmount = sub.cost * 4.33;
      }
      
      acc[cycle].count += 1;
      acc[cycle].amount += monthlyAmount;
      return acc;
    }, {} as Record<string, { count: number; amount: number }>);

    const cycleBreakdown = Object.entries(billingCycleData).map(([cycle, data]) => ({
      cycle: cycle.charAt(0).toUpperCase() + cycle.slice(1),
      count: data.count,
      amount: Math.round(data.amount * 100) / 100,
      fill: `var(--chart-${Object.keys(billingCycleData).indexOf(cycle) + 1})`,
    }));

    // Upcoming renewals (next 30 days)
    const thirtyDaysFromNow = Date.now() + (30 * 24 * 60 * 60 * 1000);
    const upcomingRenewals = subscriptions.filter(
      sub => sub.nextBillingDate <= thirtyDaysFromNow
    );

    return {
      totalSubscriptions: subscriptions.length,
      monthlyTotal: Math.round(monthlyTotal * 100) / 100,
      yearlyTotal: Math.round(yearlyTotal * 100) / 100,
      spendingTrends,
      categoryBreakdown,
      cycleBreakdown,
      upcomingRenewals: upcomingRenewals.length,
      averagePerSubscription: subscriptions.length > 0 ? Math.round((monthlyTotal / subscriptions.length) * 100) / 100 : 0,
    };
  },
});

// Delete subscription
export const deleteSubscription = mutation({
  args: {
    clerkId: v.string(),
    subscriptionId: v.id("subscriptions"),
  },
  handler: async (ctx, args) => {
    // Get user to verify ownership
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // Get subscription to verify ownership
    const subscription = await ctx.db.get(args.subscriptionId);
    
    if (!subscription) {
      throw new Error("Subscription not found");
    }

    if (subscription.userId !== user._id) {
      throw new Error("Unauthorized: You can only delete your own subscriptions");
    }

    // Delete the subscription
    await ctx.db.delete(args.subscriptionId);
    
    return { success: true };
  },
});

