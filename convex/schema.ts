import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    // Clerk user ID
    clerkId: v.string(),
    email: v.string(),
    tier: v.union(
      v.literal("free_user"),
      v.literal("plus"),
      v.literal("automate_1"),
      v.literal("premium_user"), // Legacy support
      v.literal("automate"), // Legacy support
      v.literal("family"), // Legacy support (will be migrated)
      v.literal("teams") // Legacy support (will be migrated)
    ),
    subscriptionLimit: v.number(),
    premiumExpiresAt: v.optional(v.number()),
    trialEndsAt: v.optional(v.number()),
    // Track subscription type for premium users
    subscriptionType: v.optional(v.union(v.literal("monthly"), v.literal("annual"))),
    // User preferences
    preferredCurrency: v.optional(v.string()), // User's preferred display currency (USD, EUR, etc.)
    // Push notification settings
    pushSubscription: v.optional(v.record(v.string(), v.any())), // Web Push subscription object
    pushEnabled: v.optional(v.boolean()), // User's push notification preference
    // Email integration fields - Prevent exploitation
    emailConnectionsUsedLifetime: v.optional(v.number()), // Total unique emails EVER connected (never decrements)
    orgId: v.optional(v.id("organizations")), // For Family/Teams tier
    role: v.optional(v.union(v.literal("owner"), v.literal("member"))), // Role within organization
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"])
    .index("by_org", ["orgId"]),

  subscriptions: defineTable({
    userId: v.id("users"),
    name: v.string(),
    cost: v.number(),
    currency: v.string(),
    billingCycle: v.union(
      v.literal("monthly"),
      v.literal("yearly"),
      v.literal("weekly")
    ),
    nextBillingDate: v.number(),
    category: v.optional(v.string()),
    description: v.optional(v.string()),
    isActive: v.boolean(),
    renewalStatus: v.optional(v.union(
      v.literal("pending_confirmation"),
      v.literal("confirmed_renewed"),
      v.literal("confirmed_cancelled")
    )),
    // Detection fields
    source: v.optional(v.union(
      v.literal("manual"),
      v.literal("detected"),
      v.literal("email_receipt")
    )),
    detectionConfidence: v.optional(v.number()), // 0-1 confidence score
    merchantId: v.optional(v.id("merchants")),
    // Renewal prediction fields (Automate tier)
    predictedCadence: v.optional(v.union(
      v.literal("weekly"),
      v.literal("monthly"),
      v.literal("yearly")
    )), // Predicted billing frequency
    predictedNextRenewal: v.optional(v.number()), // Predicted next renewal date
    predictionConfidence: v.optional(v.number()), // 0-1 confidence in prediction
    predictionLastUpdated: v.optional(v.number()), // When prediction was last calculated
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_active", ["userId", "isActive"])
    .index("by_next_billing", ["nextBillingDate"])
    .index("by_merchant", ["merchantId"])
    .index("by_source", ["source"]),

  categories: defineTable({
    userId: v.id("users"),
    name: v.string(),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"]),

  // Notification system tables
  notificationPreferences: defineTable({
    userId: v.id("users"),
    emailEnabled: v.boolean(),
    pushEnabled: v.boolean(),
    smsEnabled: v.optional(v.boolean()), // For Automate+ tiers
    renewalReminders: v.boolean(),
    priceChangeAlerts: v.boolean(),
    spendingAlerts: v.boolean(),
    newSubscriptionDetected: v.optional(v.boolean()), // Alert for auto-detected subscriptions
    duplicateChargeAlerts: v.optional(v.boolean()), // Alert for duplicate charges
    reminderDays: v.array(v.number()), // [7, 3, 1]
    spendingThreshold: v.optional(v.number()),
    phoneNumber: v.optional(v.string()), // For SMS alerts
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"]),

  notificationQueue: defineTable({
    userId: v.id("users"),
    subscriptionId: v.optional(v.id("subscriptions")),
    type: v.union(
      v.literal("renewal_reminder"),
      v.literal("price_change"),
      v.literal("spending_alert"),
      v.literal("trial_expiry"),
      v.literal("test"),
      v.literal("new_subscription_detected"),
      v.literal("duplicate_charge")
    ),
    scheduledFor: v.number(), // timestamp
    status: v.union(
      v.literal("pending"),
      v.literal("sent"),
      v.literal("failed"),
      v.literal("cancelled")
    ),
    emailData: v.optional(v.object({
      subject: v.string(),
      template: v.string(),
      templateData: v.any(),
    })),
    attempts: v.number(),
    lastAttempt: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_scheduled", ["scheduledFor"])
    .index("by_user_type", ["userId", "type"]),

  notificationHistory: defineTable({
    userId: v.id("users"),
    type: v.string(),
    title: v.string(),
    message: v.string(),
    read: v.boolean(),
    metadata: v.optional(v.any()), // Additional data (subscription info, etc.)
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_read", ["userId", "read"])
    .index("by_created", ["createdAt"]),

  // Feature flags for gradual rollout
  featureFlags: defineTable({
    flag: v.string(), // e.g., "bank_integrations", "email_parsing", "cancel_assistant"
    enabled: v.boolean(),
    description: v.optional(v.string()),
    rolloutPercentage: v.optional(v.number()), // For gradual rollout (0-100)
    allowedTiers: v.optional(v.array(v.string())), // Which tiers can access this feature
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_flag", ["flag"])
    .index("by_enabled", ["enabled"]),

  // Normalized merchants directory
  merchants: defineTable({
    displayName: v.string(),
    website: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    knownProviderKey: v.optional(v.string()), // e.g., "netflix", "spotify"
    aliases: v.array(v.string()), // ["NETFLIX.COM", "Netflix*1234", "NFLX"]
    mccCodes: v.optional(v.array(v.string())), // Common MCC codes for this merchant
    typicalCadence: v.optional(v.string()), // "monthly", "annual" if known
    cancelUrl: v.optional(v.string()), // For Cancel Assistant (Phase 2)
    cancelSteps: v.optional(v.array(v.string())), // Steps to cancel (Phase 2)
    // NEW: Merchant-based email scanning fields
    domains: v.optional(v.array(v.string())), // Email domains for Gmail search (e.g., ["openai.com", "mail.openai.com"])
    category: v.optional(v.string()), // Category: "ai_dev", "streaming", "vpn_security", etc.
    typicalAmount: v.optional(v.object({
      min: v.number(),
      max: v.number(),
      currency: v.string(),
    })), // Typical price range for validation
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_name", ["displayName"])
    .index("by_provider_key", ["knownProviderKey"]),

  // Subscription detection candidates (pending user review)
  detectionCandidates: defineTable({
    userId: v.id("users"),
    merchantId: v.optional(v.id("merchants")), // Optional for email-based detection
    proposedName: v.string(),
    proposedAmount: v.number(),
    proposedCurrency: v.string(),
    proposedCadence: v.union(v.literal("weekly"), v.literal("monthly"), v.literal("yearly")),
    proposedNextBilling: v.number(),
    confidence: v.number(), // 0-1
    detectionReason: v.string(), // Human-readable explanation
    // Optional evidence metadata used by pattern-based detection
    evidenceSnippet: v.optional(v.string()),
    evidenceType: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("dismissed"),
      v.literal("merged")
    ),
    acceptedSubscriptionId: v.optional(v.id("subscriptions")), // If accepted
    // Source tracking
    source: v.optional(v.union(
      v.literal("email"),
      v.literal("manual")
    )),
    // Email-specific fields
    emailReceiptId: v.optional(v.id("emailReceipts")), // Link to originating email receipt
    rawData: v.optional(v.object({
      from: v.optional(v.string()),
      subject: v.optional(v.string()),
      orderId: v.optional(v.string()),
      merchantDomain: v.optional(v.string()),
    })),
    createdAt: v.number(),
    reviewedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_user_status", ["userId", "status"])
    .index("by_merchant", ["merchantId"])
    .index("by_source", ["source"])
    .index("by_user_source", ["userId", "source"])
    .index("by_user_and_name", ["userId", "proposedName"]),

  // Audit logs for sensitive operations
  auditLogs: defineTable({
    userId: v.optional(v.id("users")), // Optional for system actions
    action: v.string(), // "bank_connected", "bank_disconnected", "data_deleted", etc.
    resourceType: v.optional(v.string()), // "bank_connection", "subscription", etc.
    resourceId: v.optional(v.string()),
    metadata: v.optional(v.any()),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_action", ["action"])
    .index("by_created", ["createdAt"])
    .index("by_user_action", ["userId", "action"]),

  // Organizations for Family/Teams tiers (Phase 3 prep)
  organizations: defineTable({
    name: v.string(),
    type: v.union(v.literal("family"), v.literal("team")),
    ownerId: v.id("users"),
    maxSeats: v.number(),
    maxConnections: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_type", ["type"]),

  // Usage meters for billing
  usageMeters: defineTable({
    userId: v.id("users"),
    orgId: v.optional(v.id("organizations")),
    metric: v.string(), // "bank_connections", "profiles", etc.
    value: v.number(),
    limit: v.number(),
    overageUnits: v.number(), // Units beyond the included limit
    overageCharge: v.number(), // Total overage cost
    billingPeriodStart: v.number(),
    billingPeriodEnd: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_org", ["orgId"])
    .index("by_metric", ["metric"])
    .index("by_period", ["billingPeriodStart", "billingPeriodEnd"]),

  // Price history tracking (Automate tier)
  priceHistory: defineTable({
    subscriptionId: v.id("subscriptions"),
    userId: v.id("users"), // Denormalized for easy querying
    oldPrice: v.number(),
    newPrice: v.number(),
    currency: v.string(),
    percentChange: v.number(), // Positive or negative
    detectedAt: v.number(), // When the change was detected
    transactionId: v.optional(v.id("transactions")), // Transaction that triggered detection
    createdAt: v.number(),
  })
    .index("by_subscription", ["subscriptionId"])
    .index("by_user", ["userId"])
    .index("by_detected_at", ["detectedAt"])
    .index("by_subscription_date", ["subscriptionId", "detectedAt"]),

  // ===== EMAIL INTEGRATION TABLES =====

  // Email connections (Gmail, Outlook, etc.)
  emailConnections: defineTable({
    userId: v.id("users"),
    provider: v.union(v.literal("gmail"), v.literal("outlook")),
    email: v.string(), // The connected email address
    accessToken: v.string(), // Encrypted OAuth access token
    refreshToken: v.string(), // Encrypted OAuth refresh token
    tokenExpiresAt: v.number(), // When access token expires
    status: v.union(
      v.literal("active"),
      v.literal("disconnected"),
      v.literal("error"),
      v.literal("requires_reauth")
    ),
    lastSyncedAt: v.optional(v.number()), // Last time we scanned emails
    syncCursor: v.optional(v.string()), // Timestamp for incremental scans
    lastFullScanAt: v.optional(v.number()), // When last FULL inbox scan completed (for incremental mode)
    lastScannedInternalDate: v.optional(v.number()), // Gmail internalDate of last scanned message
    // Full inbox scan pagination (Phase 3)
    scanStatus: v.optional(v.union(
      v.literal("not_started"),  // Never scanned before
      v.literal("scanning"),      // Currently scanning full inbox
      v.literal("paused"),        // Scan paused (will resume)
      v.literal("complete")       // Full scan complete
    )),
    pageToken: v.optional(v.string()), // Gmail API nextPageToken for pagination
    totalEmailsScanned: v.optional(v.number()), // Progress tracking
    totalReceiptsFound: v.optional(v.number()), // Progress tracking
    // AI processing progress (for real-time UI updates)
    aiProcessingStatus: v.optional(v.union(
      v.literal("not_started"),
      v.literal("processing"),
      v.literal("complete")
    )),
    aiProcessedCount: v.optional(v.number()), // How many receipts analyzed
    aiTotalCount: v.optional(v.number()), // Total receipts to analyze
    // CRITICAL: Scan state for tracking progress
    // FIX: Made flexible to support unlimited batches (no more literal enum hell)
    // Format: "idle" | "scanning_gmail" | "processing_batch_N" | "complete" | "error"
    scanState: v.optional(v.string()),
    totalBatches: v.optional(v.number()),
    currentBatch: v.optional(v.number()),
    batchProgress: v.optional(v.number()), // receipts processed in current batch
    batchTotal: v.optional(v.number()),
    overallProgress: v.optional(v.number()), // total receipts processed across all batches
    overallTotal: v.optional(v.number()),
    estimatedTimeRemaining: v.optional(v.number()), // minutes
    errorCode: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_email", ["email"])
    .index("by_user_provider", ["userId", "provider"])
    .index("by_status", ["status"]),

  // Email receipts parsed from inbox
  emailReceipts: defineTable({
    emailConnectionId: v.id("emailConnections"),
    userId: v.id("users"), // Denormalized for fast queries
    messageId: v.string(), // Gmail message ID or Outlook ID
    from: v.string(), // Sender email
    subject: v.string(),
    receivedAt: v.number(), // When email was received
    merchantName: v.optional(v.string()), // Detected merchant
    amount: v.optional(v.number()),
    currency: v.optional(v.string()),
    billingCycle: v.optional(v.string()), // If mentioned in email
    nextChargeDate: v.optional(v.number()),
    orderId: v.optional(v.string()),
    subscriptionId: v.optional(v.id("subscriptions")), // If matched to existing subscription
    detectionCandidateId: v.optional(v.id("detectionCandidates")), // If created candidate
    parsed: v.boolean(), // Whether we successfully parsed subscription info
    parsingConfidence: v.optional(v.number()), // 0-1 confidence in parsing
    parsingMethod: v.optional(v.union(
      v.literal("ai"),              // Parsed by Claude AI
      v.literal("regex_fallback"),  // AI failed, used regex fallback
      v.literal("filtered")         // Filtered out as non-subscription
    )),
    // Receipt type classification (Phase 2)
    receiptType: v.optional(v.union(
      v.literal("new_subscription"),   // Welcome email, first payment
      v.literal("renewal"),             // Recurring charge, subscription renewed
      v.literal("cancellation"),        // Subscription cancelled, final payment
      v.literal("price_change"),        // Price increase notification
      v.literal("trial_started"),       // Free trial started
      v.literal("trial_ending"),        // Trial ending soon
      v.literal("payment_failed"),      // Payment method issue
      v.literal("unknown")              // Could not classify
    )),
    // NEW: SHA-256 content hashing for deduplication (prevents duplicate AI processing)
    contentHash: v.optional(v.string()), // SHA-256 hash of email body for cache lookup
    contentHashAlgorithm: v.optional(v.string()), // Algorithm used (e.g., "sha256")
    rawBody: v.optional(v.string()), // Store for debugging/reprocessing
    createdAt: v.number(),
  })
    .index("by_connection", ["emailConnectionId"])
    .index("by_user", ["userId"])
    .index("by_message_id", ["messageId"])
    .index("by_merchant", ["merchantName"])
    .index("by_subscription", ["subscriptionId"])
    .index("by_user_received", ["userId", "receivedAt"])
    .index("by_content_hash", ["contentHash"]), // NEW: For SHA-256 cache lookups

  // Distributed locking system for preventing concurrent operations
  distributedLocks: defineTable({
    resourceType: v.string(), // e.g., "emailConnection", "userScan"
    resourceId: v.string(),   // e.g., connection ID, user ID
    ownerId: v.string(),      // Unique identifier for lock owner (session ID)
    acquiredAt: v.number(),   // Timestamp when lock was acquired
    expiresAt: v.number(),    // Timestamp when lock expires (auto-release)
    renewalToken: v.string(), // Secure token for renewal/release operations
    metadata: v.optional(v.record(v.string(), v.any())), // Additional lock metadata
  })
    .index("by_resource", ["resourceType", "resourceId"])
    .index("by_owner", ["ownerId"])
    .index("by_expiry", ["expiresAt"]),

  // Scan sessions for tracking scan lifecycle
  scanSessions: defineTable({
    userId: v.id("users"),
    connectionId: v.id("emailConnections"),
    type: v.union(v.literal("full"), v.literal("incremental")),
    status: v.union(
      v.literal("queued"),
      v.literal("connecting"),
      v.literal("collecting"),
      v.literal("filtering"),
      v.literal("parsing"),
      v.literal("detecting"),
      v.literal("reviewing"),
      v.literal("complete"),
      v.literal("failed"),
      v.literal("paused")
    ),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),

    // Checkpoint for crash recovery
    checkpoint: v.optional(v.object({
      pageToken: v.optional(v.string()),
      lastProcessedMessageId: v.optional(v.string()),
      lastProcessedReceiptId: v.optional(v.id("emailReceipts")),
      emailsCollected: v.number(),
      receiptsProcessed: v.number(),
      candidatesCreated: v.number(),
    })),

    // Statistics
    stats: v.optional(v.object({
      totalEmailsFound: v.number(),
      receiptsIdentified: v.number(),
      subscriptionsDetected: v.number(),
      tokensUsed: v.number(),
      apiCost: v.number(),
      processingTimeMs: v.number(),
    })),

    // Error tracking
    error: v.optional(v.object({
      type: v.union(
        v.literal("transient"),
        v.literal("permanent"),
        v.literal("partial"),
        v.literal("critical")
      ),
      message: v.string(),
      code: v.optional(v.string()),
      retryCount: v.number(),
      lastRetryAt: v.optional(v.number()),
    })),

    // Metadata
    metadata: v.optional(v.record(v.string(), v.any())),
  })
    .index("by_user", ["userId"])
    .index("by_connection", ["connectionId"])
    .index("by_status", ["status"])
    .index("by_user_status", ["userId", "status"]),
});

