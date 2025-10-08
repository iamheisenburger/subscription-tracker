'use client'

import Script from 'next/script'

export function Analytics() {
  const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

  // Only load analytics in production
  if (!GA_MEASUREMENT_ID || process.env.NODE_ENV !== 'production') {
    return null
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', {
            page_path: window.location.pathname,
          });
        `}
      </Script>
    </>
  )
}

// Event tracking helper functions
export const trackEvent = (action: string, params?: Record<string, unknown>) => {
  if (typeof window !== 'undefined' && (window as Window & { gtag?: Function }).gtag) {
    (window as Window & { gtag: Function }).gtag('event', action, params)
  }
}

export const trackPageView = (url: string) => {
  if (typeof window !== 'undefined' && (window as Window & { gtag?: Function }).gtag) {
    (window as Window & { gtag: Function }).gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID, {
      page_path: url,
    })
  }
}

