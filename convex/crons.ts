/**
 * Scheduled Cron Jobs
 * Automated background tasks for email scanning, parsing, and detection
 */

import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

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
