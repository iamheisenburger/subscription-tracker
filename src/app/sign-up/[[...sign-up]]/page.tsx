"use client"

import { SignUp } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";

export default function Page() {
  const searchParams = useSearchParams();
  const plan = searchParams.get('plan'); // 'premium' or null (free)
  const billing = searchParams.get('billing'); // 'monthly' or 'annual'

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md px-4">
        {plan && (
          <div className="mb-4 p-4 bg-primary/10 border border-primary/20 rounded-lg text-center">
            <p className="text-sm font-medium font-sans">
              {plan === 'premium' ? (
                <>
                  Starting your <strong>7-day Premium free trial</strong>
                  {billing === 'annual' && <span className="ml-2 text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">SAVE 17%</span>}
                </>
              ) : (
                'Signing up for the Free plan'
              )}
            </p>
          </div>
        )}
        <SignUp 
          path="/sign-up"
          routing="path"
          signInUrl="/sign-in"
          forceRedirectUrl="/dashboard"
          fallbackRedirectUrl="/dashboard"
          afterSignUpUrl="/dashboard"
          unsafeMetadata={{
            plan: plan || 'free',
            billing: billing || 'monthly'
          }}
          appearance={{
            variables: {
              colorPrimary: "hsl(var(--primary))",
              fontFamily: "var(--font-sans)",
            },
            elements: {
              rootBox: "bg-card shadow-lg border border-border rounded-lg",
              card: "bg-card shadow-lg border border-border",
              formButtonPrimary: 
                "bg-primary text-primary-foreground hover:bg-primary/90 text-sm normal-case font-medium",
              headerTitle: "text-foreground font-sans",
              headerSubtitle: "text-muted-foreground font-sans",
              socialButtonsBlockButton: 
                "border border-border hover:bg-muted/50 text-foreground",
              formFieldLabel: "text-foreground font-sans",
              formFieldInput: 
                "bg-background border border-border text-foreground focus:ring-primary/20 focus:border-primary",
              footerActionText: "text-muted-foreground font-sans",
              footerActionLink: "text-primary hover:text-primary/80",
            },
          }}
        />
      </div>
    </div>
  );
}

