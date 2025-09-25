/**
 * EMERGENCY DIAGNOSTIC PAGE
 * DELETE AFTER DEBUGGING
 */

"use client";

import { useEffect, useState } from 'react';

export default function TestPage() {
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      // Check what environment variables are actually available
      const envVars = {
        clerkPublishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || 'NOT_SET',
        convexUrl: process.env.NEXT_PUBLIC_CONVEX_URL || 'NOT_SET',
        nodeEnv: process.env.NODE_ENV || 'NOT_SET',
        // Check if we're in browser
        isBrowser: typeof window !== 'undefined',
        location: typeof window !== 'undefined' ? window.location.href : 'SERVER',
      };

      setDiagnostics(envVars);
      
      console.log('🔍 EMERGENCY DIAGNOSTICS:', envVars);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      console.error('🚨 DIAGNOSTIC ERROR:', err);
    }
  }, []);

  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'monospace', 
      backgroundColor: '#f5f5f5',
      minHeight: '100vh',
      color: '#000'
    }}>
      <h1 style={{ color: '#d32f2f', marginBottom: '20px' }}>
        🚨 EMERGENCY DIAGNOSTICS
      </h1>
      
      <div style={{ backgroundColor: '#fff', padding: '15px', marginBottom: '20px', border: '1px solid #ccc' }}>
        <h2>Basic Test</h2>
        <p>✅ React is working</p>
        <p>✅ Next.js is working</p>
        <p>✅ This page loaded successfully</p>
        <p>Time: {new Date().toISOString()}</p>
      </div>

      {error && (
        <div style={{ backgroundColor: '#ffebee', padding: '15px', marginBottom: '20px', border: '1px solid #f44336' }}>
          <h2 style={{ color: '#d32f2f' }}>❌ ERROR DETECTED</h2>
          <pre style={{ color: '#d32f2f', fontSize: '12px' }}>{error}</pre>
        </div>
      )}

      {diagnostics && (
        <div style={{ backgroundColor: '#fff', padding: '15px', marginBottom: '20px', border: '1px solid #ccc' }}>
          <h2>Environment Variables</h2>
          <pre style={{ fontSize: '12px', overflow: 'auto' }}>
            {JSON.stringify(diagnostics, null, 2)}
          </pre>
        </div>
      )}

      <div style={{ backgroundColor: '#e8f5e8', padding: '15px', border: '1px solid #4caf50' }}>
        <h2 style={{ color: '#2e7d32' }}>✅ NEXT STEPS</h2>
        <ol>
          <li>Take a screenshot of this page</li>
          <li>Check browser console (F12) for errors</li>
          <li>Go back to: <a href="/" style={{ color: '#1976d2' }}>Home Page</a></li>
          <li>If home is still blank, we have the root cause!</li>
        </ol>
      </div>
      
      <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
        🗑️ DELETE THIS FILE AFTER DEBUGGING: src/app/test/page.tsx
      </div>
    </div>
  );
}
