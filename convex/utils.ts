/**
 * Shared Utility Functions
 * Single source of truth for merchant name normalization and common utilities
 */

/**
 * Normalize merchant name for consistent grouping
 * Handles payment processors, variants, and service extraction
 *
 * Examples:
 * - "Apple (X Premium)" → "x"
 * - "Surfshark VPN: Fast VPN App" → "surfshark vpn"
 * - "Microsoft 365" → "microsoft"
 * - "Stripe (Vercel Inc.)" → "vercel"
 */
export function normalizeMerchantName(name: string | null | undefined): string {
  if (!name) return "";

  let normalized = name.trim();

  // ============================================================================
  // PAYMENT PROCESSOR EXTRACTION
  // Extract actual service from payment processor wrapper
  // ============================================================================

  // Pattern: "Apple (Service Name)" → extract "Service Name"
  const paymentProcessorPattern = /^(apple|stripe|paypal|google|paddle)\s*\(([^)]+)\)$/i;
  const processorMatch = normalized.match(paymentProcessorPattern);

  if (processorMatch) {
    // Extract service name from parentheses
    normalized = processorMatch[2].trim();

    // Clean up the service name
    // "X Premium (Monthly)" → "X Premium"
    normalized = normalized.replace(/\s*\([^)]*\)$/i, "").trim();

    // Remove common subscription tier suffixes
    // "X Premium" → "X", "Surfshark VPN Plus" → "Surfshark VPN"
    normalized = normalized.replace(/\s+(premium|plus|pro|basic|standard|monthly|annual|yearly)$/i, "").trim();
  }

  // ============================================================================
  // APPLE HTML EMAIL EXTRACTION
  // Handle format: "Apple – Service Name" (em dash separator)
  // ============================================================================

  // Pattern: "Apple – X Premium" → extract "X Premium"
  const appleDashPattern = /^apple\s*[–—-]\s*(.+)$/i;
  const appleDashMatch = normalized.match(appleDashPattern);

  if (appleDashMatch) {
    normalized = appleDashMatch[1].trim();
    // Remove subscription tier suffixes
    normalized = normalized.replace(/\s+(premium|plus|pro|basic|standard|monthly|annual|yearly)$/i, "").trim();
  }

  // ============================================================================
  // SERVICE NAME VARIANTS
  // Normalize different naming conventions for the same service
  // ============================================================================

  // Microsoft variants: "Microsoft 365", "Microsoft Office 365" → "microsoft"
  if (normalized.match(/microsoft\s*(office\s*)?365/i)) {
    return "microsoft";
  }

  // X/Twitter variants: "X (Formerly Twitter)", "X Premium", "Twitter" → "x"
  if (normalized.match(/^(x|twitter)(\s+\(formerly\s+twitter\))?(\s+(premium|plus|blue))?$/i)) {
    return "x";
  }

  // PlayStation variants: normalize to "playstation"
  if (/^playstation(\s|$)/i.test(name) || /ps\s*plus/i.test(name) || /ps\s*network/i.test(name)) {
    return "playstation";
  }

  // Anthropic variants
  if (/^anthropic(,\s*pbc)?$/i.test(name)) {
    return "anthropic";
  }

  // Surfshark variants: Remove app store suffixes
  // "Surfshark VPN: Fast & Reliable" → "surfshark vpn"
  // "Surfshark VPN: Fast VPN App" → "surfshark vpn"
  if (normalized.toLowerCase().startsWith("surfshark")) {
    normalized = normalized.split(":")[0].trim(); // Take before colon
  }

  // Adobe variants: "Adobe Creative Cloud", "Adobe Inc." → "adobe"
  if (normalized.match(/^adobe(\s+(creative\s+cloud|inc\.?|systems))?$/i)) {
    return "adobe";
  }

  // ============================================================================
  // GENERIC CLEANING
  // ============================================================================

  // Convert to lowercase for case-insensitive matching
  normalized = normalized.toLowerCase();

  // Remove app store suffixes (everything after colon)
  // "Service: Description" → "Service"
  normalized = normalized.split(":")[0].trim();

  // Normalize whitespace (multiple spaces → single space)
  normalized = normalized.replace(/\s+/g, " ");

  // Remove legal entity suffixes
  // "Company Inc.", "Service LLC" → "Company", "Service"
  normalized = normalized.replace(/[,.]?\s*(inc\.?|llc|ltd\.?|limited|corp\.?|corporation|store)$/i, "");

  // Remove trailing periods and commas
  normalized = normalized.replace(/[,.\s]+$/, "");

  // Final trim
  normalized = normalized.trim();

  return normalized || name.toLowerCase().trim(); // Fallback to original if empty
}

/**
 * Extract service name from Apple HTML receipt
 * Tries multiple patterns to handle different Apple receipt formats
 *
 * @param subject - Email subject line
 * @param htmlBody - Raw HTML body of the email
 * @returns Extracted service name or null if not found
 */
export function extractAppleServiceName(subject: string, htmlBody: string): string | null {
  // Only process if this is an Apple receipt
  if (!subject.toLowerCase().includes("apple")) {
    return null;
  }

  // ============================================================================
  // APPLE RECEIPT PATTERNS (Multiple formats over time)
  // ============================================================================

  const patterns = [
    // Format 1: Old receipts (~12KB) - <p class="custom-gzadzy">Service</p>
    /<p class="custom-gzadzy">([^<]+)<\/p>/i,

    // Format 2: Table format - <td>Service Name</td><td>$XX.XX</td>
    /<td[^>]*>\s*([A-Z][A-Za-z0-9 +:.&()-]{2,50}?)\s*<\/td>\s*<td[^>]*>\s*[£$€₹¥]\s*[\d,]+\.\d{2}/i,

    // Format 3: Paragraph with price - <p>Service Name</p>\n<price>
    /<p[^>]*>\s*([A-Z][A-Za-z0-9 +:.&()-]{2,50}?)\s*<\/p>\s*[^<]*[£$€₹¥]\s*[\d,]+\.\d{2}/i,

    // Format 4: Span with price - <span>Service Name</span><price>
    /<span[^>]*>\s*([A-Z][A-Za-z0-9 +:.&()-]{2,50}?)\s*<\/span>\s*[^<]*[£$€₹¥]\s*[\d,]+\.\d{2}/i,

    // Format 5: Text followed by price (fallback) - Service Name $XX.XX
    /\b([A-Z][A-Za-z0-9 +:.&()-]{2,50}?)\s*[£$€₹¥]\s*[\d,]+\.\d{2}/im,

    // Format 6: Apple em dash format - "Apple – Service Name"
    /Apple\s*[–—-]\s*([A-Z][A-Za-z0-9 +:.&()-]{2,50})/i,

    // Format 7: Bold service name - <b>Service Name</b>
    /<b[^>]*>\s*([A-Z][A-Za-z0-9 +:.&()-]{2,50}?)\s*<\/b>/i,

    // Format 8: Strong tag - <strong>Service Name</strong>
    /<strong[^>]*>\s*([A-Z][A-Za-z0-9 +:.&()-]{2,50}?)\s*<\/strong>/i,

    // Format 9: Row label table - <td>Description</td><td>Service</td>
    /<td[^>]*>\s*(?:Description|Item|Subscription|Plan)\s*<\/td>\s*<td[^>]*>\s*([A-Z][A-Za-z0-9 +:.&()\/-]{2,60})\s*<\/td>/i,

    // Format 10: Definition list - <th>Description</th><td>Service</td>
    /<th[^>]*>\s*(?:Description|Item|Subscription|Plan)\s*<\/th>\s*<td[^>]*>\s*([A-Z][A-Za-z0-9 +:.&()\/-]{2,60})\s*<\/td>/i,

    // Format 11: Narrative text - "You have been billed for <Service>"
    /(?:billed\s+for|renewed\s+for|subscription\s+for)\s+([A-Z][A-Za-z0-9 +:.&()\/-]{2,60})/i,

    // Format 12: List item - <li>Service Name</li> near price
    /<li[^>]*>\s*([A-Z][A-Za-z0-9 +:.&()\/-]{2,60})\s*<\/li>\s*[^<]{0,40}[£$€₹¥]\s*[\d,]+\.\d{2}/i,
    // Format 13: Anchor to App Store page - <a href="https://apps.apple.com/...">Service</a>
    /<a[^>]+href="https?:\/\/(?:apps|itunes)\.apple\.com[^"]*"[^>]*>\s*([A-Z][A-Za-z0-9 +:.&()\/-]{2,60})\s*<\/a>/i,
    // Format 14: Table label/value without price - App/Subscription/Item label then value
    /<td[^>]*>\s*(?:App|Subscription|Item)\s*<\/td>\s*<td[^>]*>\s*([A-Z][A-Za-z0-9 +:.&()\/-]{2,60})\s*<\/td>/i,
    // Format 15: Anchor text nested with span around app name
    /<a[^>]+href="https?:\/\/(?:apps|itunes)\.apple\.com[^"]*"[^>]*>\s*(?:<span[^>]*>)?\s*([A-Z][A-Za-z0-9 +:.&()\/-]{2,60})\s*(?:<\/span>)?\s*<\/a>/i,
  ];

  for (const pattern of patterns) {
    const match = htmlBody.match(pattern);

    if (match && match[1]) {
      let serviceName = match[1].trim();

      // ============================================================================
      // VALIDATION: Reject if it looks like noise
      // ============================================================================

      // Skip if it's just "Apple"
      if (serviceName.toLowerCase() === "apple") {
        continue;
      }

      // Skip if it's generic receipt text
      const noisePatterns = [
        /^(receipt|invoice|order|total|subtotal|tax|payment|billing|date|description|item|quantity|price|amount|your|the|this|that)$/i,
        /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i, // Month names
        /^\d+$/, // Just numbers
        /^[£$€₹¥]\s*[\d,]+/, // Just prices
      ];

      if (noisePatterns.some(p => p.test(serviceName))) {
        continue;
      }

      // Skip if too short (likely not a service name)
      if (serviceName.length < 3) {
        continue;
      }

      // Skip if it's obviously not a service (all caps spam-like text)
      if (serviceName.length > 30 && serviceName === serviceName.toUpperCase()) {
        continue;
      }

      // ============================================================================
      // CLEANING: Remove common suffixes and formatting
      // ============================================================================

      // Remove parenthetical info: "Service (Monthly)" → "Service"
      serviceName = serviceName.replace(/\s*\([^)]*\)$/i, "").trim();

      // Remove trailing pricing info: "Service - $9.99" → "Service"
      serviceName = serviceName.replace(/\s*[-–—]\s*[£$€₹¥].*$/i, "").trim();

      // Remove subscription tier suffixes
      serviceName = serviceName.replace(/\s+(premium|plus|pro|basic|standard|monthly|annual|yearly)$/i, "").trim();

      // If we got a valid service name, return it
      if (serviceName.length >= 2 && !serviceName.match(/^(apple|receipt|invoice)$/i)) {
        return serviceName;
      }
    }
  }

  // TEXT FALLBACK: strip tags and look for "<Service> ... Renews <date>"
  const textOnly = htmlBody
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const renewMatch = textOnly.match(/([A-Z][A-Za-z0-9 :.'&()\/-]{2,60})\s+(?:Unlimited|Premium|Pro|Plan|Subscription|Now|Monthly|Yearly|Annual|1\s*Year|12[-\s]*month)?[^]{0,120}?\bRenews\b/i);
  if (renewMatch && renewMatch[1]) {
    const candidate = renewMatch[1].trim();
    const lower = candidate.toLowerCase();
    if (lower !== "apple" && lower !== "invoice") {
      return candidate.replace(/\s*\([^)]*\)$/, "").trim();
    }
  }

  // Fallback 2a: Look back from the Renews token to capture the nearest product line
  const renewIndex = textOnly.indexOf("Renews");
  if (renewIndex > 0) {
    const windowStart = Math.max(0, renewIndex - 180);
    const lookback = textOnly.substring(windowStart, renewIndex);
    // Take the last reasonable capitalized phrase in the lookback window
    const candidates = lookback.match(/([A-Z][A-Za-z0-9 :.'&()\/-]{2,80})/g);
    if (candidates && candidates.length > 0) {
      // Prefer the last non-generic candidate
      for (let i = candidates.length - 1; i >= 0; i--) {
        const c = candidates[i].trim();
        const lc = c.toLowerCase();
        if (lc !== "apple" && lc !== "invoice" && lc !== "billing and payment") {
          return c.replace(/\s*\([^)]*\)$/, "").trim();
        }
      }
    }
  }

  // Fallback 2: BRAND: Product Name ... Renews <date>
  const brandColon = textOnly.match(/([A-Z][A-Z0-9 .&\/-]{2,40})\s*:\s*[A-Z][A-Za-z0-9 .&()\/-]{2,80}[^]{0,120}?\bRenews\b/i);
  if (brandColon && brandColon[1]) {
    const candidate = brandColon[1].trim();
    const lower = candidate.toLowerCase();
    if (lower !== "apple" && lower !== "invoice") {
      return candidate;
    }
  }

  // Fallback 3a: 'for <Service> subscription' phrasing in plain text
  const forSubscription = textOnly.match(/\bfor\s+([A-Z][A-Za-z0-9 :.'&()\/-]{2,60})\s+(?:subscription|plan|membership)\b/i);
  if (forSubscription && forSubscription[1]) {
    const candidate = forSubscription[1].trim();
    const lower = candidate.toLowerCase();
    if (lower !== "apple" && lower !== "invoice") {
      return candidate.replace(/\s*\([^)]*\)$/, "").trim();
    }
  }

  // Fallback 3b: Quoted product name near subscription terms
  const quotedNearSub = textOnly.match(/[""']\s*([A-Z][A-Za-z0-9 :.&()\/-]{2,80})\s*[""']\s+(?:subscription|plan|membership|annual|monthly)/i);
  if (quotedNearSub && quotedNearSub[1]) {
    const candidate = quotedNearSub[1].trim();
    const lower = candidate.toLowerCase();
    if (lower !== "apple" && lower !== "invoice") {
      return candidate.replace(/\s*\([^)]*\)$/, "").trim();
    }
  }

  // Fallback 3: Image alt/aria-label carries the product name (common in Apple invoices)
  const altMatch = htmlBody.match(/\b(?:alt|aria-label)\s*=\s*"([A-Z][A-Za-z0-9 :.'&()\/-]{2,80})"/i);
  if (altMatch && altMatch[1]) {
    const candidate = altMatch[1].trim();
    const lower = candidate.toLowerCase();
    if (lower !== "apple" && lower !== "invoice") {
      return candidate.replace(/\s*\([^)]*\)$/, "").trim();
    }
  }

  // Fallback 4: title attribute sometimes carries app name
  const titleMatch = htmlBody.match(/\btitle\s*=\s*"([A-Z][A-Za-z0-9 :.'&()\/-]{2,80})"/i);
  if (titleMatch && titleMatch[1]) {
    const candidate = titleMatch[1].trim();
    const lower = candidate.toLowerCase();
    if (lower !== "apple" && lower !== "invoice") {
      return candidate.replace(/\s*\([^)]*\)$/, "").trim();
    }
  }

  // No valid service name found
  return null;
}

/**
 * Extract service name from Stripe receipt emails.
 * Looks for statement descriptor or merchant lines.
 */
export function extractStripeServiceName(subject: string, body: string): string | null {
  const text = `${subject}\n${body}`.replace(/\s+/g, " ");
  const candidates: Array<string | null> = [];

  // Common Stripe failed-payment phrasing: "₹427.00 payment to X was unsuccessful"
  const paymentTo = text.match(/payment\s+to\s+([A-Za-z][A-Za-z0-9 .,&()/-]{1,60})\s+was\s+unsuccessful/i)?.[1] || null;
  if (paymentTo) candidates.push(paymentTo);

  // Receipt phrasing: "Receipt from X #1234-5678"
  const receiptFrom = text.match(/receipt\s+from\s+([A-Za-z][A-Za-z0-9 .,&()/-]{1,60})\b/i)?.[1] || null;
  if (receiptFrom) candidates.push(receiptFrom);

  // "This charge will appear on your statement as QUITTR*SUBSCRIPTION"
  const appearAs = text.match(/appear\s+on\s+your\s+statement\s+as\s+([A-Za-z0-9* .,&()/-]{2,60})/i)?.[1] || null;
  if (appearAs) candidates.push(appearAs);

  // "Statement descriptor: QUITTR"
  const descriptor = text.match(/statement\s+descriptor[:\s-]*([A-Za-z0-9* .,&()/-]{2,60})/i)?.[1] || null;
  if (descriptor) candidates.push(descriptor);

  // "Merchant: Company Name"
  const merchant = text.match(/\b(merchant|seller)[:\s-]*([A-Za-z0-9 .,&()/-]{2,60})/i)?.[2] || null;
  if (merchant) candidates.push(merchant);

  // Clean and validate
  for (let raw of candidates) {
    if (!raw) continue;
    let name = raw.trim();
    // Remove asterisks and trailing plan notes
    name = name.replace(/\*/g, "").replace(/\s+\(.*?\)$/, "").trim();
    // Drop obvious Stripe tokens that sneak in
    name = name.replace(/\b(stripe|payments?|failed[-\s]?payments?)\b/ig, "").trim();
    // Remove generic tokens
    if (/^(stripe|payment|charge|receipt|invoice|statement)$/i.test(name)) continue;
    if (name.length < 3) continue;
    const normalized = normalizeMerchantName(name);
    if (normalized && !["stripe", "payment", "invoice", "receipt"].includes(normalized)) {
      return name;
    }
  }
  return null;
}

/**
 * Extract service name from PayPal receipt emails.
 * Looks for "You sent a payment to <merchant>" or "Merchant/Seller:" lines.
 */
export function extractPayPalServiceName(subject: string, body: string): string | null {
  const text = `${subject}\n${body}`.replace(/\s+/g, " ");
  const candidates: Array<string | null> = [];

  const sentTo = text.match(/you\s+sent\s+(?:a\s+)?payment\s+to\s+([A-Za-z0-9 .,&()/-]{2,60})/i)?.[1] || null;
  if (sentTo) candidates.push(sentTo);

  const paidTo = text.match(/paid\s+to\s+([A-Za-z0-9 .,&()/-]{2,60})/i)?.[1] || null;
  if (paidTo) candidates.push(paidTo);

  const merchant = text.match(/\b(merchant|seller)[:\s-]*([A-Za-z0-9 .,&()/-]{2,60})/i)?.[2] || null;
  if (merchant) candidates.push(merchant);

  for (let raw of candidates) {
    if (!raw) continue;
    let name = raw.trim();
    name = name.replace(/\s+\(.*?\)$/, "").trim();
    if (/^(paypal|payment|charge|receipt|invoice)$/i.test(name)) continue;
    if (name.length < 3) continue;
    const normalized = normalizeMerchantName(name);
    if (normalized && !["paypal", "payment", "invoice", "receipt"].includes(normalized)) {
      return name;
    }
  }
  return null;
}

/**
 * Extract service name from Google Pay / Google Play receipts.
 * Covers patterns like:
 * - "You paid <Merchant> • Google Pay"
 * - "Order from <Merchant>"
 * - "Merchant: <Merchant>"
 * - Google Play Order receipts listing App or Subscription name
 */
export function extractGooglePayServiceName(subject: string, body: string): string | null {
  const text = `${subject}\n${body}`.replace(/\s+/g, " ");
  if (!/google\s+(pay|play|payments|commerce)/i.test(text)) {
    return null;
  }

  const candidates: Array<string | null> = [];

  // "You paid <Merchant> • Google Pay"
  const youPaid = text.match(/you\s+paid\s+([A-Z][A-Za-z0-9 .,&()\/-]{2,80})\s*(?:[•|·-]\s*)?google\s+(?:pay|payments)/i)?.[1] || null;
  if (youPaid) candidates.push(youPaid);

  // "Order from <Merchant>"
  const orderFrom = text.match(/\border\s+from\s+([A-Z][A-Za-z0-9 .,&()\/-]{2,80})\b/i)?.[1] || null;
  if (orderFrom) candidates.push(orderFrom);

  // "Merchant: <Merchant>"
  const merchant = text.match(/\b(merchant|seller)[:\s-]*([A-Z][A-Za-z0-9 .,&()\/-]{2,80})\b/i)?.[2] || null;
  if (merchant) candidates.push(merchant);

  // Google Play app/subscription: "<Name>" near price
  const playNameWithPrice = text.match(/"([A-Z][A-Za-z0-9 +:.&()\/-]{2,80})"\s*[£$€₹]\s*[\d,]+(?:\.\d{2})?/i)?.[1] || null;
  if (playNameWithPrice) candidates.push(playNameWithPrice);

  for (let raw of candidates) {
    if (!raw) continue;
    let name = raw.trim();
    name = name.replace(/\s+\(.*?\)$/, "").trim();
    // Filter out generic tokens
    if (/^(google\s*(pay|play|payments|commerce)|payment|charge|receipt|invoice)$/i.test(name)) continue;
    if (name.length < 3) continue;
    const normalized = normalizeMerchantName(name);
    if (normalized && !/^google(\s*(pay|play|payments|commerce))?$/.test(normalized)) {
      return name;
    }
  }
  return null;
}

