import { ConvexHttpClient } from "convex/browser";
import { api } from "./convex/_generated/api.js";

const client = new ConvexHttpClient("https://hearty-leopard-116.convex.cloud");

async function fixUser() {
  try {
    const result = await client.mutation(api.users.setTier, {
      clerkId: "user_2n7Scrgtefyn2jyeaM",
      tier: "premium_user", 
      subscriptionType: "monthly"
    });
    console.log("✅ User tier updated:", result);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

fixUser();
