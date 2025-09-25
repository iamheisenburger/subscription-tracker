import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";

// Enhanced Premium Spending Insights & Alerts System
// This is a comprehensive premium-only feature for smart financial tracking

// Get advanced spending insights for premium users
export const getSpendingInsights = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user || user.tier !== "premium_user") {
      throw new Error("Premium subscription required for spending insights");
    }

    const subscriptions = await ctx.db
      .query("subscriptions")
      .withIndex("by_user_active", (q) => q.eq("userId", user._id).eq("isActive", true))
      .collect();

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Calculate various spending metrics
    let monthlyTotal = 0;
    let yearlyProjection = 0;
    let categoryBreakdown: Record<string, number> = {};
    let upcomingRenewals: Array<{ name: string; cost: number; date: number; daysUntil: number }> = [];

    for (const sub of subscriptions) {
      // Calculate monthly equivalent
      let monthlyEquivalent = sub.cost;
      if (sub.billingCycle === "yearly") {
        monthlyEquivalent = sub.cost / 12;
      } else if (sub.billingCycle === "weekly") {
        monthlyEquivalent = sub.cost * 4.33;
      }
      
      monthlyTotal += monthlyEquivalent;
      yearlyProjection += monthlyEquivalent * 12;

      // Category breakdown
      const category = sub.category || "Uncategorized";
      categoryBreakdown[category] = (categoryBreakdown[category] || 0) + monthlyEquivalent;

      // Upcoming renewals (next 60 days for premium users)
      const daysUntil = Math.ceil((sub.nextBillingDate - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntil >= 0 && daysUntil <= 60) {
        upcomingRenewals.push({
          name: sub.name,
          cost: sub.cost,
          date: sub.nextBillingDate,
          daysUntil
        });
      }
    }

    // Get user's spending preferences
    const preferences = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    // Calculate spending health score (0-100)
    let healthScore = 100;
    const threshold = preferences?.spendingThreshold || 1000;
    
    if (monthlyTotal > threshold) {
      const overage = monthlyTotal - threshold;
      healthScore = Math.max(0, 100 - (overage / threshold) * 50);
    }

    // Trend analysis (compare with previous months)
    const trends = await calculateSpendingTrends(ctx, user._id, monthlyTotal);

    return {
      monthlyTotal: Math.round(monthlyTotal * 100) / 100,
      yearlyProjection: Math.round(yearlyProjection * 100) / 100,
      threshold: threshold,
      healthScore: Math.round(healthScore),
      categoryBreakdown,
      upcomingRenewals: upcomingRenewals.sort((a, b) => a.daysUntil - b.daysUntil),
      trends,
      recommendations: generateSmartRecommendations(monthlyTotal, threshold, categoryBreakdown),
      currency: user.preferredCurrency || "USD"
    };
  },
});

// Advanced spending threshold management for premium users
export const updateAdvancedSpendingPreferences = mutation({
  args: {
    clerkId: v.string(),
    monthlyThreshold: v.optional(v.number()),
    yearlyThreshold: v.optional(v.number()),
    categoryThresholds: v.optional(v.record(v.string(), v.number())),
    alertTypes: v.optional(v.array(v.union(
      v.literal("approaching_threshold"),
      v.literal("exceeded_threshold"), 
      v.literal("unusual_spike"),
      v.literal("category_overspend"),
      v.literal("renewal_cluster")
    ))),
    alertPercentages: v.optional(v.array(v.number())), // e.g., [80, 90, 100, 110]
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user || user.tier !== "premium_user") {
      throw new Error("Premium subscription required for advanced spending features");
    }

    const preferences = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    if (!preferences) {
      throw new Error("Notification preferences not found");
    }

    const updateData: any = { updatedAt: Date.now() };

    if (args.monthlyThreshold !== undefined) {
      updateData.spendingThreshold = args.monthlyThreshold;
    }

    // Store advanced preferences in metadata
    const advancedPrefs = {
      yearlyThreshold: args.yearlyThreshold,
      categoryThresholds: args.categoryThresholds,
      alertTypes: args.alertTypes || ["approaching_threshold", "exceeded_threshold"],
      alertPercentages: args.alertPercentages || [80, 100],
    };

    // We'll store this in the user record for now
    await ctx.db.patch(user._id, {
      advancedSpendingPrefs: advancedPrefs,
      updatedAt: Date.now(),
    });

    await ctx.db.patch(preferences._id, updateData);

    return { success: true };
  },
});

// Enhanced spending threshold checking with multiple alert types
export const checkAdvancedSpendingThresholds = internalMutation({
  handler: async (ctx) => {
    console.log("💎 Checking advanced spending thresholds for premium users...");
    
    const premiumUsers = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tier"), "premium_user"))
      .collect();
    
    let alertsScheduled = 0;
    const now = new Date();
    
    for (const user of premiumUsers) {
      try {
        const preferences = await ctx.db
          .query("notificationPreferences")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .unique();
        
        if (!preferences?.spendingAlerts || !preferences?.emailEnabled || !preferences?.spendingThreshold) {
          continue;
        }

        // Get advanced preferences
        const advancedPrefs = user.advancedSpendingPrefs || {
          alertTypes: ["approaching_threshold", "exceeded_threshold"],
          alertPercentages: [80, 100],
        };

        // Calculate current spending
        const subscriptions = await ctx.db
          .query("subscriptions")
          .withIndex("by_user_active", (q) => q.eq("userId", user._id).eq("isActive", true))
          .collect();
        
        let monthlySpending = 0;
        const categorySpending: Record<string, number> = {};
        const renewalCounts: Record<string, number> = {};
        
        for (const sub of subscriptions) {
          let monthlyCost = sub.cost;
          if (sub.billingCycle === "yearly") {
            monthlyCost = sub.cost / 12;
          } else if (sub.billingCycle === "weekly") {
            monthlyCost = sub.cost * 4.33;
          }
          
          monthlySpending += monthlyCost;
          
          // Track category spending
          const category = sub.category || "Uncategorized";
          categorySpending[category] = (categorySpending[category] || 0) + monthlyCost;

          // Track renewal clustering (premium insight)
          const renewalWeek = Math.floor((sub.nextBillingDate - now.getTime()) / (7 * 24 * 60 * 60 * 1000));
          renewalCounts[`week_${renewalWeek}`] = (renewalCounts[`week_${renewalWeek}`] || 0) + 1;
        }

        // Check various alert conditions
        for (const alertType of advancedPrefs.alertTypes) {
          const shouldAlert = await checkAlertCondition(
            ctx,
            user,
            alertType,
            monthlySpending,
            preferences.spendingThreshold,
            advancedPrefs,
            categorySpending,
            renewalCounts
          );

          if (shouldAlert.trigger) {
            await scheduleAdvancedSpendingAlert(
              ctx,
              user,
              alertType,
              shouldAlert.data
            );
            alertsScheduled++;
          }
        }

      } catch (error) {
        console.error(`❌ Error checking advanced spending for user ${user.email}:`, error);
      }
    }
    
    console.log(`✅ Advanced spending check complete. Scheduled ${alertsScheduled} alerts.`);
    return { alertsScheduled };
  },
});

// Helper functions
async function calculateSpendingTrends(ctx: any, userId: any, currentMonthly: number) {
  // This would ideally look at historical data
  // For now, we'll return a simple trend indicator
  return {
    monthOverMonth: 0, // Would calculate from historical data
    trend: "stable", // "increasing", "decreasing", "stable"
    confidence: 0.8,
  };
}

function generateSmartRecommendations(
  monthlyTotal: number, 
  threshold: number, 
  categoryBreakdown: Record<string, number>
): string[] {
  const recommendations: string[] = [];
  
  if (monthlyTotal > threshold * 1.2) {
    recommendations.push("🚨 Consider reviewing your highest-cost subscriptions");
  }
  
  if (monthlyTotal > threshold * 0.9) {
    recommendations.push("⚠️ Approaching your spending threshold");
  }

  // Find highest category
  const sortedCategories = Object.entries(categoryBreakdown)
    .sort(([, a], [, b]) => b - a);
  
  if (sortedCategories.length > 0 && sortedCategories[0][1] > monthlyTotal * 0.4) {
    recommendations.push(`💡 ${sortedCategories[0][0]} accounts for ${Math.round((sortedCategories[0][1] / monthlyTotal) * 100)}% of spending`);
  }

  if (recommendations.length === 0) {
    recommendations.push("✅ Your spending looks healthy!");
  }

  return recommendations;
}

async function checkAlertCondition(
  ctx: any,
  user: any,
  alertType: string,
  monthlySpending: number,
  threshold: number,
  advancedPrefs: any,
  categorySpending: Record<string, number>,
  renewalCounts: Record<string, number>
): Promise<{ trigger: boolean; data: any }> {
  
  const thresholdPercentage = (monthlySpending / threshold) * 100;
  
  switch (alertType) {
    case "approaching_threshold":
      return {
        trigger: thresholdPercentage >= 80 && thresholdPercentage < 100,
        data: { thresholdPercentage, monthlySpending, threshold }
      };
      
    case "exceeded_threshold":
      return {
        trigger: thresholdPercentage >= 100,
        data: { thresholdPercentage, monthlySpending, threshold, overage: monthlySpending - threshold }
      };
      
    case "category_overspend":
      // Check if any category exceeds its individual threshold
      const categoryThresholds = advancedPrefs.categoryThresholds || {};
      for (const [category, spent] of Object.entries(categorySpending)) {
        if (categoryThresholds[category] && spent > categoryThresholds[category]) {
          return {
            trigger: true,
            data: { category, spent, threshold: categoryThresholds[category] }
          };
        }
      }
      return { trigger: false, data: {} };
      
    case "renewal_cluster":
      // Alert if too many renewals in same week
      const maxRenewalsPerWeek = Object.values(renewalCounts).reduce((max, count) => Math.max(max, count), 0);
      return {
        trigger: maxRenewalsPerWeek >= 4, // 4+ renewals in same week
        data: { clusteredRenewals: maxRenewalsPerWeek }
      };
      
    default:
      return { trigger: false, data: {} };
  }
}

async function scheduleAdvancedSpendingAlert(
  ctx: any,
  user: any,
  alertType: string,
  alertData: any
) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  // Check if we already sent this type of alert this month
  const existingAlert = await ctx.db
    .query("notificationQueue")
    .withIndex("by_user_type", (q) => q.eq("userId", user._id).eq("type", "spending_alert"))
    .filter((q) => 
      q.and(
        q.gte(q.field("createdAt"), startOfMonth.getTime()),
        q.eq(q.field("emailData.templateData.alertType"), alertType)
      )
    )
    .unique();
  
  if (existingAlert) return; // Already sent this type of alert this month

  const emailData = generateAdvancedAlertEmail(alertType, alertData, user);
  
  await ctx.db.insert("notificationQueue", {
    userId: user._id,
    type: "spending_alert",
    scheduledFor: now.getTime() + (5 * 60 * 1000), // Send in 5 minutes
    status: "pending",
    emailData,
    attempts: 0,
    createdAt: now.getTime(),
  });
}

function generateAdvancedAlertEmail(alertType: string, alertData: any, user: any) {
  const subjects = {
    approaching_threshold: `💡 Spending Alert: You're at ${Math.round(alertData.thresholdPercentage)}% of your monthly budget`,
    exceeded_threshold: `🚨 Budget Alert: You've exceeded your monthly spending limit by $${alertData.overage?.toFixed(2)}`,
    category_overspend: `📊 Category Alert: ${alertData.category} spending exceeded`,
    renewal_cluster: `📅 Renewal Alert: ${alertData.clusteredRenewals} subscriptions renewing soon`,
  };

  return {
    subject: subjects[alertType as keyof typeof subjects] || "Spending Alert",
    template: "advanced_spending_alert",
    templateData: {
      alertType,
      ...alertData,
      currency: user.preferredCurrency || "USD",
      userName: user.email?.split('@')[0] || "there",
    },
  };
}
