import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    // Clerk user ID
    clerkId: v.string(),
    email: v.string(),
    tier: v.union(v.literal("free_user"), v.literal("premium_user")),
    subscriptionLimit: v.number(),
    premiumExpiresAt: v.optional(v.number()),
    trialEndsAt: v.optional(v.number()),
    // Track subscription type for premium users
    subscriptionType: v.optional(v.union(v.literal("monthly"), v.literal("annual"))),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"]),

  subscriptions: defineTable({
    userId: v.id("users"),
    name: v.string(),
    cost: v.number(),
    currency: v.string(),
    billingCycle: v.union(
      v.literal("monthly"), 
      v.literal("yearly"), 
      v.literal("weekly")
    ),
    nextBillingDate: v.number(),
    category: v.optional(v.string()),
    description: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_active", ["userId", "isActive"])
    .index("by_next_billing", ["nextBillingDate"]),

  categories: defineTable({
    userId: v.id("users"),
    name: v.string(),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"]),

  // Notification system tables
  notificationPreferences: defineTable({
    userId: v.id("users"),
    emailEnabled: v.boolean(),
    pushEnabled: v.boolean(),
    renewalReminders: v.boolean(),
    priceChangeAlerts: v.boolean(),
    spendingAlerts: v.boolean(),
    reminderDays: v.array(v.number()), // [7, 3, 1]
    spendingThreshold: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"]),

  notificationQueue: defineTable({
    userId: v.id("users"),
    subscriptionId: v.optional(v.id("subscriptions")),
    type: v.union(
      v.literal("renewal_reminder"),
      v.literal("price_change"),
      v.literal("spending_alert"),
      v.literal("trial_expiry")
    ),
    scheduledFor: v.number(), // timestamp
    status: v.union(
      v.literal("pending"),
      v.literal("sent"),
      v.literal("failed"),
      v.literal("cancelled")
    ),
    emailData: v.optional(v.object({
      subject: v.string(),
      template: v.string(),
      templateData: v.any(),
    })),
    attempts: v.number(),
    lastAttempt: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_scheduled", ["scheduledFor"])
    .index("by_user_type", ["userId", "type"]),

  notificationHistory: defineTable({
    userId: v.id("users"),
    type: v.string(),
    title: v.string(),
    message: v.string(),
    read: v.boolean(),
    metadata: v.optional(v.any()), // Additional data (subscription info, etc.)
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_read", ["userId", "read"])
    .index("by_created", ["createdAt"]),
});

