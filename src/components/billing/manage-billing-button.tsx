"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { PlanDetailsButton } from "@clerk/nextjs/experimental";

interface ManageBillingButtonProps {
  className?: string;
}

/**
 * ManageBillingButton
 * - If the user is signed out: opens Clerk sign-in
 * - If signed in and already subscribed: opens Plan Details drawer to manage/cancel
 * - If signed in and not subscribed: opens Checkout drawer to start 7-day trial
 *
 * Requires NEXT_PUBLIC_CLERK_PREMIUM_PLAN_ID to be set to your Clerk plan id.
 */
export function ManageBillingButton({ className }: ManageBillingButtonProps) {
  const planId = process.env.NEXT_PUBLIC_CLERK_PREMIUM_PLAN_ID ?? "";

  return (
    <div className={className}>
      {/* Signed-out users must authenticate first */}
      <SignedOut>
        <SignInButton>
          <Button className={cn("px-4 py-2", className)}>Manage Billing</Button>
        </SignInButton>
      </SignedOut>

      {/* Signed-in: open checkout (if planId present) or fallback */}
      <SignedIn>
        {planId ? (
          <PlanDetailsButton
            planId={planId}
            planDetailsProps={{
              appearance: {
                variables: {
                  colorPrimary: "hsl(var(--primary))",
                  colorText: "hsl(var(--foreground))",
                  colorBackground: "hsl(var(--background))",
                  fontFamily: "var(--font-sans)",
                },
              },
            }}
          >
            <Button className={cn("px-4 py-2", className)}>Manage Billing</Button>
          </PlanDetailsButton>
        ) : (
          <Button
            className={cn("px-4 py-2", className)}
            onClick={() => window.location.href = "/pricing"}
          >
            Manage Billing
          </Button>
        )}
      </SignedIn>
    </div>
  );
}


