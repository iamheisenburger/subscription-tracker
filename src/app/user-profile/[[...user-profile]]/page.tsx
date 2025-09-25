import { UserProfile } from '@clerk/nextjs'

const UserProfilePage = () => (
  <div className="min-h-screen bg-background py-12">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <UserProfile 
        appearance={{
          variables: {
            colorPrimary: "hsl(var(--primary))",
            colorText: "hsl(var(--foreground))",
            colorTextSecondary: "hsl(var(--muted-foreground))",
            colorBackground: "hsl(var(--background))",
            colorInputBackground: "hsl(var(--background))",
            colorInputText: "hsl(var(--foreground))",
            fontFamily: "var(--font-sans)",
            borderRadius: "var(--radius)",
          },
          elements: {
            card: "shadow-lg border border-border bg-card",
            headerTitle: "font-sans font-bold",
            headerSubtitle: "font-sans text-muted-foreground",
            formButtonPrimary: "bg-primary text-primary-foreground hover:bg-primary/90 font-sans rounded-md transition-colors",
            rootBox: "rounded-lg",
          }
        }}
      />
    </div>
  </div>
)

export default UserProfilePage
