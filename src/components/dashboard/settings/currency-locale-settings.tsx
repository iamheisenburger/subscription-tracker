"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { getLastRatesUpdate, refreshExchangeRates } from "@/lib/currency";
import { useTheme } from "next-themes";

export function CurrencyLocaleSettings() {
  const [currency, setCurrency] = useState("USD");
  const [lastUpdatedTs, setLastUpdatedTs] = useState<number | null>(null);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const preferred = window.localStorage.getItem("preferred-currency") || "USD";
    setCurrency(preferred);
    setLastUpdatedTs(getLastRatesUpdate(preferred));
  }, []);

  const handleCurrencyChange = (newCurrency: string) => {
    setCurrency(newCurrency);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("preferred-currency", newCurrency);
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
    <Card>
      <CardHeader>
        <CardTitle className="font-sans">Currency &amp; Locale</CardTitle>
        <CardDescription className="font-sans">
          Configure how amounts are displayed across your dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Currency */}
        <div className="space-y-2">
          <Label htmlFor="default-currency" className="font-sans">
            Default currency
          </Label>
          <select
            id="default-currency"
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
                : "Rates not loaded yet"}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRefreshRates}
              className="font-sans"
            >
              Refresh rates
            </Button>
          </div>
        </div>

        {/* Appearance / Theme */}
        <div className="space-y-2">
          <Label htmlFor="theme-preference" className="font-sans">
            Theme
          </Label>
          <select
            id="theme-preference"
            className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-sans"
            value={theme || "system"}
            onChange={(e) => setTheme(e.target.value)}
          >
            <option value="system">System default</option>
            <option value="light">Light mode</option>
            <option value="dark">Dark mode</option>
          </select>
          <p className="text-xs text-muted-foreground font-sans">
            Your preference is remembered on this device and used across dashboard pages.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}


