"use client";

import { useState, useEffect } from "react";
import { getPreferredCurrency, setPreferredCurrency } from "@/lib/currency";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Matching mobile app: 7 currencies
const currencies = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
];

interface CurrencySelectorProps {
  variant?: "pills" | "select";
}

export function CurrencySelector({ variant = "pills" }: CurrencySelectorProps) {
  const [selectedCurrency, setSelectedCurrency] = useState("USD");

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const preferred = getPreferredCurrency();
      setSelectedCurrency(preferred);
    }
  }, []);

  const handleCurrencyChange = (currency: string) => {
    setSelectedCurrency(currency);
    setPreferredCurrency(currency);
    toast.success(`Currency updated to ${currency}`);

    // Soft refresh to update currency displays
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        window.location.reload();
      }, 800);
    }
  };

  // Mobile app style - pill buttons grid
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
        {currencies.map((currency) => (
          <button
            key={currency.code}
            onClick={() => handleCurrencyChange(currency.code)}
            className={cn(
              "flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all",
              selectedCurrency === currency.code
                ? "bg-[#1F2937] dark:bg-white border-[#1F2937] dark:border-white text-white dark:text-[#1F2937]"
                : "bg-card border-border hover:border-[#1F2937]/30 dark:hover:border-white/30 text-foreground"
            )}
          >
            <span className="text-lg font-bold">{currency.symbol}</span>
            <span className="text-[10px] font-medium opacity-70">{currency.code}</span>
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Selected: {currencies.find(c => c.code === selectedCurrency)?.name}
      </p>
    </div>
  );
}
