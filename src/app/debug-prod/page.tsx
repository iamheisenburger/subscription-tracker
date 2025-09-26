/**
 * PRODUCTION DIAGNOSTIC PAGE
 * DELETE AFTER FIXING
 */

"use client";

import { useEffect, useState } from 'react';

export default function ProductionDebugPage() {
  const [diagnostics, setDiagnostics] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    const envVars = {
      // Environment info
      nodeEnv: process.env.NODE_ENV,
      
      // Clerk keys (partial for security)
      clerkPublishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.slice(0, 15) + '...' || 'NOT_SET',
      clerkKeyType: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.startsWith('pk_live_') ? 'PRODUCTION' : 
                   process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.startsWith('pk_test_') ? 'DEVELOPMENT' : 'UNKNOWN',
      
      // Domain info
      currentUrl: typeof window !== 'undefined' ? window.location.href : 'SERVER',
      currentHost: typeof window !== 'undefined' ? window.location.hostname : 'SERVER',
      
      // Convex
      convexUrl: process.env.NEXT_PUBLIC_CONVEX_URL?.slice(0, 30) + '...' || 'NOT_SET',
      
      // Plan ID
      premiumPlanId: process.env.NEXT_PUBLIC_CLERK_PREMIUM_PLAN_ID?.slice(0, 15) + '...' || 'NOT_SET',
      
      // Browser info
      isBrowser: typeof window !== 'undefined',
      timestamp: new Date().toISOString(),
    };

    setDiagnostics(envVars);
    console.log('🔍 PRODUCTION DIAGNOSTICS:', envVars);
  }, []);

  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'monospace', 
      backgroundColor: '#1a1a1a',
      color: '#fff',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#ff6b6b', marginBottom: '20px' }}>
        🚨 PRODUCTION DIAGNOSTICS
      </h1>
      
      <div style={{ backgroundColor: '#2d2d2d', padding: '15px', marginBottom: '20px', border: '1px solid #444' }}>
        <h2 style={{ color: '#4ecdc4' }}>Environment Check</h2>
        <p>✅ React/Next.js is working</p>
        <p>✅ This page loaded successfully</p>
        <p>Time: {new Date().toISOString()}</p>
      </div>

      {diagnostics && (
        <div style={{ backgroundColor: '#2d2d2d', padding: '15px', marginBottom: '20px', border: '1px solid #444' }}>
          <h2 style={{ color: '#4ecdc4' }}>Configuration</h2>
          <pre style={{ color: '#fff', fontSize: '12px', overflow: 'auto', whiteSpace: 'pre-wrap' }}>
            {JSON.stringify(diagnostics, null, 2)}
          </pre>
        </div>
      )}

      <div style={{ backgroundColor: '#2d3436', padding: '15px', border: '1px solid #74b9ff' }}>
        <h2 style={{ color: '#74b9ff' }}>✅ CRITICAL TESTS</h2>
        <ol style={{ fontSize: '14px' }}>
          <li><strong>Key Type:</strong> Should be &quot;PRODUCTION&quot; ✅</li>
          <li><strong>Domain:</strong> Should be &quot;usesubwise.app&quot; ✅</li>
          <li><strong>NOT Vercel URL:</strong> Should NOT contain &quot;vercel.app&quot; ⚠️</li>
          <li><strong>Clerk Working:</strong> Test sign-in button below ⬇️</li>
        </ol>
        
        <div style={{ marginTop: '20px', fontSize: '12px' }}>
          <p><strong>🌐 Test Links:</strong></p>
          <p><a href="https://usesubwise.app" style={{ color: '#00b894' }}>https://usesubwise.app</a> (CORRECT DOMAIN)</p>
          <p><a href="https://usesubwise.app/sign-in" style={{ color: '#00b894' }}>https://usesubwise.app/sign-in</a> (TEST SIGN-IN)</p>
        </div>
      </div>
      
      <div style={{ marginTop: '20px', fontSize: '10px', color: '#666', textAlign: 'center' }}>
        🗑️ DELETE THIS FILE AFTER DEBUGGING: src/app/debug-prod/page.tsx
      </div>
    </div>
  );
}
