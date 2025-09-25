import { UserProfile } from '@clerk/nextjs'

const UserProfilePage = () => (
  <div className="min-h-screen bg-background py-12">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <UserProfile 
        appearance={{
          variables: {
            // Enhanced theme colors matching PricingTable
            colorPrimary: "hsl(var(--primary))",
            colorText: "hsl(var(--foreground))",
            colorTextSecondary: "hsl(var(--muted-foreground))",
            colorBackground: "hsl(var(--card))",
            colorInputBackground: "hsl(var(--input))",
            colorInputText: "hsl(var(--foreground))",
            fontFamily: "var(--font-sans)",
            borderRadius: "var(--radius)",
            
            // Better contrast and visibility
            colorNeutral: "hsl(var(--muted))",
            colorSuccess: "hsl(var(--primary))",
            colorDanger: "hsl(var(--destructive))",
            colorBorder: "hsl(var(--border))",
          },
          elements: {
            // Enhanced card and layout styling
            rootBox: "bg-card border border-border rounded-lg shadow-sm",
            card: "bg-card border border-border rounded-lg shadow-sm",
            
            // Better text styling
            headerTitle: "font-sans font-bold text-foreground",
            headerSubtitle: "font-sans text-muted-foreground",
            text: "font-sans text-foreground",
            
            // Improved buttons with proper contrast
            formButtonPrimary: "bg-primary text-primary-foreground hover:bg-primary/90 font-sans font-medium rounded-md transition-all duration-200 shadow-sm min-h-[44px]",
            formButtonSecondary: "bg-muted text-foreground hover:bg-muted/80 font-sans font-medium rounded-md transition-all duration-200 shadow-sm border border-border min-h-[44px]",
            
            // Enhanced form styling
            formFieldInput: "bg-input border border-border text-foreground rounded-md font-sans focus:ring-2 focus:ring-primary/20",
            formFieldLabel: "text-foreground font-sans font-medium",
            
            // Better navigation and tabs
            navbarButton: "text-muted-foreground hover:text-foreground font-sans transition-colors",
            navbarButtonCurrent: "text-primary font-sans font-medium",
            
            // Enhanced switch/toggle visibility for billing toggles
            switchThumb: "bg-background border-2 border-primary shadow-sm",
            switchTrackChecked: "bg-primary",
            switchTrackUnchecked: "bg-muted border border-border",
            
            // Better dividers and layout
            divider: "border-border",
            
            // Enhanced alerts and notifications
            alert: "bg-muted/50 border border-border rounded-md font-sans",
            alertText: "text-foreground font-sans",
            
            // Better badges and status indicators
            badge: "bg-primary/10 text-primary font-sans text-xs font-medium px-2 py-1 rounded-full border border-primary/20",
          }
        }}
      />
    </div>
  </div>
)

export default UserProfilePage
