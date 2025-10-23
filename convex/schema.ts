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
    // Bank integration fields
    connectionsUsed: v.optional(v.number()), // Number of bank connections currently active
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
    // Bank integration fields
    source: v.optional(v.union(
      v.literal("manual"),
      v.literal("detected"),
      v.literal("email_receipt")
    )),
    detectionConfidence: v.optional(v.number()), // 0-1 confidence score
    merchantId: v.optional(v.id("merchants")),
    lastChargeAt: v.optional(v.number()), // Last transaction date from bank
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

  // ===== BANK INTEGRATION TABLES =====

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

  // Plan entitlements and limits by tier
  planEntitlements: defineTable({
    tier: v.string(), // "free_user", "plus", "automate", "family", "teams"
    connectionsIncluded: v.number(), // Number of free bank connections
    connectionOveragePrice: v.number(), // Price per additional connection (e.g., 3.00 for $3/mo)
    profilesLimit: v.number(), // Number of user profiles allowed
    syncFrequency: v.string(), // "manual", "daily", "hourly"
    canLinkBanks: v.boolean(), // Whether tier allows bank connections at all
    canParseEmails: v.boolean(), // Email receipt parsing
    canUseCancelAssistant: v.boolean(), // Cancel assistant access
    maxHistoryMonths: v.number(), // Transaction history window (24 months max)
    maxAccountsPerConnection: v.number(), // Accounts per institution link (default 3)
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tier", ["tier"]),

  // Plaid institutions metadata
  institutions: defineTable({
    plaidInstitutionId: v.string(), // Plaid's institution ID
    name: v.string(),
    logoUrl: v.optional(v.string()),
    primaryColor: v.optional(v.string()),
    url: v.optional(v.string()),
    countryCode: v.string(), // "US", "CA", etc.
    products: v.array(v.string()), // ["transactions", "auth", "balance"]
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_plaid_id", ["plaidInstitutionId"])
    .index("by_country", ["countryCode"]),

  // Bank connections (one per institution)
  bankConnections: defineTable({
    userId: v.id("users"),
    orgId: v.optional(v.id("organizations")), // For Family/Teams
    institutionId: v.id("institutions"),
    plaidItemId: v.string(), // Plaid's item_id
    accessToken: v.string(), // Encrypted by Convex
    status: v.union(
      v.literal("active"),
      v.literal("disconnected"),
      v.literal("error"),
      v.literal("requires_reauth")
    ),
    consentExpiresAt: v.optional(v.number()),
    lastSyncedAt: v.optional(v.number()),
    syncCursor: v.optional(v.string()), // Plaid transaction sync cursor
    errorCode: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_org", ["orgId"])
    .index("by_status", ["status"])
    .index("by_plaid_item", ["plaidItemId"])
    .index("by_user_status", ["userId", "status"]),

  // Bank accounts within a connection
  accounts: defineTable({
    bankConnectionId: v.id("bankConnections"),
    plaidAccountId: v.string(),
    name: v.string(), // "Checking", "Credit Card"
    officialName: v.optional(v.string()),
    type: v.string(), // "depository", "credit", "loan", etc.
    subtype: v.optional(v.string()), // "checking", "savings", "credit card"
    mask: v.optional(v.string()), // Last 4 digits
    currency: v.string(),
    balanceCurrent: v.optional(v.number()),
    balanceAvailable: v.optional(v.number()),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_connection", ["bankConnectionId"])
    .index("by_plaid_id", ["plaidAccountId"])
    .index("by_connection_active", ["bankConnectionId", "isActive"]),

  // Transactions from bank accounts
  transactions: defineTable({
    accountId: v.id("accounts"),
    plaidTransactionId: v.string(),
    merchantId: v.optional(v.id("merchants")),
    amount: v.number(), // Positive = debit, Negative = credit (Plaid convention)
    currency: v.string(),
    date: v.string(), // YYYY-MM-DD (authorized date)
    authorizedDate: v.optional(v.string()),
    postedDate: v.optional(v.string()),
    merchantName: v.optional(v.string()), // Raw merchant name from Plaid
    merchantNameNormalized: v.optional(v.string()), // Normalized by our system
    categoryId: v.optional(v.string()), // Plaid category ID
    category: v.optional(v.array(v.string())), // Plaid category hierarchy
    pending: v.boolean(),
    paymentChannel: v.optional(v.string()), // "online", "in store", etc.
    transactionType: v.optional(v.string()),
    description: v.optional(v.string()),
    mcc: v.optional(v.string()), // Merchant Category Code
    hash: v.string(), // For deduplication
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_account", ["accountId"])
    .index("by_plaid_id", ["plaidTransactionId"])
    .index("by_merchant", ["merchantId"])
    .index("by_date", ["date"])
    .index("by_account_date", ["accountId", "date"])
    .index("by_hash", ["hash"]),

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
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_name", ["displayName"])
    .index("by_provider_key", ["knownProviderKey"]),

  // Subscription detection candidates (pending user review)
  detectionCandidates: defineTable({
    userId: v.id("users"),
    merchantId: v.optional(v.id("merchants")), // Optional for email-based detection
    transactionIds: v.optional(v.array(v.id("transactions"))), // Optional for email-based detection
    proposedName: v.string(),
    proposedAmount: v.number(),
    proposedCurrency: v.string(),
    proposedCadence: v.union(v.literal("weekly"), v.literal("monthly"), v.literal("yearly")),
    proposedNextBilling: v.number(),
    confidence: v.number(), // 0-1
    detectionReason: v.string(), // Human-readable explanation
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
      v.literal("bank"),
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
    userId: v.id("users"),
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
    // CRITICAL: Explicit scan state machine for proper tracking (FIX #2 from audit)
    scanState: v.optional(v.union(
      v.literal("idle"),
      v.literal("scanning_gmail"),
      v.literal("processing_batch_1"),
      v.literal("processing_batch_2"),
      v.literal("processing_batch_3"),
      v.literal("processing_batch_4"),
      v.literal("processing_batch_5"),
      v.literal("processing_batch_6"),
      v.literal("processing_batch_7"),
      v.literal("complete"),
      v.literal("error")
    )),
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
    rawBody: v.optional(v.string()), // Store for debugging/reprocessing
    createdAt: v.number(),
  })
    .index("by_connection", ["emailConnectionId"])
    .index("by_user", ["userId"])
    .index("by_message_id", ["messageId"])
    .index("by_merchant", ["merchantName"])
    .index("by_subscription", ["subscriptionId"])
    .index("by_user_received", ["userId", "receivedAt"]),
});

