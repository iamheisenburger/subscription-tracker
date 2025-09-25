import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { api } from "../../../../convex/_generated/api";
import { fetchMutation } from "convex/nextjs";

// Test API endpoint to verify SubWise features
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    const results: Record<string, unknown> = {};

    if (action === "all" || action === "subwise") {
      console.log("🧪 Testing SubWise subscription addition...");
      try {
        const subwiseResult = await fetchMutation(api.users.addMissingSubWiseSubscription, {
          clerkId: userId
        });
        results.subwise = subwiseResult;
      } catch (error) {
        results.subwise = { error: error instanceof Error ? error.message : String(error) };
      }
    }

    if (action === "all" || action === "notifications") {
      console.log("🧪 Testing notification system...");
      try {
        // Test basic notification
        const testResult = await fetchMutation(api.notifications.sendTestNotification, {
          clerkId: userId,
          type: "test"
        });
        results.testNotification = testResult;

        // Test renewal reminder
        const renewalResult = await fetchMutation(api.notifications.sendTestNotification, {
          clerkId: userId,
          type: "renewal_reminder"
        });
        results.renewalTest = renewalResult;

        // Test spending alert
        const spendingResult = await fetchMutation(api.notifications.sendTestNotification, {
          clerkId: userId,
          type: "spending_alert"
        });
        results.spendingTest = spendingResult;
      } catch (error) {
        results.notifications = { error: error instanceof Error ? error.message : String(error) };
      }
    }

    return NextResponse.json({
      success: true,
      message: "Tests completed",
      results,
      instructions: [
        "🔄 Refresh your dashboard to see SubWise subscription",
        "📧 Check your email for test notifications",
        "⏰ Notifications may take 1-2 minutes to arrive"
      ]
    });

  } catch (error) {
    console.error("❌ Test API error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    return NextResponse.json(
      { 
        error: "Test failed", 
        details: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
      }, 
      { status: 500 }
    );
  }
}

// GET endpoint to show test interface
export async function GET() {
  return new Response(`
    <html>
      <head>
        <title>SubWise Feature Tests</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            max-width: 800px; 
            margin: 40px auto; 
            padding: 20px; 
            background: #0f0f23;
            color: #cccccc;
          }
          .button { 
            background: #3b82f6; 
            color: white; 
            border: none; 
            padding: 12px 24px; 
            border-radius: 8px; 
            cursor: pointer; 
            margin: 10px; 
            font-size: 16px;
          }
          .button:hover { background: #2563eb; }
          .result { 
            background: #1a1a2e; 
            border: 1px solid #333; 
            border-radius: 8px; 
            padding: 20px; 
            margin: 20px 0; 
            white-space: pre-wrap; 
            font-family: monospace;
          }
          .success { border-left: 4px solid #10b981; }
          .error { border-left: 4px solid #ef4444; }
        </style>
      </head>
      <body>
        <h1>🧪 SubWise Feature Tests</h1>
        <p>Use these buttons to test if SubWise features are actually working:</p>
        
        <button class="button" onclick="runTest('subwise')">
          ➕ Add SubWise Subscription
        </button>
        
        <button class="button" onclick="runTest('notifications')">
          📧 Test Notifications
        </button>
        
        <button class="button" onclick="runTest('all')">
          🚀 Run All Tests
        </button>
        
        <div id="results"></div>

        <script>
          async function runTest(action) {
            const resultsDiv = document.getElementById('results');
            resultsDiv.innerHTML = '<div class="result">🔄 Running tests...</div>';
            
            try {
              const response = await fetch('/api/test-features', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action })
              });
              
              const data = await response.json();
              
              const resultClass = data.success ? 'result success' : 'result error';
              resultsDiv.innerHTML = \`<div class="\${resultClass}">
📋 Test Results:

\${JSON.stringify(data, null, 2)}
              </div>\`;
            } catch (error) {
              resultsDiv.innerHTML = \`<div class="result error">❌ Error: \${error.message}</div>\`;
            }
          }
        </script>
      </body>
    </html>
  `, {
    headers: { 'Content-Type': 'text/html' }
  });
}
