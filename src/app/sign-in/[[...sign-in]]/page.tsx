import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md px-4">
        <SignIn 
          path="/sign-in"
          routing="path"
          signUpUrl="/sign-up"
          fallbackRedirectUrl="/dashboard"
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

