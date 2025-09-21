/**
 * Currency conversion utilities
 * Uses ExchangeRate-API for real-time conversion rates
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

// Cache for exchange rates (1 hour cache)
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds
let ratesCache: { rates: ExchangeRates; timestamp: number } | null = null;

/**
 * Fetch exchange rates from ExchangeRate-API
 */
export async function fetchExchangeRates(baseCurrency = 'USD'): Promise<ExchangeRates> {
  // Check cache first
  if (ratesCache && (Date.now() - ratesCache.timestamp) < CACHE_DURATION) {
    return ratesCache.rates;
  }

  try {
    const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${baseCurrency}`);
    
    if (!response.ok) {
      throw new Error(`Exchange rate API error: ${response.status}`);
    }

    const data = await response.json();
    const rates = data.rates;

    // Update cache
    ratesCache = {
      rates,
      timestamp: Date.now()
    };

    return rates;
  } catch (error) {
    console.error('Failed to fetch exchange rates:', error);
    
    // Fallback to approximate rates if API fails
    return getFallbackRates(baseCurrency);
  }
}

/**
 * Fallback exchange rates (approximate, updated manually)
 */
function getFallbackRates(baseCurrency: string): ExchangeRates {
  const fallbackRates: Record<string, ExchangeRates> = {
    USD: {
      USD: 1,
      EUR: 0.85,
      GBP: 0.80,
      CAD: 1.25,
      AUD: 1.45,
    },
    GBP: {
      USD: 1.25,
      EUR: 1.06,
      GBP: 1,
      CAD: 1.56,
      AUD: 1.81,
    },
    EUR: {
      USD: 1.18,
      EUR: 1,
      GBP: 0.94,
      CAD: 1.47,
      AUD: 1.71,
    }
  };

  return fallbackRates[baseCurrency] || fallbackRates.USD;
}

/**
 * Convert amount from one currency to another
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

  try {
    const rates = await fetchExchangeRates(fromCurrency);
    const rate = rates[toCurrency];

    if (!rate) {
      throw new Error(`Conversion rate not found for ${fromCurrency} to ${toCurrency}`);
    }

    const convertedAmount = amount * rate;

    return {
      originalAmount: amount,
      originalCurrency: fromCurrency,
      convertedAmount: Math.round(convertedAmount * 100) / 100, // Round to 2 decimal places
      targetCurrency: toCurrency,
      rate,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('Currency conversion failed:', error);
    throw error;
  }
}

/**
 * Convert multiple amounts to a target currency
 */
export async function convertMultipleCurrencies(
  amounts: Array<{ amount: number; currency: string }>,
  targetCurrency: string
): Promise<CurrencyConversionResult[]> {
  const results: CurrencyConversionResult[] = [];

  for (const { amount, currency } of amounts) {
    try {
      const result = await convertCurrency(amount, currency, targetCurrency);
      results.push(result);
    } catch (error) {
      console.error(`Failed to convert ${amount} ${currency} to ${targetCurrency}:`, error);
      // Add fallback result
      results.push({
        originalAmount: amount,
        originalCurrency: currency,
        convertedAmount: amount, // Fallback to original amount
        targetCurrency: targetCurrency,
        rate: 1,
        timestamp: Date.now()
      });
    }
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
