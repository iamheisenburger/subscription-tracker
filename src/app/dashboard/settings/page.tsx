import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="space-y-8">
      {/* Settings Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-sans tracking-tight">Settings</h1>
          <p className="text-muted-foreground font-sans">
            Manage your account preferences and subscription settings.
          </p>
        </div>
      </div>

      {/* Simple Settings Content - NO COMPLEX COMPONENTS */}
      <div className="grid gap-6">
        {/* Account Section */}
        <div className="p-6 border rounded-lg bg-card">
          <h2 className="text-lg font-semibold font-sans mb-4">Account Information</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium font-sans">Email</label>
              <p className="text-sm text-muted-foreground font-sans">
                {user?.emailAddresses?.[0]?.emailAddress || 'Not available'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium font-sans">Name</label>
              <p className="text-sm text-muted-foreground font-sans">
                {user?.firstName} {user?.lastName}
              </p>
            </div>
          </div>
        </div>

        {/* Currency Settings */}
        <div className="p-6 border rounded-lg bg-card">
          <h2 className="text-lg font-semibold font-sans mb-4">Currency Preferences</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium font-sans">Default Currency</label>
              <select className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-sans">
                <option value="USD">US Dollar (USD)</option>
                <option value="EUR">Euro (EUR)</option>
                <option value="GBP">British Pound (GBP)</option>
                <option value="CAD">Canadian Dollar (CAD)</option>
                <option value="AUD">Australian Dollar (AUD)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Billing Section */}
        <div className="p-6 border rounded-lg bg-card">
          <h2 className="text-lg font-semibold font-sans mb-4">Billing & Subscription</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium font-sans">Current Plan</label>
              <p className="text-sm text-muted-foreground font-sans">Free Plan</p>
            </div>
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-sans hover:bg-primary/90">
              Upgrade to Premium
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}