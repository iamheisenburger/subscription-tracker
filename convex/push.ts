import { v } from "convex/values";
import { internalMutation, internalAction, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";

// Get users with push subscriptions enabled
export const getUsersWithPushEnabled = internalQuery({
  handler: async (ctx) => {
    const users = await ctx.db
      .query("users")
      .filter((q) => q.and(
        q.eq(q.field("pushEnabled"), true),
        q.neq(q.field("pushSubscription"), undefined)
      ))
      .collect();

    return users.map(user => ({
      _id: user._id,
      clerkId: user.clerkId,
      email: user.email,
      pushSubscription: user.pushSubscription,
    }));
  },
});

// Get specific user's push subscription
export const getUserPushSubscription = internalQuery({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user || !user.pushEnabled || !user.pushSubscription) {
      return null;
    }

    return {
      clerkId: user.clerkId,
      email: user.email,
      pushSubscription: user.pushSubscription,
    };
  },
});

// Send push notification to specific user
export const sendPushNotification = internalAction({
  args: {
    clerkId: v.string(),
    title: v.string(),
    body: v.string(),
    icon: v.optional(v.string()),
    badge: v.optional(v.string()),
    data: v.optional(v.record(v.string(), v.any())),
    actions: v.optional(v.array(v.record(v.string(), v.string()))),
  },
  handler: async (ctx, args) => {
    try {
      // Get user's push subscription
      const userSubscription = await ctx.runQuery(internal.push.getUserPushSubscription, {
        clerkId: args.clerkId,
      });

      if (!userSubscription) {
        console.log(`❌ No push subscription found for user ${args.clerkId}`);
        return { success: false, error: "No push subscription found" };
      }

      // Prepare notification payload
      const payload = {
        title: args.title,
        body: args.body,
        icon: args.icon || '/icons/icon-192x192.png',
        badge: args.badge || '/icons/badge-72x72.png',
        data: {
          ...args.data,
          url: '/dashboard',
          timestamp: Date.now(),
        },
        actions: args.actions || [
          { action: 'view', title: 'View Dashboard' },
          { action: 'dismiss', title: 'Dismiss' }
        ],
        requireInteraction: false,
        silent: false,
      };

      // Send push notification via Web Push API
      const result = await fetch(`${process.env.SITE_URL || 'http://localhost:3000'}/api/notifications/send-push`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.INTERNAL_API_KEY || 'internal'}`,
        },
        body: JSON.stringify({
          subscription: userSubscription.pushSubscription,
          payload: JSON.stringify(payload),
        }),
      });

      const response = await result.json();

      if (!result.ok) {
        console.error(`❌ Push notification failed for ${userSubscription.email}:`, response);
        return { success: false, error: response.error || 'Push notification failed' };
      }

      console.log(`✅ Push notification sent to ${userSubscription.email}`);
      return { success: true, messageId: response.messageId };

    } catch (error) {
      console.error('❌ Push notification error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown push notification error'
      };
    }
  },
});

// Send push notification to multiple users
export const sendBulkPushNotifications = internalAction({
  args: {
    clerkIds: v.array(v.string()),
    title: v.string(),
    body: v.string(),
    icon: v.optional(v.string()),
    data: v.optional(v.record(v.string(), v.any())),
  },
  handler: async (ctx, args) => {
    const results = [];
    
    for (const clerkId of args.clerkIds) {
      const result = await ctx.runAction(internal.push.sendPushNotification, {
        clerkId,
        title: args.title,
        body: args.body,
        icon: args.icon,
        data: args.data,
      });
      
      results.push({ clerkId, ...result });
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.length - successful;

    console.log(`📊 Bulk push notifications: ${successful} sent, ${failed} failed`);

    return {
      total: results.length,
      successful,
      failed,
      results,
    };
  },
});

// Send test push notification
export const sendTestPushNotification = internalAction({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.runAction(internal.push.sendPushNotification, {
      clerkId: args.clerkId,
      title: "SubWise Test Notification",
      body: "Push notifications are working! 🎉",
      icon: '/icons/icon-192x192.png',
      data: {
        type: 'test',
        timestamp: Date.now(),
      },
    });
  },
});

// Clean up expired push subscriptions
export const cleanupExpiredPushSubscriptions = internalMutation({
  handler: async (ctx) => {
    // This would be called by a cron job to remove subscriptions 
    // that have been rejected by push services
    // Implementation would depend on tracking failed push attempts
    console.log("🧹 Push subscription cleanup completed");
    return { cleanedUp: 0 };
  },
});
