import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get user's notification preferences
export const getNotificationPreferences = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const preferences = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    // Return default preferences if none exist
    if (!preferences) {
      return {
        emailEnabled: true,
        pushEnabled: true,
        renewalReminders: true,
        priceChangeAlerts: user.tier === "premium_user", // Premium only
        spendingAlerts: user.tier === "premium_user", // Premium only
        reminderDays: [7, 3, 1],
        spendingThreshold: undefined,
      };
    }

    return preferences;
  },
});

// Create or update notification preferences
export const updateNotificationPreferences = mutation({
  args: {
    clerkId: v.string(),
    emailEnabled: v.optional(v.boolean()),
    pushEnabled: v.optional(v.boolean()),
    renewalReminders: v.optional(v.boolean()),
    priceChangeAlerts: v.optional(v.boolean()),
    spendingAlerts: v.optional(v.boolean()),
    reminderDays: v.optional(v.array(v.number())),
    spendingThreshold: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const existingPreferences = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    const now = Date.now();
    
    // Prepare update data
    const updateData: any = {
      userId: user._id,
      updatedAt: now,
    };

    if (args.emailEnabled !== undefined) updateData.emailEnabled = args.emailEnabled;
    if (args.pushEnabled !== undefined) updateData.pushEnabled = args.pushEnabled;
    if (args.renewalReminders !== undefined) updateData.renewalReminders = args.renewalReminders;
    
    // Premium-only features - enforce gating
    if (user.tier === "premium_user") {
      if (args.priceChangeAlerts !== undefined) updateData.priceChangeAlerts = args.priceChangeAlerts;
      if (args.spendingAlerts !== undefined) updateData.spendingAlerts = args.spendingAlerts;
      if (args.spendingThreshold !== undefined) updateData.spendingThreshold = args.spendingThreshold;
    } else {
      // Force disable premium features for free users
      updateData.priceChangeAlerts = false;
      updateData.spendingAlerts = false;
      updateData.spendingThreshold = undefined;
    }
    
    if (args.reminderDays !== undefined) updateData.reminderDays = args.reminderDays;

    if (existingPreferences) {
      // Update existing preferences
      await ctx.db.patch(existingPreferences._id, updateData);
      return existingPreferences._id;
    } else {
      // Create new preferences with defaults
      const preferencesId = await ctx.db.insert("notificationPreferences", {
        ...updateData,
        emailEnabled: updateData.emailEnabled ?? true,
        pushEnabled: updateData.pushEnabled ?? true,
        renewalReminders: updateData.renewalReminders ?? true,
        priceChangeAlerts: updateData.priceChangeAlerts ?? false,
        spendingAlerts: updateData.spendingAlerts ?? false,
        reminderDays: updateData.reminderDays ?? [7, 3, 1],
        createdAt: now,
      });
      return preferencesId;
    }
  },
});

// Initialize default notification preferences for new users
export const initializeNotificationPreferences = mutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // Check if preferences already exist
    const existingPreferences = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    if (existingPreferences) {
      return existingPreferences._id; // Already exists
    }

    const now = Date.now();
    const isPremium = user.tier === "premium_user";

    const preferencesId = await ctx.db.insert("notificationPreferences", {
      userId: user._id,
      emailEnabled: true,
      pushEnabled: true,
      renewalReminders: true,
      priceChangeAlerts: isPremium, // Premium only
      spendingAlerts: isPremium, // Premium only
      reminderDays: [7, 3, 1],
      spendingThreshold: undefined,
      createdAt: now,
      updatedAt: now,
    });

    return preferencesId;
  },
});

// Get notification history for a user
export const getNotificationHistory = query({
  args: { 
    clerkId: v.string(),
    limit: v.optional(v.number()),
    unreadOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      return [];
    }

    let query = ctx.db
      .query("notificationHistory")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc");

    if (args.unreadOnly) {
      query = ctx.db
        .query("notificationHistory")
        .withIndex("by_user_read", (q) => q.eq("userId", user._id).eq("read", false))
        .order("desc");
    }

    const notifications = await query.take(args.limit ?? 50);
    return notifications;
  },
});

// Mark notification as read
export const markNotificationAsRead = mutation({
  args: { 
    clerkId: v.string(),
    notificationId: v.id("notificationHistory"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const notification = await ctx.db.get(args.notificationId);
    if (!notification || notification.userId !== user._id) {
      throw new Error("Notification not found or unauthorized");
    }

    await ctx.db.patch(args.notificationId, { read: true });
    return args.notificationId;
  },
});

// Mark all notifications as read
export const markAllNotificationsAsRead = mutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const unreadNotifications = await ctx.db
      .query("notificationHistory")
      .withIndex("by_user_read", (q) => q.eq("userId", user._id).eq("read", false))
      .collect();

    // Mark all as read
    for (const notification of unreadNotifications) {
      await ctx.db.patch(notification._id, { read: true });
    }

    return { updatedCount: unreadNotifications.length };
  },
});

// Add notification to history (used by notification system)
export const addNotificationToHistory = mutation({
  args: {
    clerkId: v.string(),
    type: v.string(),
    title: v.string(),
    message: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const notificationId = await ctx.db.insert("notificationHistory", {
      userId: user._id,
      type: args.type,
      title: args.title,
      message: args.message,
      read: false,
      metadata: args.metadata,
      createdAt: Date.now(),
    });

    return notificationId;
  },
});

// Get unread notification count
export const getUnreadNotificationCount = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      return 0;
    }

    const unreadNotifications = await ctx.db
      .query("notificationHistory")
      .withIndex("by_user_read", (q) => q.eq("userId", user._id).eq("read", false))
      .collect();

    return unreadNotifications.length;
  },
});
