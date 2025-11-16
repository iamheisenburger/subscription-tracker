/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as adminAIParse from "../adminAIParse.js";
import type * as adminCleanup from "../adminCleanup.js";
import type * as adminFixes from "../adminFixes.js";
import type * as adminQueries from "../adminQueries.js";
import type * as adminReset from "../adminReset.js";
import type * as aiAdmin from "../aiAdmin.js";
import type * as aiReceiptAnalyzer from "../aiReceiptAnalyzer.js";
import type * as aiReceiptParser from "../aiReceiptParser.js";
import type * as ai_cache from "../ai/cache.js";
import type * as ai_optimizer from "../ai/optimizer.js";
import type * as auditLogs from "../auditLogs.js";
import type * as categories from "../categories.js";
import type * as clearAllReceipts from "../clearAllReceipts.js";
import type * as core_distributedLock from "../core/distributedLock.js";
import type * as core_errorHandler from "../core/errorHandler.js";
import type * as core_stateMachine from "../core/stateMachine.js";
import type * as cron from "../cron.js";
import type * as crons from "../crons.js";
import type * as debugMerchantField from "../debugMerchantField.js";
import type * as debugProductionIssues from "../debugProductionIssues.js";
import type * as debugReceipts from "../debugReceipts.js";
import type * as detection from "../detection.js";
import type * as diagnostics from "../diagnostics.js";
import type * as emailConnectionAdmin from "../emailConnectionAdmin.js";
import type * as emailConnections from "../emailConnections.js";
import type * as emailCronJobs from "../emailCronJobs.js";
import type * as emailDetection from "../emailDetection.js";
import type * as emailScanner from "../emailScanner.js";
import type * as emailScannerActions from "../emailScannerActions.js";
import type * as insights from "../insights.js";
import type * as merchants from "../merchants.js";
import type * as monitoring_costTracker from "../monitoring/costTracker.js";
import type * as notifications from "../notifications.js";
import type * as patternDetection from "../patternDetection.js";
import type * as push from "../push.js";
import type * as receiptParser from "../receiptParser.js";
import type * as repair from "../repair.js";
import type * as resetScan from "../resetScan.js";
import type * as scanning_orchestrator from "../scanning/orchestrator.js";
import type * as scanning_preFilter from "../scanning/preFilter.js";
import type * as scanning_smartFilter from "../scanning/smartFilter.js";
import type * as subscription_renewal from "../subscription_renewal.js";
import type * as subscriptions from "../subscriptions.js";
import type * as users from "../users.js";
import type * as utils from "../utils.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  adminAIParse: typeof adminAIParse;
  adminCleanup: typeof adminCleanup;
  adminFixes: typeof adminFixes;
  adminQueries: typeof adminQueries;
  adminReset: typeof adminReset;
  aiAdmin: typeof aiAdmin;
  aiReceiptAnalyzer: typeof aiReceiptAnalyzer;
  aiReceiptParser: typeof aiReceiptParser;
  "ai/cache": typeof ai_cache;
  "ai/optimizer": typeof ai_optimizer;
  auditLogs: typeof auditLogs;
  categories: typeof categories;
  clearAllReceipts: typeof clearAllReceipts;
  "core/distributedLock": typeof core_distributedLock;
  "core/errorHandler": typeof core_errorHandler;
  "core/stateMachine": typeof core_stateMachine;
  cron: typeof cron;
  crons: typeof crons;
  debugMerchantField: typeof debugMerchantField;
  debugProductionIssues: typeof debugProductionIssues;
  debugReceipts: typeof debugReceipts;
  detection: typeof detection;
  diagnostics: typeof diagnostics;
  emailConnectionAdmin: typeof emailConnectionAdmin;
  emailConnections: typeof emailConnections;
  emailCronJobs: typeof emailCronJobs;
  emailDetection: typeof emailDetection;
  emailScanner: typeof emailScanner;
  emailScannerActions: typeof emailScannerActions;
  insights: typeof insights;
  merchants: typeof merchants;
  "monitoring/costTracker": typeof monitoring_costTracker;
  notifications: typeof notifications;
  patternDetection: typeof patternDetection;
  push: typeof push;
  receiptParser: typeof receiptParser;
  repair: typeof repair;
  resetScan: typeof resetScan;
  "scanning/orchestrator": typeof scanning_orchestrator;
  "scanning/preFilter": typeof scanning_preFilter;
  "scanning/smartFilter": typeof scanning_smartFilter;
  subscription_renewal: typeof subscription_renewal;
  subscriptions: typeof subscriptions;
  users: typeof users;
  utils: typeof utils;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
