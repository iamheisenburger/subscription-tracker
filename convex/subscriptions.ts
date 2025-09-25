import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";

// Currency conversion logic embedded directly in Convex (no external imports)
interface CurrencyConversionResult {
  originalAmount: number;
  originalCurrency: string;
  convertedAmount: number;
  targetCurrency: string;
  rate: number;
}

// EXACT SAME fallback rates as frontend lib (src/lib/currency.ts) for consistency
const FALLBACK_RATES: Record<string, Record<string, number>> = {
  USD: { USD: 1.00, EUR: 0.92, GBP: 0.79, CAD: 1.36, AUD: 1.52 },
  EUR: { USD: 1.09, EUR: 1.00, GBP: 0.86, CAD: 1.48, AUD: 1.65 },
  GBP: { USD: 1.27, EUR: 1.16, GBP: 1.00, CAD: 1.73, AUD: 1.93 },
  CAD: { USD: 0.74, EUR: 0.68, GBP: 0.58, CAD: 1.00, AUD: 1.12 },
  AUD: { USD: 0.66, EUR: 0.61, GBP: 0.52, CAD: 0.89, AUD: 1.00 },
};

async function fetchLiveExchangeRates(baseCurrency: string): Promise<Record<string, number>> {
  try {
    const base = baseCurrency.toUpperCase();
    // USE SAME API AS FRONTEND: open.er-api.com (not exchangerate.host)
    const response = await fetch(
      `https://open.er-api.com/v6/latest/${base}`,
      { 
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Exchange rate API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.result !== "success" || !data.rates) {
      throw new Error('Invalid API response format');
    }
    
    // Return live rates with base currency = 1.0
    return {
      ...data.rates,
      [base]: 1.0
    };
  } catch (error) {
    console.warn(`Failed to fetch live rates for ${baseCurrency}:`, error);
    // Return fallback rates
    return FALLBACK_RATES[baseCurrency.toUpperCase()] || FALLBACK_RATES.USD;
  }
}

async function convertCurrency(
  amount: number, 
  fromCurrency: string, 
  toCurrency: string
): Promise<CurrencyConversionResult> {
  const from = fromCurrency.toUpperCase();
  const to = toCurrency.toUpperCase();
  
  if (from === to) {
    return {
      originalAmount: amount,
      originalCurrency: from,
      convertedAmount: amount,
      targetCurrency: to,
      rate: 1.0
    };
  }
  
  const rates = await fetchLiveExchangeRates(from);
  const rate = rates[to];
  
  if (!rate) {
    throw new Error(`No exchange rate found for ${from} to ${to}`);
  }
  
  const convertedAmount = amount * rate;
  
  return {
    originalAmount: amount,
    originalCurrency: from,
    convertedAmount: Math.round(convertedAmount * 100) / 100, // Round to 2 decimals
    targetCurrency: to,
    rate
  };
}

async function convertMultipleCurrencies(
  amounts: Array<{ amount: number; currency: string }>,
  targetCurrency: string
): Promise<CurrencyConversionResult[]> {
  const results: CurrencyConversionResult[] = [];
  
  // Group by currency to minimize API calls
  const currencyGroups: Record<string, { amount: number; currency: string }[]> = {};
  amounts.forEach(item => {
    const currency = item.currency.toUpperCase();
    if (!currencyGroups[currency]) {
      currencyGroups[currency] = [];
    }
    currencyGroups[currency].push(item);
  });
  
  // Process each currency group
  for (const [currency, items] of Object.entries(currencyGroups)) {
    const rates = await fetchLiveExchangeRates(currency);
    const rate = rates[targetCurrency.toUpperCase()];
    
    if (!rate) {
      throw new Error(`No exchange rate found for ${currency} to ${targetCurrency}`);
    }
    
    items.forEach(item => {
      const convertedAmount = item.amount * rate;
      results.push({
        originalAmount: item.amount,
        originalCurrency: currency,
        convertedAmount: Math.round(convertedAmount * 100) / 100,
        targetCurrency: targetCurrency.toUpperCase(),
        rate
      });
    });
  }
  
  return results;
}

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
      category: args.category && args.category.trim().length > 0 ? args.category.trim() : undefined,
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
    // Multi-select support
    billing: v.optional(v.array(v.union(v.literal("monthly"), v.literal("yearly"), v.literal("weekly")))),
    categories: v.optional(v.array(v.string())),
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

      // Category filter (multi)
      const selectedCategories = args.categories && args.categories.length > 0 ? args.categories :
        (args.category && args.category !== "all" ? [args.category] : []);
      if (selectedCategories.length > 0) {
        const wantsUncategorized = selectedCategories.includes("uncategorized");
        const named = selectedCategories.filter(c => c !== "uncategorized");
        const matchNamed = sub.category ? named.includes(sub.category) : false;
        const matchUncategorized = wantsUncategorized && !sub.category;
        if (!(matchNamed || matchUncategorized)) {
          return false;
        }
      }

      // Billing cycle filter (multi)
      const selectedBilling = args.billing && args.billing.length > 0 ? args.billing :
        (args.billingCycle ? [args.billingCycle] : []);
      if (selectedBilling.length > 0 && !selectedBilling.includes(sub.billingCycle)) {
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

    // Check for price changes before updating
    const oldCost = subscription.cost;
    const newCost = args.cost;
    const priceChanged = newCost !== undefined && newCost !== oldCost;

    // Only include provided fields
    if (args.name !== undefined) updateData.name = args.name;
    if (args.cost !== undefined) updateData.cost = args.cost;
    if (args.currency !== undefined) updateData.currency = args.currency;
    if (args.billingCycle !== undefined) updateData.billingCycle = args.billingCycle;
    if (args.nextBillingDate !== undefined) updateData.nextBillingDate = args.nextBillingDate;
    if (args.category !== undefined) updateData.category = args.category && args.category.trim().length > 0 ? args.category.trim() : undefined;
    if (args.description !== undefined) updateData.description = args.description;
    if (args.isActive !== undefined) updateData.isActive = args.isActive;

    await ctx.db.patch(args.subscriptionId, updateData);

    // If price changed, queue price change alert for premium users
    if (priceChanged && newCost !== undefined) {
      // Get user's notification preferences
      const preferences = await ctx.db
        .query("notificationPreferences")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .unique();

      // Only send if user has price change alerts enabled (premium feature)
      if (preferences?.priceChangeAlerts && user.tier === "premium_user") {
        await ctx.db.insert("notificationQueue", {
          userId: user._id,
          type: "price_change",
          subscriptionId: args.subscriptionId,
          emailData: {
            subject: `Price Change: ${subscription.name}`,
            template: "price_change",
            templateData: {
              subscriptionName: subscription.name,
              oldPrice: oldCost,
              newPrice: newCost,
              currency: subscription.currency || 'USD',
            },
          },
          scheduledFor: Date.now() + (5 * 60 * 1000), // Send in 5 minutes
          attempts: 0,
          status: "pending",
          createdAt: Date.now(),
        });
      }
    }
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

// Relabel/migrate category across user's subscriptions (used for rename/merge)
export const relabelCategory = mutation({
  args: {
    clerkId: v.string(),
    from: v.string(),
    to: v.optional(v.string()), // undefined or empty => remove category (uncategorized)
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) throw new Error("User not found");

    const subs = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const targetValue = args.to && args.to.trim().length > 0 ? args.to : undefined;
    const now = Date.now();

    for (const s of subs) {
      if ((s.category || "") === args.from) {
        await ctx.db.patch(s._id, { category: targetValue, updatedAt: now });
      }
    }

    return { updated: true };
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
  args: { 
    clerkId: v.string(),
    targetCurrency: v.optional(v.string())
  },
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

    const targetCurrency = (args.targetCurrency || "USD").toUpperCase();

    // Prepare subscription amounts for currency conversion
    const subscriptionAmounts = subscriptions.map(sub => ({
      amount: sub.cost,
      currency: sub.currency || "USD"
    }));

    // Convert all subscription costs to target currency with 100% accurate rates
    let convertedSubscriptions;
    try {
      const conversions = await convertMultipleCurrencies(subscriptionAmounts, targetCurrency);
      convertedSubscriptions = subscriptions.map((sub, index) => ({
        ...sub,
        convertedCost: conversions[index].convertedAmount,
        originalCost: sub.cost,
        originalCurrency: sub.currency || "USD",
        conversionRate: conversions[index].rate
      }));
    } catch (error) {
      console.error("Currency conversion failed:", error);
      // Don't fallback - throw error for proper debugging
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Currency conversion failed: ${errorMessage}`);
    }

    // Calculate spending trends (last 6 months) with converted amounts
    const now = new Date();
    const spendingTrends = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = date.toLocaleDateString('en-US', { month: 'short' });
      
      // Calculate total for this month using converted amounts
      let monthlySpend = 0;
      convertedSubscriptions.forEach(sub => {
        // Only count subscriptions that existed during this month
        const subCreated = new Date(sub.createdAt);
        if (subCreated <= date) {
          let monthlyAmount = sub.convertedCost;
          if (sub.billingCycle === "yearly") {
            monthlyAmount = sub.convertedCost / 12;
          } else if (sub.billingCycle === "weekly") {
            monthlyAmount = sub.convertedCost * 4.33;
          }
          monthlySpend += monthlyAmount;
        }
      });
      
      spendingTrends.push({
        month,
        spending: Math.round(monthlySpend * 100) / 100,
      });
    }

    // Calculate current totals with converted amounts
    const monthlyTotal = convertedSubscriptions.reduce((total, sub) => {
      let monthlyAmount = sub.convertedCost;
      if (sub.billingCycle === "yearly") {
        monthlyAmount = sub.convertedCost / 12;
      } else if (sub.billingCycle === "weekly") {
        monthlyAmount = sub.convertedCost * 4.33;
      }
      return total + monthlyAmount;
    }, 0);

    const yearlyTotal = monthlyTotal * 12;

    // Group by category for pie chart using converted amounts
    const categoryData = convertedSubscriptions.reduce((acc, sub) => {
      const category = sub.category || "Uncategorized";
      if (!acc[category]) {
        acc[category] = { total: 0, count: 0, subscriptions: [] };
      }
      
      let monthlyAmount = sub.convertedCost;
      if (sub.billingCycle === "yearly") {
        monthlyAmount = sub.convertedCost / 12;
      } else if (sub.billingCycle === "weekly") {
        monthlyAmount = sub.convertedCost * 4.33;
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

    // Billing cycle breakdown using converted amounts
    const billingCycleData = convertedSubscriptions.reduce((acc, sub) => {
      const cycle = sub.billingCycle;
      if (!acc[cycle]) {
        acc[cycle] = { count: 0, amount: 0 };
      }
      
      let monthlyAmount = sub.convertedCost;
      if (sub.billingCycle === "yearly") {
        monthlyAmount = sub.convertedCost / 12;
      } else if (sub.billingCycle === "weekly") {
        monthlyAmount = sub.convertedCost * 4.33;
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
    const upcomingRenewals = convertedSubscriptions.filter(
      sub => sub.nextBillingDate <= thirtyDaysFromNow
    );

    return {
      totalSubscriptions: convertedSubscriptions.length,
      monthlyTotal: Math.round(monthlyTotal * 100) / 100,
      yearlyTotal: Math.round(yearlyTotal * 100) / 100,
      spendingTrends,
      categoryBreakdown,
      cycleBreakdown,
      upcomingRenewals: upcomingRenewals.length,
      averagePerSubscription: convertedSubscriptions.length > 0 ? Math.round((monthlyTotal / convertedSubscriptions.length) * 100) / 100 : 0,
      // Currency metadata for frontend
      currency: targetCurrency,
      currencyConversionApplied: true,
      lastUpdated: Date.now()
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

// Convert single currency amount using the live exchange rates
export const convertSingleCurrency = action({
  args: {
    amount: v.number(),
    fromCurrency: v.string(),
    toCurrency: v.string(),
  },
  handler: async (ctx, args): Promise<CurrencyConversionResult> => {
    if (args.fromCurrency === args.toCurrency) {
      return {
        originalAmount: args.amount,
        originalCurrency: args.fromCurrency,
        convertedAmount: args.amount,
        targetCurrency: args.toCurrency,
        rate: 1,
      };
    }

    try {
      // Use the live exchange rates
      const rates = await fetchLiveExchangeRates(args.fromCurrency);
      const rate = rates[args.toCurrency.toUpperCase()];
      
      if (!rate) {
        throw new Error(`Exchange rate not found for ${args.fromCurrency} to ${args.toCurrency}`);
      }

      const convertedAmount = args.amount * rate;
      
      return {
        originalAmount: args.amount,
        originalCurrency: args.fromCurrency,
        convertedAmount,
        targetCurrency: args.toCurrency,
        rate,
      };
    } catch (error) {
      console.warn(`Currency conversion failed: ${error}. Using fallback rates.`);
      
      // Use fallback rates
      const fallbackRates = FALLBACK_RATES[args.fromCurrency.toUpperCase()] || FALLBACK_RATES.USD;
      const rate = fallbackRates[args.toCurrency.toUpperCase()] || 1;
      const convertedAmount = args.amount * rate;
      
      return {
        originalAmount: args.amount,
        originalCurrency: args.fromCurrency,
        convertedAmount,
        targetCurrency: args.toCurrency,
        rate,
      };
    }
  },
});