/**
 * Convex Functions: Subscription Detection Engine (Email-Only)
 * Handles detection candidates from email receipt parsing
 */

import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";

/**
 * Get pending detection candidates for a user
 */
export const getPendingCandidates = query({
  args: {
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkUserId))
      .first();

    if (!user) {
      return [];
    }

    // Get pending candidates
    const candidates = await ctx.db
      .query("detectionCandidates")
      .withIndex("by_user_status", (q) => q.eq("userId", user._id).eq("status", "pending"))
      .order("desc")
      .collect();

    // Enrich with merchant data
    const enriched = await Promise.all(
      candidates.map(async (candidate) => {
        const merchant = candidate.merchantId ? await ctx.db.get(candidate.merchantId) : null;
        return {
          ...candidate,
          merchant,
        };
      })
    );

    return enriched;
  },
});

/**
 * Accept a detection candidate (create subscription)
 */
export const acceptCandidate = mutation({
  args: {
    candidateId: v.id("detectionCandidates"),
    clerkUserId: v.string(),
    overrides: v.optional(
      v.object({
        name: v.optional(v.string()),
        amount: v.optional(v.number()),
        cadence: v.optional(v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly"), v.literal("yearly"))),
        nextBilling: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Get candidate
    const candidate = await ctx.db.get(args.candidateId);
    if (!candidate) {
      throw new Error("Candidate not found");
    }

    // Verify ownership
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkUserId))
      .first();

    if (!user || user._id !== candidate.userId) {
      throw new Error("Unauthorized");
    }

    // Get merchant for category/description
    const merchant = candidate.merchantId ? await ctx.db.get(candidate.merchantId) : null;

    // Create subscription with overrides
    const subscriptionId = await ctx.db.insert("subscriptions", {
      userId: user._id,
      name: args.overrides?.name || candidate.proposedName,
      cost: args.overrides?.amount || candidate.proposedAmount,
      currency: candidate.proposedCurrency,
      billingCycle: args.overrides?.cadence || candidate.proposedCadence,
      nextBillingDate: args.overrides?.nextBilling || candidate.proposedNextBilling,
      category: merchant?.knownProviderKey || "Other",
      isActive: true,
      source: "detected",
      detectionConfidence: candidate.confidence,
      merchantId: candidate.merchantId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Update candidate status
    await ctx.db.patch(args.candidateId, {
      status: "accepted",
      acceptedSubscriptionId: subscriptionId,
      reviewedAt: Date.now(),
    });

    // Log audit event
    await ctx.db.insert("auditLogs", {
      userId: user._id,
      action: "subscription_detected_accepted",
      resourceType: "subscription",
      resourceId: subscriptionId,
      metadata: {
        candidateId: args.candidateId,
        confidence: candidate.confidence,
        merchantName: candidate.proposedName,
      },
      createdAt: Date.now(),
    });

    return subscriptionId;
  },
});

/**
 * Dismiss a detection candidate
 */
export const dismissCandidate = mutation({
  args: {
    candidateId: v.id("detectionCandidates"),
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get candidate
    const candidate = await ctx.db.get(args.candidateId);
    if (!candidate) {
      throw new Error("Candidate not found");
    }

    // Verify ownership
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkUserId))
      .first();

    if (!user || user._id !== candidate.userId) {
      throw new Error("Unauthorized");
    }

    // Update status
    await ctx.db.patch(args.candidateId, {
      status: "dismissed",
      reviewedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Detect price changes for existing subscriptions
 * Called periodically via cron (currently disabled for email-only mode)
 */
export const detectPriceChanges = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Price change detection is disabled in email-only mode
    // This would require bank transaction data to detect price changes automatically
    console.log("[Price Detection] Skipped - email-only mode");
    return { detected: 0 };
  },
});
