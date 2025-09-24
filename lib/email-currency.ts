/**
 * Shared currency utilities for email templates
 * This file provides currency formatting that works in email rendering environment
 */

// Currency symbol mapping (expanded for email templates)
const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€', 
  GBP: '£',
  CAD: 'C$',
  AUD: 'A$',
  JPY: '¥',
  CHF: 'CHF',
  SEK: 'kr',
  NOK: 'kr',
  DKK: 'kr',
  PLN: 'zł',
  CZK: 'Kč',
  HUF: 'Ft',
  ILS: '₪',
  INR: '₹',
  CNY: '¥',
  KRW: '₩',
  BRL: 'R$',
  MXN: '$',
  ZAR: 'R',
  NZD: 'NZ$',
};

// Fallback exchange rates (same as in frontend, for email consistency)
const FALLBACK_RATES: Record<string, Record<string, number>> = {
  USD: { USD: 1.00, EUR: 0.91, GBP: 0.75, CAD: 1.392, AUD: 1.53 },
  EUR: { USD: 1.10, EUR: 1.00, GBP: 0.82, CAD: 1.53, AUD: 1.68 },
  GBP: { USD: 1.33, EUR: 1.22, GBP: 1.00, CAD: 1.85, AUD: 2.04 },
  CAD: { USD: 0.718, EUR: 0.654, GBP: 0.541, CAD: 1.00, AUD: 1.10 },
  AUD: { USD: 0.653, EUR: 0.595, GBP: 0.490, CAD: 0.909, AUD: 1.00 },
};

/**
 * Get currency symbol for a given currency code
 */
export function getCurrencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency.toUpperCase()] || currency.toUpperCase();
}

/**
 * Format currency amount with proper symbol and formatting
 * This provides consistent formatting across all email templates
 */
export function formatEmailCurrency(amount: number, currency: string): string {
  const symbol = getCurrencySymbol(currency);
  const formattedAmount = amount.toFixed(2);
  
  // Handle special positioning for some currencies
  switch (currency.toUpperCase()) {
    case 'EUR':
      return `${formattedAmount}${symbol}`; // 15.99€
    case 'SEK':
    case 'NOK': 
    case 'DKK':
      return `${formattedAmount} ${symbol}`; // 15.99 kr
    case 'PLN':
      return `${formattedAmount} ${symbol}`; // 15.99 zł
    case 'CZK':
      return `${formattedAmount} ${symbol}`; // 15.99 Kč
    case 'HUF':
      return `${Math.round(amount)} ${symbol}`; // 1599 Ft (no decimals for HUF)
    case 'JPY':
    case 'KRW':
      return `${symbol}${Math.round(amount)}`; // ¥1599 (no decimals for JPY/KRW)
    default:
      return `${symbol}${formattedAmount}`; // $15.99
  }
}

/**
 * Convert currency amount using fallback rates
 * Used when live rates are not available in email context
 */
export function convertEmailCurrency(
  amount: number, 
  fromCurrency: string, 
  toCurrency: string
): { convertedAmount: number; rate: number } {
  const from = fromCurrency.toUpperCase();
  const to = toCurrency.toUpperCase();
  
  // Same currency, no conversion needed
  if (from === to) {
    return { convertedAmount: amount, rate: 1.0 };
  }
  
  // Get conversion rate
  const rates = FALLBACK_RATES[from];
  const rate = rates?.[to];
  
  if (!rate) {
    // Fallback: try reverse conversion or default to 1:1
    const reverseRates = FALLBACK_RATES[to];
    const reverseRate = reverseRates?.[from];
    
    if (reverseRate) {
      const convertedAmount = amount / reverseRate;
      return { 
        convertedAmount: Math.round(convertedAmount * 100) / 100, 
        rate: 1 / reverseRate 
      };
    }
    
    // Ultimate fallback: no conversion
    console.warn(`Email currency conversion: No rate found for ${from} to ${to}, using 1:1`);
    return { convertedAmount: amount, rate: 1.0 };
  }
  
  const convertedAmount = amount * rate;
  return { 
    convertedAmount: Math.round(convertedAmount * 100) / 100, 
    rate 
  };
}

/**
 * Format currency with conversion display
 * Shows both original and converted amounts for transparency
 */
export function formatEmailCurrencyWithConversion(
  amount: number,
  originalCurrency: string, 
  displayCurrency: string
): { 
  displayAmount: string;
  originalAmount: string; 
  showBoth: boolean;
} {
  const showBoth = originalCurrency.toUpperCase() !== displayCurrency.toUpperCase();
  
  if (!showBoth) {
    return {
      displayAmount: formatEmailCurrency(amount, displayCurrency),
      originalAmount: '',
      showBoth: false
    };
  }
  
  const { convertedAmount } = convertEmailCurrency(amount, originalCurrency, displayCurrency);
  
  return {
    displayAmount: formatEmailCurrency(convertedAmount, displayCurrency),
    originalAmount: formatEmailCurrency(amount, originalCurrency),
    showBoth: true
  };
}

/**
 * Calculate monthly equivalent for different billing cycles
 * Used for spending calculations in emails
 */
export function getMonthlyEquivalent(amount: number, billingCycle: string): number {
  switch (billingCycle.toLowerCase()) {
    case 'yearly':
      return amount / 12;
    case 'weekly':
      return amount * 4.33; // Average weeks per month
    case 'monthly':
    default:
      return amount;
  }
}

/**
 * Format percentage for display in emails
 */
export function formatEmailPercentage(value: number): string {
  return `${Math.round(value)}%`;
}
