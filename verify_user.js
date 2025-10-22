const { ConvexHttpClient } = require("convex/browser");
const client = new ConvexHttpClient("https://hearty-leopard-116.convex.cloud");

async function verifyUser() {
  const allUsers = await client.query("adminQueries:getAllUsers");
  
  const targetClerkId = "user_33juD7PuxD9OVFJtVM9Hi74EneG";
  const user = allUsers.find(u => u.clerkId === targetClerkId);
  
  console.log("Target clerkId:", targetClerkId);
  console.log("User found:", user || "NOT FOUND");
  
  if (user) {
    const connections = await client.query("emailConnections:getUserConnections", {
      clerkUserId: targetClerkId
    });
    console.log("\nConnections for this user:", connections.length);
    console.log(JSON.stringify(connections, null, 2));
  }
  
  // Also check all users with arshadhakim67 email
  const arshadUsers = allUsers.filter(u => u.email && u.email.includes("arshadhakim67"));
  console.log("\n\nAll users with arshadhakim67 email:");
  console.log(JSON.stringify(arshadUsers, null, 2));
}

verifyUser();
