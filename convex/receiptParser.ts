/**
 * Receipt Parser Service
 * Parses email receipts to extract subscription information
 */

import { v } from "convex/values";
import { mutation, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * Parse receipt data - core logic extracted for reuse
 */
function parseReceiptData(receipt: {
  subject: string;
  rawBody?: string | null;
  from: string;
}) {
  // Combine subject and body for parsing
  const text = `${receipt.subject}\n${receipt.rawBody || ""}`.toLowerCase();

  // Extract merchant name
  const merchantResult = extractMerchant(text, receipt.from, receipt.subject);

  // Extract amount and currency
  const amountResult = extractAmount(text);

  // Extract billing cycle
  const billingCycle = extractBillingCycle(text);

  // Extract next charge date
  const nextChargeDate = extractNextChargeDate(text);

  // Calculate confidence score
  const confidence = calculateConfidence({
    hasMerchant: !!merchantResult.name,
    hasAmount: !!amountResult.amount,
    hasCurrency: !!amountResult.currency,
    hasBillingCycle: !!billingCycle,
    hasNextChargeDate: !!nextChargeDate,
    merchantConfidence: merchantResult.confidence,
  });

  return {
    merchantName: merchantResult.name,
    amount: amountResult.amount,
    currency: amountResult.currency,
    billingCycle,
    nextChargeDate,
    confidence,
  };
}

/**
 * Parse a single email receipt
 * Extracts merchant name, amount, currency, billing cycle
 */
export const parseReceipt = internalMutation({
  args: {
    receiptId: v.id("emailReceipts"),
  },
  handler: async (ctx, args) => {
    const receipt = await ctx.db.get(args.receiptId);
    if (!receipt) {
      return { success: false, error: "Receipt not found" };
    }

    if (receipt.parsed) {
      return { success: true, message: "Already parsed" };
    }

    try {
      const parsed = parseReceiptData(receipt);

      // Only save if we have at least merchant + amount
      if (parsed.merchantName && parsed.amount) {
        await ctx.db.patch(receipt._id, {
          merchantName: parsed.merchantName,
          amount: parsed.amount,
          currency: parsed.currency,
          billingCycle: parsed.billingCycle || undefined,
          nextChargeDate: parsed.nextChargeDate || undefined,
          parsed: true,
          parsingConfidence: parsed.confidence,
        });

        console.log(`✅ Parsed receipt: ${parsed.merchantName} - ${parsed.amount} ${parsed.currency}`);

        return {
          success: true,
          merchant: parsed.merchantName,
          amount: parsed.amount,
          currency: parsed.currency,
          confidence: parsed.confidence,
        };
      } else {
        // Mark as parsed but low confidence (won't create detection)
        await ctx.db.patch(receipt._id, {
          parsed: true,
          parsingConfidence: 0.1,
        });

        return { success: false, error: "Insufficient data extracted" };
      }
    } catch (error) {
      console.error("❌ Error parsing receipt:", error);
      return { success: false, error: "Parse failed" };
    }
  },
});

/**
 * Parse all unparsed receipts for a user
 * SYNCHRONOUSLY parses receipts so they're immediately ready for detection
 */
export const parseUnparsedReceipts = internalMutation({
  args: {
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkUserId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Get unparsed receipts OR receipts marked as parsed but missing actual data
    // This handles cases where receipts were marked "parsed" by the broken async system
    // but don't actually have merchantName/amount extracted
    const allReceipts = await ctx.db
      .query("emailReceipts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .take(200); // Get more receipts to filter

    const receiptsToProcess = allReceipts.filter(
      (receipt) =>
        // Either not parsed yet
        !receipt.parsed ||
        // Or marked as parsed but missing critical data (broken parse)
        (!receipt.merchantName && !receipt.amount)
    ).slice(0, 100); // Process max 100 at a time

    if (receiptsToProcess.length === 0) {
      console.log("📋 No receipts need parsing (all receipts have valid data)");
      return { message: "No receipts need parsing", count: 0, parsed: 0 };
    }

    console.log(`📋 Found ${receiptsToProcess.length} receipts to parse (${allReceipts.filter(r => !r.parsed).length} unparsed, ${allReceipts.filter(r => r.parsed && !r.merchantName && !r.amount).length} incomplete)`);

    console.log(`📋 Parsing ${receiptsToProcess.length} receipts synchronously...`);

    let successCount = 0;
    let failCount = 0;

    // Parse each receipt SYNCHRONOUSLY (not scheduled)
    for (const receipt of receiptsToProcess) {
      try {
        const parsed = parseReceiptData(receipt);

        // Only save if we have at least merchant + amount
        if (parsed.merchantName && parsed.amount) {
          await ctx.db.patch(receipt._id, {
            merchantName: parsed.merchantName,
            amount: parsed.amount,
            currency: parsed.currency,
            billingCycle: parsed.billingCycle || undefined,
            nextChargeDate: parsed.nextChargeDate || undefined,
            parsed: true,
            parsingConfidence: parsed.confidence,
          });

          console.log(`  ✅ ${parsed.merchantName}: ${parsed.amount} ${parsed.currency} (${Math.round(parsed.confidence * 100)}% confidence)`);
          successCount++;
        } else {
          // Mark as parsed but low confidence (won't create detection)
          await ctx.db.patch(receipt._id, {
            parsed: true,
            parsingConfidence: 0.1,
          });
          failCount++;
        }
      } catch (error) {
        console.error(`  ❌ Error parsing receipt ${receipt._id}:`, error);
        failCount++;
      }
    }

    console.log(`📋 Parsing complete: ${successCount} successful, ${failCount} failed/low-confidence`);

    return {
      message: `Parsed ${receiptsToProcess.length} receipts: ${successCount} successful`,
      count: receiptsToProcess.length,
      parsed: successCount,
      failed: failCount,
    };
  },
});

// ============================================================================
// EXTRACTION FUNCTIONS
// ============================================================================

/**
 * Extract merchant name from email
 */
function extractMerchant(
  text: string,
  from: string,
  subject: string
): { name: string | null; confidence: number } {
  // Known merchant patterns (most common subscription services)
  const knownMerchants = [
    { pattern: /netflix/i, name: "Netflix" },
    { pattern: /spotify/i, name: "Spotify" },
    { pattern: /apple\s*(music|tv|arcade|one)/i, name: "Apple" },
    { pattern: /amazon\s*prime/i, name: "Amazon Prime" },
    { pattern: /disney\+|disneyplus/i, name: "Disney+" },
    { pattern: /hbo\s*max/i, name: "HBO Max" },
    { pattern: /hulu/i, name: "Hulu" },
    { pattern: /youtube\s*(premium|music)/i, name: "YouTube Premium" },
    { pattern: /microsoft\s*365/i, name: "Microsoft 365" },
    { pattern: /adobe/i, name: "Adobe" },
    { pattern: /dropbox/i, name: "Dropbox" },
    { pattern: /google\s*(one|workspace)/i, name: "Google One" },
    { pattern: /icloud/i, name: "iCloud" },
    { pattern: /notion/i, name: "Notion" },
    { pattern: /slack/i, name: "Slack" },
    { pattern: /zoom/i, name: "Zoom" },
    { pattern: /github/i, name: "GitHub" },
    { pattern: /linkedin\s*premium/i, name: "LinkedIn Premium" },
    { pattern: /canva/i, name: "Canva" },
    { pattern: /grammarly/i, name: "Grammarly" },
    { pattern: /nordvpn|expressvpn|protonvpn/i, name: "VPN Service" },
    { pattern: /new york times|nytimes/i, name: "New York Times" },
    { pattern: /washington post/i, name: "Washington Post" },
    { pattern: /audible/i, name: "Audible" },
    { pattern: /kindle unlimited/i, name: "Kindle Unlimited" },
    { pattern: /peloton/i, name: "Peloton" },
    { pattern: /headspace|calm/i, name: "Meditation App" },
    { pattern: /duolingo/i, name: "Duolingo" },
    { pattern: /coursera|udemy|skillshare/i, name: "Online Learning" },
    { pattern: /patreon/i, name: "Patreon" },
    { pattern: /onlyfans/i, name: "OnlyFans" },
    { pattern: /squarespace|wix|wordpress/i, name: "Website Builder" },
    { pattern: /mailchimp/i, name: "Mailchimp" },
    { pattern: /salesforce/i, name: "Salesforce" },
    { pattern: /hubspot/i, name: "HubSpot" },
    { pattern: /shopify/i, name: "Shopify" },
    { pattern: /quickbooks/i, name: "QuickBooks" },
    { pattern: /dashlane|1password|lastpass/i, name: "Password Manager" },
    { pattern: /evernote/i, name: "Evernote" },
    { pattern: /trello|asana|monday\.com/i, name: "Project Management" },
    { pattern: /figma/i, name: "Figma" },
    { pattern: /cloudflare/i, name: "Cloudflare" },
    { pattern: /aws|amazon web services/i, name: "AWS" },
    { pattern: /vercel/i, name: "Vercel" },
    { pattern: /heroku/i, name: "Heroku" },
    { pattern: /twilio/i, name: "Twilio" },
    { pattern: /stripe/i, name: "Stripe" },
  ];

  // Check known merchants first (high confidence)
  for (const merchant of knownMerchants) {
    if (merchant.pattern.test(text) || merchant.pattern.test(from)) {
      return { name: merchant.name, confidence: 0.95 };
    }
  }

  // Try to extract from "from" email address
  // Example: noreply@spotify.com → Spotify
  const emailMatch = from.match(/@([a-zA-Z0-9-]+)\./);
  if (emailMatch) {
    const domain = emailMatch[1];
    // Filter out generic domains
    const genericDomains = ["gmail", "yahoo", "outlook", "hotmail", "mail", "email", "noreply"];
    if (!genericDomains.includes(domain.toLowerCase())) {
      // Capitalize first letter
      const name = domain.charAt(0).toUpperCase() + domain.slice(1);
      return { name, confidence: 0.7 };
    }
  }

  // Try to extract from subject line
  // Example: "Your Netflix receipt" → Netflix
  const subjectMatch = subject.match(/(?:your|from)\s+([A-Z][a-zA-Z0-9\s]+?)(?:\s+(?:receipt|invoice|payment|subscription))/i);
  if (subjectMatch) {
    const name = subjectMatch[1].trim();
    if (name.length > 2 && name.length < 30) {
      return { name, confidence: 0.6 };
    }
  }

  // Last resort: use domain from email
  if (emailMatch) {
    const domain = emailMatch[1];
    const name = domain.charAt(0).toUpperCase() + domain.slice(1);
    return { name, confidence: 0.4 };
  }

  return { name: null, confidence: 0 };
}

/**
 * Extract amount and currency from email text
 */
function extractAmount(text: string): { amount: number | null; currency: string } {
  // Currency patterns
  const currencyPatterns = [
    { symbol: "$", code: "USD", pattern: /\$\s*(\d+(?:[.,]\d{2})?)/ },
    { symbol: "£", code: "GBP", pattern: /£\s*(\d+(?:[.,]\d{2})?)/ },
    { symbol: "€", code: "EUR", pattern: /€\s*(\d+(?:[.,]\d{2})?)/ },
    { symbol: "USD", code: "USD", pattern: /(\d+(?:[.,]\d{2})?)\s*USD/ },
    { symbol: "GBP", code: "GBP", pattern: /(\d+(?:[.,]\d{2})?)\s*GBP/ },
    { symbol: "EUR", code: "EUR", pattern: /(\d+(?:[.,]\d{2})?)\s*EUR/ },
  ];

  // Look for amount with currency symbol
  for (const currency of currencyPatterns) {
    const match = text.match(currency.pattern);
    if (match) {
      const amountStr = match[1].replace(",", ".");
      const amount = parseFloat(amountStr);
      if (amount > 0 && amount < 10000) {
        // Reasonable subscription range
        return { amount, currency: currency.code };
      }
    }
  }

  // Fallback: look for "total" or "amount" with number
  const totalMatch = text.match(/(?:total|amount|charged|paid)[\s:]*\$?\s*(\d+(?:[.,]\d{2})?)/i);
  if (totalMatch) {
    const amountStr = totalMatch[1].replace(",", ".");
    const amount = parseFloat(amountStr);
    if (amount > 0 && amount < 10000) {
      return { amount, currency: "USD" }; // Default to USD
    }
  }

  return { amount: null, currency: "USD" };
}

/**
 * Extract billing cycle from email text
 */
function extractBillingCycle(text: string): string | null {
  if (/monthly|per month|\/month|\/mo\b/i.test(text)) {
    return "monthly";
  }
  if (/yearly|annually|per year|\/year|\/yr\b/i.test(text)) {
    return "yearly";
  }
  if (/quarterly|3 months/i.test(text)) {
    return "quarterly";
  }
  if (/weekly|per week|\/week/i.test(text)) {
    return "weekly";
  }

  // Default to monthly for most subscriptions
  if (/subscription|recurring/i.test(text)) {
    return "monthly";
  }

  return null;
}

/**
 * Extract next charge date from email text
 */
function extractNextChargeDate(text: string): number | null {
  // Look for patterns like "next charge on [date]"
  const datePatterns = [
    /next\s+(?:charge|payment|billing)\s+(?:on|date)[\s:]*([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i,
    /renews?\s+on[\s:]*([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i,
    /(?:due|charged)\s+on[\s:]*([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i,
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      try {
        const dateStr = match[1];
        const timestamp = Date.parse(dateStr);
        if (!isNaN(timestamp)) {
          return timestamp;
        }
      } catch (error) {
        console.error("Error parsing date:", error);
      }
    }
  }

  // Look for ISO date format
  const isoMatch = text.match(/(\d{4}-\d{2}-\d{2})/);
  if (isoMatch) {
    try {
      const timestamp = Date.parse(isoMatch[1]);
      if (!isNaN(timestamp)) {
        return timestamp;
      }
    } catch (error) {
      console.error("Error parsing ISO date:", error);
    }
  }

  return null;
}

/**
 * Calculate confidence score based on extracted data
 */
function calculateConfidence(data: {
  hasMerchant: boolean;
  hasAmount: boolean;
  hasCurrency: boolean;
  hasBillingCycle: boolean;
  hasNextChargeDate: boolean;
  merchantConfidence: number;
}): number {
  let score = 0;

  // Merchant (40% weight)
  if (data.hasMerchant) {
    score += 0.4 * data.merchantConfidence;
  }

  // Amount (30% weight)
  if (data.hasAmount) {
    score += 0.3;
  }

  // Currency (10% weight)
  if (data.hasCurrency) {
    score += 0.1;
  }

  // Billing cycle (10% weight)
  if (data.hasBillingCycle) {
    score += 0.1;
  }

  // Next charge date (10% weight)
  if (data.hasNextChargeDate) {
    score += 0.1;
  }

  return Math.min(score, 1.0);
}
