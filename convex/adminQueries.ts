/**
 * Admin Query Functions
 */

import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get all users - for finding Clerk ID
 */
export const getAllUsers = query({
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return users.map((u) => ({
      clerkId: u.clerkId,
      email: u.email,
      tier: u.tier,
      emailConnectionsUsedLifetime: u.emailConnectionsUsedLifetime,
    }));
  },
});

/**
 * Get all email receipts for a user (for debugging)
 */
export const getUserEmailReceipts = query({
  args: {
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkUserId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const receipts = await ctx.db
      .query("emailReceipts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return receipts.map((r) => ({
      _id: r._id,
      messageId: r.messageId,
      from: r.from,
      subject: r.subject,
      receivedAt: r.receivedAt,
      merchantName: r.merchantName,
      amount: r.amount,
      currency: r.currency,
      billingCycle: r.billingCycle,
      nextChargeDate: r.nextChargeDate,
      parsed: r.parsed,
      parsingConfidence: r.parsingConfidence,
      rawBodyLength: r.rawBody?.length || 0,
      rawBodyPreview: r.rawBody?.substring(0, 200) || "(empty)",
    }));
  },
});

/**
 * Get all detection candidates for a user (for debugging)
 */
export const getUserDetectionCandidates = query({
  args: {
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkUserId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const candidates = await ctx.db
      .query("detectionCandidates")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return candidates.map((c) => ({
      _id: c._id,
      proposedName: c.proposedName,
      proposedAmount: c.proposedAmount,
      proposedCurrency: c.proposedCurrency,
      proposedCadence: c.proposedCadence,
      proposedNextBilling: c.proposedNextBilling,
      confidence: c.confidence,
      detectionReason: c.detectionReason,
      status: c.status,
      source: c.source,
      rawData: c.rawData,
      createdAt: c.createdAt,
    }));
  },
});
