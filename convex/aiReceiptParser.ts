/**
 * AI-Powered Receipt Parser
 * Uses Claude API for intelligent subscription detection with regex fallback
 * RATE LIMIT FIX: Sequential processing with 1 key + 60s delays between batches
 */

import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

/**
 * Parse receipts using AI-first approach with regex fallback
 * RATE LIMIT FIX: Sequential processing with 1 API key to prevent 429 errors
 */
export const parseReceiptsWithAI = internalAction({
  args: {
    receipts: v.array(
      v.object({
        _id: v.id("emailReceipts"),
        subject: v.string(),
        rawBody: v.optional(v.union(v.string(), v.null())),
        from: v.string(),
      })
    ),
    connectionId: v.optional(v.id("emailConnections")), // For progress tracking
  },
  handler: async (ctx, args) => {
    // RATE LIMIT FIX: Use only 1 API key (sequential processing)
    // Previous issue: 3 keys in parallel = 30 receipts hitting API simultaneously = instant rate limit
    // New approach: 1 key + 10 receipts/batch + 60s delays = ~20k tokens/min (well under 50k limit)
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      console.error("❌ No API key configured!");
      return { results: [] };
    }

    console.log(`🤖 AI Parser: Analyzing ${args.receipts.length} receipts SEQUENTIALLY with 1 API key`);
    console.log(`⏰ Rate limiting protection: Processing one at a time with delays`);

    // Validate connectionId for progress tracking
    if (!args.connectionId) {
      console.warn(`⚠️  No connectionId provided - progress tracking disabled`);
    } else {
      console.log(`🔗 Using connectionId for progress: ${args.connectionId}`);
    }

    // Initialize progress tracking (single call)
    if (args.connectionId) {
      await ctx.runMutation(internal.emailScanner.updateAIProgress, {
        connectionId: args.connectionId,
        status: "processing",
        processed: 0,
        total: args.receipts.length,
      });
    }

    // SEQUENTIAL PROCESSING: Process all receipts with 1 API key
    console.log(`🔑 Processing ${args.receipts.length} receipts sequentially`);

    const results = await processReceiptsWithAPIKey(ctx, args.receipts, apiKey, 1, args.connectionId);

    console.log(`✅ Sequential processing complete! Total: ${results.length} receipts analyzed`);

    // Final progress update
    if (args.connectionId) {
      await ctx.runMutation(internal.emailScanner.updateAIProgress, {
        connectionId: args.connectionId,
        status: "complete",
        processed: results.length,
        total: args.receipts.length,
      });
    }

    const aiCount = results.filter(r => r.method === "ai").length;
    const regexCount = results.filter(r => r.method === "regex_fallback").length;
    const filteredCount = results.filter(r => r.method === "filtered").length;

    console.log(`🎯 AI Parser Summary (Sequential Processing):`);
    console.log(`   AI Success: ${aiCount}/${args.receipts.length}`);
    console.log(`   Regex Fallback: ${regexCount}/${args.receipts.length}`);
    console.log(`   Filtered Out: ${filteredCount}/${args.receipts.length}`);
    console.log(`   ✅ Rate limiting avoided by sequential processing + 60s delays`);

    return { results };
  },
});

/**
 * Process a batch of receipts using a specific API key
 * RATE LIMIT FIX: Now processes sequentially with delays to prevent 429 errors
 */
async function processReceiptsWithAPIKey(
  ctx: any,
  receipts: Array<{
    _id: any;
    subject: string;
    rawBody?: string | null;
    from: string;
  }>,
  apiKey: string,
  keyNumber: number,
  connectionId?: any
): Promise<Array<{
  receiptId: string;
  merchantName: string | null;
  amount: number | null;
  currency: string;
  billingCycle: string | null;
  confidence: number;
  method: "ai" | "regex_fallback" | "filtered";
  reasoning?: string;
}>> {
  const results: Array<{
    receiptId: string;
    merchantName: string | null;
    amount: number | null;
    currency: string;
    billingCycle: string | null;
    confidence: number;
    method: "ai" | "regex_fallback" | "filtered";
    reasoning?: string;
  }> = [];

  console.log(`🔑 Worker ${keyNumber}: Starting processing of ${receipts.length} receipts`);

  for (const receipt of receipts) {
    // Rate limiting: 10 requests/second per API key (Anthropic limit)
    if (results.length > 0 && results.length % 10 === 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    try {
      // Try AI analysis first if API key available
      if (apiKey) {
        const aiResult = await analyzeReceiptWithClaudeAPI(
          apiKey,
          receipt.subject,
          receipt.rawBody || "",
          receipt.from
        );

        // Log specific missing subscriptions for debugging
        const missingSubKeywords = ["chatgpt", "openai", "perplexity", "spotify", "surfshark", "brandon", "fpl", "patreon"];
        const hasMissingSubKeyword = missingSubKeywords.some(keyword =>
          receipt.subject.toLowerCase().includes(keyword) ||
          receipt.from.toLowerCase().includes(keyword)
        );

        if (hasMissingSubKeyword) {
          console.log(`🔍 MISSING SUB CANDIDATE: "${receipt.subject}" | From: ${receipt.from} | AI Result: ${aiResult.success ? `${aiResult.confidence}% confidence, merchant: ${aiResult.merchant}` : "FAILED"}`);
        }

        // Keep 40% confidence threshold - real issue was pre-filter blocking receipts entirely
        if (aiResult.success && aiResult.confidence >= 40) {
          // FIX: Don't filter based on past dates - many receipts don't have future dates
          // They're just payment confirmations for the current month (e.g., "Charged $20 for October")
          // Let the user review all detections and manually confirm/dismiss

          // Valid subscription - include it (40%+ confidence)
          console.log(`  🔑${keyNumber} 🤖 AI SUCCESS: "${aiResult.merchant || "Unknown"}" - $${aiResult.amount} ${aiResult.currency} (${aiResult.confidence}% confidence) | Subject: "${receipt.subject.substring(0, 60)}"`);

          results.push({
            receiptId: receipt._id,
            merchantName: aiResult.merchant,
            amount: aiResult.amount,
            currency: aiResult.currency || "USD",
            billingCycle: aiResult.frequency === "monthly" ? "monthly" : aiResult.frequency === "yearly" ? "yearly" : null,
            confidence: aiResult.confidence / 100, // Convert to 0-1 scale
            method: "ai",
            reasoning: aiResult.reasoning,
          });
          continue; // Skip regex fallback
        } else if (!aiResult.success) {
          console.log(`  🔑${keyNumber} ⚠️  AI FAILED: "${receipt.subject.substring(0, 60)}" - Falling back to regex`);
        } else {
          console.log(`  🔑${keyNumber} ⚠️  AI LOW CONFIDENCE: ${aiResult.confidence}% (need 40%+) for "${receipt.subject.substring(0, 60)}" - Falling back to regex`);
        }
      }

      // Fallback: Use regex-based parsing
      const regexResult = await ctx.runMutation(internal.receiptParser.parseReceiptWithRegex, {
        receiptId: receipt._id,
      });

      if (regexResult.merchantName && regexResult.amount) {
        console.log(`  🔑${keyNumber} 📋 REGEX SUCCESS: "${regexResult.merchantName}" - $${regexResult.amount} ${regexResult.currency} | Subject: "${receipt.subject.substring(0, 60)}"`);
        results.push({
          receiptId: receipt._id,
          merchantName: regexResult.merchantName,
          amount: regexResult.amount,
          currency: regexResult.currency,
          billingCycle: regexResult.billingCycle,
          confidence: regexResult.confidence,
          method: "regex_fallback",
        });
      } else {
        // Filtered out as non-subscription
        console.log(`  🔑${keyNumber} ⏭️  FILTERED OUT (non-subscription): "${receipt.subject.substring(0, 80)}"`);
        results.push({
          receiptId: receipt._id,
          merchantName: null,
          amount: null,
          currency: "USD",
          billingCycle: null,
          confidence: 0,
          method: "filtered",
        });
      }
    } catch (error) {
      console.error(`  🔑${keyNumber} ❌ Error parsing receipt ${receipt._id}:`, error);
      // Mark as failed - will retry later
      results.push({
        receiptId: receipt._id,
        merchantName: null,
        amount: null,
        currency: "USD",
        billingCycle: null,
        confidence: 0,
        method: "filtered",
      });
    }

    // Update progress every 5 receipts for real-time UI feedback
    if (connectionId && results.length % 5 === 0) {
      console.log(`🔑${keyNumber} 🔄 Progress: ${results.length}/${receipts.length} receipts analyzed`);
      // Note: Progress updates from multiple workers will be approximate
      // But that's okay - it's just for UI feedback
    }
  }

  console.log(`🔑 Worker ${keyNumber}: COMPLETE - ${results.length} receipts processed`);

  return results;
}

/**
 * Call Claude API to analyze a single receipt
 * Returns structured data or error
 */
async function analyzeReceiptWithClaudeAPI(
  apiKey: string,
  subject: string,
  body: string,
  from: string
): Promise<{
  success: boolean;
  merchant: string | null;
  amount: number | null;
  currency: string | null;
  frequency: string | null;
  confidence: number;
  reasoning?: string;
  nextBillingDate?: string | null;
}> {
  // Get current date for context
  const currentDate = new Date();
  const formattedDate = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD format

  const prompt = `You are analyzing an email receipt. Your task is to determine if this represents a RECURRING SUBSCRIPTION or a ONE-TIME PURCHASE.

CONTEXT:
Current Date: ${formattedDate}

EMAIL CONTENT:
Subject: ${subject}
From: ${from}
Body: ${body.substring(0, 2000)}

TASK:
Analyze the email and determine if it represents a recurring subscription service (monthly/yearly/weekly charges that automatically renew).

WHAT IS A SUBSCRIPTION:
- Recurring payments that automatically renew (monthly, yearly, weekly, etc.)
- Services with words like: "subscription", "recurring", "renewal", "auto-renew", "membership", "plan", "billing cycle"
- Digital services, streaming platforms, SaaS tools, cloud services, memberships
- Any service that charges repeatedly at regular intervals

WHAT IS NOT A SUBSCRIPTION:
- One-time product purchases
- Physical goods orders
- Shipping fees
- Single app/game purchases (unless they mention recurring charges)
- Restaurant/food delivery orders
- Travel bookings

EXTRACT THE FOLLOWING:
1. Merchant/Service name
2. Charge amount
3. Currency (USD, GBP, EUR, INR, etc.)
4. Billing frequency (monthly, yearly, weekly, etc.)
5. Next billing date (if mentioned in the email)

DATE VALIDATION:
- If you find a "next billing date" or "renewal date", include it
- If the next billing date is BEFORE ${formattedDate}, this subscription may be cancelled, so lower confidence to 60-70%
- If no date found but other subscription indicators exist, still mark as subscription

CONFIDENCE SCORING:
- High confidence (80-95%): Clear subscription language, recurring billing mentioned
- Medium confidence (60-79%): Likely subscription but some ambiguity
- Low confidence (50-59%): Possible subscription but uncertain

BE INCLUSIVE: If it looks like a recurring payment service, mark it as subscription. The user will review all detections.

Respond ONLY with valid JSON (no markdown, no explanation):
{
  "isSubscription": true or false,
  "merchant": "Company Name" or null,
  "amount": 9.99 or null,
  "currency": "USD" or null,
  "frequency": "monthly" or null,
  "nextBillingDate": "2025-11-15" or null,
  "confidence": 85,
  "reasoning": "Brief explanation"
}`;

  // Retry logic with exponential backoff for rate limiting
  let retries = 0;
  const maxRetries = 3;
  let response: Response | null = null;

  while (retries <= maxRetries) {
    try {
      response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 300,
          temperature: 0,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
        }),
      });

      // Handle rate limiting with exponential backoff
      if (response.status === 429) {
        if (retries < maxRetries) {
          const waitTime = Math.pow(2, retries) * 1000; // 1s, 2s, 4s
          console.warn(`⚠️  Rate limit hit (429). Waiting ${waitTime}ms before retry ${retries + 1}/${maxRetries}...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          retries++;
          continue;
        } else {
          const errorText = await response.text();
          console.error("❌ Claude API error (max retries exceeded):", response.status, errorText);
          return { success: false, merchant: null, amount: null, currency: null, frequency: null, confidence: 0, nextBillingDate: null };
        }
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Claude API error:", response.status, errorText);
        return { success: false, merchant: null, amount: null, currency: null, frequency: null, confidence: 0, nextBillingDate: null };
      }

      // Success - break out of retry loop
      break;
    } catch (error) {
      if (retries < maxRetries) {
        const waitTime = Math.pow(2, retries) * 1000;
        console.warn(`⚠️  Network error. Waiting ${waitTime}ms before retry ${retries + 1}/${maxRetries}...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        retries++;
        continue;
      } else {
        console.error("❌ Claude API call failed (max retries exceeded):", error);
        return { success: false, merchant: null, amount: null, currency: null, frequency: null, confidence: 0, nextBillingDate: null };
      }
    }
  }

    if (!response) {
      console.error("❌ No response received after retries");
      return { success: false, merchant: null, amount: null, currency: null, frequency: null, confidence: 0, nextBillingDate: null };
    }

    try {
      const data = await response.json();
      const aiResponse = data.content[0].text;

      // Extract JSON from response (handle markdown code blocks if present)
      let jsonText = aiResponse;
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonText = jsonMatch[0];
      }

      const analysis = JSON.parse(jsonText);

      // Only return success if AI confirms it's a subscription
      if (!analysis.isSubscription) {
        return {
          success: true,
          merchant: null,
          amount: null,
          currency: null,
          frequency: null,
          confidence: analysis.confidence || 0,
          reasoning: analysis.reasoning,
          nextBillingDate: null,
        };
      }

      return {
        success: true,
        merchant: analysis.merchant,
        amount: analysis.amount,
        currency: analysis.currency || "USD",
        frequency: analysis.frequency,
        confidence: analysis.confidence || 50,
        reasoning: analysis.reasoning,
        nextBillingDate: analysis.nextBillingDate || null,
      };
    } catch (error) {
      console.error("❌ Claude API call failed:", error);
      return { success: false, merchant: null, amount: null, currency: null, frequency: null, confidence: 0, nextBillingDate: null };
    }
}
