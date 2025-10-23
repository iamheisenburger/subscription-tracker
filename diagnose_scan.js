// Quick diagnostic script to check scan state
const { ConvexHttpClient } = require("convex/browser");

const client = new ConvexHttpClient("https://hearty-leopard-116.convex.cloud");

async function diagnose() {
  try {
    // Check email connections
    const query = `
      import { query } from "./_generated/server";
      import { v } from "convex/values";

      export default query({
        args: {},
        handler: async (ctx) => {
          const connections = await ctx.db.query("emailConnections").collect();
          const receipts = await ctx.db.query("emailReceipts").collect();
          const candidates = await ctx.db.query("detectionCandidates").collect();

          return {
            connections: connections.map(c => ({
              email: c.email,
              status: c.status,
              totalEmailsScanned: c.totalEmailsScanned,
              totalReceiptsFound: c.totalReceiptsFound,
              aiProcessingStatus: c.aiProcessingStatus,
              aiProcessedCount: c.aiProcessedCount,
              aiTotalCount: c.aiTotalCount,
              lastSyncedAt: c.lastSyncedAt,
            })),
            receiptsStats: {
              total: receipts.length,
              parsed: receipts.filter(r => r.parsed).length,
              unparsed: receipts.filter(r => !r.parsed).length,
              withMerchant: receipts.filter(r => r.merchantName).length,
            },
            candidatesStats: {
              total: candidates.length,
              pending: candidates.filter(c => c.status === "pending").length,
              accepted: candidates.filter(c => c.status === "accepted").length,
            }
          };
        }
      });
    `;

    console.log("Fetching diagnostic data...");
    // This is a placeholder - we need to run this via Convex CLI
    console.log("Run this command instead:");
    console.log("npx convex run admin:getDiagnostics");

  } catch (error) {
    console.error("Error:", error);
  }
}

diagnose();
