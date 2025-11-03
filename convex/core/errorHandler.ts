import { v } from "convex/values";
import { internalMutation, internalQuery } from "../_generated/server";
import { Id } from "../_generated/dataModel";

/**
 * ERROR HANDLING FRAMEWORK
 *
 * Comprehensive error management with categorization, retry logic,
 * and recovery strategies for different error types.
 *
 * Key features:
 * - Error categorization (transient/permanent/partial/critical)
 * - Exponential backoff with jitter for retries
 * - Circuit breaker pattern for external services
 * - Error recovery strategies
 * - Detailed error logging and alerting
 */

// Error types
export enum ErrorType {
  TRANSIENT = "transient",     // Network issues, rate limits - retry with backoff
  PERMANENT = "permanent",     // Invalid auth, bad data - fail fast
  PARTIAL = "partial",         // Some items failed - continue with others
  CRITICAL = "critical",       // System failure - stop everything and alert
}

// Error codes for specific scenarios
export enum ErrorCode {
  // Authentication errors
  TOKEN_EXPIRED = "TOKEN_EXPIRED",
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
  OAUTH_REFRESH_FAILED = "OAUTH_REFRESH_FAILED",

  // API errors
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  QUOTA_EXCEEDED = "QUOTA_EXCEEDED",
  API_TIMEOUT = "API_TIMEOUT",
  API_SERVICE_UNAVAILABLE = "API_SERVICE_UNAVAILABLE",

  // Data errors
  INVALID_DATA_FORMAT = "INVALID_DATA_FORMAT",
  MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD",
  DUPLICATE_ENTRY = "DUPLICATE_ENTRY",

  // System errors
  DATABASE_ERROR = "DATABASE_ERROR",
  OUT_OF_MEMORY = "OUT_OF_MEMORY",
  CONCURRENT_MODIFICATION = "CONCURRENT_MODIFICATION",

  // Business logic errors
  SUBSCRIPTION_LIMIT_EXCEEDED = "SUBSCRIPTION_LIMIT_EXCEEDED",
  INSUFFICIENT_PERMISSIONS = "INSUFFICIENT_PERMISSIONS",
  INVALID_OPERATION = "INVALID_OPERATION",
}

// Error metadata interface
export interface ErrorMetadata {
  type: ErrorType;
  code: ErrorCode | string;
  message: string;
  context?: Record<string, any>;
  stackTrace?: string;
  retryable: boolean;
  maxRetries?: number;
  retryAfterMs?: number;
}

// Circuit breaker state
interface CircuitBreakerState {
  service: string;
  isOpen: boolean;
  failures: number;
  lastFailureAt: number;
  nextRetryAt: number;
}

// Default retry configuration
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_BASE_DELAY = 1000; // 1 second
const DEFAULT_MAX_DELAY = 30000; // 30 seconds

/**
 * Categorize error based on type and content
 */
export function categorizeError(error: any): ErrorMetadata {
  const errorMessage = error?.message || error?.toString() || "Unknown error";

  // Token/Auth errors - PERMANENT (need user action)
  if (
    errorMessage.includes("401") ||
    errorMessage.includes("Unauthorized") ||
    errorMessage.includes("Authentication") ||
    errorMessage.includes("Invalid token")
  ) {
    return {
      type: ErrorType.PERMANENT,
      code: ErrorCode.INVALID_CREDENTIALS,
      message: "Authentication failed. Please reconnect your account.",
      retryable: false,
    };
  }

  // Rate limiting - TRANSIENT (retry with backoff)
  if (
    errorMessage.includes("429") ||
    errorMessage.includes("Rate limit") ||
    errorMessage.includes("Too many requests")
  ) {
    const retryAfter = extractRetryAfter(error);
    return {
      type: ErrorType.TRANSIENT,
      code: ErrorCode.RATE_LIMIT_EXCEEDED,
      message: "Rate limit exceeded. Will retry automatically.",
      retryable: true,
      maxRetries: 5,
      retryAfterMs: retryAfter || 60000, // Default to 1 minute
    };
  }

  // Quota exceeded - PERMANENT (need upgrade or wait)
  if (
    errorMessage.includes("Quota") ||
    errorMessage.includes("Usage limit")
  ) {
    return {
      type: ErrorType.PERMANENT,
      code: ErrorCode.QUOTA_EXCEEDED,
      message: "API quota exceeded. Please upgrade your plan or wait.",
      retryable: false,
    };
  }

  // Network/Timeout - TRANSIENT
  if (
    errorMessage.includes("Network") ||
    errorMessage.includes("Timeout") ||
    errorMessage.includes("ECONNREFUSED") ||
    errorMessage.includes("ETIMEDOUT")
  ) {
    return {
      type: ErrorType.TRANSIENT,
      code: ErrorCode.API_TIMEOUT,
      message: "Network error. Will retry automatically.",
      retryable: true,
      maxRetries: DEFAULT_MAX_RETRIES,
    };
  }

  // Service unavailable - TRANSIENT
  if (
    errorMessage.includes("503") ||
    errorMessage.includes("Service unavailable") ||
    errorMessage.includes("502") ||
    errorMessage.includes("Bad gateway")
  ) {
    return {
      type: ErrorType.TRANSIENT,
      code: ErrorCode.API_SERVICE_UNAVAILABLE,
      message: "Service temporarily unavailable. Will retry.",
      retryable: true,
      maxRetries: DEFAULT_MAX_RETRIES,
    };
  }

  // Data format errors - PARTIAL (skip this item)
  if (
    errorMessage.includes("JSON") ||
    errorMessage.includes("Parse") ||
    errorMessage.includes("Invalid format")
  ) {
    return {
      type: ErrorType.PARTIAL,
      code: ErrorCode.INVALID_DATA_FORMAT,
      message: "Invalid data format. Skipping this item.",
      retryable: false,
    };
  }

  // Database errors - CRITICAL
  if (
    errorMessage.includes("Database") ||
    errorMessage.includes("Transaction") ||
    errorMessage.includes("Constraint violation")
  ) {
    return {
      type: ErrorType.CRITICAL,
      code: ErrorCode.DATABASE_ERROR,
      message: "Database error. Manual intervention required.",
      retryable: false,
    };
  }

  // Default to transient with limited retries
  return {
    type: ErrorType.TRANSIENT,
    code: "UNKNOWN_ERROR",
    message: errorMessage,
    retryable: true,
    maxRetries: 1,
  };
}

/**
 * Calculate exponential backoff with jitter
 */
export function calculateBackoff(
  attempt: number,
  baseDelay: number = DEFAULT_BASE_DELAY,
  maxDelay: number = DEFAULT_MAX_DELAY
): number {
  // Exponential backoff: delay = min(base * 2^attempt, maxDelay)
  const exponentialDelay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);

  // Add jitter (±10% randomization to prevent thundering herd)
  const jitter = exponentialDelay * 0.1 * (Math.random() * 2 - 1);

  return Math.floor(exponentialDelay + jitter);
}

/**
 * Extract retry-after header from error response
 */
function extractRetryAfter(error: any): number | null {
  // Check for Retry-After header in various formats
  const retryAfter =
    error?.headers?.["retry-after"] ||
    error?.response?.headers?.["retry-after"] ||
    error?.retryAfter;

  if (!retryAfter) return null;

  // Parse as seconds (number) or HTTP date
  const parsed = parseInt(retryAfter);
  if (!isNaN(parsed)) {
    return parsed * 1000; // Convert to milliseconds
  }

  // Try parsing as date
  const retryDate = new Date(retryAfter);
  if (!isNaN(retryDate.getTime())) {
    return Math.max(0, retryDate.getTime() - Date.now());
  }

  return null;
}

/**
 * Log error to database for tracking
 */
export const logError = internalMutation({
  args: {
    sessionId: v.optional(v.id("scanSessions")),
    errorType: v.string(),
    errorCode: v.string(),
    message: v.string(),
    context: v.optional(v.record(v.string(), v.any())),
    stackTrace: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const errorLog = {
      sessionId: args.sessionId,
      type: args.errorType,
      code: args.errorCode,
      message: args.message,
      context: args.context,
      stackTrace: args.stackTrace,
      timestamp: Date.now(),
    };

    // Store in audit log
    await ctx.db.insert("auditLogs", {
      action: "error_logged",
      userId: undefined, // System error
      metadata: errorLog,
      createdAt: Date.now(),
    });

    // Update session if provided
    if (args.sessionId) {
      const session = await ctx.db.get(args.sessionId);
      if (session) {
        await ctx.db.patch(args.sessionId, {
          error: {
            type: args.errorType as any,
            message: args.message,
            code: args.errorCode,
            retryCount: (session.error?.retryCount || 0) + 1,
            lastRetryAt: Date.now(),
          },
        });
      }
    }

    console.error(`❌ Error logged: [${args.errorCode}] ${args.message}`);
    if (args.context) {
      console.error("Context:", JSON.stringify(args.context, null, 2));
    }

    return { logged: true };
  },
});

/**
 * Check if we should retry based on error and attempt count
 */
export function shouldRetry(
  errorMetadata: ErrorMetadata,
  attemptCount: number
): boolean {
  if (!errorMetadata.retryable) {
    return false;
  }

  const maxRetries = errorMetadata.maxRetries || DEFAULT_MAX_RETRIES;
  return attemptCount < maxRetries;
}

/**
 * Error recovery strategies for different error types
 */
export class ErrorRecovery {
  /**
   * Handle transient errors with retry
   */
  static async handleTransient(
    error: ErrorMetadata,
    attemptCount: number,
    retryFn: () => Promise<any>
  ): Promise<any> {
    if (!shouldRetry(error, attemptCount)) {
      throw new Error(`Max retries (${error.maxRetries}) exceeded: ${error.message}`);
    }

    const delay = error.retryAfterMs || calculateBackoff(attemptCount);
    console.log(`⏱️ Retrying in ${delay}ms (attempt ${attemptCount + 1}/${error.maxRetries})`);

    await new Promise((resolve) => setTimeout(resolve, delay));
    return retryFn();
  }

  /**
   * Handle permanent errors - fail fast
   */
  static handlePermanent(error: ErrorMetadata): never {
    console.error(`🚫 Permanent error: ${error.message}`);
    throw new Error(error.message);
  }

  /**
   * Handle partial errors - log and continue
   */
  static handlePartial(
    error: ErrorMetadata,
    itemId: string,
    failedItems: Set<string>
  ): void {
    console.warn(`⚠️ Partial failure for item ${itemId}: ${error.message}`);
    failedItems.add(itemId);
    // Continue processing other items
  }

  /**
   * Handle critical errors - stop everything
   */
  static async handleCritical(
    ctx: any,
    error: ErrorMetadata,
    sessionId?: Id<"scanSessions">
  ): Promise<never> {
    console.error(`🔴 CRITICAL ERROR: ${error.message}`);

    // Log to database
    await ctx.runMutation(internal.core.errorHandler.logError, {
      sessionId,
      errorType: error.type,
      errorCode: error.code,
      message: error.message,
      context: error.context,
      stackTrace: error.stackTrace,
    });

    // Send alert (would integrate with monitoring service)
    // await sendAlert(error);

    throw new Error(`Critical error - manual intervention required: ${error.message}`);
  }
}

/**
 * Circuit breaker for external services
 */
export class CircuitBreaker {
  private states: Map<string, CircuitBreakerState> = new Map();
  private readonly threshold = 5; // Open circuit after 5 failures
  private readonly timeout = 60000; // Reset after 1 minute

  /**
   * Check if circuit is open for a service
   */
  isOpen(service: string): boolean {
    const state = this.states.get(service);
    if (!state) return false;

    // Check if circuit should be reset
    if (state.isOpen && Date.now() >= state.nextRetryAt) {
      state.isOpen = false;
      state.failures = 0;
      console.log(`🔌 Circuit breaker reset for ${service}`);
    }

    return state.isOpen;
  }

  /**
   * Record successful call
   */
  recordSuccess(service: string): void {
    const state = this.states.get(service);
    if (state) {
      state.failures = 0;
      state.isOpen = false;
    }
  }

  /**
   * Record failed call
   */
  recordFailure(service: string): void {
    let state = this.states.get(service);
    if (!state) {
      state = {
        service,
        isOpen: false,
        failures: 0,
        lastFailureAt: 0,
        nextRetryAt: 0,
      };
      this.states.set(service, state);
    }

    state.failures++;
    state.lastFailureAt = Date.now();

    if (state.failures >= this.threshold) {
      state.isOpen = true;
      state.nextRetryAt = Date.now() + this.timeout;
      console.error(
        `⚡ Circuit breaker opened for ${service} after ${state.failures} failures. ` +
        `Will retry at ${new Date(state.nextRetryAt).toISOString()}`
      );
    }
  }

  /**
   * Execute with circuit breaker protection
   */
  async execute<T>(
    service: string,
    fn: () => Promise<T>,
    fallback?: () => T
  ): Promise<T> {
    if (this.isOpen(service)) {
      if (fallback) {
        console.log(`🔀 Using fallback for ${service} (circuit open)`);
        return fallback();
      }
      throw new Error(`Circuit breaker open for ${service}. Service temporarily unavailable.`);
    }

    try {
      const result = await fn();
      this.recordSuccess(service);
      return result;
    } catch (error) {
      this.recordFailure(service);
      throw error;
    }
  }
}

// Export internal reference for mutations
import { internal } from "../_generated/api";