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

