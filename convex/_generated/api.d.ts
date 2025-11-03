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
import type * as admin from "../admin.js";
import type * as adminCleanup from "../adminCleanup.js";
import type * as adminFixes from "../adminFixes.js";
import type * as adminQueries from "../adminQueries.js";
import type * as adminReset from "../adminReset.js";
import type * as ai_cache from "../ai/cache.js";
import type * as ai_optimizer from "../ai/optimizer.js";
import type * as aiReceiptAnalyzer from "../aiReceiptAnalyzer.js";
import type * as aiReceiptParser from "../aiReceiptParser.js";
import type * as auditLogs from "../auditLogs.js";
import type * as bankConnections from "../bankConnections.js";
import type * as categories from "../categories.js";
import type * as clearAllReceipts from "../clearAllReceipts.js";
import type * as core_distributedLock from "../core/distributedLock.js";
import type * as core_errorHandler from "../core/errorHandler.js";
import type * as core_stateMachine from "../core/stateMachine.js";
import type * as cron from "../cron.js";
import type * as crons from "../crons.js";
import type * as dailyBankSync from "../dailyBankSync.js";
import type * as debugProductionIssues from "../debugProductionIssues.js";
import type * as detection from "../detection.js";
import type * as diagnostics from "../diagnostics.js";
import type * as emailConnectionAdmin from "../emailConnectionAdmin.js";
import type * as emailConnections from "../emailConnections.js";
import type * as emailCronJobs from "../emailCronJobs.js";
import type * as emailDetection from "../emailDetection.js";
import type * as emailScanner from "../emailScanner.js";
import type * as emailScannerActions from "../emailScannerActions.js";
import type * as insights from "../insights.js";
import type * as institutions from "../institutions.js";
import type * as merchants from "../merchants.js";
import type * as monitoring_costTracker from "../monitoring/costTracker.js";
import type * as notifications from "../notifications.js";
import type * as patternDetection from "../patternDetection.js";
import type * as push from "../push.js";
import type * as receiptParser from "../receiptParser.js";
import type * as scanning_orchestrator from "../scanning/orchestrator.js";
import type * as scanning_preFilter from "../scanning/preFilter.js";
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
  admin: typeof admin;
  adminCleanup: typeof adminCleanup;
  adminFixes: typeof adminFixes;
  adminQueries: typeof adminQueries;
  adminReset: typeof adminReset;
  "ai/cache": typeof ai_cache;
  "ai/optimizer": typeof ai_optimizer;
  aiReceiptAnalyzer: typeof aiReceiptAnalyzer;
  aiReceiptParser: typeof aiReceiptParser;
  auditLogs: typeof auditLogs;
  bankConnections: typeof bankConnections;
  categories: typeof categories;
  clearAllReceipts: typeof clearAllReceipts;
  "core/distributedLock": typeof core_distributedLock;
  "core/errorHandler": typeof core_errorHandler;
  "core/stateMachine": typeof core_stateMachine;
  cron: typeof cron;
  crons: typeof crons;
  dailyBankSync: typeof dailyBankSync;
  debugProductionIssues: typeof debugProductionIssues;
  detection: typeof detection;
  diagnostics: typeof diagnostics;
  emailConnectionAdmin: typeof emailConnectionAdmin;
  emailConnections: typeof emailConnections;
  emailCronJobs: typeof emailCronJobs;
  emailDetection: typeof emailDetection;
  emailScanner: typeof emailScanner;
  emailScannerActions: typeof emailScannerActions;
  insights: typeof insights;
  institutions: typeof institutions;
  merchants: typeof merchants;
  "monitoring/costTracker": typeof monitoring_costTracker;
  notifications: typeof notifications;
  patternDetection: typeof patternDetection;
  push: typeof push;
  receiptParser: typeof receiptParser;
  "scanning/orchestrator": typeof scanning_orchestrator;
  "scanning/preFilter": typeof scanning_preFilter;
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
