/**
 * Performance Optimization Utilities
 * Helper functions for improving app performance
 */

/**
 * Debounce function for expensive operations
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function for high-frequency events
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Format currency efficiently
 */
export function formatCurrency(amount: number, currency: string = "USD"): string {
  // Use Intl.NumberFormat for better performance than toLocaleString
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return formatter.format(amount);
}

/**
 * Format date efficiently
 */
export function formatDate(timestamp: number, format: "short" | "long" | "relative" = "short"): string {
  const date = new Date(timestamp);
  const now = new Date();

  if (format === "relative") {
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
    return `${Math.floor(diffDays / 365)}y ago`;
  }

  const formatter = new Intl.DateTimeFormat("en-US", {
    dateStyle: format === "long" ? "long" : "short",
  });

  return formatter.format(date);
}

/**
 * Memoize expensive calculations
 */
export function memoize<T extends (...args: unknown[]) => unknown>(
  func: T
): (...args: Parameters<T>) => ReturnType<T> {
  const cache = new Map<string, ReturnType<T>>();

  return function memoized(...args: Parameters<T>): ReturnType<T> {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = func(...args) as ReturnType<T>;
    cache.set(key, result);

    return result;
  };
}

/**
 * Check if element is in viewport (for lazy loading)
 */
export function isInViewport(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * Lazy load images with Intersection Observer
 */
export function setupLazyLoading(selector: string = "img[data-src]"): void {
  if ("IntersectionObserver" in window) {
    const lazyImages = document.querySelectorAll<HTMLImageElement>(selector);

    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const src = img.dataset.src;

          if (src) {
            img.src = src;
            img.removeAttribute("data-src");
            imageObserver.unobserve(img);
          }
        }
      });
    });

    lazyImages.forEach((img) => imageObserver.observe(img));
  }
}

/**
 * Prefetch a resource for better performance
 */
export function prefetch(url: string, type: "fetch" | "script" | "style" = "fetch"): void {
  if (type === "fetch") {
    // Prefetch data
    fetch(url, { priority: "low" }).catch(() => {
      // Silently fail
    });
  } else {
    // Prefetch script or style
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = url;
    link.as = type === "script" ? "script" : "style";
    document.head.appendChild(link);
  }
}

/**
 * Calculate total cost efficiently
 */
export function calculateTotalCost(
  subscriptions: Array<{ cost: number; billingCycle: string; isActive: boolean }>
): { monthly: number; yearly: number } {
  let monthly = 0;
  let yearly = 0;

  for (const sub of subscriptions) {
    if (!sub.isActive) continue;

    switch (sub.billingCycle) {
      case "weekly":
        monthly += sub.cost * 4.33; // Average weeks per month
        yearly += sub.cost * 52;
        break;
      case "monthly":
        monthly += sub.cost;
        yearly += sub.cost * 12;
        break;
      case "yearly":
        monthly += sub.cost / 12;
        yearly += sub.cost;
        break;
    }
  }

  return { monthly, yearly };
}

/**
 * Batch multiple operations together
 */
export function batch<T>(
  items: T[],
  batchSize: number,
  processor: (batch: T[]) => Promise<void>
): Promise<void> {
  const batches: T[][] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }

  return batches.reduce(
    (promise, batch) => promise.then(() => processor(batch)),
    Promise.resolve()
  );
}
