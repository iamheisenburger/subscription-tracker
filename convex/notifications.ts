import { v } from "convex/values";
import { mutation, query, internalMutation, internalQuery, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

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
    const updateData: Record<string, unknown> = {
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
      // Premium users can customize reminder days
      if (args.reminderDays !== undefined) updateData.reminderDays = args.reminderDays;
    } else {
      // Force disable premium features for free users
      updateData.priceChangeAlerts = false;
      updateData.spendingAlerts = false;
      updateData.spendingThreshold = undefined;
      // Force free users to use only 3-day reminders
      updateData.reminderDays = [3];
    }

    if (existingPreferences) {
      // Update existing preferences
      await ctx.db.patch(existingPreferences._id, updateData);
      return existingPreferences._id;
    } else {
      // Create new preferences with defaults
      const preferencesId = await ctx.db.insert("notificationPreferences", {
        userId: user._id,
        emailEnabled: (updateData.emailEnabled as boolean) ?? true,
        pushEnabled: (updateData.pushEnabled as boolean) ?? true,
        renewalReminders: (updateData.renewalReminders as boolean) ?? true,
        priceChangeAlerts: (updateData.priceChangeAlerts as boolean) ?? false,
        spendingAlerts: (updateData.spendingAlerts as boolean) ?? false,
        reminderDays: (updateData.reminderDays as number[]) ?? [7, 3, 1],
        spendingThreshold: updateData.spendingThreshold as number | undefined,
        createdAt: now,
        updatedAt: now,
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

// Add notification to history (public version for API)
export const addNotificationToHistory = mutation({
  args: {
    clerkId: v.string(),
    type: v.string(),
    title: v.string(),
    message: v.string(),
    metadata: v.optional(v.record(v.string(), v.any())),
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

// Add notification to history (internal version for cron jobs)
export const addNotificationToHistoryInternal = internalMutation({
  args: {
    clerkId: v.string(),
    type: v.string(),
    title: v.string(),
    message: v.string(),
    metadata: v.optional(v.record(v.string(), v.any())),
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

// ================================
// SCHEDULING & QUEUE PROCESSING
// ================================

// Generate renewal reminders for all users (called by cron job)
export const generateRenewalReminders = internalMutation({
  handler: async (ctx) => {
    console.log("🔔 Starting renewal reminder generation...");
    
    // Get all users with notification preferences
    const users = await ctx.db.query("users").collect();
    let scheduledCount = 0;
    
    for (const user of users) {
      try {
        // Get user's notification preferences
        const preferences = await ctx.db
          .query("notificationPreferences")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .unique();
        
        // Skip if user disabled renewal reminders or email notifications
        if (!preferences?.renewalReminders || !preferences?.emailEnabled) {
          continue;
        }
        
        // Get user's active subscriptions
        const subscriptions = await ctx.db
          .query("subscriptions")
          .withIndex("by_user_active", (q) => q.eq("userId", user._id).eq("isActive", true))
          .collect();
        
        // Group subscriptions by renewal day to send consolidated emails
        const reminderGroups: Record<number, Array<{ subscription: any; daysUntil: number }>> = {};
        
        for (const subscription of subscriptions) {
          const renewalDate = new Date(subscription.nextBillingDate);
          const now = new Date();
          
          // Calculate days until renewal
          const timeDiff = renewalDate.getTime() - now.getTime();
          const daysUntil = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
          
          // Check if this matches any reminder day
          for (const reminderDay of preferences.reminderDays) {
            if (daysUntil === reminderDay) {
              if (!reminderGroups[reminderDay]) {
                reminderGroups[reminderDay] = [];
              }
              reminderGroups[reminderDay].push({ subscription, daysUntil });
            }
          }
        }

        // Send consolidated emails for each reminder day
        for (const [reminderDay, subscriptionsToRemind] of Object.entries(reminderGroups)) {
          const daysUntil = parseInt(reminderDay);
          
          // Check if we already sent a reminder for this day
          const existingReminderForDay = await ctx.db
            .query("notificationQueue")
            .withIndex("by_user_type", (q) => q.eq("userId", user._id).eq("type", "renewal_reminder"))
            .filter((q) => 
              q.and(
                q.eq(q.field("status"), "pending"),
                q.eq(q.field("emailData.templateData.daysUntil"), daysUntil)
              )
            )
            .unique();

          if (!existingReminderForDay) {
            // Calculate total cost for all renewals
            let totalCost = 0;
            const userCurrency = user.preferredCurrency || 'USD';
            
            for (const { subscription } of subscriptionsToRemind) {
              // Convert to user's preferred currency here if needed
              totalCost += subscription.cost; // Will implement currency conversion
            }

            const now = new Date();
            const multiple = subscriptionsToRemind.length > 1;
            
            const subject = multiple 
              ? `${subscriptionsToRemind.length} subscriptions renew ${daysUntil === 1 ? 'tomorrow' : `in ${daysUntil} days`}`
              : `${subscriptionsToRemind[0].subscription.name} renews ${daysUntil === 1 ? 'tomorrow' : `in ${daysUntil} days`}`;

            // Schedule consolidated reminder
            await ctx.db.insert("notificationQueue", {
              userId: user._id,
              type: "renewal_reminder",
              scheduledFor: now.getTime() + (5 * 60 * 1000), // Send in 5 minutes
              status: "pending",
              emailData: {
                subject,
                template: "renewal_reminder",
                templateData: {
                  userName: user.email?.split('@')[0] || 'there',
                  daysUntil,
                  multiple,
                  subscriptions: subscriptionsToRemind.map(({ subscription }) => ({
                    name: subscription.name,
                    cost: subscription.cost,
                    currency: subscription.currency || 'USD',
                    billingCycle: subscription.billingCycle,
                    category: subscription.category,
                  })),
                  totalCost,
                  userCurrency,
                  subscriptionCount: subscriptionsToRemind.length,
                },
              },
              attempts: 0,
              createdAt: now.getTime(),
            });
            
            scheduledCount++;
            console.log(`📅 Scheduled consolidated renewal reminder for ${user.email} - ${subscriptionsToRemind.length} subscription(s) (${daysUntil} days)`);
          }
        }
      } catch (error) {
        console.error(`❌ Error processing user ${user.email}:`, error);
      }
    }
    
    console.log(`✅ Renewal reminder generation complete. Scheduled ${scheduledCount} reminders.`);
    return { scheduledCount };
  },
});

// Test notification system - send test email to user
export const sendTestNotification = mutation({
  args: { 
    clerkId: v.string(),
    type: v.union(v.literal("renewal_reminder"), v.literal("spending_alert"), v.literal("test"))
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
    let emailData;

    switch (args.type) {
      case "renewal_reminder":
        emailData = {
          subject: "🧪 TEST: Subscription Renewal Reminder",
          template: "renewal_reminder",
          templateData: {
            userName: user.email?.split('@')[0] || 'there',
            subscriptionName: "Test Subscription",
            cost: 9.99,
            currency: "USD",
            billingCycle: "monthly",
            daysUntil: 3,
            category: "Test"
          }
        };
        break;
      
      case "spending_alert":
        emailData = {
          subject: "🧪 TEST: Monthly Spending Alert",
          template: "spending_alert", 
          templateData: {
            userName: user.email?.split('@')[0] || 'there',
            currentSpending: 125.00,
            threshold: 100.00,
            currency: "USD",
            percentageOfThreshold: 125,
            overspent: true
          }
        };
        break;

      default:
        emailData = {
          subject: "🧪 TEST: SubWise Notification System",
          template: "test_notification",
          templateData: {
            userName: user.email?.split('@')[0] || 'there',
            message: "Your notification system is working correctly!"
          }
        };
    }

    // Add to notification queue for immediate processing
    const queueId = await ctx.db.insert("notificationQueue", {
      userId: user._id,
      type: args.type,
      scheduledFor: now + (10 * 1000), // Send in 10 seconds
      status: "pending",
      emailData,
      attempts: 0,
      createdAt: now,
    });

    return { 
      message: `Test ${args.type} notification scheduled`, 
      queueId,
      willSendTo: user.email 
    };
  },
});

// Process the notification queue (called by cron job every 5 minutes)
export const processNotificationQueue = internalAction({
  handler: async (ctx) => {
    console.log("🔄 Processing notification queue...");
    
    const now = Date.now();
    
    // Get pending notifications that are ready to be sent
    const pendingNotifications = await ctx.runQuery(internal.notifications.getPendingNotifications, {
      scheduledBefore: now,
      limit: 50, // Process up to 50 notifications per run
    });
    
    let processedCount = 0;
    let successCount = 0;
    let failedCount = 0;
    
    for (const notification of pendingNotifications) {
      try {
        processedCount++;
        
        // Get user and subscription data
        const user = await ctx.runQuery(internal.notifications.getUserById, {
          userId: notification.userId,
        });
        
        const subscription = notification.subscriptionId 
          ? await ctx.runQuery(internal.notifications.getSubscriptionById, {
              subscriptionId: notification.subscriptionId,
            })
          : null;
        
        if (!user) {
          console.error(`❌ User not found for notification ${notification._id}`);
          await ctx.runMutation(internal.notifications.updateNotificationStatus, {
            notificationId: notification._id,
            status: "failed",
            errorMessage: "User not found",
          });
          failedCount++;
          continue;
        }
        
        // Send the email via external API
        const emailResult = await ctx.runAction(internal.notifications.sendNotificationEmail, {
          userId: user.clerkId,
          subscriptionId: notification.subscriptionId,
          type: notification.type,
          emailData: notification.emailData,
        });
        
        if (emailResult.success) {
          // Mark as sent and add to history
          await ctx.runMutation(internal.notifications.updateNotificationStatus, {
            notificationId: notification._id,
            status: "sent",
          });
          
          await ctx.runMutation(internal.notifications.addNotificationToHistoryInternal, {
            clerkId: user.clerkId,
            type: notification.type,
            title: notification.emailData?.subject || "Notification",
            message: getNotificationMessage(notification.type, subscription?.name || "Subscription", notification.emailData?.templateData || {}),
            metadata: {
              subscriptionId: notification.subscriptionId,
              emailMessageId: emailResult.messageId,
            },
          });
          
          successCount++;
          console.log(`✅ Sent ${notification.type} to ${user.email}`);
        } else {
          // Handle failure with retry logic
          const newAttempts = notification.attempts + 1;
          const maxAttempts = 3;
          
          if (newAttempts >= maxAttempts) {
            await ctx.runMutation(internal.notifications.updateNotificationStatus, {
              notificationId: notification._id,
              status: "failed",
              errorMessage: emailResult.error || "Maximum retry attempts reached",
            });
            failedCount++;
            console.error(`❌ Failed ${notification.type} to ${user.email} after ${maxAttempts} attempts: ${emailResult.error}`);
          } else {
            // Schedule retry with exponential backoff
            const retryDelay = Math.pow(2, newAttempts) * 10 * 60 * 1000; // 10min, 20min, 40min
            await ctx.runMutation(internal.notifications.updateNotificationStatus, {
              notificationId: notification._id,
              status: "pending",
              scheduledFor: now + retryDelay,
              attempts: newAttempts,
              errorMessage: emailResult.error,
            });
            console.log(`⏳ Retrying ${notification.type} to ${user.email} in ${retryDelay / 60000} minutes (attempt ${newAttempts})`);
          }
        }
      } catch (error) {
        console.error(`❌ Error processing notification ${notification._id}:`, error);
        await ctx.runMutation(internal.notifications.updateNotificationStatus, {
          notificationId: notification._id,
          status: "failed",
          errorMessage: error instanceof Error ? error.message : "Unknown error",
        });
        failedCount++;
      }
    }
    
    console.log(`✅ Queue processing complete. Processed: ${processedCount}, Success: ${successCount}, Failed: ${failedCount}`);
    return { processedCount, successCount, failedCount };
  },
});

// Check spending thresholds for PREMIUM users (Smart Alerts - Premium Feature)
export const checkSpendingThresholds = internalMutation({
  handler: async (ctx) => {
    console.log("💰 Checking spending thresholds for premium users...");
    
    // Get premium users only (Smart Alerts are premium feature per project rules)
    const premiumUsers = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tier"), "premium_user"))
      .collect();
    
    let alertsScheduled = 0;
    
    for (const user of premiumUsers) {
      try {
        const preferences = await ctx.db
          .query("notificationPreferences")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .unique();
        
        if (!preferences?.spendingAlerts || !preferences?.emailEnabled || !preferences?.spendingThreshold) {
          continue;
        }
        
        // Calculate current month spending
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        
        const subscriptions = await ctx.db
          .query("subscriptions")
          .withIndex("by_user_active", (q) => q.eq("userId", user._id).eq("isActive", true))
          .collect();
        
        let monthlySpending = 0;
        
        for (const sub of subscriptions) {
          // Calculate how much this subscription costs per month
          let monthlyCost = sub.cost;
          if (sub.billingCycle === "yearly") {
            monthlyCost = sub.cost / 12;
          } else if (sub.billingCycle === "weekly") {
            monthlyCost = sub.cost * 4.33; // Average weeks per month
          }
          monthlySpending += monthlyCost;
        }
        
        // Check if spending exceeds threshold or is approaching (80%+)
        const thresholdPercentage = (monthlySpending / preferences.spendingThreshold) * 100;
        const shouldAlert = thresholdPercentage >= 80; // Alert at 80% and above
        
        if (shouldAlert) {
          // Check if we already sent an alert this month
          const existingAlert = await ctx.db
            .query("notificationQueue")
            .withIndex("by_user_type", (q) => q.eq("userId", user._id).eq("type", "spending_alert"))
            .filter((q) => 
              q.and(
                q.gte(q.field("createdAt"), startOfMonth.getTime()),
                q.lte(q.field("createdAt"), endOfMonth.getTime())
              )
            )
            .unique();
          
          if (!existingAlert) {
            // Schedule spending alert
            await ctx.db.insert("notificationQueue", {
              userId: user._id,
              type: "spending_alert",
              scheduledFor: now.getTime() + (5 * 60 * 1000), // Send in 5 minutes
              status: "pending",
              emailData: {
                subject: monthlySpending > preferences.spendingThreshold
                  ? `Spending Alert: You've exceeded your monthly budget`
                  : `Spending Alert: You're at ${Math.round(thresholdPercentage)}% of your monthly budget`,
                template: "spending_alert",
                templateData: {
                  currentSpending: monthlySpending,
                  threshold: preferences.spendingThreshold,
                  currency: user.preferredCurrency || "USD", // Use user's preferred currency
                  period: "month",
                  percentageOfThreshold: Math.round(thresholdPercentage),
                  overspent: monthlySpending > preferences.spendingThreshold,
                },
              },
              attempts: 0,
              createdAt: now.getTime(),
            });
            
            alertsScheduled++;
            console.log(`💰 Scheduled spending alert for ${user.email} - $${monthlySpending.toFixed(2)}/${preferences.spendingThreshold} (${Math.round(thresholdPercentage)}%)`);
          }
        }
      } catch (error) {
        console.error(`❌ Error checking spending for user ${user.email}:`, error);
      }
    }
    
    console.log(`✅ Spending threshold check complete. Scheduled ${alertsScheduled} alerts.`);
    return { alertsScheduled };
  },
});

// Cleanup old notifications (called weekly by cron job)
export const cleanupOldNotifications = internalMutation({
  handler: async (ctx) => {
    console.log("🧹 Cleaning up old notifications...");
    
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const sixMonthsAgo = Date.now() - (6 * 30 * 24 * 60 * 60 * 1000);
    
    // Delete old queue items (sent/failed older than 30 days)
    const oldQueueItems = await ctx.db
      .query("notificationQueue")
      .withIndex("by_status", (q) => q.eq("status", "sent"))
      .filter((q) => q.lt(q.field("createdAt"), thirtyDaysAgo))
      .collect();
    
    const oldFailedItems = await ctx.db
      .query("notificationQueue")
      .withIndex("by_status", (q) => q.eq("status", "failed"))
      .filter((q) => q.lt(q.field("createdAt"), thirtyDaysAgo))
      .collect();
    
    let deletedQueueCount = 0;
    for (const item of [...oldQueueItems, ...oldFailedItems]) {
      await ctx.db.delete(item._id);
      deletedQueueCount++;
    }
    
    // Delete old notification history (older than 6 months)
    const oldHistory = await ctx.db
      .query("notificationHistory")
      .withIndex("by_created", (q) => q.lt("createdAt", sixMonthsAgo))
      .collect();
    
    let deletedHistoryCount = 0;
    for (const history of oldHistory) {
      await ctx.db.delete(history._id);
      deletedHistoryCount++;
    }
    
    console.log(`✅ Cleanup complete. Deleted ${deletedQueueCount} queue items and ${deletedHistoryCount} history items.`);
    return { deletedQueueCount, deletedHistoryCount };
  },
});

// ================================
// INTERNAL HELPER FUNCTIONS
// ================================

// Get pending notifications ready to be sent
export const getPendingNotifications = internalQuery({
  args: {
    scheduledBefore: v.number(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("notificationQueue")
      .withIndex("by_scheduled", (q) => q.lte("scheduledFor", args.scheduledBefore))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .order("asc")
      .take(args.limit ?? 50);
  },
});

// Get user by ID
export const getUserById = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

// Get subscription by ID
export const getSubscriptionById = internalQuery({
  args: { subscriptionId: v.id("subscriptions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.subscriptionId);
  },
});

// Update notification status
export const updateNotificationStatus = internalMutation({
  args: {
    notificationId: v.id("notificationQueue"),
    status: v.union(v.literal("pending"), v.literal("sent"), v.literal("failed"), v.literal("cancelled")),
    scheduledFor: v.optional(v.number()),
    attempts: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updateData: Record<string, unknown> = {
      status: args.status,
      lastAttempt: Date.now(),
    };
    
    if (args.scheduledFor !== undefined) updateData.scheduledFor = args.scheduledFor;
    if (args.attempts !== undefined) updateData.attempts = args.attempts;
    if (args.errorMessage !== undefined) updateData.errorMessage = args.errorMessage;
    
    await ctx.db.patch(args.notificationId, updateData);
    return args.notificationId;
  },
});

// Send notification email (calls external API)
export const sendNotificationEmail = internalAction({
  args: {
    userId: v.string(), // clerkId
    subscriptionId: v.optional(v.id("subscriptions")),
    type: v.string(),
    emailData: v.optional(v.record(v.string(), v.any())),
  },
  handler: async (ctx, args) => {
    try {
      // Resolve site URL for calling Next API from Convex
      const siteUrl =
        process.env.SITE_URL ||
        process.env.PUBLIC_SITE_URL ||
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);

      if (!siteUrl) {
        return { success: false, error: 'SITE_URL not configured on Convex environment' };
      }

      // Call our email API with INTERNAL bearer and clerkId
      const response = await fetch(`${siteUrl}/api/notifications/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Use internal API key or bypass auth for internal calls
          'Authorization': `Bearer ${process.env.INTERNAL_API_KEY || 'internal'}`,
        },
        body: JSON.stringify({
          type: args.type,
          subscriptionId: args.subscriptionId,
          clerkId: args.userId,
          ...args.emailData?.templateData,
        }),
      });
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Failed to send notification email:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  },
});

// Helper function to generate notification messages
function getNotificationMessage(type: string, subscriptionName: string, data: Record<string, unknown>): string {
  switch (type) {
    case 'renewal_reminder':
      const days = (data.daysUntil as number) || 3;
      return `${subscriptionName} renews ${days === 1 ? 'tomorrow' : `in ${days} days`}`;
    case 'spending_alert':
      const currentSpending = (data.currentSpending as number) || 0;
      const threshold = (data.threshold as number) || 0;
      return `Current spending: $${currentSpending.toFixed(2)} (${Math.round((currentSpending / threshold) * 100)}% of budget)`;
    case 'price_change':
      return `${subscriptionName} price changed`;
    default:
      return 'You have a new notification';
  }
}
