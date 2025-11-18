/**
 * Convex Functions: Insights & Activity
 * Provides data for the Insights page - activity feed, price history, predictions
 */

import { v } from "convex/values";
import { query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

/**
 * Activity Feed - Unified timeline of automation events
 * Returns recent activity across detections, price changes, and notifications
 */
export const getActivityFeed = query({
  args: {
    clerkUserId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    // Get user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkUserId))
      .first();

    if (!user) return [];

    // Fetch all activity types in parallel
    const [
      detectionAccepted,
      detectionDismissed,
      priceChanges,
      notifications,
    ] = await Promise.all([
      // Accepted detections
      ctx.db
        .query("detectionCandidates")
        .withIndex("by_user_status", (q) => q.eq("userId", user._id).eq("status", "accepted"))
        .order("desc")
        .take(limit),

      // Dismissed detections
      ctx.db
        .query("detectionCandidates")
        .withIndex("by_user_status", (q) => q.eq("userId", user._id).eq("status", "dismissed"))
        .order("desc")
        .take(limit),

      // Price changes
      ctx.db
        .query("priceHistory")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .order("desc")
        .take(limit),

      // Notification history (includes duplicates, renewals, etc.)
      ctx.db
        .query("notificationHistory")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .order("desc")
        .take(limit),
    ]);

    // Unify into single feed with type discriminators
    const feed: Array<{
      id: string;
      type: "detection_accepted" | "detection_dismissed" | "price_change" | "notification";
      timestamp: number;
      data: any;
    }> = [];

    detectionAccepted.forEach((d) => {
      feed.push({
        id: d._id,
        type: "detection_accepted",
        timestamp: d.reviewedAt || d.createdAt,
        data: d,
      });
    });

    detectionDismissed.forEach((d) => {
      feed.push({
        id: d._id,
        type: "detection_dismissed",
        timestamp: d.reviewedAt || d.createdAt,
        data: d,
      });
    });

    priceChanges.forEach((p) => {
      feed.push({
        id: p._id,
        type: "price_change",
        timestamp: p.detectedAt,
        data: {
          ...p,
          subscriptionId: p.subscriptionId,
        },
      });
    });

    notifications.forEach((n) => {
      feed.push({
        id: n._id,
        type: "notification",
        timestamp: n.createdAt,
        data: n,
      });
    });

    // Sort by timestamp DESC
    feed.sort((a, b) => b.timestamp - a.timestamp);

    // Take top N
    return feed.slice(0, limit);
  },
});

/**
 * Price History for a subscription or all subscriptions
 * Used for price history charts and statistics
 */
export const getPriceHistory = query({
  args: {
    clerkUserId: v.string(),
    subscriptionId: v.optional(v.id("subscriptions")),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkUserId))
      .first();

    if (!user) return [];

    if (args.subscriptionId) {
      // Get price history for specific subscription
      const subId = args.subscriptionId; // Store in variable to satisfy TypeScript
      const history = await ctx.db
        .query("priceHistory")
        .withIndex("by_subscription", (q) => q.eq("subscriptionId", subId))
        .order("desc")
        .collect();

      // Enrich with subscription name
      const subscription = await ctx.db.get(subId);

      return history.map((h) => ({
        ...h,
        subscriptionName: subscription?.name || "Unknown",
      }));
    } else {
      // Get all price history for user
      const history = await ctx.db
        .query("priceHistory")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .order("desc")
        .collect();

      // Enrich with subscription names
      const enriched = await Promise.all(
        history.map(async (h) => {
          const subscription = await ctx.db.get(h.subscriptionId);
          return {
            ...h,
            subscriptionName: subscription?.name || "Unknown",
          };
        })
      );

      return enriched;
    }
  },
});

/**
 * Upcoming Renewals (Predictions)
 * Shows subscriptions with predicted renewal dates in next N days
 */
export const getUpcomingRenewals = query({
  args: {
    clerkUserId: v.string(),
    daysAhead: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const daysAhead = args.daysAhead || 30;
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkUserId))
      .first();

    if (!user) return [];

    // Get all active subscriptions
    const subscriptions = await ctx.db
      .query("subscriptions")
      .withIndex("by_user_active", (q) => q.eq("userId", user._id).eq("isActive", true))
      .collect();

    // Filter to subscriptions with predictions in next N days
    const now = Date.now();
    const futureDate = now + daysAhead * 24 * 60 * 60 * 1000;

    const upcoming = subscriptions
      .filter((s) => {
        const renewalDate = s.predictedNextRenewal || s.nextBillingDate;
        return renewalDate >= now && renewalDate <= futureDate;
      })
      .map((s) => ({
        ...s,
        renewalDate: s.predictedNextRenewal || s.nextBillingDate,
        isPredicted: !!s.predictedNextRenewal,
      }))
      .sort((a, b) => a.renewalDate - b.renewalDate);

    return upcoming;
  },
});

/**
 * Get unread notification count for header badge
 */
export const getUnreadNotificationCount = query({
  args: {
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkUserId))
      .first();

    if (!user) return 0;

    const unread = await ctx.db
      .query("notificationHistory")
      .withIndex("by_user_read", (q) => q.eq("userId", user._id).eq("read", false))
      .collect();

    return unread.length;
  },
});

/**
 * Get notification history (for alerts tab)
 */
export const getNotificationHistory = query({
  args: {
    clerkUserId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkUserId))
      .first();

    if (!user) return [];

    const notifications = await ctx.db
      .query("notificationHistory")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(limit);

    return notifications;
  },
});

/**
 * Get price history for a specific subscription (enriched with subscription data)
 */
export const getSubscriptionPriceHistory = query({
  args: {
    clerkUserId: v.string(),
    subscriptionId: v.id("subscriptions"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkUserId))
      .first();

    if (!user) return null;

    // Get subscription
    const subscription = await ctx.db.get(args.subscriptionId);
    if (!subscription || subscription.userId !== user._id) {
      return null;
    }

    // Get price history
    const history = await ctx.db
      .query("priceHistory")
      .withIndex("by_subscription_date", (q) => q.eq("subscriptionId", args.subscriptionId))
      .order("asc")
      .collect();

    // Calculate stats
    const currentPrice = subscription.cost;
    const startPrice = history.length > 0 ? history[0].oldPrice : currentPrice;
    const totalChange = ((currentPrice - startPrice) / startPrice) * 100;
    const changeCount = history.length;

    return {
      subscription,
      history,
      stats: {
        currentPrice,
        startPrice,
        totalChange,
        changeCount,
        lastChangeDate: history.length > 0 ? history[history.length - 1].detectedAt : null,
      },
    };
  },
});

/**
 * Savings Summary
 * Computes normalized monthly/yearly savings from cancelled subscriptions.
 */
export const getSavingsSummary = query({
  args: {
    clerkUserId: v.string(),
    since: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkUserId))
      .first();

    if (!user) return { totals: { count: 0, monthlySaved: 0, yearlySaved: 0 }, items: [] };

    const since = args.since ?? 0;

    // Get all subscriptions for the user; filter to ones the user explicitly marked as cancelled
    const allSubs = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const cancelled = allSubs.filter((sub) => {
      // Only count subscriptions where we have an explicit cancellation timestamp.
      if (!sub.cancelledAt) return false;

      if (since > 0 && sub.cancelledAt < since) return false;

      return true;
    });

    if (cancelled.length === 0) {
      return { totals: { count: 0, monthlySaved: 0, yearlySaved: 0 }, items: [] };
    }

    const items = cancelled.map((sub) => {
      let monthlySavings = sub.cost;
      if (sub.billingCycle === "yearly") {
        monthlySavings = sub.cost / 12;
      } else if (sub.billingCycle === "weekly") {
        monthlySavings = sub.cost * 4.33;
      }
      const yearlySavings = monthlySavings * 12;

      return {
        subscriptionId: sub._id,
        name: sub.name,
        currency: sub.currency,
        billingCycle: sub.billingCycle,
        originalCost: sub.cost,
        monthlySavings,
        yearlySavings,
        cancelledAt: sub.cancelledAt,
      };
    });

    const monthlySaved = items.reduce((sum, item) => sum + item.monthlySavings, 0);
    const yearlySaved = items.reduce((sum, item) => sum + item.yearlySavings, 0);

    return {
      totals: {
        count: items.length,
        monthlySaved,
        yearlySaved,
      },
      items,
    };
  },
});

/**
 * Automation Health Summary
 * Lightweight snapshot of Gmail connection, scan activity, detection queue, and safe mode.
 */
export const getAutomationHealth = query({
  args: {
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkUserId))
      .first();

    if (!user) {
      return null;
    }

    // Gmail connection (if any)
    const gmailConnection = await ctx.db
      .query("emailConnections")
      .withIndex("by_user_provider", (q) => q.eq("userId", user._id).eq("provider", "gmail"))
      .first();

    // Recent scan session for additional context (if available)
    const recentScan = await ctx.db
      .query("scanSessions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .first();

    // Detection queue stats (pending and total)
    const pendingDetections = await ctx.db
      .query("detectionCandidates")
      .withIndex("by_user_status", (q) => q.eq("userId", user._id).eq("status", "pending"))
      .collect();

    const resolvedDetections = await ctx.db
      .query("detectionCandidates")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Safe-mode / system settings (single row keyed by "global")
    const settings = await ctx.db
      .query("systemSettings")
      .withIndex("by_key", (q) => q.eq("key", "global"))
      .first();

    const safeMode =
      settings?.safeModeEnabled ?? settings?.safeMode ?? settings?.cronsDisabled ?? false;

    // Derive high-level status
    let status: "ok" | "warning" | "error" = "ok";

    if (!gmailConnection) {
      status = "warning";
    } else if (
      gmailConnection.status === "error" ||
      gmailConnection.status === "revoked"
    ) {
      status = "error";
    } else if (
      gmailConnection.status === "requires_reauth" ||
      gmailConnection.status === "expired"
    ) {
      status = "warning";
    }

    if (safeMode) {
      status = status === "error" ? "error" : "warning";
    }

    return {
      status,
      gmail: gmailConnection
        ? {
            email: gmailConnection.email,
            status: gmailConnection.status,
            lastFullScanAt: gmailConnection.lastFullScanAt ?? null,
            lastSyncedAt: gmailConnection.lastSyncedAt ?? null,
            scanStatus: gmailConnection.scanStatus ?? null,
            aiProcessingStatus: gmailConnection.aiProcessingStatus ?? null,
            scanState: gmailConnection.scanState ?? null,
            errorMessage: gmailConnection.errorMessage ?? null,
          }
        : null,
      scan: recentScan
        ? {
            type: recentScan.type,
            status: recentScan.status,
            startedAt: recentScan.startedAt,
            completedAt: recentScan.completedAt ?? null,
            stats: recentScan.stats ?? null,
          }
        : null,
      detection: {
        pending: pendingDetections.length,
        total: resolvedDetections.length,
      },
      safety: {
        safeMode,
        safeModeReason: settings?.safeModeReason ?? settings?.autoKillReason ?? null,
        safeModeEnabledAt: settings?.safeModeEnabledAt ?? settings?.autoKillAt ?? null,
      },
    };
  },
});