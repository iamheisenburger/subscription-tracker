"use client";

export function TestModeBanner() {
  // Only show in development or if test mode env var is set
  const isTestMode = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_TEST_MODE === 'true';
  
  if (!isTestMode) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-black text-center py-2 text-sm font-semibold">
      ⚠️ TEST MODE - Using Stripe Test Cards - No Real Charges
    </div>
  );
}


