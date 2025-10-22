const { ConvexHttpClient } = require("convex/browser");
const client = new ConvexHttpClient("https://hearty-leopard-116.convex.cloud");

async function checkUser() {
  // Get all users to find which one has the connections
  const allUsers = await client.query("adminQueries:getAllUsers");
  
  const stats = await client.query("adminQueries:getDbStats");
  
  console.log("Email connections userIds:", stats.connections.byUser.map(c => c.userId));
  console.log("\nAll users internal IDs:");
  // Note: We can't directly see internal _id from the query, but we can try to match
  console.log(JSON.stringify(stats.connections, null, 2));
}

checkUser();
