const { ConvexHttpClient } = require("convex/browser");
const client = new ConvexHttpClient("https://hearty-leopard-116.convex.cloud");

async function test() {
  const clerkUserId = "user_33juD7PuxD9OVFJtVM9Hi74EneG";
  
  console.log("Testing getUserConnections (public query)...");
  const publicResult = await client.query("emailConnections:getUserConnections", {
    clerkUserId
  });
  console.log("Public query result:", publicResult.length, "connections");
  
  console.log("\nTesting triggerUserEmailScan...");
  const scanResult = await client.action("emailScannerActions:triggerUserEmailScan", {
    clerkUserId
  });
  console.log("Scan result:", JSON.stringify(scanResult, null, 2));
}

test().catch(console.error);
