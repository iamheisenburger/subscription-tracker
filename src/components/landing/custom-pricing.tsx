"use client"

import { PricingTable } from "@clerk/nextjs";

export const CustomPricing = () => {
  return (
    <div id="pricing" className="w-full py-12 xs:py-20 px-6">
      {/* CUSTOM CSS FOR ULTRA-VISIBLE BILLING TOGGLE */}
      <style dangerouslySetInnerHTML={{__html: `
        /* PROPER TOGGLE SWITCH - NOT RADIO BUTTON */
        .cl-pricing-table [role="switch"] {
          width: 52px !important;
          height: 28px !important;
          background-color: #d1d5db !important;
          border: none !important;
          border-radius: 14px !important;
          position: relative !important;
          cursor: pointer !important;
          transition: background-color 0.2s ease !important;
          display: inline-flex !important;
          align-items: center !important;
          padding: 2px !important;
          box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1) !important;
        }
        
        .cl-pricing-table [role="switch"][data-state="checked"] {
          background-color: hsl(var(--primary)) !important;
        }
        
        /* THE SLIDING THUMB - THIS IS THE IMPORTANT PART */
        .cl-pricing-table [role="switch"] span,
        .cl-pricing-table [role="switch"] > div,
        .cl-pricing-table [role="switch"]:after {
          content: '' !important;
          width: 24px !important;
          height: 24px !important;
          background-color: white !important;
          border-radius: 50% !important;
          position: absolute !important;
          top: 2px !important;
          left: 2px !important;
          transition: transform 0.2s ease !important;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2) !important;
          display: block !important;
        }
        
        /* SLIDING ANIMATION - MOVE THE THUMB */
        .cl-pricing-table [role="switch"][data-state="checked"] span,
        .cl-pricing-table [role="switch"][data-state="checked"] > div,
        .cl-pricing-table [role="switch"][data-state="checked"]:after {
          transform: translateX(24px) !important;
        }
        
        /* Clean up any conflicting radio button styling */
        .cl-pricing-table input[type="radio"] {
          appearance: none !important;
          width: 16px !important;
          height: 16px !important;
          border: 2px solid hsl(var(--border)) !important;
          border-radius: 50% !important;
          background-color: transparent !important;
          position: relative !important;
          cursor: pointer !important;
          margin-right: 8px !important;
        }
        
        .cl-pricing-table input[type="radio"]:checked {
          border-color: hsl(var(--primary)) !important;
          background-color: hsl(var(--primary)) !important;
        }
        
        .cl-pricing-table input[type="radio"]:checked:after {
          content: '' !important;
          width: 6px !important;
          height: 6px !important;
          border-radius: 50% !important;
          background-color: white !important;
          position: absolute !important;
          top: 50% !important;
          left: 50% !important;
          transform: translate(-50%, -50%) !important;
        }
        
        /* Better labels */
        .cl-pricing-table label {
          color: hsl(var(--foreground)) !important;
          font-weight: 500 !important;
          font-family: var(--font-sans) !important;
          cursor: pointer !important;
          display: flex !important;
          align-items: center !important;
          gap: 8px !important;
        }
      `}} />
      
      <div className="max-w-screen-xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl xs:text-4xl sm:text-5xl font-bold tracking-tight font-sans">
            Start free, upgrade when ready
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
                
                // Improved contrast for switches and toggles
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
                
                // AGGRESSIVE BUTTON STYLING - TARGET ALL BUTTON VARIATIONS
                formButtonPrimary: "!bg-primary !text-primary-foreground hover:!bg-primary/90 !font-sans !font-medium !rounded-md !transition-all !duration-200 !shadow-sm !border-0 !min-h-[44px] !px-6 !py-3",
                formButtonSecondary: "!bg-muted !text-foreground hover:!bg-muted/80 !font-sans !font-medium !rounded-md !transition-all !duration-200 !shadow-sm !border !border-border !min-h-[44px] !px-6 !py-3",
                
                // Additional button targeting
                button: "!bg-primary !text-primary-foreground hover:!bg-primary/90 !font-sans !font-medium !rounded-md !transition-all !duration-200 !shadow-sm !border-0 !min-h-[44px] !px-6 !py-3",
                primaryButton: "!bg-primary !text-primary-foreground hover:!bg-primary/90 !font-sans !font-medium !rounded-md !transition-all !duration-200 !shadow-sm !border-0 !min-h-[44px] !px-6 !py-3",
                secondaryButton: "!bg-muted !text-foreground hover:!bg-muted/80 !font-sans !font-medium !rounded-md !transition-all !duration-200 !shadow-sm !border !border-border !min-h-[44px] !px-6 !py-3",
                
                // Target specific pricing table buttons
                subscribeButton: "!bg-primary !text-primary-foreground hover:!bg-primary/90 !font-sans !font-medium !rounded-md !transition-all !duration-200 !shadow-sm !border-0 !min-h-[44px] !px-6 !py-3",
                ctaButton: "!bg-primary !text-primary-foreground hover:!bg-primary/90 !font-sans !font-medium !rounded-md !transition-all !duration-200 !shadow-sm !border-0 !min-h-[44px] !px-6 !py-3",
                
                // Enhanced features list
                pricingFeature: "font-sans text-sm text-foreground flex items-center gap-2",
                
                // Better badge styling
                badge: "bg-primary text-primary-foreground font-sans text-xs font-medium px-2 py-1 rounded-full",
                
                // ULTRA-VISIBLE TOGGLE STYLING - CRITICAL FIX FOR BILLING SWITCH
                switchThumb: "!bg-white !border-4 !border-primary !shadow-lg !w-6 !h-6 !rounded-full !transition-all !duration-300",
                switchTrackChecked: "!bg-primary !border-2 !border-primary !w-12 !h-7 !rounded-full !shadow-md !transition-all !duration-300",
                switchTrackUnchecked: "!bg-gray-300 !border-2 !border-gray-400 !w-12 !h-7 !rounded-full !shadow-md !transition-all !duration-300",
                
                // Target the switch container and labels for better visibility
                switchContainer: "!flex !items-center !gap-3 !p-4 !bg-card !border !border-border !rounded-lg !shadow-sm",
                switchLabel: "!text-foreground !font-medium !font-sans !text-sm",
                
                // Enhanced radio button styling for billing period selection
                radioButton: "!w-5 !h-5 !border-3 !border-primary !text-primary !bg-background !rounded-full !shadow-sm",
                radioButtonChecked: "!w-5 !h-5 !border-3 !border-primary !bg-primary !text-primary-foreground !rounded-full !shadow-md",
                
                // Better visibility for billing period labels and containers
                billingPeriodContainer: "!bg-muted/30 !border !border-border !rounded-lg !p-3 !shadow-sm",
                billingPeriodLabel: "!text-foreground !font-medium !font-sans !cursor-pointer !select-none",
                
                // ADDITIONAL TOGGLE TARGETING - Multiple element types
                toggleContainer: "!bg-card !border-2 !border-border !rounded-xl !p-4 !shadow-lg !my-4",
                toggleSwitch: "!w-14 !h-8 !bg-gray-300 !rounded-full !border-2 !border-gray-400 !relative !cursor-pointer !transition-all !duration-300 !shadow-inner",
                toggleSwitchChecked: "!w-14 !h-8 !bg-primary !rounded-full !border-2 !border-primary !relative !cursor-pointer !transition-all !duration-300 !shadow-inner",
                toggleThumb: "!w-6 !h-6 !bg-white !rounded-full !border-3 !border-primary !shadow-lg !absolute !top-0.5 !transition-all !duration-300",
                
                // Period selection styling
                periodSelector: "!flex !items-center !justify-center !gap-4 !p-4 !bg-muted/20 !border !border-border !rounded-lg !shadow-sm !my-2",
                periodOption: "!flex !items-center !gap-2 !cursor-pointer !p-2 !rounded-md !transition-all !duration-200 hover:!bg-muted/50",
                periodOptionActive: "!flex !items-center !gap-2 !cursor-pointer !p-2 !rounded-md !bg-primary/10 !border !border-primary/30 !text-primary !font-medium",
                
                // Enhanced input styling
                formFieldInput: "bg-input border border-border text-foreground rounded-md font-sans",
                formFieldLabel: "text-foreground font-sans font-medium",
                
                // Better dividers and separators
                divider: "border-border",
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
                  // Enhanced checkout page styling
                  rootBox: "bg-background",
                  card: "bg-card border border-border rounded-lg shadow-lg",
                  cardBox: "bg-card border border-border rounded-lg shadow-lg",
                  
                  // AGGRESSIVE BUTTON STYLING FOR CHECKOUT
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
            <span className="font-sans">No credit card required for free</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-600">✓</span>
            <span className="font-sans">Cancel anytime</span>
          </div>
        </div>
      </div>
    </div>
  );
};