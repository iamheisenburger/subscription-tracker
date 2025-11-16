/**
 * Scheduled Cron Jobs
 * Automated background tasks for email scanning, parsing, and detection
 * 
 * SAFE MODE PROTECTION: All crons check safe mode before running
 * Per COST_SAFETY_AND_UNIT_ECONOMICS.md
 */

import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

/**
 * Check if safe mode is enabled (env or database)
 * Early return wrapper for all cron handlers
 */
async function checkSafeMode(ctx: any): Promise<boolean> {
  // Check environment variable first (highest priority)
  if (process.env.SUBWISE_DISABLE_CRONS === "true" || 
      process.env.SUBWISE_SAFE_MODE === "true") {
    console.log("🔴 SAFE MODE: Crons disabled via environment variable");
    return true;
  }

  // Check database
  const settings = await ctx.db
    .query("systemSettings")
    .first();

  if (settings?.safeModeEnabled) {
    console.log(`🔴 SAFE MODE: Crons disabled - ${settings.safeModeReason || "manual"}`);
    return true;
  }

  return false;
}

/**
 * Email Scanner - Every 6 hours
 * Scans all active email connections for new receipts
 */
crons.interval(
  "email-scanner",
  { hours: 6 }, // Run every 6 hours
  internal.emailCronJobs.scanAllActiveConnections
);

/**
 * Receipt Parser - Every hour
 * Parses unparsed email receipts
 */
crons.interval(
  "receipt-parser",
  { hours: 1 }, // Run every hour
  internal.emailCronJobs.parseAllUnparsedReceipts
);

/**
 * Detection Creator - Every hour
 * Creates detection candidates from parsed receipts
 */
crons.interval(
  "detection-creator",
  { hours: 1 }, // Run every hour
  internal.emailCronJobs.createDetectionCandidates
);

/**
 * Renewal Reminder - Daily at 9 AM
 * Sends renewal reminder notifications
 */
crons.daily(
  "renewal-reminders",
  { hourUTC: 13, minuteUTC: 0 }, // 9 AM EST = 1 PM UTC
  internal.emailCronJobs.sendRenewalReminders
);

export default crons;
