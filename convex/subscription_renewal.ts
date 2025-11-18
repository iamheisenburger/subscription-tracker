import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

// Mark subscription as needing renewal confirmation
export const markSubscriptionForConfirmation = mutation({
  args: { 
    clerkId: v.string(), 
    subscriptionId: v.id("subscriptions") 
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const subscription = await ctx.db.get(args.subscriptionId);
    if (!subscription || subscription.userId !== user._id) {
      throw new Error("Subscription not found or access denied");
    }

    // Mark subscription as pending renewal confirmation
    await ctx.db.patch(args.subscriptionId, {
      renewalStatus: "pending_confirmation",
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Confirm subscription renewal or cancellation
export const confirmSubscriptionRenewal = mutation({
  args: { 
    clerkId: v.string(), 
    subscriptionId: v.id("subscriptions"),
    action: v.union(v.literal("renewed"), v.literal("cancelled")),
    newCost: v.optional(v.number()), // In case price changed
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const subscription = await ctx.db.get(args.subscriptionId);
    if (!subscription || subscription.userId !== user._id) {
      throw new Error("Subscription not found or access denied");
    }

    const now = Date.now();

    if (args.action === "renewed") {
      // Calculate next billing date
      let nextBillingDate: number;
      const currentBillingDate = subscription.nextBillingDate;
      
      if (subscription.billingCycle === "monthly") {
        nextBillingDate = currentBillingDate + (30 * 24 * 60 * 60 * 1000);
      } else if (subscription.billingCycle === "yearly") {
        nextBillingDate = currentBillingDate + (365 * 24 * 60 * 60 * 1000);
      } else { // weekly
        nextBillingDate = currentBillingDate + (7 * 24 * 60 * 60 * 1000);
      }

      // Update subscription as renewed (cost changes are handled by subscriptions.updateSubscription for price history)
      await ctx.db.patch(args.subscriptionId, {
        nextBillingDate,
        cost: args.newCost || subscription.cost,
        renewalStatus: "confirmed_renewed",
        isActive: true,
        updatedAt: now,
      });

      // Add to notification history
      await ctx.db.insert("notificationHistory", {
        userId: user._id,
        type: "renewal_confirmed",
        title: "Subscription Renewed",
        message: `${subscription.name} has been renewed successfully`,
        read: false,
        metadata: { subscriptionId: args.subscriptionId },
        createdAt: now,
      });

      return { 
        message: "Subscription renewed successfully",
        nextBilling: nextBillingDate,
        cost: args.newCost || subscription.cost
      };

    } else {
      // Mark as cancelled (user explicitly confirmed cancellation)
      await ctx.db.patch(args.subscriptionId, {
        isActive: false,
        renewalStatus: "confirmed_cancelled",
        cancelledAt: now,
        updatedAt: now,
      });

      // Calculate savings and add to notification history with reward
      const monthlySavings = subscription.billingCycle === "yearly" 
        ? subscription.cost / 12 
        : subscription.billingCycle === "weekly"
        ? subscription.cost * 4.33
        : subscription.cost;

      const yearlySavings = monthlySavings * 12;

      await ctx.db.insert("notificationHistory", {
        userId: user._id,
        type: "subscription_cancelled",
        title: "🎉 Great Job! Subscription Cancelled",
        message: `You're saving $${monthlySavings.toFixed(2)}/month ($${yearlySavings.toFixed(2)}/year) by cancelling ${subscription.name}!`,
        read: false,
        metadata: { 
          subscriptionId: args.subscriptionId,
          monthlySavings,
          yearlySavings,
          rewardType: "savings_celebration"
        },
        createdAt: now,
      });

      return { 
        message: "Subscription cancelled successfully",
        monthlySavings,
        yearlySavings,
        rewardMessage: `🎉 Congratulations! You're now saving $${yearlySavings.toFixed(2)} per year!`
      };
    }
  },
});

// Get subscriptions needing renewal confirmation
export const getSubscriptionsNeedingConfirmation = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const subscriptions = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .collect();

    // Find subscriptions that passed their renewal date and need confirmation
    const now = Date.now();
    const needingConfirmation = subscriptions.filter(sub => {
      return sub.isActive && 
             sub.nextBillingDate < now && 
             (!sub.renewalStatus || sub.renewalStatus === "pending_confirmation");
    });

    return needingConfirmation.map(sub => ({
      _id: sub._id,
      name: sub.name,
      cost: sub.cost,
      currency: sub.currency,
      billingCycle: sub.billingCycle,
      nextBillingDate: sub.nextBillingDate,
      daysPastDue: Math.floor((now - sub.nextBillingDate) / (24 * 60 * 60 * 1000)),
    }));
  },
});

// Cron job to check for expired subscriptions and mark them for confirmation
export const checkExpiredSubscriptions = internalMutation({
  handler: async (ctx) => {
    console.log("🔍 Checking for expired subscriptions needing confirmation...");
    
    const subscriptions = await ctx.db
      .query("subscriptions")
      .withIndex("by_next_billing", (q: any) => q.lt("nextBillingDate", Date.now()))
      .collect();

    let markedCount = 0;
    
    for (const subscription of subscriptions) {
      // Skip if already processed or inactive
      if (!subscription.isActive || subscription.renewalStatus) {
        continue;
      }

      // Mark as needing confirmation
      await ctx.db.patch(subscription._id, {
        renewalStatus: "pending_confirmation",
        updatedAt: Date.now(),
      });

      markedCount++;
    }
    
    console.log(`✅ Marked ${markedCount} subscriptions for renewal confirmation`);
    return { markedCount };
  },
});

// Get user's total savings from cancelled subscriptions
export const getSavingsStats = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // Get cancelled subscriptions
    const cancelledSubs = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .filter((q: any) => q.eq(q.field("isActive"), false))
      .collect();

    let totalMonthlySavings = 0;
    let totalCancelledSubs = cancelledSubs.length;

    for (const sub of cancelledSubs) {
      const monthlyCost = sub.billingCycle === "yearly" 
        ? sub.cost / 12 
        : sub.billingCycle === "weekly"
        ? sub.cost * 4.33
        : sub.cost;
      
      totalMonthlySavings += monthlyCost;
    }

    const totalYearlySavings = totalMonthlySavings * 12;

    return {
      totalMonthlySavings: Math.round(totalMonthlySavings * 100) / 100,
      totalYearlySavings: Math.round(totalYearlySavings * 100) / 100,
      totalCancelledSubs,
    };
  },
});
