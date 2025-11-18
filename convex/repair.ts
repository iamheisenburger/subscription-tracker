import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { normalizeMerchantName, extractAppleServiceName, extractStripeServiceName, extractPayPalServiceName, extractGooglePayServiceName } from "./utils";

/**
 * Lightweight, non-AI repair pass for receipts that were marked parsed
 * but are missing critical fields (merchantName and/or amount).
 * - Uses subject/body regex extraction
 * - Extracts Apple service names from HTML
 * - Does not call external providers
 */
export const repairParsedReceipts = internalMutation({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 400, 800);

    // Fetch parsed receipts (collect all), then filter for missing fields in application code
    // Collecting first ensures we consider the newest receipts as well, then we slice to the limit.
    const parsed = await ctx.db
      .query("emailReceipts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("parsed"), true))
      .collect();

    // Consider a receipt "broken" if it is missing merchant/amount, has a generic
    // aggregator merchant, or matches a known mislabel pattern.
    const AGGREGATOR_NAMES = new Set(["apple", "stripe", "paypal", "google", "paddle"]);
    const brokenAll = parsed.filter((r: any) => {
      const hasMissing = r.merchantName == null || r.amount == null;
      // If merchant exists but is an aggregator, attempt service extraction to unify clusters
      const normalized = normalizeMerchantName(r.merchantName || "");

      const subject = (r.subject || "").toLowerCase();
      const from = (r.from || "").toLowerCase();
      const looksLikeFortect =
        subject.includes("fortect") ||
        from.includes("fortect.com");
      const isFortectMislabel =
        looksLikeFortect && normalized === "playstation";

      return hasMissing || AGGREGATOR_NAMES.has(normalized) || isFortectMislabel;
    });
    // Process newest broken receipts first for determinism across scans
    const broken = brokenAll
      .sort((a: any, b: any) => (b.receivedAt || 0) - (a.receivedAt || 0))
      .slice(0, limit);

    let fixedMerchant = 0;
    let fixedAmount = 0;

    for (const r of broken) {
      let newMerchant: string | null = r.merchantName ?? null;
      let newAmount: number | null = r.amount ?? null;
      let newCurrency: string | undefined = r.currency ?? undefined;

      const subject = (r as any).subject || "";
      const from = (r as any).from || "";
      const body = (r as any).rawBody || "";
      const lowerSubject = subject.toLowerCase();
      const lowerFrom = from.toLowerCase();

      // 1) Merchant salvage
      // Try to extract a specific service when merchant is missing OR a generic aggregator
      const merchantNeedsRepair =
        !newMerchant ||
        AGGREGATOR_NAMES.has(normalizeMerchantName(newMerchant)) ||
        // Generic placeholders that should be replaced with the real product
        /^system$/i.test(String(newMerchant)) ||
        /^g\d+.*invoice\s+date/i.test(String(newMerchant)) ||
        /^g40ps\s+gbr/i.test(String(newMerchant));

      // Fortect-specific fix: some older AI parses mislabeled Fortect as PlayStation.
      // If the email clearly comes from Fortect but merchant is PlayStation, relabel
      // deterministically to Fortect. This is narrow and won't affect real PlayStation receipts.
      const looksLikeFortect =
        lowerSubject.includes("fortect") ||
        lowerFrom.includes("fortect.com");
      if (
        looksLikeFortect &&
        newMerchant &&
        normalizeMerchantName(newMerchant) === "playstation"
      ) {
        newMerchant = "Fortect";
        await ctx.db.patch(r._id, {
          merchantName: newMerchant,
          parsingConfidence: Math.max(r.parsingConfidence ?? 0.6, 0.9),
          // Clear detectionCandidateId so detection can create a dedicated Fortect candidate
          detectionCandidateId: undefined,
        });
        fixedMerchant++;
      }
      if (merchantNeedsRepair) {
        // Subject patterns
        const fromMatch = subject.match(/(?:receipt|invoice)\s+from\s+([^#\n]+?)(?:\s*#|\s*$)/i);
        const yourPattern = subject.match(/your\s+([A-Za-z0-9\s]+?)\s+(?:receipt|invoice|payment|subscription)/i);
        const simplePattern = subject.match(/^([A-Za-z0-9\s]+?)\s+(?:receipt|invoice)/i);

        if (fromMatch) {
          newMerchant = cleanMerchant(fromMatch[1]);
        } else if (yourPattern) {
          const candidate = cleanMerchant(yourPattern[1]);
          if (candidate && candidate.toLowerCase() !== "your") newMerchant = candidate;
        } else if (simplePattern) {
          const candidate = cleanMerchant(simplePattern[1]);
          if (candidate && candidate.toLowerCase() !== "your") newMerchant = candidate;
        }

        // Apple HTML body fallback (deterministic salvage for invoices)
        if ((!newMerchant || normalizeMerchantName(newMerchant) === "apple") && subject.toLowerCase().includes("apple") && body) {
          // Try structured extractor first
          const service = extractAppleServiceName(subject, body);
          if (service) {
            newMerchant = service;
          } else {
            // Deterministic salvage:
            // 1) Strip tags and look back from "Renews" to capture product line
            const textOnly = body
              .replace(/<style[\s\S]*?<\/style>/gi, " ")
              .replace(/<script[\s\S]*?<\/script>/gi, " ")
              .replace(/<[^>]+>/g, " ")
              .replace(/\s+/g, " ")
              .trim();
            const renewIdx = textOnly.toLowerCase().indexOf("renews");
            if (renewIdx > 0) {
              const lookback = textOnly.substring(Math.max(0, renewIdx - 200), renewIdx);
              // Take the last reasonable capitalized phrase in the lookback window
              const candidates = lookback.match(/([A-Z][A-Za-z0-9 :.'&()\/-]{2,80})/g);
              if (candidates && candidates.length > 0) {
                for (let i = candidates.length - 1; i >= 0; i--) {
                  const c = candidates[i].trim();
                  const lc = c.toLowerCase();
                  if (lc !== "apple" && lc !== "invoice" && lc !== "billing and payment") {
                    newMerchant = c.replace(/\s*\([^)]*\)$/, "").trim();
                    break;
                  }
                }
              }
            }
            // 2) Brand token fallback (safe within Apple invoice context)
            if (!newMerchant) {
              if (/quittr/i.test(body)) newMerchant = "Quittr";
              else if (/surfshark/i.test(body)) newMerchant = "Surfshark VPN";
              else if (/spotify/i.test(body)) newMerchant = "Spotify";
            }
          }
        }

        // Stripe statement descriptor / payment-to fallback (covers X/Twitter)
        if (!newMerchant && (subject.toLowerCase().includes("stripe") || from.toLowerCase().includes("stripe"))) {
          const svc = extractStripeServiceName(subject, body);
          if (svc) newMerchant = svc;
        }

        // PayPal merchant fallback
        if (!newMerchant && (subject.toLowerCase().includes("paypal") || from.toLowerCase().includes("paypal"))) {
          const svc = extractPayPalServiceName(subject, body);
          if (svc) newMerchant = svc;
        }

        // Google Pay / Play merchant fallback
        if (!newMerchant && (subject.toLowerCase().includes("google pay") || subject.toLowerCase().includes("google play") || from.toLowerCase().includes("google.com"))) {
          const svc = extractGooglePayServiceName(subject, body);
          if (svc) newMerchant = svc;
        }

        // PlayStation receipts ("Thank You For Your Purchase") salvage
        // Many PlayStation emails are purchases/renewals sent from txn domains and lack explicit "receipt/invoice" phrasing.
        // When the sender matches PlayStation transaction domains or subject matches their template, assign merchant and try to pull amount.
        const fromLower = from.toLowerCase();
        const isPlayStationSender =
          fromLower.includes("txn-email.playstation.com") ||
          fromLower.includes("txn-email03.playstation.com") ||
          fromLower.includes("playstation");
        const looksLikePlayStationTemplate =
          /thank\s+you\s+for\s+your\s+purchase/i.test(subject) ||
          /your\s+playstation\s+store\s+transaction\s+was\s+successful/i.test(body || "");
        if ((!newMerchant || normalizeMerchantName(newMerchant) === "your") && (isPlayStationSender || looksLikePlayStationTemplate)) {
          newMerchant = "PlayStation";
        }

        if (newMerchant) {
          const normalized = normalizeMerchantName(newMerchant);
          if (normalized && normalized !== "apple" && normalized !== "your") {
            await ctx.db.patch(r._id, { merchantName: newMerchant, parsingConfidence: Math.max(r.parsingConfidence ?? 0.6, 0.8) });
            fixedMerchant++;
          }
        }
      }

      // Enforce Apple product extraction on invoice templates, even if a generic merchant is present.
      if (subject.toLowerCase().includes("your invoice from apple") && body) {
        const forcedService = extractAppleServiceName(subject, body);
        if (forcedService) {
          const normForced = normalizeMerchantName(forcedService);
          if (normForced && normForced !== "apple" && normForced !== "your") {
            await ctx.db.patch(r._id, {
              merchantName: forcedService,
              parsingConfidence: Math.max(r.parsingConfidence ?? 0.6, 0.9),
            });
            fixedMerchant++;
          }
        }
      }

      // 2) Amount salvage (subject + body + Substack HTML patterns)
      if (newAmount == null) {
        // Substack receipts often have explicit "Total" or "Amount paid" labels
        const substackAmount = extractSubstackAmount(subject, body);
        const amountSubject = extractAmountFromText(subject);
        const amountBody = extractAmountFromText(body);
        const candidate = amountSubject ?? amountBody;
        if (substackAmount) {
          newAmount = substackAmount.amount;
          newCurrency = substackAmount.currency;
          await ctx.db.patch(r._id, {
            amount: newAmount,
            currency: newCurrency,
            parsingConfidence: Math.max(r.parsingConfidence ?? 0.6, 0.85),
          });
          fixedAmount++;
        } else if (candidate) {
          newAmount = candidate.amount;
          newCurrency = candidate.currency;
          await ctx.db.patch(r._id, {
            amount: newAmount,
            currency: newCurrency,
            parsingConfidence: Math.max(r.parsingConfidence ?? 0.6, 0.8),
          });
          fixedAmount++;
        }
      }
    }

    return {
      scanned: broken.length,
      fixedMerchant,
      fixedAmount,
      remaining: broken.length - (fixedMerchant + fixedAmount), // rough
    };
  },
});

function cleanMerchant(m: string): string {
  return m.trim().replace(/,?\s*(Inc\.?|LLC\.?|Ltd\.?|PBC|Corporation|Corp\.?)$/i, "");
}

function extractAmountFromText(text: string): { amount: number; currency: string } | null {
  if (!text) return null;

  // Currency symbol patterns
  const symbolPattern = /([£$€₹]|Rs\.?)\s*([\d,]+(?:\.\d{1,2})?)/i;
  // Currency code first or after amount
  const codePattern = /\b(USD|GBP|EUR|INR|JPY|AUD|CAD)\b\s*([\d,]+(?:\.\d{1,2})?)|([\d,]+(?:\.\d{1,2})?)\s*\b(USD|GBP|EUR|INR|JPY|AUD|CAD)\b/i;

  const symbolMatch = text.match(symbolPattern);
  if (symbolMatch) {
    const symbol = symbolMatch[1].toUpperCase();
    const raw = (symbolMatch[2] || "").replace(/,/g, "");
    const amount = parseFloat(raw);
    if (!Number.isNaN(amount)) {
      const currency = symbolToCode(symbol);
      return { amount, currency };
    }
  }

  const codeMatch = text.match(codePattern);
  if (codeMatch) {
    // Handle both positions
    const code = (codeMatch[1] || codeMatch[4] || "").toUpperCase();
    const rawNum = (codeMatch[2] || codeMatch[3] || "").replace(/,/g, "");
    const amt = parseFloat(rawNum);
    if (!Number.isNaN(amt) && code) return { amount: amt, currency: code };
  }

  return null;
}

function symbolToCode(s: string): string {
  switch (s) {
    case "£":
      return "GBP";
    case "$":
      return "USD";
    case "€":
      return "EUR";
    case "₹":
      return "INR";
    default:
      return "USD";
  }
}

/**
 * Specialized extractor for Substack receipts.
 * Substack HTML often includes labels like "Amount paid" or "Total" followed by a currency and number.
 * Works on raw HTML (no DOM needed).
 */
function extractSubstackAmount(subject: string, html: string): { amount: number; currency: string } | null {
  const isSubstack = /substack/i.test(subject) || /substack/i.test(html);
  if (!isSubstack) return null;

  // Normalize HTML entities and whitespace
  const text = html
    .replace(/&nbsp;/g, " ")
    .replace(/&pound;/ig, "£")
    .replace(/&euro;/ig, "€")
    .replace(/&#8377;/g, "₹")
    .replace(/\s+/g, " ");

  // Patterns commonly observed in Substack receipts
  // 1) "Amount paid $5.00" or "Amount Paid: $5.00"
  const amountPaid = text.match(/amount\s+paid[:\s-]*([£$€₹]\s*[\d,]+(?:\.\d{1,2})?)(?:\s*(USD|GBP|EUR|INR))?/i);
  if (amountPaid) {
    const amt = amountPaid[1].replace(/[£$€₹\s,]/g, "");
    const currency = amountPaid[2]?.toUpperCase() || symbolToCode(amountPaid[1][0]);
    const num = parseFloat(amt);
    if (!Number.isNaN(num)) return { amount: num, currency };
  }

  // 2) "Total $5.00" or "Total: $5.00 USD"
  const total = text.match(/\btotal[:\s-]*([£$€₹]\s*[\d,]+(?:\.\d{1,2})?)(?:\s*(USD|GBP|EUR|INR))?/i);
  if (total) {
    const amt = total[1].replace(/[£$€₹\s,]/g, "");
    const currency = total[2]?.toUpperCase() || symbolToCode(total[1][0]);
    const num = parseFloat(amt);
    if (!Number.isNaN(num)) return { amount: num, currency };
  }

  // 3) Currency code + amount, e.g., "USD 5.00"
  const codeFirst = text.match(/\b(USD|GBP|EUR|INR)\s*([\d,]+(?:\.\d{1,2})?)\b/i);
  if (codeFirst) {
    const currency = codeFirst[1].toUpperCase();
    const amt = parseFloat(codeFirst[2].replace(/,/g, ""));
    if (!Number.isNaN(amt)) return { amount: amt, currency };
  }

  return null;
}


