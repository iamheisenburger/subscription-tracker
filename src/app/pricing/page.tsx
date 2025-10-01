import { CustomPricingV2 } from '@/components/landing/custom-pricing-v2'
import { Navbar } from '@/components/landing/navbar'
import { Footer } from '@/components/landing/footer'

export default function PricingPage() {
  return (
    <>
      <Navbar />
      <div className="pt-16 xs:pt-20 sm:pt-24">
        <CustomPricingV2 />
      </div>
      <Footer />
    </>
  )
}

/* OLD CLERK VERSION WITH TOGGLE ISSUES - KEPT FOR REFERENCE
"use client"

import { PricingTable } from '@clerk/nextjs'

export default function PricingPageClerk() {
  return (
    <>
      <style jsx global>{`
        /* ULTRA-AGGRESSIVE: Toggle/Switch Maximum Visibility Enhancement */
        .cl-internal-1vgucwi,
        .cl-toggleGroup,
        .cl-switchGroup,
        .cl-billingCycleToggle,
        [role="radiogroup"],
        [data-clerk-toggle],
        [data-clerk-switch],
        [class*="toggle"],
        [class*="switch"],
        [class*="radio"] {
          background: hsl(var(--muted)) !important;
          border: 3px solid hsl(var(--border)) !important;
          border-radius: 9999px !important;
          padding: 6px !important;
          display: inline-flex !important;
          gap: 6px !important;
          min-height: 52px !important;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15) !important;
          transition: all 0.3s ease !important;
        }
        
        /* Toggle buttons with maximum contrast */
        .cl-internal-1vgucwi button,
        .cl-toggleGroup button,
        .cl-switchGroup button,
        .cl-billingCycleToggle button,
        [role="radiogroup"] button,
        [role="radio"],
        [class*="toggle"] button,
        [class*="switch"] button {
          font-size: 16px !important;
          font-weight: 700 !important;
          padding: 12px 28px !important;
          border-radius: 9999px !important;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
          border: 3px solid transparent !important;
          min-height: 44px !important;
          font-family: var(--font-sans) !important;
          text-transform: uppercase !important;
          letter-spacing: 0.5px !important;
        }
        
        /* UNSELECTED state - Maximum visibility with gray background */
        .cl-internal-1vgucwi button:not([data-state="checked"]):not([aria-checked="true"]),
        .cl-toggleGroup button:not([aria-checked="true"]),
        .cl-switchGroup button:not([aria-checked="true"]),
        .cl-billingCycleToggle button:not([aria-checked="true"]),
        [role="radio"]:not([aria-checked="true"]),
        [class*="toggle"] button:not([data-state="checked"]),
        [class*="switch"] button:not([data-state="checked"]) {
          background: hsl(var(--background)) !important;
          color: hsl(var(--muted-foreground)) !important;
          opacity: 0.8 !important;
          border-color: transparent !important;
        }
        
        /* SELECTED/ACTIVE state - Maximum prominence */
        .cl-internal-1vgucwi button[data-state="checked"],
        .cl-internal-1vgucwi button[aria-checked="true"],
        .cl-toggleGroup button[aria-checked="true"],
        .cl-switchGroup button[aria-checked="true"],
        .cl-billingCycleToggle button[aria-checked="true"],
        [role="radio"][aria-checked="true"],
        [role="radio"][data-state="checked"],
        [class*="toggle"] button[data-state="checked"],
        [class*="switch"] button[data-state="checked"],
        button[data-selected="true"] {
          background: linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary)) 100%) !important;
          color: hsl(var(--primary-foreground)) !important;
          border-color: hsl(var(--primary)) !important;
          opacity: 1 !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1) !important;
          font-weight: 800 !important;
          transform: scale(1.05) !important;
        }
        
        /* Hover states for ALL buttons */
        .cl-internal-1vgucwi button:hover,
        .cl-toggleGroup button:hover,
        .cl-switchGroup button:hover,
        .cl-billingCycleToggle button:hover,
        [role="radio"]:hover,
        [class*="toggle"] button:hover,
        [class*="switch"] button:hover {
          opacity: 1 !important;
          transform: scale(1.03) translateY(-1px) !important;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2) !important;
        }
        
        /* Ensure container visibility */
        .cl-internal-b8oy6s,
        .cl-pricingTableToggle,
        [class*="billingCycle"],
        [class*="pricingToggle"] {
          margin: 24px auto !important;
          display: flex !important;
          justify-content: center !important;
          align-items: center !important;
          min-height: 60px !important;
        }
        
        /* Mobile optimizations */
        @media (max-width: 768px) {
          .cl-modal {
            max-width: 100vw !important;
            max-height: 100vh !important;
            margin: 0 !important;
            border-radius: 0 !important;
          }
          
          .cl-modalContent {
            max-width: 100vw !important;
            max-height: 100vh !important;
            padding: 16px !important;
            overflow-y: auto !important;
          }
          
          .cl-formFieldInput {
            font-size: 16px !important;
            min-height: 48px !important;
          }
          
          .cl-formButtonPrimary {
            min-height: 52px !important;
            font-size: 17px !important;
            width: 100% !important;
          }
          
          /* Mobile toggle sizing */
          .cl-internal-1vgucwi,
          .cl-toggleGroup,
          .cl-billingCycleToggle,
          [role="radiogroup"] {
            width: 100% !important;
            max-width: 340px !important;
            min-height: 56px !important;
          }
          
          .cl-internal-1vgucwi button,
          .cl-toggleGroup button,
          .cl-billingCycleToggle button,
          [role="radio"] {
            flex: 1 !important;
            font-size: 15px !important;
            padding: 14px 20px !important;
            min-height: 48px !important;
          }
        }
      `}</style>
      
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

          {/* REAL Clerk PricingTable with enhanced styling */}
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
                  priceText: "font-sans font-bold text-3xl text-foreground",
                  formButtonPrimary: "!bg-primary !text-primary-foreground hover:!bg-primary/90 !font-sans !font-medium !rounded-md !transition-all !duration-200 !shadow-sm !border-0 !min-h-[44px] !px-6 !py-3",
                  formButtonSecondary: "!bg-muted !text-foreground hover:!bg-muted/80 !font-sans !font-medium !rounded-md !transition-all !duration-200 !shadow-sm !border !border-border !min-h-[44px] !px-6 !py-3",
                  button: "!bg-primary !text-primary-foreground hover:!bg-primary/90 !font-sans !font-medium !rounded-md !transition-all !duration-200 !shadow-sm !border-0 !min-h-[44px] !px-6 !py-3",
                  primaryButton: "!bg-primary !text-primary-foreground hover:!bg-primary/90 !font-sans !font-medium !rounded-md !transition-all !duration-200 !shadow-sm !border-0 !min-h-[44px] !px-6 !py-3",
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
                    formButtonPrimary: "!bg-primary !text-primary-foreground hover:!bg-primary/90 !font-sans !font-medium !rounded-md !transition-all !duration-200 !min-h-[44px] !px-6 !py-3 !shadow-sm !w-full",
                    formFieldInput: "bg-input border border-border text-foreground rounded-md font-sans focus:ring-2 focus:ring-primary/20 focus:border-primary min-h-[44px] text-base",
                    text: "text-foreground font-sans",
                    headerTitle: "font-sans font-bold text-foreground",
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
    </>
  )
}
*/
