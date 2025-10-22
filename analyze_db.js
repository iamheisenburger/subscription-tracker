const { ConvexHttpClient } = require("convex/browser");
const client = new ConvexHttpClient("https://hearty-leopard-116.convex.cloud");

async function analyze() {
  const allUsers = await client.query("adminQueries:getAllUsers");
  
  console.log("=== DATABASE ANALYSIS ===\n");
  
  const tierCounts = {};
  allUsers.forEach(u => {
    tierCounts[u.tier] = (tierCounts[u.tier] || 0) + 1;
  });
  
  console.log("Users by tier:");
  Object.entries(tierCounts).forEach(([tier, count]) => {
    console.log("  " + tier + ": " + count + " users");
  });
  console.log("  TOTAL: " + allUsers.length + " users\n");
  
  const emailMap = {};
  allUsers.forEach(u => {
    if (u.email) {
      emailMap[u.email] = (emailMap[u.email] || 0) + 1;
    }
  });
  
  const duplicates = Object.entries(emailMap).filter(([email, count]) => count > 1);
  console.log("Duplicate emails:");
  duplicates.forEach(([email, count]) => {
    console.log("  " + email + ": " + count + " accounts");
  });
  
  const testEmails = [
    "devansharma466", "tiktokburner54", "sattar.louay", "chiragpanjwani87",
    "aevrlystore", "kingoftiktok619", "1callumreid", "isabellacarterai"
  ];
  
  const testUsers = allUsers.filter(u => 
    testEmails.some(test => u.email && u.email.includes(test))
  );
  
  console.log("\nTest accounts: " + testUsers.length);
  console.log("Real accounts: " + (allUsers.length - testUsers.length));
}

analyze().catch(console.error);
