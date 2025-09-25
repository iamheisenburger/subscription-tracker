import { PricingTable } from '@clerk/nextjs'

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4 font-sans">
            Choose Your Plan
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-sans">
            Start tracking your subscriptions for free, or unlock powerful features with Premium
          </p>
        </div>

        {/* REAL Clerk PricingTable with proper billing integration */}
        <div className="max-w-4xl mx-auto">
          <PricingTable 
            newSubscriptionRedirectUrl="/dashboard"
            appearance={{
              variables: {
                colorPrimary: "hsl(var(--primary))",
                colorText: "hsl(var(--foreground))",
                colorTextSecondary: "hsl(var(--muted-foreground))",
                colorBackground: "hsl(var(--card))",
                colorInputBackground: "hsl(var(--input))",
                colorInputText: "hsl(var(--foreground))",
                fontFamily: "var(--font-sans)",
                borderRadius: "var(--radius)",
                colorNeutral: "hsl(var(--muted))",
                colorSuccess: "hsl(var(--primary))",
                colorDanger: "hsl(var(--destructive))",
                colorBorder: "hsl(var(--border))",
              },
              elements: {
                rootBox: "bg-card border border-border rounded-lg shadow-sm",
                card: "bg-card border border-border rounded-lg shadow-sm",
                headerTitle: "font-sans font-bold text-foreground",
                headerSubtitle: "font-sans text-muted-foreground", 
                text: "font-sans text-foreground",
                formButtonPrimary: "bg-primary text-primary-foreground hover:bg-primary/90 font-sans font-medium rounded-md transition-all duration-200 min-h-[44px] px-6 py-3",
                formButtonSecondary: "bg-muted text-foreground hover:bg-muted/80 font-sans font-medium rounded-md transition-all duration-200 min-h-[44px] px-6 py-3 border border-border",
                // Better mobile responsiveness
                modalContent: "max-w-[95vw] max-h-[95vh] p-4 overflow-y-auto",
                modalCard: "max-w-full mx-auto p-4",
              }
            }}
            checkoutProps={{
              appearance: {
                variables: {
                  colorPrimary: "hsl(var(--primary))",
                  colorText: "hsl(var(--foreground))",
                  colorBackground: "hsl(var(--background))",
                  colorInputBackground: "hsl(var(--input))",
                  fontFamily: "var(--font-sans)",
                  borderRadius: "var(--radius)",
                  colorBorder: "hsl(var(--border))",
                  colorNeutral: "hsl(var(--muted))",
                  colorSuccess: "hsl(var(--primary))",
                  colorDanger: "hsl(var(--destructive))",
                },
                elements: {
                  rootBox: "bg-background max-w-[95vw] max-h-[95vh] p-4 overflow-y-auto",
                  card: "bg-card border border-border rounded-lg shadow-lg max-w-full mx-auto p-4",
                  formButtonPrimary: "bg-primary text-primary-foreground hover:bg-primary/90 font-sans font-medium rounded-md transition-all duration-200 min-h-[44px] px-6 py-3 w-full",
                  formFieldInput: "bg-input border border-border text-foreground rounded-md font-sans focus:ring-2 focus:ring-primary/20 focus:border-primary min-h-[44px] text-base",
                  text: "text-foreground font-sans",
                  headerTitle: "font-sans font-bold text-foreground",
                  // Mobile-specific improvements
                  modalContent: "!max-w-[95vw] !max-h-[95vh] !p-4",
                  modalCard: "!max-w-full !mx-auto !p-4",
                }
              }
            }}
          />
        </div>

        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground font-sans">
            All plans include secure data storage and regular backups. Cancel anytime.
          </p>
        </div>
      </div>
    </div>
  )
}
