"use client"

import { PricingTable } from "@clerk/nextjs";

export const CustomPricing = () => {
  return (
    <>
      {/* ULTRA-AGGRESSIVE Toggle Visibility + Mobile Optimizations */}
      <style jsx global>{`
        /* MAXIMUM VISIBILITY: Toggle/Switch for Monthly/Annual Billing */
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
        
        /* UNSELECTED state - Maximum visibility */
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
        
        /* Mobile checkout modal fixes */
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
          
          .cl-card {
            max-width: 100% !important;
            margin: 0 auto !important;
            padding: 16px !important;
          }
          
          .cl-formFieldInput {
            font-size: 16px !important;
            min-height: 44px !important;
          }
          
          .cl-formButtonPrimary {
            min-height: 48px !important;
            font-size: 16px !important;
            width: 100% !important;
          }
          
          /* Fix overlapping text */
          .cl-pricing-table {
            font-size: 14px !important;
            line-height: 1.4 !important;
          }
          
          .cl-pricing-table h1,
          .cl-pricing-table h2,
          .cl-pricing-table h3 {
            font-size: 18px !important;
            line-height: 1.3 !important;
            margin-bottom: 8px !important;
          }
          
          /* Fix checkout form spacing */
          .cl-formField {
            margin-bottom: 16px !important;
          }
          
          .cl-formFieldLabel {
            font-size: 14px !important;
            margin-bottom: 4px !important;
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
      
      <div id="pricing" className="w-full py-12 xs:py-20 px-6">
      <div className="max-w-screen-xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl xs:text-4xl sm:text-5xl font-bold tracking-tight font-sans">
            Start Free, Upgrade When Ready
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto font-sans">
            No hidden fees, no long-term contracts. Try Premium free for 7 days, then decide. 
            Cancel anytime with one click.
          </p>
        </div>

        {/* Clerk's PricingTable - Enhanced Theme & Visibility */}
        <div className="max-w-4xl mx-auto">
          <PricingTable 
            newSubscriptionRedirectUrl="/dashboard"
            appearance={{
              variables: {
                // Enhanced theme colors for better visibility
                colorPrimary: "hsl(var(--primary))",
                colorText: "hsl(var(--foreground))",
                colorTextSecondary: "hsl(var(--muted-foreground))",
                colorBackground: "hsl(var(--card))",
                colorInputBackground: "hsl(var(--input))",
                colorInputText: "hsl(var(--foreground))",
                fontFamily: "var(--font-sans)",
                borderRadius: "var(--radius)",
                
                // Improved contrast
                colorNeutral: "hsl(var(--muted))",
                colorSuccess: "hsl(var(--primary))",
                colorDanger: "hsl(var(--destructive))",
                
                // Enhanced border and shadow
                colorBorder: "hsl(var(--border))",
                colorShimmer: "hsl(var(--muted))",
              },
              elements: {
                // Enhanced card styling
                rootBox: "bg-card border border-border rounded-lg shadow-sm",
                card: "bg-card border border-border rounded-lg shadow-sm",
                cardBox: "bg-card border border-border rounded-lg shadow-sm",
                
                // Better text contrast
                headerTitle: "font-sans font-bold text-foreground",
                headerSubtitle: "font-sans text-muted-foreground",
                text: "font-sans text-foreground",
                
                // Enhanced pricing text
                priceText: "font-sans font-bold text-3xl text-foreground",
                
                // Button styling only (leave Clerk toggles/radios at defaults)
                formButtonPrimary: "!bg-primary !text-primary-foreground hover:!bg-primary/90 !font-sans !font-medium !rounded-md !transition-all !duration-200 !shadow-sm !border-0 !min-h-[44px] !px-6 !py-3",
                formButtonSecondary: "!bg-muted !text-foreground hover:!bg-muted/80 !font-sans !font-medium !rounded-md !transition-all !duration-200 !shadow-sm !border !border-border !min-h-[44px] !px-6 !py-3",
                
                // Additional button targeting
                button: "!bg-primary !text-primary-foreground hover:!bg-primary/90 !font-sans !font-medium !rounded-md !transition-all !duration-200 !shadow-sm !border-0 !min-h-[44px] !px-6 !py-3",
                primaryButton: "!bg-primary !text-primary-foreground hover:!bg-primary/90 !font-sans !font-medium !rounded-md !transition-all !duration-200 !shadow-sm !border-0 !min-h-[44px] !px-6 !py-3",
                secondaryButton: "!bg-muted !text-foreground hover:!bg-muted/80 !font-sans !font-medium !rounded-md !transition-all !duration-200 !shadow-sm !border !border-border !min-h-[44px] !px-6 !py-3",
                
                // Target specific pricing table buttons
                subscribeButton: "!bg-primary !text-primary-foreground hover:!bg-primary/90 !font-sans !font-medium !rounded-md !transition-all !duration-200 !shadow-sm !border-0 !min-h-[44px] !px-6 !py-3",
                ctaButton: "!bg-primary !text-primary-foreground hover:!bg-primary/90 !font-sans !font-medium !rounded-md !transition-all !duration-200 !shadow-sm !border-0 !min-h-[44px] !px-6 !py-3",
                
                // Keep feature text clean
                pricingFeature: "font-sans text-sm text-foreground flex items-center gap-2",
                
                // Better badge styling
                badge: "bg-primary text-primary-foreground font-sans text-xs font-medium px-2 py-1 rounded-full",
                
                // Subtle, accessible toggle contrast (no size changes)
                switchTrackChecked: "bg-primary",
                switchTrackUnchecked: "bg-muted border border-border",
                switchThumb: "bg-background border border-border shadow-sm",
                
                // Do NOT override toggle/radio styles → use Clerk defaults
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
                  // Enhanced checkout page styling with mobile fixes
                  rootBox: "bg-background !p-4 !max-w-full !overflow-x-hidden",
                  card: "bg-card border border-border rounded-lg shadow-lg !max-w-full !mx-auto",
                  cardBox: "bg-card border border-border rounded-lg shadow-lg !max-w-full !mx-auto !p-4",
                  
                  // Button styling in checkout
                  formButtonPrimary: "!bg-primary !text-primary-foreground hover:!bg-primary/90 !font-sans !font-medium !rounded-md !transition-all !duration-200 !min-h-[44px] !px-6 !py-3 !shadow-sm",
                  formButtonSecondary: "!bg-muted !text-foreground hover:!bg-muted/80 !font-sans !font-medium !rounded-md !transition-all !duration-200 !min-h-[44px] !px-6 !py-3 !border !border-border",
                  
                  // Additional button targeting for checkout
                  button: "!bg-primary !text-primary-foreground hover:!bg-primary/90 !font-sans !font-medium !rounded-md !transition-all !duration-200 !min-h-[44px] !px-6 !py-3",
                  primaryButton: "!bg-primary !text-primary-foreground hover:!bg-primary/90 !font-sans !font-medium !rounded-md !transition-all !duration-200 !min-h-[44px] !px-6 !py-3",
                  
                  // Text and form styling
                  text: "text-foreground font-sans",
                  headerTitle: "font-sans font-bold text-foreground",
                  headerSubtitle: "font-sans text-muted-foreground",
                  
                  // Form elements
                  formFieldInput: "bg-input border border-border text-foreground rounded-md font-sans focus:ring-2 focus:ring-primary/20 focus:border-primary",
                  formFieldLabel: "text-foreground font-sans font-medium",
                  
                  // Enhanced payment form
                  paymentMethodContainer: "bg-card border border-border rounded-md p-4",
                  paymentMethodRadio: "text-primary",
                  
                  // Better alerts and messages
                  alert: "bg-muted/50 border border-border rounded-md font-sans text-foreground",
                  alertText: "text-foreground font-sans",
                  
                  // Better dividers
                  divider: "border-border",
                }
              }
            }}
          />
        </div>

        {/* Trust indicators */}
        <div className="mt-12 flex flex-col sm:flex-row justify-center items-center gap-6 text-sm text-muted-foreground">
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
    </>
  );
};