/**
 * Calendar Export Utility
 * Generates .ics files for subscription renewals
 */

import { Doc } from "../../convex/_generated/dataModel";

/**
 * Format date for iCalendar format (YYYYMMDDTHHMMSSZ)
 */
function formatICalDate(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const seconds = String(date.getUTCSeconds()).padStart(2, "0");

  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Generate RRULE for recurring events based on billing cycle
 */
function generateRRule(billingCycle: "weekly" | "monthly" | "yearly"): string {
  switch (billingCycle) {
    case "weekly":
      return "RRULE:FREQ=WEEKLY;INTERVAL=1";
    case "monthly":
      return "RRULE:FREQ=MONTHLY;INTERVAL=1";
    case "yearly":
      return "RRULE:FREQ=YEARLY;INTERVAL=1";
  }
}

/**
 * Escape special characters for iCalendar text fields
 */
function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

/**
 * Generate a unique UID for the event
 */
function generateUID(subscriptionId: string): string {
  return `subscription-${subscriptionId}@subwise.app`;
}

/**
 * Generate .ics file content for a single subscription
 */
export function generateICalendarEvent(subscription: Doc<"subscriptions">): string {
  const now = formatICalDate(Date.now());
  const startDate = formatICalDate(subscription.nextBillingDate);
  const uid = generateUID(subscription._id);
  const rrule = generateRRule(subscription.billingCycle);

  const summary = escapeICalText(`${subscription.name} - $${subscription.cost}`);
  const description = escapeICalText(
    `Subscription renewal: ${subscription.name}\n` +
    `Amount: ${subscription.currency} ${subscription.cost}\n` +
    `Billing cycle: ${subscription.billingCycle}\n` +
    `\n` +
    `Managed by SubWise - https://subwise.app`
  );

  // Create all-day event
  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SubWise//Subscription Tracker//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:SubWise Subscriptions",
    "X-WR-TIMEZONE:UTC",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART;VALUE=DATE:${startDate.substring(0, 8)}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `STATUS:CONFIRMED`,
    `SEQUENCE:0`,
    rrule,
    "BEGIN:VALARM",
    "TRIGGER:-PT24H", // 24 hours before
    "ACTION:DISPLAY",
    `DESCRIPTION:Reminder: ${summary} due tomorrow`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  return icsContent;
}

/**
 * Generate .ics file content for multiple subscriptions
 */
export function generateICalendarForMultiple(subscriptions: Doc<"subscriptions">[]): string {
  const now = formatICalDate(Date.now());

  const events = subscriptions.map((subscription) => {
    const startDate = formatICalDate(subscription.nextBillingDate);
    const uid = generateUID(subscription._id);
    const rrule = generateRRule(subscription.billingCycle);

    const summary = escapeICalText(`${subscription.name} - $${subscription.cost}`);
    const description = escapeICalText(
      `Subscription renewal: ${subscription.name}\n` +
      `Amount: ${subscription.currency} ${subscription.cost}\n` +
      `Billing cycle: ${subscription.billingCycle}\n` +
      `\n` +
      `Managed by SubWise - https://subwise.app`
    );

    return [
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${now}`,
      `DTSTART;VALUE=DATE:${startDate.substring(0, 8)}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${description}`,
      `STATUS:CONFIRMED`,
      `SEQUENCE:0`,
      rrule,
      "BEGIN:VALARM",
      "TRIGGER:-PT24H",
      "ACTION:DISPLAY",
      `DESCRIPTION:Reminder: ${summary} due tomorrow`,
      "END:VALARM",
      "END:VEVENT",
    ].join("\r\n");
  });

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SubWise//Subscription Tracker//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:SubWise Subscriptions",
    "X-WR-TIMEZONE:UTC",
    ...events,
    "END:VCALENDAR",
  ].join("\r\n");

  return icsContent;
}

/**
 * Download .ics file
 */
export function downloadICalendar(content: string, filename: string = "subscriptions.ics"): void {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Export single subscription to calendar
 */
export function exportSubscriptionToCalendar(subscription: Doc<"subscriptions">): void {
  const icsContent = generateICalendarEvent(subscription);
  const filename = `${subscription.name.toLowerCase().replace(/\s+/g, "-")}-renewal.ics`;
  downloadICalendar(icsContent, filename);
}

/**
 * Export all subscriptions to calendar
 */
export function exportAllSubscriptionsToCalendar(subscriptions: Doc<"subscriptions">[]): void {
  const icsContent = generateICalendarForMultiple(subscriptions);
  downloadICalendar(icsContent, "all-subscriptions.ics");
}
