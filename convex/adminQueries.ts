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

/**
 * Detection queue stats (receipts still needing detection)
 */
export const getDetectionQueueStats = query({
  handler: async (ctx) => {
    const queue = await ctx.db
      .query("emailReceipts")
      .filter((q) =>
        q.and(
          q.eq(q.field("parsed"), true),
          q.eq(q.field("detectionCandidateId"), undefined),
          q.eq(q.field("subscriptionId"), undefined),
          q.gte(q.field("parsingConfidence"), 0.6)
        )
      )
      .take(500);

    const byUser = new Map<string, number>();
    for (const r of queue) {
      const key = String(r.userId);
      byUser.set(key, (byUser.get(key) || 0) + 1);
    }

    return {
      totalNeedingDetection: queue.length,
      users: Array.from(byUser.entries()).map(([userId, count]) => ({ userId, count })),
      sample: queue.slice(0, 5).map((r) => ({
        _id: r._id,
        userId: r.userId,
        merchantName: r.merchantName,
        amount: r.amount,
        parsingConfidence: r.parsingConfidence,
      })),
    };
  },
});

/**
 * Get user scan stats: cooldowns, connection health, and recent costs
 */
export const getUserScanStats = query({
  args: {
    clerkUserId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkUserId))
      .first();
    if (!user) {
      return null;
    }
    const connections = await ctx.db
      .query("emailConnections")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    const connectionStats = connections.map((c) => ({
      connectionId: c._id,
      email: c.email,
      status: c.status,
      lastSyncedAt: c.lastSyncedAt,
      lastScannedInternalDate: c.lastScannedInternalDate,
      lastManualScanAt: c.lastManualScanAt,
      nextEligibleManualScanAt: c.nextEligibleManualScanAt,
    }));
    const rawSessions = await ctx.db
      .query("scanSessions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    const sessions = rawSessions
      .sort((a, b) => (b.startedAt || 0) - (a.startedAt || 0))
      .slice(0, Math.min(args.limit ?? 10, 50))
      .map((s) => ({
        sessionId: s._id,
        type: s.type,
        status: s.status,
        startedAt: s.startedAt,
        completedAt: s.completedAt,
        tokensUsed: s.stats?.tokensUsed ?? 0,
        apiCost: s.stats?.apiCost ?? 0,
        processingTimeMs: s.stats?.processingTimeMs ?? 0,
      }));
    return {
      connections: connectionStats,
      sessions,
    };
  },
});