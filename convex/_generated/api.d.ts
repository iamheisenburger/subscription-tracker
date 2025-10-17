/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as accounts from "../accounts.js";
import type * as auditLogs from "../auditLogs.js";
import type * as bankConnections from "../bankConnections.js";
import type * as categories from "../categories.js";
import type * as cron from "../cron.js";
import type * as crons from "../crons.js";
import type * as dailyBankSync from "../dailyBankSync.js";
import type * as detection from "../detection.js";
import type * as emailConnections from "../emailConnections.js";
import type * as emailCronJobs from "../emailCronJobs.js";
import type * as emailDetection from "../emailDetection.js";
import type * as emailScanner from "../emailScanner.js";
import type * as insights from "../insights.js";
import type * as institutions from "../institutions.js";
import type * as merchants from "../merchants.js";
import type * as notifications from "../notifications.js";
import type * as push from "../push.js";
import type * as receiptParser from "../receiptParser.js";
import type * as subscription_renewal from "../subscription_renewal.js";
import type * as subscriptions from "../subscriptions.js";
import type * as transactions from "../transactions.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  accounts: typeof accounts;
  auditLogs: typeof auditLogs;
  bankConnections: typeof bankConnections;
  categories: typeof categories;
  cron: typeof cron;
  crons: typeof crons;
  dailyBankSync: typeof dailyBankSync;
  detection: typeof detection;
  emailConnections: typeof emailConnections;
  emailCronJobs: typeof emailCronJobs;
  emailDetection: typeof emailDetection;
  emailScanner: typeof emailScanner;
  insights: typeof insights;
  institutions: typeof institutions;
  merchants: typeof merchants;
  notifications: typeof notifications;
  push: typeof push;
  receiptParser: typeof receiptParser;
  subscription_renewal: typeof subscription_renewal;
  subscriptions: typeof subscriptions;
  transactions: typeof transactions;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
