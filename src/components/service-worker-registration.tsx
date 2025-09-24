"use client";

import { useEffect } from 'react';

export function ServiceWorkerRegistration() {
  useEffect(() => {
    // Only register service worker in browser environment
    if (typeof window === 'undefined') return;
    
    // Register service worker for PWA functionality and push notifications
    if ('serviceWorker' in navigator) {
      // Add delay to avoid blocking initial render
      const timer = setTimeout(() => {
        navigator.serviceWorker
          .register('/sw.js', { 
            scope: '/',
            updateViaCache: 'none' // Always check for updates
          })
          .then((registration) => {
            console.log('✅ Service Worker registered successfully:', registration.scope);
            
            // Check for updates
            registration.addEventListener('updatefound', () => {
              console.log('🔄 Service Worker update found');
            });
          })
          .catch((error) => {
            console.error('❌ Service Worker registration failed:', error);
            // Don't throw - graceful degradation
          });

        // Listen for service worker messages
        navigator.serviceWorker.addEventListener('message', (event) => {
          console.log('📨 SW Message:', event.data);
        });
      }, 100);

      return () => clearTimeout(timer);
    } else {
      console.warn('⚠️ Service Worker not supported in this browser');
    }
  }, []);

  return null; // This component doesn't render anything
}
