/**
 * Temporary debug page to check environment configuration
 * DELETE THIS FILE AFTER DEBUGGING
 */

export default function DebugEnvPage() {
  return (
    <div className="p-4 font-mono text-sm">
      <h1 className="text-xl font-bold mb-4">🔍 Environment Debug</h1>
      
      <div className="space-y-4">
        <div>
          <h2 className="font-bold">Clerk Config:</h2>
          <p>Publishable Key: {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.slice(0, 20)}...</p>
          <p>JWT Issuer: {process.env.CLERK_JWT_ISSUER_DOMAIN || 'NOT_SET'}</p>
        </div>
        
        <div>
          <h2 className="font-bold">Convex Config:</h2>
          <p>URL: {process.env.NEXT_PUBLIC_CONVEX_URL}</p>
        </div>
        
        <div>
          <h2 className="font-bold">Environment:</h2>
          <p>NODE_ENV: {process.env.NODE_ENV}</p>
          <p>VERCEL_ENV: {process.env.VERCEL_ENV}</p>
        </div>
      </div>
      
      <div className="mt-8 p-4 bg-yellow-100 rounded">
        <p className="font-bold">🚨 DELETE THIS FILE AFTER DEBUGGING</p>
        <p>This page exposes environment info - remove it once fixed!</p>
      </div>
    </div>
  );
}
