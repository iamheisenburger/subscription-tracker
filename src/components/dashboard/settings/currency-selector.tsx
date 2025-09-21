"use client";

import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getPreferredCurrency, setPreferredCurrency } from "@/lib/currency";
import { toast } from "sonner";

const currencies = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
];

export function CurrencySelector() {
  const [selectedCurrency, setSelectedCurrency] = useState("USD");

  useEffect(() => {
    // Only run on client side
    if (typeof window !== 'undefined') {
      const preferred = getPreferredCurrency();
      setSelectedCurrency(preferred);
    }
  }, []);

  const handleCurrencyChange = (currency: string) => {
    setSelectedCurrency(currency);
    setPreferredCurrency(currency);
    toast.success(`Default currency updated to ${currency}`);
    
    // Refresh the page to update all currency displays (client-side only)
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  return (
    <Select value={selectedCurrency} onValueChange={handleCurrencyChange}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {currencies.map((currency) => (
          <SelectItem key={currency.code} value={currency.code} className="font-sans">
            {currency.name} ({currency.symbol})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
