"use client"

import { useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { SignedIn, useUser } from "@clerk/nextjs";
import { CheckoutButton } from "@clerk/nextjs/experimental";
import { Button } from "@/components/ui/button";

/**
 * Checkout Content Component - Uses useSearchParams
 */
function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isLoaded, user } = useUser();
  
  const billing = searchParams.get('billing') || 'annual';
  const PREMIUM_PLAN_ID = "cplan_33DAB0ChNOO9L2vRGzokuOvc4dl";
  
  // If no user, redirect to sign-up
  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-up?plan=premium&billing=' + billing);
    }
  }, [isLoaded, user, router, billing]);

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
            Complete Your Subscription
          </h1>
          <p className="text-muted-foreground font-sans">
            Click below to start your 7-day free trial
          </p>
        </div>

        {/* Auto-trigger checkout */}
        <SignedIn>
          <CheckoutButton
            planId={PREMIUM_PLAN_ID}
            planPeriod={billing === 'monthly' ? 'month' : 'annual'}
            onSubscriptionComplete={() => {
              console.log('Subscription completed! Redirecting to dashboard...');
              router.push('/dashboard');
            }}
            newSubscriptionRedirectUrl="/dashboard"
            checkoutProps={{
              appearance: {
                elements: {
                  // Submit button - match theme with !important
                  formButtonPrimary: "!bg-primary !text-primary-foreground hover:!bg-primary/90 !font-semibold !shadow-md",
                  
                  // Form inputs - better visibility with !important
                  formFieldInput: "!bg-background !border-2 !border-border !text-foreground !font-medium",
                  formFieldLabel: "!text-foreground !font-semibold",
                  
                  // Country select - better visibility with !important
                  selectButton: "!bg-background !border-2 !border-border !text-foreground !font-medium",
                  
                  // All text elements
                  text: "!text-foreground",
                },
                variables: {
                  colorPrimary: "hsl(var(--primary))",
                  colorBackground: "hsl(var(--background))",
                  colorText: "hsl(var(--foreground))",
                  fontFamily: "var(--font-sans)",
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

