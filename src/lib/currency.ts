/**
* Currency conversion utilities
* Live rates via exchangerate.host with 1h cache and hardcoded fallback
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

// Hardcoded fallback exchange rates (used when API unavailable)
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

type CachedRates = { base: string; rates: ExchangeRates; timestamp: number };

const SUPPORTED_CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD"];
const CACHE_KEY_PREFIX = "exchange-rates:";
const ONE_HOUR_MS = 60 * 60 * 1000;

const inMemoryRatesCache: Map<string, CachedRates> = new Map();

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function readCache(baseCurrency: string): CachedRates | null {
  if (isBrowser()) {
    try {
      const raw = localStorage.getItem(CACHE_KEY_PREFIX + baseCurrency);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as CachedRates;
      return parsed;
    } catch {
      return null;
    }
  }
  return inMemoryRatesCache.get(baseCurrency) || null;
}

function writeCache(entry: CachedRates): void {
  if (isBrowser()) {
    try {
      localStorage.setItem(CACHE_KEY_PREFIX + entry.base, JSON.stringify(entry));
    } catch {
      // ignore storage errors
    }
  } else {
    inMemoryRatesCache.set(entry.base, entry);
  }
}

async function fetchFromApi(baseCurrency: string): Promise<CachedRates> {
  const base = (baseCurrency || "USD").toUpperCase();
  
  // Use free exchangerate-api.com service (no API key required)
  const url = `https://open.er-api.com/v6/latest/${encodeURIComponent(base)}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Exchange API error: ${res.status}`);
  }
  const json = await res.json();
  
  // Check if API call was successful
  if (json.result !== "success" || !json.rates) {
    throw new Error(`Exchange API returned error: ${json.error?.info || 'Invalid response'}`);
  }
  
  // Start from fallback to guarantee coverage, then overlay API values
  const fallback = EXCHANGE_RATES[base] || EXCHANGE_RATES.USD;
  const rates: ExchangeRates = { ...fallback };
  
  // Map supported currencies from API response
  for (const symbol of SUPPORTED_CURRENCIES) {
    if (symbol === base) {
      rates[symbol] = 1;
    } else if (json.rates[symbol] != null && typeof json.rates[symbol] === "number") {
      rates[symbol] = json.rates[symbol];
    }
  }
  
  const timestamp = Date.now();
  console.log(`✅ Updated currency rates for ${base} from API at ${new Date(timestamp).toISOString()}`);
  return { base, rates, timestamp };
}

function getFallbackRates(baseCurrency: string): CachedRates {
  const base = (baseCurrency || "USD").toUpperCase();
  const fallback = EXCHANGE_RATES[base] || EXCHANGE_RATES.USD;
  const rates: ExchangeRates = { ...fallback };
  // Ensure self-rate is 1
  rates[base] = 1;
  return { base, rates, timestamp: Date.now() };
}

function isFresh(entry: CachedRates | null): boolean {
  if (!entry) return false;
  return Date.now() - entry.timestamp < ONE_HOUR_MS;
}

export async function getExchangeRates(
  baseCurrency = "USD",
  options?: { forceRefresh?: boolean }
): Promise<CachedRates> {
  const base = baseCurrency.toUpperCase();
  const cached = readCache(base);
  const force = options?.forceRefresh === true;
  if (!force && isFresh(cached)) {
    return cached as CachedRates;
  }
  try {
    const fresh = await fetchFromApi(base);
    writeCache(fresh);
    return fresh;
  } catch {
    const fallback = getFallbackRates(base);
    // Cache fallback so downstream uses consistent timestamp
    writeCache(fallback);
    return fallback;
  }
}

export function getLastRatesUpdate(baseCurrency = "USD"): number {
  const cached = readCache(baseCurrency.toUpperCase());
  return cached?.timestamp ?? 0;
}

export async function refreshExchangeRates(baseCurrency = "USD"): Promise<CachedRates> {
  return getExchangeRates(baseCurrency, { forceRefresh: true });
}

// Backwards-compatible function name retained for existing imports
export async function fetchExchangeRates(baseCurrency = 'USD'): Promise<ExchangeRates> {
  const { rates } = await getExchangeRates(baseCurrency);
  return rates;
}

/**
* Convert amount from one currency to another using cached/live rates
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

  const base = (fromCurrency || "USD").toUpperCase();
  const target = (toCurrency || "USD").toUpperCase();

  let rate = 1;
  let timestamp = Date.now();

  try {
    const { rates, timestamp: ts } = await getExchangeRates(base);
    rate = rates[target] ?? 1;
    timestamp = ts;
  } catch {
    const fallback = EXCHANGE_RATES[base] || EXCHANGE_RATES.USD;
    rate = fallback[target] ?? 1;
  }

  const convertedAmount = amount * rate;

  return {
    originalAmount: amount,
    originalCurrency: fromCurrency,
    convertedAmount: Math.round(convertedAmount * 100) / 100,
    targetCurrency: toCurrency,
    rate,
    timestamp
  };
}

/**
* Convert multiple amounts to a target currency; reuses per-base caches
 */
export async function convertMultipleCurrencies(
  amounts: Array<{ amount: number; currency: string }>,
  targetCurrency: string
): Promise<CurrencyConversionResult[]> {
  // Preload rates for distinct bases to minimize API calls
  const distinctBases = Array.from(new Set(amounts.map(a => (a.currency || "USD").toUpperCase())));
  await Promise.all(distinctBases.map(base => getExchangeRates(base)));
  const results: CurrencyConversionResult[] = [];
  for (const { amount, currency } of amounts) {
    results.push(await convertCurrency(amount, currency, targetCurrency));
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