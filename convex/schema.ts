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
});

