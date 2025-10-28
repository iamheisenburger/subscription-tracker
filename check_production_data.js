/**
 * Check what's actually in production database
 */

const { ConvexHttpClient } = require("convex/browser");

const client = new ConvexHttpClient("https://hearty-leopard-116.convex.cloud");

const USER_ID = "user_33juD7PuxD9OVFJtVM9Hi74EneG";

async function main() {
  console.log("🔍 Checking production database...\n");

  try {
    // Check scan stats
    const scanStats = await client.query("emailScanner:getUserScanStats", {
      clerkUserId: USER_ID,
    });

    console.log("📊 Scan Stats:");
    console.log(`   Total Receipts: ${scanStats?.totalReceipts || 0}`);
    console.log(`   Parsed: ${scanStats?.parsedReceipts || 0}`);
    console.log(`   Unparsed: ${scanStats?.unparsedReceipts || 0}`);
    console.log("");

    // Check detection stats
    const detectionStats = await client.query("emailDetection:getEmailDetectionStats", {
      clerkUserId: USER_ID,
    });

    console.log("🎯 Detection Stats:");
    console.log(`   Total Detections: ${detectionStats?.totalEmailDetections || 0}`);
    console.log(`   Pending: ${detectionStats?.pending || 0}`);
    console.log(`   Accepted: ${detectionStats?.accepted || 0}`);
    console.log(`   Dismissed: ${detectionStats?.dismissed || 0}`);
    console.log("");

    // Check email connections
    const connections = await client.query("emailConnections:getUserConnections", {
      clerkUserId: USER_ID,
    });

    if (connections && connections.length > 0) {
      const gmail = connections[0];
      console.log("📧 Gmail Connection:");
      console.log(`   Status: ${gmail.status}`);
      console.log(`   Email: ${gmail.email}`);
      console.log(`   Scan Status: ${gmail.scanStatus || 'idle'}`);
      console.log(`   AI Processing Status: ${gmail.aiProcessingStatus || 'idle'}`);
      console.log(`   Last Scanned: ${gmail.lastSyncedAt ? new Date(gmail.lastSyncedAt).toLocaleString() : 'Never'}`);
      console.log("");
    }

  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

main();
