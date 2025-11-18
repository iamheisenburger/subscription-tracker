/**
 * ADMIN CONTROL & SAFE MODE SYSTEM
 * Implements automatic kill switch and cost protection
 * Per COST_SAFETY_AND_UNIT_ECONOMICS.md
 */

import { internalMutation, internalQuery, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

/**
 * Get current safe mode status
 */
export const getSafeModeStatus = query({
  args: {},
  handler: async (ctx) => {
    // Check environment variable first (highest priority)
    const envDisabled = process.env.SUBWISE_DISABLE_CRONS === "true" || 
                        process.env.SUBWISE_SAFE_MODE === "true";
    
    if (envDisabled) {
      return {
        enabled: true,
        reason: "environment_variable",
        source: "env",
        message: "Safe mode enabled via environment variable",
      };
    }

    // Check system settings
    const settings = await ctx.db
      .query("systemSettings")
      .first();

    // Check both new and legacy field names
    const isEnabled = settings?.safeModeEnabled === true || settings?.safeMode === true || settings?.cronsDisabled === true;
    if (isEnabled) {
      return {
        enabled: true,
        reason: settings.safeModeReason || settings.autoKillReason || "manual",
        source: "database",
        message: settings.safeModeMessage || "Safe mode enabled",
        enabledAt: settings.safeModeEnabledAt || settings.autoKillAt,
      };
    }

    return {
      enabled: false,
      reason: null,
      source: null,
      message: "Safe mode disabled - system operational",
    };
  },
});

/**
 * Set safe mode (enable/disable)
 */
export const setSafeMode = internalMutation({
  args: {
    enabled: v.boolean(),
    reason: v.optional(v.string()),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let settings = await ctx.db
      .query("systemSettings")
      .first();

    if (!settings) {
      // Create settings if they don't exist
      await ctx.db.insert("systemSettings", {
        key: "global",
        safeModeEnabled: args.enabled,
        safeModeReason: args.reason || undefined,
        safeModeMessage: args.message || undefined,
        safeModeEnabledAt: args.enabled ? Date.now() : undefined,
        debugQueriesDisabled: false,
        minDebugPollIntervalMs: 60000, // 60 seconds
        lastDetectionQueueSize: 0,
        lastDetectionQueueCheck: undefined,
        consecutiveUnchangedRuns: 0,
      });
    } else {
      await ctx.db.patch(settings._id, {
        safeModeEnabled: args.enabled,
        safeModeReason: args.reason || undefined,
        safeModeMessage: args.message || undefined,
        safeModeEnabledAt: args.enabled ? Date.now() : undefined,
      });
    }

    console.log(
      args.enabled 
        ? `🔴 SAFE MODE ENABLED: ${args.reason || "manual"} - ${args.message || ""}`
        : `🟢 SAFE MODE DISABLED`
    );

    return { success: true, enabled: args.enabled };
  },
});

/**
 * Check if safe mode is enabled (for use in cron jobs and actions)
 */
export const isSafeModeEnabled = internalQuery({
  args: {},
  handler: async (ctx) => {
    // Check environment variable first
    if (process.env.SUBWISE_DISABLE_CRONS === "true" || 
        process.env.SUBWISE_SAFE_MODE === "true") {
      return true;
    }

    // Check database
    const settings = await ctx.db
      .query("systemSettings")
      .first();

    // Check both new and legacy field names for backward compatibility
    return settings?.safeModeEnabled === true || settings?.safeMode === true || settings?.cronsDisabled === true;
  },
});

/**
 * Auto-enable safe mode if detection queue is too large
 * Called by detection cron jobs
 */
export const checkAndEnableSafeMode = internalMutation({
  args: {
    detectionQueueSize: v.number(),
  },
  handler: async (ctx, args) => {
    // Heuristic 1: Queue spikes to ≥150
    if (args.detectionQueueSize >= 150) {
      console.error(`🚨 AUTO SAFE MODE: Detection queue spiked to ${args.detectionQueueSize} (threshold: 150)`);
      await ctx.runMutation(internal.adminControl.setSafeMode, {
        enabled: true,
        reason: "auto_detection_queue_spike",
        message: `Detection queue spiked to ${args.detectionQueueSize} receipts`,
      });
      return { enabled: true, reason: "queue_spike" };
    }

    // Heuristic 2: Queue is non-zero and unchanged for 3 consecutive runs
    // (This would need to be tracked separately - simplified here)
    
    return { enabled: false };
  },
});

