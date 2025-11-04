/**
 * SMART PRE-FILTER: Reduce 2,000+ emails to 200-300 subscription-likely emails
 * Runs BEFORE AI parsing to save $4-5 per scan
 *
 * Cost: $0 (pure regex/heuristics, no API calls)
 * Impact: 80-90% email reduction
 */

interface EmailMessage {
  subject: string;
  body: string;
  from: string;
}

interface FilterResult {
  isSubscriptionLikely: boolean;
  confidence: "high" | "medium" | "low";
  reason: string;
}

/**
 * SMART FILTER: Determines if email is subscription-related
 * Returns true only for emails that look like subscription receipts/renewals
 */
export function isSubscriptionEmail(email: EmailMessage): FilterResult {
  const subject = email.subject.toLowerCase();
  const body = email.body.toLowerCase();
  const from = email.from.toLowerCase();

  // ============================================================================
  // PHASE 1: HIGH CONFIDENCE - Obvious subscriptions
  // ============================================================================

  // Subscription-specific keywords in subject
  const subscriptionSubjectKeywords = [
    "subscription",
    "recurring payment",
    "auto-renewal",
    "membership renewal",
    "plan renewed",
    "subscription renewed",
    "your plan",
    "premium plan",
    "pro plan",
  ];

  for (const keyword of subscriptionSubjectKeywords) {
    if (subject.includes(keyword)) {
      return {
        isSubscriptionLikely: true,
        confidence: "high",
        reason: `Subject contains '${keyword}'`,
      };
    }
  }

  // Billing/payment keywords (accept even without amount - parser will validate)
  const billingKeywords = [
    { keyword: "invoice", requiresAmount: false },  // "Payment received for invoice" is clearly a payment
    { keyword: "receipt", requiresAmount: false },  // "Receipt from X" is clearly a payment
    { keyword: "payment received", requiresAmount: false },  // "Payment received" is explicitly a payment
    { keyword: "billing", requiresAmount: true },  // "Billing" alone is too vague, needs amount
    { keyword: "payment", requiresAmount: true },  // "Payment" alone is too vague, needs amount
  ];

  const hasAmount = /\$\d+(\.\d{2})?|\£\d+(\.\d{2})?|\€\d+(\.\d{2})?/.test(body) || /\$\d+(\.\d{2})?|\£\d+(\.\d{2})?|\€\d+(\.\d{2})?/.test(subject);

  for (const {keyword, requiresAmount} of billingKeywords) {
    if (subject.includes(keyword)) {
      if (!requiresAmount || hasAmount) {
        return {
          isSubscriptionLikely: true,
          confidence: "high",
          reason: `Subject has '${keyword}'${hasAmount ? ' + amount found' : ''}`,
        };
      }
    }
  }

  // "Your receipt from [Merchant]" pattern (even without amount in subject)
  if (/your receipt from/i.test(subject)) {
    return {
      isSubscriptionLikely: true,
      confidence: "high",
      reason: "Receipt email from merchant",
    };
  }

  // ============================================================================
  // PHASE 2: BODY ANALYSIS - Renewal/next billing indicators
  // ============================================================================

  const renewalPatterns = [
    /next\s+(billing|payment|charge)/i,
    /renew(s|al|ed)?\s+on/i,
    /automatic\s+(billing|payment|renewal)/i,
    /monthly\s+(subscription|plan|payment)/i,
    /annual\s+(subscription|plan|payment)/i,
    /will\s+(be\s+)?charged\s+on/i,
    /subscription\s+(will\s+)?renew/i,
  ];

  for (const pattern of renewalPatterns) {
    if (pattern.test(body)) {
      return {
        isSubscriptionLikely: true,
        confidence: "high",
        reason: `Body matches renewal pattern: ${pattern}`,
      };
    }
  }

  // ============================================================================
  // PHASE 3: EXCLUDE - Obvious non-subscriptions
  // ============================================================================

  // One-time purchase indicators
  const oneTimePurchaseKeywords = [
    "order shipped",
    "tracking number",
    "delivery update",
    "out for delivery",
    "package delivered",
    "return your order",
    "order confirmation", // Unless it also mentions subscription
  ];

  for (const keyword of oneTimePurchaseKeywords) {
    if (subject.includes(keyword) || body.includes(keyword)) {
      // Exception: If it also mentions subscription, keep it
      if (!body.includes("subscription") && !subject.includes("subscription")) {
        return {
          isSubscriptionLikely: false,
          confidence: "high",
          reason: `One-time purchase indicator: '${keyword}'`,
        };
      }
    }
  }

  // Marketing/promotional emails (reject these - they're not billing receipts!)
  const marketingKeywords = [
    "special offer",
    "limited time",
    "sale ends",
    "flash sale",
    "exclusive deal",
    "get \d+% off",
    "\d+% off",           // "90% off", "50% off" etc
    "summer sale",
    "winter sale",
    "black friday",
    "cyber monday",
    "discount",
    "save \$",
    "limited-time deal",
    "extend your subscription.*\d+% off",  // Surfshark type promos
    "pay only \$\d+",     // "pay only $1.54" promotional pricing
  ];

  for (const keyword of marketingKeywords) {
    const regex = new RegExp(keyword, "i");
    if (regex.test(subject) || regex.test(body)) {
      return {
        isSubscriptionLikely: false,
        confidence: "high",
        reason: `Marketing email: '${keyword}'`,
      };
    }
  }

  // ============================================================================
  // PHASE 4: MEDIUM CONFIDENCE - Weak signals
  // ============================================================================

  // Has "thank you for your payment" + amount
  if (
    (body.includes("thank you for your payment") || body.includes("payment received")) &&
    hasAmount
  ) {
    return {
      isSubscriptionLikely: true,
      confidence: "medium",
      reason: "Payment confirmation with amount",
    };
  }

  // Known subscription merchants (from email domain)
  const knownSubscriptionDomains = [
    "openai.com",
    "anthropic.com",
    "perplexity.ai",
    "cursor.sh",
    "spotify.com",
    "netflix.com",
    "github.com",
    "vercel.com",
    "patreon.com",
    "surfshark.com",      // VPN subscription
    "x.com",              // X Premium (Twitter)
    "twitter.com",        // X Premium (legacy domain)
    "telegram.org",       // Telegram Premium
    "t.me",               // Telegram (short domain)
    // Add more from merchants table dynamically
  ];

  for (const domain of knownSubscriptionDomains) {
    if (from.includes(domain)) {
      // If from known merchant + has amount, medium confidence
      if (hasAmount) {
        return {
          isSubscriptionLikely: true,
          confidence: "medium",
          reason: `Known subscription merchant (${domain}) + amount`,
        };
      }
    }
  }

  // ============================================================================
  // PHASE 5: LOW CONFIDENCE - Default to false
  // ============================================================================

  return {
    isSubscriptionLikely: false,
    confidence: "low",
    reason: "No strong subscription indicators found",
  };
}

/**
 * Filter array of emails, return only subscription-likely ones
 * Expected: 2,000 emails → 200-300 filtered
 */
export function filterSubscriptionEmails(emails: EmailMessage[]): {
  filtered: EmailMessage[];
  stats: {
    total: number;
    kept: number;
    filtered: number;
    highConfidence: number;
    mediumConfidence: number;
  };
} {
  let kept = 0;
  let highConfidence = 0;
  let mediumConfidence = 0;

  const filtered = emails.filter((email) => {
    const result = isSubscriptionEmail(email);

    if (result.isSubscriptionLikely) {
      kept++;
      if (result.confidence === "high") highConfidence++;
      if (result.confidence === "medium") mediumConfidence++;
      return true;
    }

    return false;
  });

  return {
    filtered,
    stats: {
      total: emails.length,
      kept,
      filtered: emails.length - kept,
      highConfidence,
      mediumConfidence,
    },
  };
}
