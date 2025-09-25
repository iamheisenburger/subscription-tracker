import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { autoUpgradeIfPremium } from '@/lib/automatic-premium-detection';

/**
 * POST /api/auto-detect-premium
 * 
 * Automatically detects if the authenticated user should be premium
 * and upgrades them if webhooks failed to work properly.
 * 
 * This is called automatically by UserSync when a user appears as free
 * but might have purchased premium (webhook failure scenario).
 */
export async function POST() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔍 Auto-detect premium request for user:', userId.slice(-8));

    // Run the automatic premium detection
    const wasUpgraded = await autoUpgradeIfPremium(userId);

    if (wasUpgraded) {
      return NextResponse.json({
        success: true,
        upgraded: true,
        message: 'User automatically upgraded to premium'
      });
    } else {
      return NextResponse.json({
        success: true,
        upgraded: false,
        message: 'No premium status detected'
      });
    }

  } catch (error) {
    console.error('❌ Auto-detect premium error:', error);
    return NextResponse.json({
      error: 'Auto-detection failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * GET /api/auto-detect-premium
 * 
 * Returns current detection status without making changes.
 * Useful for debugging what the detection system sees.
 */
export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Import the detection function
    const { detectPremiumFromClerkBilling } = await import('@/lib/automatic-premium-detection');
    const detection = await detectPremiumFromClerkBilling(userId);

    return NextResponse.json({
      userId: userId.slice(-8),
      detection: {
        isPremium: detection.isPremium,
        confidence: detection.confidence,
        source: detection.source,
        subscriptionType: detection.subscriptionType,
        details: detection.details
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Auto-detect premium GET error:', error);
    return NextResponse.json({
      error: 'Detection check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
