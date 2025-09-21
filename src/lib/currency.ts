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

// HARDCODED EXCHANGE RATES - INSTANT CONVERSION
const EXCHANGE_RATES: Record<string, ExchangeRates> = {
  USD: {
    USD: 1.00,
    EUR: 0.85,
    GBP: 0.80,
    CAD: 1.25,
    AUD: 1.45,
  },
  GBP: {
    USD: 1.25,
    EUR: 1.06,
    GBP: 1.00,
    CAD: 1.56,
    AUD: 1.81,
  },
  EUR: {
    USD: 1.18,
    EUR: 1.00,
    GBP: 0.94,
    CAD: 1.47,
    AUD: 1.71,
  },
  CAD: {
    USD: 0.80,
    EUR: 0.68,
    GBP: 0.64,
    CAD: 1.00,
    AUD: 1.16,
  },
  AUD: {
    USD: 0.69,
    EUR: 0.58,
    GBP: 0.55,
    CAD: 0.86,
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