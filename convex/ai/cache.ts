import { v } from "convex/values";
import { internalMutation, internalQuery } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { internal } from "../_generated/api";

/**
 * AI RESPONSE CACHE
 *
 * Caches AI parsing results to avoid reprocessing identical content.
 * Uses SHA-256 hashing for content fingerprinting.
 *
 * Key features:
 * - Content-based cache keys (SHA-256 hash)
 * - TTL-based expiration (30 days default)
 * - Hit rate tracking for optimization
 * - Automatic cleanup of expired entries
 * - Provider-specific caching
 */

// Cache configuration
const CACHE_CONFIG = {
  DEFAULT_TTL: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
  MAX_CACHE_SIZE: 10000, // Maximum number of cached entries
  CLEANUP_BATCH_SIZE: 100, // Entries to clean up at once
  MIN_CONTENT_LENGTH: 100, // Don't cache very short content
};

// Cache entry structure
export interface CacheEntry {
  contentHash: string;
  provider: string;
  model: string;
  result: any; // The AI parsing result
  createdAt: number;
  expiresAt: number;
  hitCount: number;
  lastAccessedAt: number;
  contentLength: number;
}

/**
 * Generate content hash for cache key
 * Using a simple hash function since crypto.subtle isn't available in Convex
 */
export function generateContentHash(content: string, provider?: string): string {
  // Simple hash function (FNV-1a variant)
  let hash = 2166136261;
  const prime = 16777619;

  // Include provider in hash to separate caches
  const fullContent = `${provider || 'default'}:${content}`;

  for (let i = 0; i < fullContent.length; i++) {
    hash ^= fullContent.charCodeAt(i);
    hash = Math.imul(hash, prime);
  }

  // Convert to hex string
  return hash.toString(16);
}

/**
 * Check if content should be cached
 */
function shouldCache(content: string): boolean {
  // Don't cache very short content
  if (content.length < CACHE_CONFIG.MIN_CONTENT_LENGTH) {
    return false;
  }

  // Don't cache content that looks like an error
  const lowerContent = content.toLowerCase();
  if (
    lowerContent.includes('error') ||
    lowerContent.includes('failed') ||
    lowerContent.includes('invalid')
  ) {
    return false;
  }

  return true;
}

/**
 * Get cached AI response
 */
export const getCachedResponse = internalQuery({
  args: {
    contentHash: v.string(),
    provider: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Look for cached entry
    const cacheKey = args.provider
      ? `${args.provider}:${args.contentHash}`
      : args.contentHash;

    // Query audit logs for cached AI responses
    const cachedEntry = await ctx.db
      .query("auditLogs")
      .withIndex("by_action", (q) => q.eq("action", "ai_cache_hit"))
      .filter((q) =>
        q.and(
          q.eq(q.field("metadata.cacheKey"), cacheKey),
          q.gt(q.field("metadata.expiresAt"), now)
        )
      )
      .order("desc")
      .first();

    if (cachedEntry && cachedEntry.metadata) {
      console.log(`✅ Cache hit for hash ${args.contentHash.substring(0, 8)}...`);
      return {
        hit: true,
        result: cachedEntry.metadata.result,
        cachedAt: cachedEntry.metadata.createdAt,
        provider: cachedEntry.metadata.provider,
      };
    }

    console.log(`❌ Cache miss for hash ${args.contentHash.substring(0, 8)}...`);
    return { hit: false };
  },
});

/**
 * Store AI response in cache
 */
export const cacheResponse = internalMutation({
  args: {
    contentHash: v.string(),
    provider: v.string(),
    model: v.string(),
    result: v.any(),
    contentLength: v.number(),
    sessionId: v.optional(v.id("scanSessions")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const expiresAt = now + CACHE_CONFIG.DEFAULT_TTL;

    const cacheKey = `${args.provider}:${args.contentHash}`;

    // Store in audit logs as cache entry
    await ctx.db.insert("auditLogs", {
      action: "ai_cache_write",
      userId: undefined, // System action
      metadata: {
        cacheKey,
        contentHash: args.contentHash,
        provider: args.provider,
        model: args.model,
        result: args.result,
        createdAt: now,
        expiresAt,
        contentLength: args.contentLength,
        sessionId: args.sessionId,
      },
      createdAt: now,
    });

    console.log(
      `💾 Cached response: ${args.contentHash.substring(0, 8)}... ` +
      `(${args.provider}/${args.model}, expires ${new Date(expiresAt).toISOString()})`
    );

    return { cached: true, cacheKey, expiresAt };
  },
});

/**
 * Update cache hit statistics
 */
export const recordCacheHit = internalMutation({
  args: {
    cacheKey: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("auditLogs", {
      action: "ai_cache_hit",
      userId: undefined,
      metadata: {
        cacheKey: args.cacheKey,
        timestamp: Date.now(),
      },
      createdAt: Date.now(),
    });
  },
});

/**
 * Get cache statistics
 */
export const getCacheStats = internalQuery({
  args: {
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const startTime = args.startTime || Date.now() - 24 * 60 * 60 * 1000; // Default: last 24 hours
    const endTime = args.endTime || Date.now();

    // Get cache writes
    const cacheWrites = await ctx.db
      .query("auditLogs")
      .withIndex("by_action", (q) => q.eq("action", "ai_cache_write"))
      .filter((q) =>
        q.and(
          q.gte(q.field("createdAt"), startTime),
          q.lte(q.field("createdAt"), endTime)
        )
      )
      .collect();

    // Get cache hits
    const cacheHits = await ctx.db
      .query("auditLogs")
      .withIndex("by_action", (q) => q.eq("action", "ai_cache_hit"))
      .filter((q) =>
        q.and(
          q.gte(q.field("createdAt"), startTime),
          q.lte(q.field("createdAt"), endTime)
        )
      )
      .collect();

    const totalWrites = cacheWrites.length;
    const totalHits = cacheHits.length;
    const hitRate = totalWrites > 0 ? (totalHits / (totalHits + totalWrites)) * 100 : 0;

    // Calculate cost savings (approximate)
    const avgCostPerCall = 0.001; // $0.001 per AI call
    const costSavings = totalHits * avgCostPerCall;

    // Get provider breakdown
    const providerStats: Record<string, { writes: number; hits: number }> = {};

    for (const write of cacheWrites) {
      const provider = write.metadata?.provider || 'unknown';
      if (!providerStats[provider]) {
        providerStats[provider] = { writes: 0, hits: 0 };
      }
      providerStats[provider].writes++;
    }

    return {
      period: { startTime, endTime },
      totalWrites,
      totalHits,
      hitRate: hitRate.toFixed(2) + '%',
      costSavings: `$${costSavings.toFixed(4)}`,
      providerStats,
      recentHits: cacheHits.slice(-10).map(hit => ({
        cacheKey: hit.metadata?.cacheKey,
        timestamp: hit.createdAt,
      })),
    };
  },
});

/**
 * Clean up expired cache entries
 */
export const cleanupExpiredCache = internalMutation({
  handler: async (ctx) => {
    const now = Date.now();

    // Find expired cache entries
    const expiredEntries = await ctx.db
      .query("auditLogs")
      .withIndex("by_action", (q) => q.eq("action", "ai_cache_write"))
      .filter((q) => q.lt(q.field("metadata.expiresAt"), now))
      .take(CACHE_CONFIG.CLEANUP_BATCH_SIZE);

    let cleanedCount = 0;
    for (const entry of expiredEntries) {
      await ctx.db.delete(entry._id);
      cleanedCount++;
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} expired cache entries`);
    }

    return { cleanedCount };
  },
});

/**
 * Preload cache for known receipts
 */
export const preloadCache = internalMutation({
  args: {
    receipts: v.array(v.object({
      contentHash: v.string(),
      provider: v.string(),
      result: v.any(),
    })),
  },
  handler: async (ctx, args) => {
    let loadedCount = 0;
    const now = Date.now();

    for (const receipt of args.receipts) {
      // Check if already cached
      const existing = await ctx.runQuery(
        internal.ai.cache.getCachedResponse,
        {
          contentHash: receipt.contentHash,
          provider: receipt.provider,
        }
      );

      if (!existing.hit) {
        await ctx.runMutation(
          internal.ai.cache.cacheResponse,
          {
            contentHash: receipt.contentHash,
            provider: receipt.provider,
            model: 'preloaded',
            result: receipt.result,
            contentLength: 0,
          }
        );
        loadedCount++;
      }
    }

    console.log(`📦 Preloaded ${loadedCount} entries into cache`);
    return { loadedCount };
  },
});

/**
 * Calculate potential cost savings from cache
 */
export function calculateCacheSavings(
  hitRate: number,
  totalRequests: number,
  costPerRequest: number = 0.001
): { saved: number; percentage: number } {
  const cacheHits = totalRequests * (hitRate / 100);
  const saved = cacheHits * costPerRequest;
  const totalCost = totalRequests * costPerRequest;
  const percentage = totalCost > 0 ? (saved / totalCost) * 100 : 0;

  return { saved, percentage };
}

/**
 * Determine optimal cache TTL based on usage patterns
 */
export function calculateOptimalTTL(
  averageAccessInterval: number,
  contentType: string
): number {
  // Base TTL by content type
  const baseTTL = {
    subscription_receipt: 60 * 24 * 60 * 60 * 1000, // 60 days for subscription receipts
    one_time_purchase: 90 * 24 * 60 * 60 * 1000,    // 90 days for one-time purchases
    payment_notification: 30 * 24 * 60 * 60 * 1000, // 30 days for notifications
    default: 30 * 24 * 60 * 60 * 1000,              // 30 days default
  };

  const ttl = baseTTL[contentType as keyof typeof baseTTL] || baseTTL.default;

  // Adjust based on access patterns
  if (averageAccessInterval < 7 * 24 * 60 * 60 * 1000) {
    // Accessed frequently - extend TTL
    return ttl * 2;
  } else if (averageAccessInterval > 30 * 24 * 60 * 60 * 1000) {
    // Rarely accessed - reduce TTL
    return ttl * 0.5;
  }

  return ttl;
}