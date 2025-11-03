import { v } from "convex/values";
import { mutation, internalMutation, query, internalQuery } from "../_generated/server";
import { Id } from "../_generated/dataModel";

/**
 * DISTRIBUTED LOCKING SYSTEM
 *
 * Prevents concurrent operations on the same resource using lease-based locking.
 * Automatically releases locks on timeout to prevent deadlocks.
 *
 * Key features:
 * - Atomic lock acquisition using Convex transactions
 * - Automatic lease expiration (prevents deadlocks)
 * - Lock renewal for long-running operations
 * - Graceful release on completion
 */

// Lock timeout in milliseconds (5 minutes default)
const DEFAULT_LOCK_TIMEOUT = 5 * 60 * 1000;

// Lock renewal interval (renew at 50% of timeout)
const RENEWAL_INTERVAL = DEFAULT_LOCK_TIMEOUT * 0.5;

export interface LockInfo {
  lockId: Id<"distributedLocks">;
  resourceId: string;
  resourceType: string;
  ownerId: string;
  acquiredAt: number;
  expiresAt: number;
  renewalToken: string;
}

/**
 * Attempt to acquire a distributed lock
 * Returns lock info if successful, null if resource is already locked
 */
export const acquireLock = internalMutation({
  args: {
    resourceType: v.string(), // e.g., "emailConnection", "userScan"
    resourceId: v.string(),   // e.g., connection ID, user ID
    ownerId: v.string(),      // Unique identifier for the lock owner (e.g., session ID)
    timeoutMs: v.optional(v.number()), // Custom timeout in milliseconds
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const timeout = args.timeoutMs || DEFAULT_LOCK_TIMEOUT;
    const expiresAt = now + timeout;

    // Check if resource is already locked (and not expired)
    const existingLock = await ctx.db
      .query("distributedLocks")
      .withIndex("by_resource", (q) =>
        q.eq("resourceType", args.resourceType)
         .eq("resourceId", args.resourceId)
      )
      .filter((q) => q.gt(q.field("expiresAt"), now))
      .first();

    if (existingLock) {
      // Resource is locked by another process
      console.log(`🔒 Lock acquisition failed: ${args.resourceType}/${args.resourceId} is locked by ${existingLock.ownerId}`);
      return null;
    }

    // Clean up expired locks for this resource
    const expiredLocks = await ctx.db
      .query("distributedLocks")
      .withIndex("by_resource", (q) =>
        q.eq("resourceType", args.resourceType)
         .eq("resourceId", args.resourceId)
      )
      .filter((q) => q.lte(q.field("expiresAt"), now))
      .collect();

    for (const expiredLock of expiredLocks) {
      await ctx.db.delete(expiredLock._id);
      console.log(`🧹 Cleaned up expired lock: ${expiredLock.ownerId}`);
    }

    // Generate renewal token for secure lock renewal
    const renewalToken = `${args.ownerId}_${now}_${Math.random().toString(36).substring(7)}`;

    // Acquire the lock
    const lockId = await ctx.db.insert("distributedLocks", {
      resourceType: args.resourceType,
      resourceId: args.resourceId,
      ownerId: args.ownerId,
      acquiredAt: now,
      expiresAt,
      renewalToken,
      metadata: {
        timeoutMs: timeout,
      },
    });

    console.log(`✅ Lock acquired: ${args.resourceType}/${args.resourceId} by ${args.ownerId} (expires in ${timeout}ms)`);

    return {
      lockId,
      resourceId: args.resourceId,
      resourceType: args.resourceType,
      ownerId: args.ownerId,
      acquiredAt: now,
      expiresAt,
      renewalToken,
    } as LockInfo;
  },
});

/**
 * Renew a lock before it expires
 * Used for long-running operations
 */
export const renewLock = internalMutation({
  args: {
    lockId: v.id("distributedLocks"),
    renewalToken: v.string(),
    extensionMs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const lock = await ctx.db.get(args.lockId);

    if (!lock) {
      console.error("Lock not found for renewal:", args.lockId);
      return { success: false, reason: "lock_not_found" };
    }

    if (lock.renewalToken !== args.renewalToken) {
      console.error("Invalid renewal token for lock:", args.lockId);
      return { success: false, reason: "invalid_token" };
    }

    const now = Date.now();
    if (lock.expiresAt <= now) {
      console.error("Lock already expired:", args.lockId);
      return { success: false, reason: "lock_expired" };
    }

    const extension = args.extensionMs || DEFAULT_LOCK_TIMEOUT;
    const newExpiresAt = now + extension;

    await ctx.db.patch(args.lockId, {
      expiresAt: newExpiresAt,
      metadata: {
        ...lock.metadata,
        lastRenewedAt: now,
        renewalCount: ((lock.metadata?.renewalCount as number) || 0) + 1,
      },
    });

    console.log(`🔄 Lock renewed: ${lock.resourceType}/${lock.resourceId} extended to ${new Date(newExpiresAt).toISOString()}`);

    return { success: true, newExpiresAt };
  },
});

/**
 * Release a lock when operation completes
 */
export const releaseLock = internalMutation({
  args: {
    lockId: v.id("distributedLocks"),
    renewalToken: v.string(),
  },
  handler: async (ctx, args) => {
    const lock = await ctx.db.get(args.lockId);

    if (!lock) {
      console.log("Lock already released or expired:", args.lockId);
      return { success: true }; // Idempotent - already released is success
    }

    if (lock.renewalToken !== args.renewalToken) {
      console.error("Cannot release lock - invalid renewal token");
      return { success: false, reason: "invalid_token" };
    }

    await ctx.db.delete(args.lockId);

    const heldDuration = Date.now() - lock.acquiredAt;
    console.log(`🔓 Lock released: ${lock.resourceType}/${lock.resourceId} (held for ${heldDuration}ms)`);

    return { success: true, heldDuration };
  },
});

/**
 * Check if a resource is currently locked
 */
export const isLocked = internalQuery({
  args: {
    resourceType: v.string(),
    resourceId: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const activeLock = await ctx.db
      .query("distributedLocks")
      .withIndex("by_resource", (q) =>
        q.eq("resourceType", args.resourceType)
         .eq("resourceId", args.resourceId)
      )
      .filter((q) => q.gt(q.field("expiresAt"), now))
      .first();

    return {
      isLocked: !!activeLock,
      lockedBy: activeLock?.ownerId || null,
      expiresAt: activeLock?.expiresAt || null,
    };
  },
});

/**
 * Clean up all expired locks (maintenance task)
 */
export const cleanupExpiredLocks = internalMutation({
  handler: async (ctx) => {
    const now = Date.now();

    const expiredLocks = await ctx.db
      .query("distributedLocks")
      .filter((q) => q.lte(q.field("expiresAt"), now))
      .collect();

    let cleanedCount = 0;
    for (const lock of expiredLocks) {
      await ctx.db.delete(lock._id);
      cleanedCount++;
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} expired locks`);
    }

    return { cleanedCount };
  },
});

/**
 * Force release all locks for a specific owner (emergency cleanup)
 */
export const forceReleaseOwnerLocks = internalMutation({
  args: {
    ownerId: v.string(),
  },
  handler: async (ctx, args) => {
    const ownerLocks = await ctx.db
      .query("distributedLocks")
      .filter((q) => q.eq(q.field("ownerId"), args.ownerId))
      .collect();

    let releasedCount = 0;
    for (const lock of ownerLocks) {
      await ctx.db.delete(lock._id);
      releasedCount++;
    }

    if (releasedCount > 0) {
      console.log(`⚠️ Force released ${releasedCount} locks for owner: ${args.ownerId}`);
    }

    return { releasedCount };
  },
});

/**
 * Helper class for managing locks in actions
 */
export class LockManager {
  private lockInfo: LockInfo | null = null;
  private renewalInterval: NodeJS.Timeout | null = null;

  constructor(
    private ctx: any,
    private resourceType: string,
    private resourceId: string,
    private ownerId: string
  ) {}

  /**
   * Acquire lock with automatic renewal
   */
  async acquire(timeoutMs?: number): Promise<boolean> {
    this.lockInfo = await this.ctx.runMutation(
      "core/distributedLock:acquireLock",
      {
        resourceType: this.resourceType,
        resourceId: this.resourceId,
        ownerId: this.ownerId,
        timeoutMs,
      }
    );

    if (!this.lockInfo) {
      return false;
    }

    // Set up automatic renewal
    this.renewalInterval = setInterval(async () => {
      if (this.lockInfo) {
        const result = await this.ctx.runMutation(
          "core/distributedLock:renewLock",
          {
            lockId: this.lockInfo.lockId,
            renewalToken: this.lockInfo.renewalToken,
          }
        );

        if (!result.success) {
          console.error(`Failed to renew lock: ${result.reason}`);
          this.stopRenewal();
        }
      }
    }, RENEWAL_INTERVAL);

    return true;
  }

  /**
   * Release lock and stop renewal
   */
  async release(): Promise<void> {
    this.stopRenewal();

    if (this.lockInfo) {
      await this.ctx.runMutation(
        "core/distributedLock:releaseLock",
        {
          lockId: this.lockInfo.lockId,
          renewalToken: this.lockInfo.renewalToken,
        }
      );
      this.lockInfo = null;
    }
  }

  /**
   * Stop automatic renewal
   */
  private stopRenewal(): void {
    if (this.renewalInterval) {
      clearInterval(this.renewalInterval);
      this.renewalInterval = null;
    }
  }

  /**
   * Check if we still hold the lock
   */
  isHeld(): boolean {
    return !!this.lockInfo;
  }
}

/**
 * Decorator for functions that need exclusive access
 */
export function withLock(
  resourceType: string,
  getResourceId: (args: any) => string
) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const ctx = args[0];
      const functionArgs = args[1];
      const resourceId = getResourceId(functionArgs);
      const ownerId = `${propertyKey}_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      const lockManager = new LockManager(ctx, resourceType, resourceId, ownerId);

      try {
        const acquired = await lockManager.acquire();
        if (!acquired) {
          throw new Error(`Failed to acquire lock for ${resourceType}/${resourceId}`);
        }

        // Execute the original function
        return await originalMethod.apply(this, args);
      } finally {
        await lockManager.release();
      }
    };

    return descriptor;
  };
}