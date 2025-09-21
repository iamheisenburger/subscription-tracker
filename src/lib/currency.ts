/**
 * Currency conversion utilities
 * Uses HARDCODED exchange rates - NO API CALLS
 */

export interface ExchangeRates {
  [key: string]: number;
}

export interface CurrencyConversionResult {
  originalAmount: number;
  originalCurrency: string;
  convertedAmount: number;
  targetCurrency: string;
  rate: number;
  timestamp: number;
}

// ACCURATE EXCHANGE RATES - ALL CURRENCIES PROPERLY CORRELATED
const EXCHANGE_RATES: Record<string, ExchangeRates> = {
  USD: {
    USD: 1.00,
    EUR: 0.92,
    GBP: 0.79,
    CAD: 1.36,
    AUD: 1.52,
  },
  EUR: {
    USD: 1.09,
    EUR: 1.00,
    GBP: 0.86,
    CAD: 1.48,
    AUD: 1.65,
  },
  GBP: {
    USD: 1.27,
    EUR: 1.16,
    GBP: 1.00,
    CAD: 1.73,
    AUD: 1.93,
  },
  CAD: {
    USD: 0.74,
    EUR: 0.68,
    GBP: 0.58,
    CAD: 1.00,
    AUD: 1.12,
  },
  AUD: {
    USD: 0.66,
    EUR: 0.61,
    GBP: 0.52,
    CAD: 0.89,
    AUD: 1.00,
  },
};

/**
 * Get exchange rates instantly - NO API CALLS
 */
export async function fetchExchangeRates(baseCurrency = 'USD'): Promise<ExchangeRates> {
  return EXCHANGE_RATES[baseCurrency] || EXCHANGE_RATES.USD;
}

/**
 * Convert amount from one currency to another - INSTANT
 */
export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<CurrencyConversionResult> {
  if (fromCurrency === toCurrency) {
    return {
      originalAmount: amount,
      originalCurrency: fromCurrency,
      convertedAmount: amount,
      targetCurrency: toCurrency,
      rate: 1,
      timestamp: Date.now()
    };
  }

  const rates = EXCHANGE_RATES[fromCurrency] || EXCHANGE_RATES.USD;
  const rate = rates[toCurrency] || 1;
  const convertedAmount = amount * rate;

  return {
    originalAmount: amount,
    originalCurrency: fromCurrency,
    convertedAmount: Math.round(convertedAmount * 100) / 100,
    targetCurrency: toCurrency,
    rate,
    timestamp: Date.now()
  };
}

/**
 * Convert multiple amounts to a target currency - INSTANT
 */
export async function convertMultipleCurrencies(
  amounts: Array<{ amount: number; currency: string }>,
  targetCurrency: string
): Promise<CurrencyConversionResult[]> {
  const results: CurrencyConversionResult[] = [];

  for (const { amount, currency } of amounts) {
    const result = await convertCurrency(amount, currency, targetCurrency);
    results.push(result);
  }

  return results;
}

/**
 * Format currency with proper symbol
 */
export function formatCurrency(amount: number, currency: string): string {
  const currencySymbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    CAD: 'C$',
    AUD: 'A$',
  };

  const symbol = currencySymbols[currency] || currency;
  return `${symbol}${amount.toFixed(2)}`;
}

/**
 * Get user's preferred currency from localStorage
 */
export function getPreferredCurrency(): string {
  if (typeof window === 'undefined') return 'USD';
  return localStorage.getItem('preferred-currency') || 'USD';
}

/**
 * Set user's preferred currency
 */
export function setPreferredCurrency(currency: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('preferred-currency', currency);
}