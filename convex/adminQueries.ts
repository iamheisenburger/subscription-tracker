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
 * Find Fortect receipts for debugging
 */
export const findFortectReceipts = query({
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

    const allReceipts = await ctx.db
      .query("emailReceipts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const fortectReceipts = allReceipts.filter((r) => 
      (r.subject && r.subject.toLowerCase().includes("fortect")) ||
      (r.merchantName && r.merchantName.toLowerCase().includes("fortect")) ||
      (r.from && r.from.toLowerCase().includes("fortect"))
    );

    return fortectReceipts.map((r) => ({
      _id: r._id,
      merchantName: r.merchantName,
      subject: r.subject?.substring(0, 100),
      from: r.from,
      amount: r.amount,
      parsed: r.parsed,
      receivedAt: r.receivedAt,
    }));
  },
});

/**
 * Get detection queue stats (for monitoring)
 * Per COST_SAFETY_AND_UNIT_ECONOMICS.md
 */
export const getDetectionQueueStats = query({
  args: {},
  handler: async (ctx) => {
    // Count receipts needing detection (not linked to subscriptions or candidates)
    const queueSize = await ctx.db
      .query("emailReceipts")
      .filter((q) =>
        q.and(
          q.eq(q.field("parsed"), true),
          q.eq(q.field("subscriptionId"), undefined),
          q.eq(q.field("detectionCandidateId"), undefined),
          q.gte(q.field("parsingConfidence"), 0.6)
        )
      )
      .collect();

    return {
      queueSize: queueSize.length,
      timestamp: Date.now(),
      warning: queueSize.length >= 150 ? "Queue size exceeds threshold (150) - safe mode should trigger" : null,
    };
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

    // LIMIT to 500 receipts to prevent 16MB query error
    const receipts = await ctx.db
      .query("emailReceipts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .take(500);

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

/**
 * Find user by internal ID
 */
export const findUserByInternalId = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return null;
    }
    return {
      _id: user._id,
      clerkId: user.clerkId,
      email: user.email,
      tier: user.tier,
      emailConnectionsUsedLifetime: user.emailConnectionsUsedLifetime,
    };
  },
});

/**
 * Get database statistics (admin debug)
 */
export const getDbStats = query({
  handler: async (ctx) => {
    const allReceipts = await ctx.db.query("emailReceipts").take(300);
    const allConnections = await ctx.db.query("emailConnections").collect();
    const allCandidates = await ctx.db.query("detectionCandidates").collect();
    const allSubscriptions = await ctx.db.query("subscriptions").collect();

    // Analyze receipts
    const parsed = allReceipts.filter(r => r.parsed === true);
    const parsedWithData = parsed.filter(r => r.merchantName && r.amount);
    const parsedButBroken = parsed.filter(r => !r.merchantName || !r.amount);
    const unparsed = allReceipts.filter(r => !r.parsed);

    // Get user IDs from receipts
    const userIdsSet = new Set(allReceipts.map(r => r.userId));
    const userIds = Array.from(userIdsSet);

    // Get user info for connection owners
    const connectionUserIds = allConnections.map(c => c.userId);
    const connectionUsers = await Promise.all(
      connectionUserIds.map(async (userId) => {
        const user = await ctx.db.get(userId);
        return user ? {
          userId: user._id,
          clerkId: user.clerkId,
          email: user.email,
          tier: user.tier,
        } : { userId, clerkId: "DELETED", email: "DELETED", tier: "DELETED" };
      })
    );

    // Sample receipts
    const sampleParsedGood = parsedWithData[0];
    const sampleParsedBroken = parsedButBroken[0];

    return {
      receipts: {
        total: allReceipts.length,
        parsed: parsed.length,
        parsedWithData: parsedWithData.length,
        parsedButBroken: parsedButBroken.length,
        unparsed: unparsed.length,
        uniqueUserIds: userIds.length,
        userIds: userIds,
        sampleGood: sampleParsedGood ? {
          userId: sampleParsedGood.userId,
          merchantName: sampleParsedGood.merchantName,
          amount: sampleParsedGood.amount,
          parsed: sampleParsedGood.parsed,
        } : null,
        sampleBroken: sampleParsedBroken ? {
          userId: sampleParsedBroken.userId,
          subject: sampleParsedBroken.subject?.substring(0, 50),
          merchantName: sampleParsedBroken.merchantName,
          amount: sampleParsedBroken.amount,
          parsed: sampleParsedBroken.parsed,
        } : null,
      },
      connections: {
        total: allConnections.length,
        byUser: allConnections.map(c => ({
          userId: c.userId,
          email: c.email,
          status: c.status,
          totalEmailsScanned: c.totalEmailsScanned,
          totalReceiptsFound: c.totalReceiptsFound,
        })),
        owners: connectionUsers,
      },
      candidates: {
        total: allCandidates.length,
      },
      subscriptions: {
        total: allSubscriptions.length,
      },
    };
  },
});
