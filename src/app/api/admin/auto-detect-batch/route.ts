import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { batchDetectPremiumUsers } from '@/lib/automatic-premium-detection';

/**
 * POST /api/admin/auto-detect-batch
 * 
 * Admin endpoint to batch-process users and automatically detect premium status.
 * This is useful for:
 * 1. Fixing users who were missed by webhook failures
 * 2. Periodic cleanup to ensure no paying customers are left as free
 * 3. One-time migration after implementing new detection logic
 * 
 * Should be called periodically (daily/weekly) to catch any missed premium users.
 */
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Simple admin check - in production, use proper admin role checking
    const isAdmin = process.env.ADMIN_USER_ID === userId || 
                   process.env.NODE_ENV === 'development';
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      limit = 50,           // Max users to process per batch
      daysBack = 30,        // Only check users created in last N days
      forceRecheck = false  // Recheck even premium users
    } = body;

    console.log('🔧 Starting batch premium detection:', {
      limit,
      daysBack,
      forceRecheck,
      requestedBy: userId.slice(-8)
    });

    // Get list of users to check from Convex
    const cutoffDate = Date.now() - (daysBack * 24 * 60 * 60 * 1000);
    
    // Note: This would need a Convex function to get recent users
    // For now, we'll get from Clerk directly
    const client = await clerkClient();
    const clerkUsers = await client.users.getUserList({
      limit,
      orderBy: '-created_at'
    });

    const usersToCheck = clerkUsers.data
      .filter(user => {
        // Only check recent users
        if (user.createdAt && user.createdAt < cutoffDate) {
          return false;
        }
        
        // If not forcing recheck, skip users who already have premium metadata
        if (!forceRecheck) {
          const meta = user.publicMetadata as { tier?: string };
          if (meta?.tier === 'premium_user') {
            return false;
          }
        }
        
        return true;
      })
      .map(user => user.id);

    console.log(`🔍 Found ${usersToCheck.length} users to check for premium status`);

    // Run batch detection
    const results = await batchDetectPremiumUsers(usersToCheck);

    console.log('✅ Batch premium detection completed:', {
      checked: results.checked,
      upgraded: results.upgraded.length,
      errors: results.errors.length
    });

    return NextResponse.json({
      success: true,
      results: {
        checked: results.checked,
        upgraded: results.upgraded.length,
        upgradeUserIds: results.upgraded.map(id => id.slice(-8)), // Truncated for privacy
        errors: results.errors.length,
        errorDetails: process.env.NODE_ENV === 'development' ? results.errors : []
      },
      parameters: {
        limit,
        daysBack,
        forceRecheck
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Batch premium detection error:', error);
    return NextResponse.json({
      error: 'Batch detection failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * GET /api/admin/auto-detect-batch
 * 
 * Get statistics about users who might need premium detection
 */
export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = process.env.ADMIN_USER_ID === userId || 
                   process.env.NODE_ENV === 'development';
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const client = await clerkClient();
    
    // Get recent users
    const recentUsers = await client.users.getUserList({
      limit: 100,
      orderBy: '-created_at'
    });

    const stats = {
      totalRecentUsers: recentUsers.data.length,
      usersWithPremiumMetadata: 0,
      usersWithEmptyMetadata: 0,
      usersWithPaymentProviders: 0,
      oldestUserDate: null as string | null,
      newestUserDate: null as string | null
    };

    for (const user of recentUsers.data) {
      const meta = user.publicMetadata as { tier?: string };
      
      if (meta?.tier === 'premium_user') {
        stats.usersWithPremiumMetadata++;
      } else if (!meta || Object.keys(meta).length === 0) {
        stats.usersWithEmptyMetadata++;
      }

      if (user.externalAccounts?.some(acc => ['stripe', 'paypal'].includes(acc.provider))) {
        stats.usersWithPaymentProviders++;
      }

      if (!stats.oldestUserDate || (user.createdAt && user.createdAt < Date.parse(stats.oldestUserDate))) {
        stats.oldestUserDate = user.createdAt ? new Date(user.createdAt).toISOString() : null;
      }
      
      if (!stats.newestUserDate || (user.createdAt && user.createdAt > Date.parse(stats.newestUserDate))) {
        stats.newestUserDate = user.createdAt ? new Date(user.createdAt).toISOString() : null;
      }
    }

    return NextResponse.json({
      stats,
      recommendations: generateRecommendations(stats),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Batch stats error:', error);
    return NextResponse.json({
      error: 'Failed to get stats',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function generateRecommendations(stats: {
  totalRecentUsers: number;
  usersWithEmptyMetadata: number;
  usersWithPaymentProviders: number;
}): string[] {
  const recommendations: string[] = [];

  if (stats.usersWithEmptyMetadata > 5) {
    recommendations.push(`${stats.usersWithEmptyMetadata} users have empty metadata - consider running batch detection`);
  }

  if (stats.usersWithPaymentProviders > 0) {
    recommendations.push(`${stats.usersWithPaymentProviders} users have payment providers connected - they may be premium`);
  }

  if (stats.totalRecentUsers > 50) {
    recommendations.push('Large number of recent users - consider running batch detection with higher limit');
  }

  return recommendations;
}
