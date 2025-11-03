import { v } from "convex/values";
import { internalMutation, internalQuery, query } from "../_generated/server";
import { Id } from "../_generated/dataModel";

/**
 * COST TRACKING & MONITORING SYSTEM
 *
 * Tracks API usage, calculates costs, and provides insights
 * for optimizing expenses and understanding usage patterns.
 *
 * Key features:
 * - Real-time cost tracking per API call
 * - Token usage monitoring
 * - Cost projections and budgeting
 * - Provider performance comparison
 * - Usage analytics and reporting
 */

// API Provider pricing (as of Jan 2025)
export const API_PRICING = {
  CLAUDE: {
    "claude-3-5-haiku-4-5": {
      inputTokens: 0.001 / 1000,  // $0.001 per 1K tokens
      outputTokens: 0.005 / 1000,  // $0.005 per 1K tokens
    },
    "claude-3-5-sonnet": {
      inputTokens: 0.003 / 1000,  // $0.003 per 1K tokens
      outputTokens: 0.015 / 1000, // $0.015 per 1K tokens
    },
  },
  OPENAI: {
    "gpt-5-nano": {
      inputTokens: 0.00015 / 1000,  // $0.00015 per 1K tokens
      outputTokens: 0.0006 / 1000,   // $0.0006 per 1K tokens
    },
    "gpt-4o": {
      inputTokens: 0.005 / 1000,   // $0.005 per 1K tokens
      outputTokens: 0.015 / 1000,  // $0.015 per 1K tokens
    },
  },
  GMAIL: {
    api_call: 0.00001, // Estimated cost per API call
  },
};

// Cost thresholds for alerting
export const COST_THRESHOLDS = {
  WARNING: 0.50,    // Warn at $0.50 per scan
  CRITICAL: 1.00,   // Alert at $1.00 per scan
  DAILY_LIMIT: 10,  // $10 daily limit
  MONTHLY_LIMIT: 100, // $100 monthly limit
};

// Metrics interface
export interface APIMetrics {
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  duration: number;
  success: boolean;
  timestamp: number;
}

export interface ScanMetrics {
  sessionId: Id<"scanSessions">;
  totalCost: number;
  tokensUsed: number;
  emailsProcessed: number;
  receiptsFound: number;
  subscriptionsDetected: number;
  duration: number;
  costPerEmail: number;
  costPerSubscription: number;
}

/**
 * Record API call and calculate cost
 */
export const recordAPICall = internalMutation({
  args: {
    sessionId: v.optional(v.id("scanSessions")),
    provider: v.string(),
    model: v.string(),
    inputTokens: v.number(),
    outputTokens: v.number(),
    duration: v.number(),
    success: v.boolean(),
    metadata: v.optional(v.record(v.string(), v.any())),
  },
  handler: async (ctx, args) => {
    // Calculate cost based on provider and model
    const cost = calculateAPIcost(
      args.provider,
      args.model,
      args.inputTokens,
      args.outputTokens
    );

    // Store API call record
    const apiCallId = await ctx.db.insert("auditLogs", {
      action: "api_call",
      userId: undefined, // System action
      metadata: {
        sessionId: args.sessionId,
        provider: args.provider,
        model: args.model,
        inputTokens: args.inputTokens,
        outputTokens: args.outputTokens,
        cost,
        duration: args.duration,
        success: args.success,
        ...args.metadata,
      },
      createdAt: Date.now(),
    });

    // Update session stats if provided
    if (args.sessionId) {
      const session = await ctx.db.get(args.sessionId);
      if (session) {
        const currentStats = session.stats || {
          totalEmailsFound: 0,
          receiptsIdentified: 0,
          subscriptionsDetected: 0,
          tokensUsed: 0,
          apiCost: 0,
          processingTimeMs: 0,
        };

        await ctx.db.patch(args.sessionId, {
          stats: {
            ...currentStats,
            tokensUsed: currentStats.tokensUsed + args.inputTokens + args.outputTokens,
            apiCost: currentStats.apiCost + cost,
            processingTimeMs: currentStats.processingTimeMs + args.duration,
          },
        });
      }
    }

    // Check cost thresholds
    if (cost > COST_THRESHOLDS.WARNING) {
      console.warn(`⚠️ High API cost: $${cost.toFixed(4)} for ${args.provider}/${args.model}`);
    }

    console.log(
      `💰 API call: ${args.provider}/${args.model} - ` +
      `${args.inputTokens + args.outputTokens} tokens = $${cost.toFixed(4)}`
    );

    return { cost, apiCallId };
  },
});

/**
 * Calculate API cost based on provider and token usage
 */
function calculateAPIcost(
  provider: string,
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = API_PRICING[provider as keyof typeof API_PRICING];
  if (!pricing) {
    console.warn(`Unknown provider: ${provider}`);
    return 0;
  }

  const modelPricing = pricing[model as keyof typeof pricing];
  if (!modelPricing) {
    console.warn(`Unknown model: ${model} for provider ${provider}`);
    return 0;
  }

  // Special case for Gmail API
  if (provider === "GMAIL") {
    return (modelPricing as any).api_call || 0;
  }

  // Calculate token-based cost
  const inputCost = inputTokens * (modelPricing as any).inputTokens;
  const outputCost = outputTokens * (modelPricing as any).outputTokens;

  return inputCost + outputCost;
}

/**
 * Get session cost breakdown
 */
export const getSessionCost = internalQuery({
  args: {
    sessionId: v.id("scanSessions"),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      return null;
    }

    const stats = session.stats || {
      totalEmailsFound: 0,
      receiptsIdentified: 0,
      subscriptionsDetected: 0,
      tokensUsed: 0,
      apiCost: 0,
      processingTimeMs: 0,
    };

    // Calculate per-unit costs
    const costPerEmail = stats.totalEmailsFound > 0
      ? stats.apiCost / stats.totalEmailsFound
      : 0;

    const costPerSubscription = stats.subscriptionsDetected > 0
      ? stats.apiCost / stats.subscriptionsDetected
      : 0;

    return {
      sessionId: args.sessionId,
      totalCost: stats.apiCost,
      tokensUsed: stats.tokensUsed,
      emailsProcessed: stats.totalEmailsFound,
      receiptsFound: stats.receiptsIdentified,
      subscriptionsDetected: stats.subscriptionsDetected,
      duration: stats.processingTimeMs,
      costPerEmail,
      costPerSubscription,
    };
  },
});

/**
 * Get user's total costs for a time period
 */
export const getUserCosts = query({
  args: {
    userId: v.id("users"),
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const startTime = args.startTime || Date.now() - 30 * 24 * 60 * 60 * 1000; // Default: last 30 days
    const endTime = args.endTime || Date.now();

    // Get user's sessions in time range
    const sessions = await ctx.db
      .query("scanSessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) =>
        q.and(
          q.gte(q.field("startedAt"), startTime),
          q.lte(q.field("startedAt"), endTime)
        )
      )
      .collect();

    let totalCost = 0;
    let totalTokens = 0;
    let totalEmails = 0;
    let totalSubscriptions = 0;

    for (const session of sessions) {
      if (session.stats) {
        totalCost += session.stats.apiCost;
        totalTokens += session.stats.tokensUsed;
        totalEmails += session.stats.totalEmailsFound;
        totalSubscriptions += session.stats.subscriptionsDetected;
      }
    }

    return {
      userId: args.userId,
      period: { startTime, endTime },
      totalCost,
      totalTokens,
      totalEmails,
      totalSubscriptions,
      sessionCount: sessions.length,
      averageCostPerSession: sessions.length > 0 ? totalCost / sessions.length : 0,
      averageCostPerEmail: totalEmails > 0 ? totalCost / totalEmails : 0,
      averageCostPerSubscription: totalSubscriptions > 0 ? totalCost / totalSubscriptions : 0,
    };
  },
});

/**
 * Project cost for a scan based on email count
 */
export function projectScanCost(
  emailCount: number,
  scanType: "full" | "incremental"
): number {
  // Based on empirical data:
  // - 90% of emails filtered out by pre-filter (no AI cost)
  // - 10% need AI processing
  // - Average 200 tokens per receipt (150 input, 50 output)
  // - Using Claude Haiku for cost efficiency

  const receiptsToProcess = emailCount * 0.1; // 10% are actual receipts
  const tokensPerReceipt = 200;
  const totalTokens = receiptsToProcess * tokensPerReceipt;

  // Split between input/output (75/25 ratio)
  const inputTokens = totalTokens * 0.75;
  const outputTokens = totalTokens * 0.25;

  // Calculate cost using Claude Haiku pricing
  const cost = calculateAPIcost(
    "CLAUDE",
    "claude-3-5-haiku-4-5",
    inputTokens,
    outputTokens
  );

  // Add Gmail API costs (minimal)
  const gmailCost = emailCount * 0.00001;

  // Incremental scans are cheaper (fewer emails)
  const multiplier = scanType === "incremental" ? 0.05 : 1; // 5% of emails for incremental

  return (cost + gmailCost) * multiplier;
}

/**
 * Get provider performance metrics
 */
export const getProviderPerformance = internalQuery({
  args: {
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const startTime = args.startTime || Date.now() - 7 * 24 * 60 * 60 * 1000; // Default: last 7 days
    const endTime = args.endTime || Date.now();

    // Get all API calls in time range
    const apiCalls = await ctx.db
      .query("auditLogs")
      .filter((q) =>
        q.and(
          q.eq(q.field("action"), "api_call"),
          q.gte(q.field("createdAt"), startTime),
          q.lte(q.field("createdAt"), endTime)
        )
      )
      .collect();

    const providerStats: Record<string, {
      calls: number;
      successRate: number;
      totalCost: number;
      totalTokens: number;
      avgDuration: number;
      avgCostPerCall: number;
    }> = {};

    for (const call of apiCalls) {
      const metadata = call.metadata as any;
      if (!metadata?.provider) continue;

      const key = `${metadata.provider}/${metadata.model}`;

      if (!providerStats[key]) {
        providerStats[key] = {
          calls: 0,
          successRate: 0,
          totalCost: 0,
          totalTokens: 0,
          avgDuration: 0,
          avgCostPerCall: 0,
        };
      }

      const stats = providerStats[key];
      stats.calls++;
      stats.totalCost += metadata.cost || 0;
      stats.totalTokens += (metadata.inputTokens || 0) + (metadata.outputTokens || 0);
      stats.avgDuration += metadata.duration || 0;

      if (metadata.success) {
        stats.successRate++;
      }
    }

    // Calculate averages
    for (const key in providerStats) {
      const stats = providerStats[key];
      if (stats.calls > 0) {
        stats.successRate = (stats.successRate / stats.calls) * 100;
        stats.avgDuration = stats.avgDuration / stats.calls;
        stats.avgCostPerCall = stats.totalCost / stats.calls;
      }
    }

    return providerStats;
  },
});

/**
 * Check if user is approaching cost limits
 */
export const checkCostLimits = internalQuery({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args): Promise<{
    dailyCost: number;
    monthlyCost: number;
    dailyLimit: number;
    monthlyLimit: number;
    alerts: Array<{ level: string; message: string }>;
  }> => {
    const now = Date.now();
    const todayStart = new Date().setHours(0, 0, 0, 0);
    const monthStart = new Date().setDate(1);

    // Get daily costs directly from database
    const dailySessions = await ctx.db
      .query("scanSessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) =>
        q.and(
          q.gte(q.field("startedAt"), todayStart),
          q.lte(q.field("startedAt"), now)
        )
      )
      .collect();

    let dailyCost = 0;
    for (const session of dailySessions) {
      if (session.stats) {
        dailyCost += session.stats.apiCost;
      }
    }

    // Get monthly costs
    const monthlySessions = await ctx.db
      .query("scanSessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) =>
        q.and(
          q.gte(q.field("startedAt"), monthStart),
          q.lte(q.field("startedAt"), now)
        )
      )
      .collect();

    let monthlyCost = 0;
    for (const session of monthlySessions) {
      if (session.stats) {
        monthlyCost += session.stats.apiCost;
      }
    }

    const alerts = [];

    // Check daily limit
    if (dailyCost > COST_THRESHOLDS.DAILY_LIMIT * 0.8) {
      alerts.push({
        level: "warning",
        message: `Approaching daily cost limit: $${dailyCost.toFixed(2)} of $${COST_THRESHOLDS.DAILY_LIMIT}`,
      });
    }

    if (dailyCost > COST_THRESHOLDS.DAILY_LIMIT) {
      alerts.push({
        level: "critical",
        message: `Daily cost limit exceeded: $${dailyCost.toFixed(2)}`,
      });
    }

    // Check monthly limit
    if (monthlyCost > COST_THRESHOLDS.MONTHLY_LIMIT * 0.8) {
      alerts.push({
        level: "warning",
        message: `Approaching monthly cost limit: $${monthlyCost.toFixed(2)} of $${COST_THRESHOLDS.MONTHLY_LIMIT}`,
      });
    }

    if (monthlyCost > COST_THRESHOLDS.MONTHLY_LIMIT) {
      alerts.push({
        level: "critical",
        message: `Monthly cost limit exceeded: $${monthlyCost.toFixed(2)}`,
      });
    }

    return {
      dailyCost,
      monthlyCost,
      dailyLimit: COST_THRESHOLDS.DAILY_LIMIT,
      monthlyLimit: COST_THRESHOLDS.MONTHLY_LIMIT,
      alerts,
    };
  },
});

/**
 * Optimize API usage based on performance metrics
 */
export function selectOptimalProvider(
  providerStats: any,
  prioritize: "cost" | "speed" | "accuracy" = "cost"
): string {
  let bestProvider = "CLAUDE/claude-3-5-haiku-4-5"; // Default
  let bestScore = Infinity;

  for (const [key, stats] of Object.entries(providerStats)) {
    const s = stats as any;

    // Skip providers with low success rates
    if (s.successRate < 90) continue;

    let score: number;
    switch (prioritize) {
      case "cost":
        score = s.avgCostPerCall;
        break;
      case "speed":
        score = s.avgDuration;
        break;
      case "accuracy":
        // Prefer higher token models (usually more accurate)
        score = -s.totalTokens / s.calls;
        break;
      default:
        score = s.avgCostPerCall;
    }

    if (score < bestScore) {
      bestScore = score;
      bestProvider = key;
    }
  }

  return bestProvider;
}

// Export internal reference
import { internal } from "../_generated/api";