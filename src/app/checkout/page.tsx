"use client"

import { useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { SignedIn, useUser } from "@clerk/nextjs";
import { CheckoutButton } from "@clerk/nextjs/experimental";
import type { CommerceSubscriptionPlanPeriod } from "@clerk/types";
import { Button } from "@/components/ui/button";
import { plusPlanId, automatePlanId } from "@/lib/clerk-plan-ids";

// Force dynamic rendering (no static generation)
export const dynamic = 'force-dynamic';

/**
 * Checkout Content Component - Uses useSearchParams
 */
function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isLoaded, user } = useUser();

  const billing = searchParams.get('billing') || 'annual';
  const plan = searchParams.get('plan') || 'plus'; // Default to plus

  const planId = plan === 'automate' ? automatePlanId : plusPlanId;
  const planName = plan === 'automate' ? 'Automate' : 'Plus';
  const planPeriodValue = billing === 'monthly' ? 'month' : 'year';
  const clerkPlanPeriod = planPeriodValue as unknown as CommerceSubscriptionPlanPeriod;

  // If no user, redirect to sign-up
  useEffect(() => {
    if (isLoaded && !user) {
      router.push(`/sign-up?plan=${plan}&billing=${billing}`);
    }
  }, [isLoaded, user, router, billing, plan]);

  if (!isLoaded || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground font-sans">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="max-w-md w-full px-4">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold font-sans mb-2">
            Complete Your {planName} Subscription
          </h1>
          <p className="text-muted-foreground font-sans">
            Click below to start your 7-day free trial
          </p>
        </div>

        {/* Auto-trigger checkout */}
        <SignedIn>
          <CheckoutButton
            planId={planId}
            planPeriod={clerkPlanPeriod}
            onSubscriptionComplete={() => {
              // Force redirect to dashboard
              window.location.href = '/dashboard';
            }}
            newSubscriptionRedirectUrl="/dashboard"
            checkoutProps={{
              appearance: {
                elements: {
                  // ONLY override the submit button color - everything else stays Clerk default
                  formButtonPrimary: "!bg-primary !text-primary-foreground hover:!bg-primary/90 !font-semibold !shadow-md",
                }
              }
            }}
          >
            <Button className="w-full font-sans" size="lg">
              Start 7-day Free Trial
            </Button>
          </CheckoutButton>
        </SignedIn>

        <div className="mt-6 text-center">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/dashboard')}
            className="font-sans text-sm"
          >
            Skip for now
          </Button>
        </div>

        {/* Trust indicators */}
        <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="text-green-600">✓</span>
            <span className="font-sans">7-day free trial</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-600">✓</span>
            <span className="font-sans">Cancel anytime</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Checkout Page - Wrapped in Suspense for useSearchParams
 */
export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground font-sans">Loading checkout...</p>
        </div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}

