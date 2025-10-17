import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

/**
 * Gmail OAuth Initiation Endpoint
 * Redirects user to Google OAuth consent screen
 */
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get Google OAuth credentials from environment
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI || "http://localhost:3000/api/gmail/callback";

    if (!clientId) {
      console.error("GOOGLE_CLIENT_ID not configured");
      return NextResponse.json({ error: "Gmail integration not configured" }, { status: 500 });
    }

    // Build Google OAuth URL
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/userinfo.email",
      access_type: "offline", // Request refresh token
      prompt: "consent", // Force consent screen to get refresh token
      state: userId, // Pass Clerk user ID for security
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    // Redirect to Google OAuth
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("Error initiating Gmail OAuth:", error);
    return NextResponse.json({ error: "Failed to initiate OAuth" }, { status: 500 });
  }
}
