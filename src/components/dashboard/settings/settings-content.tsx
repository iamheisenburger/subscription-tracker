"use client";

import { useState, useEffect } from "react";
import { CategoriesManager } from "./categories-manager";
import { useUserTier } from "@/hooks/use-user-tier";
import { getLastRatesUpdate, refreshExchangeRates } from "@/lib/currency";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface SettingsContentProps {
  user: {
    id?: string;
    firstName?: string | null;
    lastName?: string | null;
    imageUrl?: string;
    emailAddresses?: Array<{ emailAddress: string }>;
    createdAt?: string | number;
  } | null;
}

export function SettingsContent({ user }: SettingsContentProps) {
  const [currency, setCurrency] = useState("USD");
  const { isPremium } = useUserTier();
  const [lastUpdatedTs, setLastUpdatedTs] = useState<number>(0);

  useEffect(() => {
    // Get preferred currency from localStorage on client side
    if (typeof window !== 'undefined') {
      const preferred = localStorage.getItem('preferred-currency') || 'USD';
      setCurrency(preferred);
      setLastUpdatedTs(getLastRatesUpdate(preferred));
    }
  }, []);

  const handleCurrencyChange = (newCurrency: string) => {
    setCurrency(newCurrency);
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferred-currency', newCurrency);
      setLastUpdatedTs(getLastRatesUpdate(newCurrency));
      window.location.reload();
    }
  };

  const handleRefreshRates = async () => {
    try {
      const refreshed = await refreshExchangeRates(currency);
      setLastUpdatedTs(refreshed.timestamp);
      toast.success("Exchange rates refreshed");
    } catch {
      toast.error("Failed to refresh rates. Using fallback.");
    }
  };

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
              <select 
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-sans"
                value={currency}
                onChange={(e) => handleCurrencyChange(e.target.value)}
              >
                <option value="USD">US Dollar ($)</option>
                <option value="EUR">Euro (€)</option>
                <option value="GBP">British Pound (£)</option>
                <option value="CAD">Canadian Dollar (C$)</option>
                <option value="AUD">Australian Dollar (A$)</option>
              </select>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-xs text-muted-foreground font-sans">
                  {lastUpdatedTs
                    ? `Rates updated ${formatDistanceToNow(lastUpdatedTs, { addSuffix: true })}`
                    : 'Rates not loaded yet'}
                </p>
                <button
                  type="button"
                  onClick={handleRefreshRates}
                  className="px-3 py-1.5 border border-input rounded-md text-xs font-sans hover:bg-muted"
                >
                  Refresh Rates
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="p-6 border rounded-lg bg-card">
          <h2 className="text-lg font-semibold font-sans mb-4">Notification Preferences</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium font-sans">Email Notifications</label>
                <p className="text-xs text-muted-foreground font-sans">Receive renewal reminders via email</p>
              </div>
              <input type="checkbox" defaultChecked className="rounded" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium font-sans">Push Notifications</label>
                <p className="text-xs text-muted-foreground font-sans">Browser notifications for upcoming renewals</p>
              </div>
              <input type="checkbox" className="rounded" />
            </div>
          </div>
        </div>

        {/* Theme Settings */}
        <div className="p-6 border rounded-lg bg-card">
          <h2 className="text-lg font-semibold font-sans mb-4">Appearance</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium font-sans">Theme</label>
              <select className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-sans">
                <option value="system">System Default</option>
                <option value="light">Light Mode</option>
                <option value="dark">Dark Mode</option>
              </select>
            </div>
          </div>
        </div>

        {/* Billing Section */}
        <div className="p-6 border rounded-lg bg-card">
          <h2 className="text-lg font-semibold font-sans mb-4">Billing & Subscription</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium font-sans">Plan</h3>
                  <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-full font-sans">Managed by Clerk</span>
                </div>
                <p className="text-sm text-muted-foreground font-sans">Upgrade, change, or cancel your plan</p>
              </div>
              <a href="/pricing" className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-sans hover:bg-primary/90">
                Manage Billing
              </a>
            </div>
          </div>
        </div>

        {/* Categories Manager */}
        <CategoriesManager />

        {/* Data Management */}
        <div className="p-6 border rounded-lg bg-card">
          <h2 className="text-lg font-semibold font-sans mb-4">Data Management</h2>
          <div className="space-y-4">
            {isPremium ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <a
                  href="/api/export/csv"
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-input rounded-md text-sm font-sans hover:bg-muted"
                >
                  Export CSV
                </a>
                <a
                  href="/api/export/pdf"
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-input rounded-md text-sm font-sans hover:bg-muted"
                >
                  Export PDF
                </a>
              </div>
            ) : (
              <div className="w-full px-4 py-3 border border-dashed rounded-md text-sm text-muted-foreground font-sans">
                Export is a Premium feature. <a href="/pricing" className="text-primary underline">Upgrade to enable</a>.
              </div>
            )}
            <button className="w-full px-4 py-2 border border-destructive text-destructive rounded-md text-sm font-sans hover:bg-destructive/10">
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
