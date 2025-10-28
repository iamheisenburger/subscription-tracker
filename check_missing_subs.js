// Query to check if missing subscriptions exist in database
const results = await ctx.db
  .query("emailReceipts")
  .withIndex("by_user")
  .filter(q => 
    q.or(
      q.gte(q.field("subject"), /chatgpt|openai/i),
      q.gte(q.field("subject"), /perplexity/i),
      q.gte(q.field("subject"), /spotify/i),
      q.gte(q.field("subject"), /surfshark/i)
    )
  )
  .collect();

console.log("Found receipts:", results.map(r => ({
  subject: r.subject,
  parsed: r.parsed,
  merchantName: r.merchantName,
  amount: r.amount
})));
