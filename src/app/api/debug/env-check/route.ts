import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { validateTierDetectionEnvironment } from '@/lib/tier-detection';

/**
 * Environment validation endpoint for debugging tier detection issues
 * Only works for authenticated users in development mode or with proper permissions
 */
export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow in development or for admin users
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isAdminUser = process.env.ADMIN_USER_ID === userId; // Optional admin check
    
    if (!isDevelopment && !isAdminUser) {
      return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
    }

    // Validate environment
    const envCheck = validateTierDetectionEnvironment();

    // Check for additional configuration
    const additionalChecks = {
      clerkPremiumPlanId: !!process.env.NEXT_PUBLIC_CLERK_PREMIUM_PLAN_ID,
      resendApiKey: !!process.env.RESEND_API_KEY,
      clerkJwtIssuerDomain: !!process.env.CLERK_JWT_ISSUER_DOMAIN,
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV || 'local'
    };

    // Obfuscated environment values for debugging (safe to log)
    const safeEnvValues = {
      clerkPublishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? 
        `${process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.substring(0, 10)}...` : 'NOT_SET',
      convexUrl: process.env.NEXT_PUBLIC_CONVEX_URL ?
        `${process.env.NEXT_PUBLIC_CONVEX_URL.substring(0, 20)}...` : 'NOT_SET',
      clerkSecretKey: process.env.CLERK_SECRET_KEY ? 
        `sk_...${process.env.CLERK_SECRET_KEY.slice(-4)}` : 'NOT_SET',
      webhookSecret: process.env.CLERK_WEBHOOK_SECRET ? 'SET' : 'NOT_SET',
      premiumPlanId: process.env.NEXT_PUBLIC_CLERK_PREMIUM_PLAN_ID || 'NOT_SET'
    };

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      userId,
      environment: {
        valid: envCheck.valid,
        missing: envCheck.missing,
        warnings: envCheck.warnings,
        additional: additionalChecks,
        safeValues: safeEnvValues
      },
      recommendations: generateRecommendations(envCheck, additionalChecks)
    });

  } catch (error) {
    console.error('❌ Environment check error:', error);
    return NextResponse.json({ 
      error: 'Environment check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function generateRecommendations(
  envCheck: ReturnType<typeof validateTierDetectionEnvironment>,
  additionalChecks: Record<string, unknown>
): string[] {
  const recommendations: string[] = [];

  if (envCheck.missing.length > 0) {
    recommendations.push(`Set missing environment variables: ${envCheck.missing.join(', ')}`);
  }

  if (!additionalChecks.clerkPremiumPlanId) {
    recommendations.push('Set NEXT_PUBLIC_CLERK_PREMIUM_PLAN_ID to your Clerk premium plan ID for proper subscription detection');
  }

  if (!additionalChecks.resendApiKey) {
    recommendations.push('Set RESEND_API_KEY for email notifications to work');
  }

  if (!additionalChecks.clerkJwtIssuerDomain) {
    recommendations.push('Set CLERK_JWT_ISSUER_DOMAIN from your Clerk JWT template for Convex integration');
  }

  if (envCheck.warnings.length > 0) {
    recommendations.push('Consider addressing environment warnings for better reliability');
  }

  return recommendations;
}
