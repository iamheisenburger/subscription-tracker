/**
 * AI Receipt Analyzer - Uses Claude API for intelligent subscription detection
 * This is our competitive advantage over other apps!
 */

import { action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

/**
 * Analyze email receipt using Claude API to determine if it's a subscription
 * Returns structured data: merchant, amount, frequency, confidence score
 */
export const analyzeReceiptWithAI = action({
  args: {
    subject: v.string(),
    body: v.string(),
    from: v.string(),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      console.error("❌ ANTHROPIC_API_KEY not set - falling back to regex");
      return {
        isSubscription: false,
        confidence: 0,
        method: "no_api_key",
      };
    }

    try {
      // Construct prompt for Claude
      const prompt = `Analyze this email receipt and determine if it's a recurring subscription or a one-time purchase.

Email Subject: ${args.subject}
Email From: ${args.from}
Email Body (first 2000 chars): ${args.body.substring(0, 2000)}

Instructions:
1. Determine if this is a RECURRING SUBSCRIPTION (monthly/yearly charges) or a ONE-TIME PURCHASE
2. Look for explicit subscription language: "subscription", "recurring", "renewal", "auto-renew", "next billing"
3. Exclude: one-time app purchases, product orders, shipping confirmations, trials, marketing emails
4. Extract: merchant name, amount, currency, billing frequency

Respond in valid JSON format:
{
  "isSubscription": boolean,
  "merchant": "Company Name" or null,
  "amount": number or null,
  "currency": "USD" or "GBP" etc,
  "frequency": "monthly" or "yearly" or null,
  "confidence": 0-100,
  "reasoning": "Brief explanation of decision"
}`;

      // Call Claude API
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001", // Latest Haiku 4.5 model
          max_tokens: 300, // Reduced since we only need JSON output
          temperature: 0, // Deterministic for consistency
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
        }),
      });

      if (!response.ok) {
        console.error("❌ Claude API error:", response.status, await response.text());
        return {
          isSubscription: false,
          confidence: 0,
          method: "api_error",
        };
      }

      const data = await response.json();
      const aiResponse = data.content[0].text;

      // Parse JSON response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error("❌ Could not parse Claude response as JSON");
        return {
          isSubscription: false,
          confidence: 0,
          method: "parse_error",
        };
      }

      const analysis = JSON.parse(jsonMatch[0]);

      console.log(`🤖 AI Analysis: ${analysis.isSubscription ? "✅ SUBSCRIPTION" : "❌ NOT subscription"}`);
      console.log(`   Merchant: ${analysis.merchant || "unknown"}`);
      console.log(`   Amount: ${analysis.amount} ${analysis.currency}`);
      console.log(`   Frequency: ${analysis.frequency || "unknown"}`);
      console.log(`   Confidence: ${analysis.confidence}%`);
      console.log(`   Reasoning: ${analysis.reasoning}`);

      return {
        isSubscription: analysis.isSubscription,
        merchant: analysis.merchant,
        amount: analysis.amount,
        currency: analysis.currency,
        frequency: analysis.frequency,
        confidence: analysis.confidence,
        reasoning: analysis.reasoning,
        method: "claude_api",
      };
    } catch (error) {
      console.error("❌ AI analysis error:", error);
      return {
        isSubscription: false,
        confidence: 0,
        method: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

/**
 * Batch analyze multiple receipts with AI
 * More efficient than one-by-one
 * NOTE: Commented out to avoid TypeScript circular reference - implement when needed
 */
// export const batchAnalyzeReceipts = action({...});
