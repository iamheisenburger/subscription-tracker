const { ConvexHttpClient } = require("convex/browser");
const client = new ConvexHttpClient("https://hearty-leopard-116.convex.cloud");

async function checkAll() {
  const receipts = await client.query("adminQueries:getUserEmailReceipts", {
    clerkUserId: "user_33juD7PuxD9OVFJtVM9Hi74EneG"
  });
  
  const connections = await client.query("emailConnections:getUserConnections", {
    clerkUserId: "user_33juD7PuxD9OVFJtVM9Hi74EneG"
  });

  console.log("Receipts count:", receipts.length);
  console.log("Connections count:", connections.length);
}

checkAll();
