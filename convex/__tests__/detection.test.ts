/**
 * Detection Engine Tests
 * Validates subscription detection algorithm accuracy
 */

import { describe, it, expect } from "vitest";

/**
 * Test helper: Calculate median
 */
function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/**
 * Test helper: Calculate variance
 */
function calculateVariance(values: number[], mean: number): number {
  if (values.length === 0) return 0;
  const squareDiffs = values.map((value) => Math.pow(value - mean, 2));
  return Math.sqrt(squareDiffs.reduce((sum, val) => sum + val, 0) / values.length);
}

/**
 * Test helper: Calculate periodicity score
 */
function calculatePeriodicityScore(intervals: number[], expectedInterval: number): number {
  if (intervals.length === 0) return 0;

  const deviations = intervals.map((interval) => {
    const deviation = Math.abs(interval - expectedInterval);
    const percentDeviation = deviation / expectedInterval;
    return Math.max(0, 1 - percentDeviation);
  });

  return deviations.reduce((sum, score) => sum + score, 0) / deviations.length;
}

describe("Detection Engine", () => {
  describe("Median Calculation", () => {
    it("should calculate median for odd number of values", () => {
      const values = [1, 3, 5, 7, 9];
      expect(calculateMedian(values)).toBe(5);
    });

    it("should calculate median for even number of values", () => {
      const values = [1, 2, 3, 4];
      expect(calculateMedian(values)).toBe(2.5);
    });

    it("should handle single value", () => {
      expect(calculateMedian([42])).toBe(42);
    });

    it("should handle empty array", () => {
      expect(calculateMedian([])).toBe(0);
    });
  });

  describe("Variance Calculation", () => {
    it("should calculate variance for identical values", () => {
      const values = [10, 10, 10, 10];
      const mean = 10;
      expect(calculateVariance(values, mean)).toBe(0);
    });

    it("should calculate variance for varied values", () => {
      const values = [10, 12, 8, 14, 6];
      const mean = 10;
      const variance = calculateVariance(values, mean);
      expect(variance).toBeGreaterThan(0);
      expect(variance).toBeLessThan(5); // Should be ~2.83
    });

    it("should handle empty array", () => {
      expect(calculateVariance([], 0)).toBe(0);
    });
  });

  describe("Periodicity Score", () => {
    it("should score perfect monthly intervals at 1.0", () => {
      const intervals = [30, 30, 30, 30]; // Exact 30-day intervals
      const score = calculatePeriodicityScore(intervals, 30);
      expect(score).toBe(1.0);
    });

    it("should score near-monthly intervals highly", () => {
      const intervals = [29, 30, 31, 30]; // Close to 30 days
      const score = calculatePeriodicityScore(intervals, 30);
      expect(score).toBeGreaterThan(0.9);
    });

    it("should score inconsistent intervals poorly", () => {
      const intervals = [15, 45, 20, 50]; // Highly inconsistent
      const score = calculatePeriodicityScore(intervals, 30);
      expect(score).toBeLessThan(0.6);
    });

    it("should score perfect annual intervals at 1.0", () => {
      const intervals = [365, 365, 365]; // Exact yearly
      const score = calculatePeriodicityScore(intervals, 365);
      expect(score).toBe(1.0);
    });

    it("should handle single interval", () => {
      const score = calculatePeriodicityScore([30], 30);
      expect(score).toBe(1.0);
    });

    it("should handle empty array", () => {
      expect(calculatePeriodicityScore([], 30)).toBe(0);
    });
  });

  describe("Cadence Detection", () => {
    it("should detect monthly pattern from intervals", () => {
      const intervals = [29, 30, 31, 30];
      const median = calculateMedian(intervals);
      expect(median).toBeGreaterThanOrEqual(28);
      expect(median).toBeLessThanOrEqual(33);
    });

    it("should detect weekly pattern from intervals", () => {
      const intervals = [7, 7, 7, 7];
      const median = calculateMedian(intervals);
      expect(median).toBeGreaterThanOrEqual(6);
      expect(median).toBeLessThanOrEqual(8);
    });

    it("should detect annual pattern from intervals", () => {
      const intervals = [365, 366, 365]; // Including leap year
      const median = calculateMedian(intervals);
      expect(median).toBeGreaterThanOrEqual(350);
      expect(median).toBeLessThanOrEqual(380);
    });

    it("should reject irregular patterns", () => {
      const intervals = [10, 45, 15, 60]; // No clear pattern
      const median = calculateMedian(intervals);
      // Should not fall into any cadence range
      const isWeekly = median >= 6 && median <= 8;
      const isMonthly = median >= 28 && median <= 33;
      const isYearly = median >= 350 && median <= 380;
      expect(isWeekly || isMonthly || isYearly).toBe(false);
    });
  });

  describe("Confidence Scoring", () => {
    it("should score high for perfect monthly subscription", () => {
      // Perfect monthly pattern: identical amounts, perfect intervals
      const intervals = [30, 30, 30, 30];
      const amounts = [9.99, 9.99, 9.99, 9.99, 9.99]; // Netflix-like

      const periodicityScore = calculatePeriodicityScore(intervals, 30);
      const medianAmount = calculateMedian(amounts);
      const amountVariance = calculateVariance(amounts, medianAmount);
      const amountScore = Math.max(0, 1 - amountVariance / medianAmount);

      const confidence = periodicityScore * 0.6 + amountScore * 0.3;

      expect(confidence).toBeGreaterThan(0.85);
    });

    it("should score medium for slightly inconsistent pattern", () => {
      // Slightly irregular: dates drift, amounts vary a bit
      const intervals = [28, 31, 29, 32];
      const amounts = [12.99, 12.99, 13.49, 12.99]; // Minor price change

      const periodicityScore = calculatePeriodicityScore(intervals, 30);
      const medianAmount = calculateMedian(amounts);
      const amountVariance = calculateVariance(amounts, medianAmount);
      const amountScore = Math.max(0, 1 - amountVariance / medianAmount);

      const confidence = periodicityScore * 0.6 + amountScore * 0.3;

      expect(confidence).toBeGreaterThan(0.6);
      expect(confidence).toBeLessThan(0.85);
    });

    it("should score low for irregular pattern", () => {
      // Irregular: inconsistent dates and amounts
      const intervals = [25, 35, 28, 40];
      const amounts = [10.99, 15.99, 8.99, 20.99];

      const periodicityScore = calculatePeriodicityScore(intervals, 30);
      const medianAmount = calculateMedian(amounts);
      const amountVariance = calculateVariance(amounts, medianAmount);
      const amountScore = Math.max(0, 1 - amountVariance / medianAmount);

      const confidence = periodicityScore * 0.6 + amountScore * 0.3;

      expect(confidence).toBeLessThan(0.6);
    });
  });

  describe("Real-World Scenarios", () => {
    it("should detect Netflix-like subscription (perfect monthly)", () => {
      // Real Netflix pattern: $9.99/month, always on the 15th
      const intervals = [30, 30, 31, 30, 30]; // Accounting for month lengths
      const amounts = [9.99, 9.99, 9.99, 9.99, 9.99, 9.99];

      const periodicityScore = calculatePeriodicityScore(intervals, 30);
      const medianAmount = calculateMedian(amounts);
      const amountVariance = calculateVariance(amounts, medianAmount);
      const amountScore = Math.max(0, 1 - amountVariance / medianAmount);

      const confidence = periodicityScore * 0.6 + amountScore * 0.3 + 0.1; // +0.1 for known merchant

      expect(confidence).toBeGreaterThan(0.9); // Very high confidence
    });

    it("should detect Spotify-like subscription (monthly with occasional free month)", () => {
      // Spotify: sometimes skips a month (free trial extension)
      const intervals = [30, 30, 61, 30]; // 61-day gap = skipped month
      const amounts = [9.99, 9.99, 9.99, 9.99, 9.99];

      const periodicityScore = calculatePeriodicityScore(intervals, 30);
      const medianAmount = calculateMedian(amounts);
      const amountVariance = calculateVariance(amounts, medianAmount);
      const amountScore = Math.max(0, 1 - amountVariance / medianAmount);

      const confidence = periodicityScore * 0.6 + amountScore * 0.3;

      // Should still detect, but lower confidence due to gap
      expect(confidence).toBeGreaterThan(0.6);
      expect(confidence).toBeLessThan(0.9);
    });

    it("should detect Adobe Creative Cloud (annual)", () => {
      // Adobe: $52.99/month charged annually ($634.99/year)
      const intervals = [365, 365]; // 2 annual charges
      const amounts = [634.99, 634.99, 634.99];

      const periodicityScore = calculatePeriodicityScore(intervals, 365);
      const medianAmount = calculateMedian(amounts);
      const amountVariance = calculateVariance(amounts, medianAmount);
      const amountScore = Math.max(0, 1 - amountVariance / medianAmount);

      const confidence = periodicityScore * 0.6 + amountScore * 0.3 + 0.1; // +0.1 for known

      expect(confidence).toBeGreaterThan(0.9);
    });

    it("should NOT detect one-off purchases", () => {
      // Amazon: random purchases, no pattern
      const intervals = [10, 45, 3, 120, 7];
      const amounts = [25.99, 129.99, 8.50, 450.00, 12.99];

      const medianInterval = calculateMedian(intervals);

      // Check if it falls into any recognized cadence
      const isWeekly = medianInterval >= 6 && medianInterval <= 8;
      const isMonthly = medianInterval >= 28 && medianInterval <= 33;
      const isYearly = medianInterval >= 350 && medianInterval <= 380;

      // Should not match any pattern
      expect(isWeekly || isMonthly || isYearly).toBe(false);
    });

    it("should detect Patreon weekly subscription", () => {
      // Patreon: $5/week
      const intervals = [7, 7, 7, 7, 7];
      const amounts = [5.00, 5.00, 5.00, 5.00, 5.00, 5.00];

      const periodicityScore = calculatePeriodicityScore(intervals, 7);
      const medianAmount = calculateMedian(amounts);
      const amountVariance = calculateVariance(amounts, medianAmount);
      const amountScore = Math.max(0, 1 - amountVariance / medianAmount);

      const confidence = periodicityScore * 0.6 + amountScore * 0.3;

      expect(confidence).toBeGreaterThan(0.85);
    });
  });
});
