import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  convertCurrency, 
  convertMultipleCurrencies, 
  fetchExchangeRates, 
  getExchangeRates,
  refreshExchangeRates
} from '../currency';

// Provide a stable Date.now for deterministic timestamps
const FIXED_NOW = 1737500000000; // arbitrary

describe('currency utils', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
  });

  it('returns 1:1 when converting same currency', async () => {
    const res = await convertCurrency(100, 'USD', 'USD');
    expect(res.convertedAmount).toBe(100);
    expect(res.rate).toBe(1);
  });

  it('fetches supported rates and includes self=1', async () => {
    const rates = await fetchExchangeRates('USD');
    expect(rates.USD).toBe(1);
    // basic sanity checks for supported currencies
    expect(typeof rates.EUR).toBe('number');
    expect(typeof rates.GBP).toBe('number');
    expect(typeof rates.CAD).toBe('number');
    expect(typeof rates.AUD).toBe('number');
  });

  it('converts multiple currencies to a target', async () => {
    const results = await convertMultipleCurrencies([
      { amount: 10, currency: 'USD' },
      { amount: 10, currency: 'EUR' },
    ], 'GBP');
    expect(results.length).toBe(2);
    expect(results[0].targetCurrency).toBe('GBP');
  });

  it('CAD↔USD conversion remains consistent across direct and round-trip', async () => {
    // Ensure rates cached/refreshed
    await refreshExchangeRates('CAD');
    const { rates: cadRates } = await getExchangeRates('CAD');
    const { rates: usdRates } = await getExchangeRates('USD');

    const cadToUsd = cadRates.USD; // e.g., 0.74
    const usdToCad = usdRates.CAD; // e.g., 1.36

    // Round-trip of 1 CAD -> USD -> CAD should be ~1 within tolerance
    const oneCadInUsd = 1 * cadToUsd;
    const backToCad = oneCadInUsd * usdToCad;
    expect(backToCad).toBeGreaterThan(0.97);
    expect(backToCad).toBeLessThan(1.03);
  });
});



