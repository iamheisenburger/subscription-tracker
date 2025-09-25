// Test script to verify SubWise features are working
// Run with: node test-functions.js

const { ConvexClient } = require("convex/browser");
const { api } = require("./convex/_generated/api.js");

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;
const USER_CLERK_ID = process.argv[2]; // Pass user clerk ID as argument

if (!CONVEX_URL) {
  console.error("❌ NEXT_PUBLIC_CONVEX_URL not found in environment");
  process.exit(1);
}

if (!USER_CLERK_ID) {
  console.error("❌ Usage: node test-functions.js <clerk_user_id>");
  console.error("   Example: node test-functions.js user_2xxxxx");
  process.exit(1);
}

const client = new ConvexClient(CONVEX_URL);

async function testSubWiseFeatures() {
  console.log("🚀 Testing SubWise Features...");
  console.log("📋 User Clerk ID:", USER_CLERK_ID);
  console.log("🔗 Convex URL:", CONVEX_URL);
  console.log();

  try {
    // Test 1: Add missing SubWise subscription
    console.log("🧪 TEST 1: Adding SubWise subscription...");
    const subwiseResult = await client.mutation(api.users.addMissingSubWiseSubscription, {
      clerkId: USER_CLERK_ID
    });
    console.log("✅ SubWise Result:", subwiseResult);
    console.log();

    // Test 2: Send test notification
    console.log("🧪 TEST 2: Sending test notification...");
    const testNotification = await client.mutation(api.notifications.sendTestNotification, {
      clerkId: USER_CLERK_ID,
      type: "test"
    });
    console.log("✅ Test Notification Result:", testNotification);
    console.log();

    // Test 3: Send renewal reminder test
    console.log("🧪 TEST 3: Sending test renewal reminder...");
    const renewalTest = await client.mutation(api.notifications.sendTestNotification, {
      clerkId: USER_CLERK_ID,
      type: "renewal_reminder"
    });
    console.log("✅ Renewal Test Result:", renewalTest);
    console.log();

    // Test 4: Send spending alert test
    console.log("🧪 TEST 4: Sending test spending alert...");
    const spendingTest = await client.mutation(api.notifications.sendTestNotification, {
      clerkId: USER_CLERK_ID,
      type: "spending_alert"
    });
    console.log("✅ Spending Alert Test Result:", spendingTest);
    console.log();

    console.log("🎉 ALL TESTS COMPLETED!");
    console.log("📧 Check your email for test notifications in the next few minutes.");
    console.log("🔄 Refresh your SubWise dashboard to see the SubWise subscription.");

  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error("🔍 Full error:", error);
  } finally {
    client.close();
  }
}

testSubWiseFeatures();
