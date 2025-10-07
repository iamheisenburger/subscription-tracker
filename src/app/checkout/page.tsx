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
                  // Modal container - proper z-index and positioning
                  rootBox: "!bg-black/50 !backdrop-blur-sm !z-[9999]",
                  modalContent: "!max-w-[95vw] sm:!max-w-[440px] !max-h-[90vh] !overflow-y-auto !mx-auto !my-4 sm:!my-8",
                  modalCloseButton: "!text-foreground hover:!bg-muted/80 !top-3 !right-3 !z-[10000] !w-8 !h-8",
                  
                  // Card styling - clean and modern
                  card: "!bg-card !border !border-border !shadow-2xl !rounded-xl !p-6",
                  
                  // Header - clear and prominent
                  headerTitle: "!text-foreground !font-bold !text-2xl font-sans !mb-1",
                  headerSubtitle: "!text-foreground !font-medium !text-sm font-sans !mb-4",
                  
                  // Pricing section - very visible
                  priceText: "!text-foreground !font-bold !text-3xl font-sans",
                  text: "!text-foreground font-sans !text-base",
                  
                  // Form labels - clear
                  formFieldLabel: "!text-foreground !font-semibold !text-sm font-sans !mb-1.5",
                  
                  // Form inputs - consistent and clear
                  formFieldInput: "!bg-background !border-2 !border-border !text-foreground !font-medium !text-base !h-12 !px-4 !rounded-lg focus:!ring-2 focus:!ring-primary/20 focus:!border-primary",
                  
                  // Dropdown styling - FIXED SIZE
                  selectButton: "!bg-background !border-2 !border-border !text-foreground !h-12 !px-4 !rounded-lg !flex !items-center !justify-between",
                  selectButtonText: "!text-foreground !font-medium",
                  selectListbox: "!max-h-[200px] !overflow-y-auto !bg-card !border-2 !border-border !rounded-lg !shadow-xl",
                  selectOption: "!text-foreground hover:!bg-muted !px-4 !py-2 !cursor-pointer",
                  selectOptionActive: "!bg-primary/10 !text-primary",
                  
                  // Submit button - very prominent
                  formButtonPrimary: "!bg-primary !text-primary-foreground hover:!bg-primary/90 !h-14 !text-lg !font-bold !shadow-lg !rounded-xl !mt-6 !w-full !transition-all",
                  
                  // Hide scary legal text
                  identityPreviewText: "!hidden",
                  identityPreviewEditButton: "!hidden",
                  footerActionText: "!hidden",
                  footerActionLink: "!hidden",
                  
                  // Footer - minimal
                  footer: "!mt-4 !pt-4 !border-t !border-border",
                  footerText: "!text-muted-foreground font-sans !text-xs !text-center",
                },
                variables: {
                  colorPrimary: "hsl(var(--primary))",
                  colorBackground: "hsl(var(--background))",
                  colorText: "hsl(var(--foreground))",
                  colorTextSecondary: "hsl(var(--foreground))",
                  colorInputBackground: "hsl(var(--background))",
                  colorInputText: "hsl(var(--foreground))",
                  fontFamily: "var(--font-sans)",
                  fontSize: "16px",
                  borderRadius: "0.75rem",
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

