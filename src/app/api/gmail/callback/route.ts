import { NextRequest, NextResponse } from "next/server";
import { fetchMutation } from "convex/nextjs";
import { api } from "../../../../../convex/_generated/api";

/**
 * Gmail OAuth Callback Handler
 * Exchanges authorization code for tokens and stores in Convex
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state"); // Clerk user ID
    const error = searchParams.get("error");

    // Handle OAuth errors
    if (error) {
      console.error("Gmail OAuth error:", error);
      return NextResponse.redirect(
        new URL(`/dashboard/settings?gmail_error=${encodeURIComponent(error)}`, request.url)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL("/dashboard/settings?gmail_error=missing_params", request.url)
      );
    }

    const userId = state; // Clerk user ID from state parameter

    // Exchange authorization code for tokens
    const clientId = process.env.GOOGLE_CLIENT_ID!;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
    const redirectUri = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI || "http://localhost:3000/api/gmail/callback";

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error("Token exchange failed:", errorData);
      return NextResponse.redirect(
        new URL("/dashboard/settings?gmail_error=token_exchange_failed", request.url)
      );
    }

    const tokens = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokens;

    if (!refresh_token) {
      console.error("No refresh token received - user may have already authorized");
      return NextResponse.redirect(
        new URL("/dashboard/settings?gmail_error=no_refresh_token", request.url)
      );
    }

    // Get user's email from Google
    const userinfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    if (!userinfoResponse.ok) {
      console.error("Failed to get user info");
      return NextResponse.redirect(
        new URL("/dashboard/settings?gmail_error=userinfo_failed", request.url)
      );
    }

    const userinfo = await userinfoResponse.json();
    const email = userinfo.email;

    // Store Gmail connection in Convex
    try {
      await fetchMutation(api.emailConnections.createGmailConnection, {
        clerkUserId: userId,
        email,
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresIn: expires_in,
      });

      // Success! Redirect to dashboard with success message
      return NextResponse.redirect(
        new URL("/dashboard?gmail_connected=true", request.url)
      );
    } catch (convexError) {
      console.error("Failed to store Gmail connection:", convexError);
      return NextResponse.redirect(
        new URL("/dashboard/settings?gmail_error=storage_failed", request.url)
      );
    }
  } catch (error) {
    console.error("Gmail callback error:", error);
    return NextResponse.redirect(
      new URL("/dashboard/settings?gmail_error=unknown", request.url)
    );
  }
}
