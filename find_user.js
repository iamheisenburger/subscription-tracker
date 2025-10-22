const { ConvexHttpClient } = require("convex/browser");
const client = new ConvexHttpClient("https://hearty-leopard-116.convex.cloud");

async function findUser() {
  const allUsers = await client.query("adminQueries:getAllUsers");
  
  // Find automate_1 tier users
  const automateUsers = allUsers.filter(u => u.tier === "automate_1");
  
  console.log("Automate tier users:");
  automateUsers.forEach(u => {
    console.log(`  ${u.email} - ${u.clerkId}`);
  });
  
  // Check which one has connections
  for (const user of automateUsers) {
    const connections = await client.query("emailConnections:getUserConnections", {
      clerkUserId: user.clerkId
    });
    if (connections.length > 0) {
      console.log(`\n✅ USER WITH CONNECTIONS: ${user.email} (${user.clerkId})`);
      console.log(`   Connections: ${connections.length}`);
      
      const receipts = await client.query("adminQueries:getUserEmailReceipts", {
        clerkUserId: user.clerkId
      });
      console.log(`   Receipts: ${receipts.length}`);
      
      const candidates = await client.query("adminQueries:getUserDetectionCandidates", {
        clerkUserId: user.clerkId
      });
      console.log(`   Detection candidates: ${candidates.length}`);
    }
  }
}

findUser().catch(console.error);
