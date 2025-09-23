import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Process notification queue every 5 minutes
crons.interval(
  "process notification queue",
  { minutes: 5 },
  internal.notifications.processNotificationQueue,
);

// Generate renewal reminders daily at 9 AM UTC
crons.daily(
  "generate renewal reminders",
  { hourUTC: 9, minuteUTC: 0 },
  internal.notifications.generateRenewalReminders,
);

// Cleanup old notifications weekly on Sundays at 2 AM UTC
crons.weekly(
  "cleanup old notifications",
  { dayOfWeek: "sunday", hourUTC: 2, minuteUTC: 0 },
  internal.notifications.cleanupOldNotifications,
);

// Check spending thresholds daily at 10 AM UTC
crons.daily(
  "check spending thresholds",
  { hourUTC: 10, minuteUTC: 0 },
  internal.notifications.checkSpendingThresholds,
);

export default crons;

