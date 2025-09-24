import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';

// Configure web-push with VAPID keys
// In production, these would be environment variables
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_EMAIL = process.env.VAPID_EMAIL || 'mailto:noreply@usesubwise.app';

// Helper function to validate and clean VAPID key
function cleanVapidKey(key: string): string {
  if (!key) return '';
  // Remove any padding and ensure URL-safe base64
  return key.replace(/[=]+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
}

// Set VAPID details for web-push (only if keys are properly configured)
function initializeVapidKeys() {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || 
      VAPID_PUBLIC_KEY === 'YOUR_VAPID_PUBLIC_KEY_HERE' || 
      VAPID_PRIVATE_KEY === 'YOUR_VAPID_PRIVATE_KEY_HERE') {
    return false;
  }

  try {
    const cleanPublicKey = cleanVapidKey(VAPID_PUBLIC_KEY);
    const cleanPrivateKey = cleanVapidKey(VAPID_PRIVATE_KEY);
    
    webpush.setVapidDetails(VAPID_EMAIL, cleanPublicKey, cleanPrivateKey);
    return true;
  } catch (error) {
    console.error('❌ Invalid VAPID keys:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify internal API key for security
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.INTERNAL_API_KEY || 'internal'}`;
    
    if (authHeader !== expectedAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { subscription, payload } = body;

    if (!subscription || !payload) {
      return NextResponse.json({ 
        error: 'Missing required fields: subscription, payload' 
      }, { status: 400 });
    }

    // Initialize VAPID keys (safe for build time)
    const vapidInitialized = initializeVapidKeys();
    if (!vapidInitialized) {
      console.warn('⚠️ VAPID keys not configured - push notifications disabled');
      return NextResponse.json({ 
        success: false, 
        error: 'Push notifications not configured (missing or invalid VAPID keys)' 
      });
    }

    // Send push notification
    const result = await webpush.sendNotification(subscription, payload);

    console.log('✅ Push notification sent successfully');

    return NextResponse.json({
      success: true,
      messageId: `push-${Date.now()}`,
      statusCode: result.statusCode,
    });

  } catch (error) {
    console.error('❌ Push notification error:', error);

    // Handle specific web-push errors
    if (error && typeof error === 'object' && 'statusCode' in error) {
      const webPushError = error as { statusCode: number; body: string };
      
      // Handle common errors
      switch (webPushError.statusCode) {
        case 410:
          // Subscription has expired or is no longer valid
          return NextResponse.json({
            success: false,
            error: 'Push subscription expired',
            shouldRemoveSubscription: true,
          }, { status: 410 });
        
        case 413:
          return NextResponse.json({
            success: false,
            error: 'Payload too large',
          }, { status: 413 });
        
        case 429:
          return NextResponse.json({
            success: false,
            error: 'Rate limited - too many requests',
          }, { status: 429 });
        
        default:
          return NextResponse.json({
            success: false,
            error: `Push service error: ${webPushError.statusCode}`,
          }, { status: webPushError.statusCode });
      }
    }

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown push notification error',
    }, { status: 500 });
  }
}

// Test endpoint
export async function GET() {
  return NextResponse.json({
    message: 'Push notification service is running',
    vapidConfigured: VAPID_PUBLIC_KEY !== 'YOUR_VAPID_PUBLIC_KEY_HERE',
    timestamp: new Date().toISOString(),
  });
}
