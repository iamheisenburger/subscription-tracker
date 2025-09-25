"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

export default function MobileDebugPage() {
  const { user } = useUser();
  const userData = useQuery(
    api.users.getUserByClerkId, 
    user?.id ? { clerkId: user.id } : "skip"
  );
  const [syncResult, setSyncResult] = useState<Record<string, unknown> | null>(null);
  const [apiResult, setApiResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  const testSync = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/sync/tier', { method: 'POST' });
      const result = await response.json();
      setSyncResult(result);
    } catch (error) {
      setSyncResult({ error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  const checkApi = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/sync/tier', { method: 'GET' });
      const result = await response.json();
      setApiResult(result);
    } catch (error) {
      setApiResult({ error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  const forceUpgrade = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/set-subscription-type', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionType: 'annual' })
      });
      const result = await response.json();
      if (result.success) {
        window.location.reload();
      } else {
        setSyncResult({ error: 'Force upgrade failed' });
      }
    } catch (error) {
      setSyncResult({ error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">Please sign in first</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto space-y-4">
        
        {/* Current Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">🔧 Mobile Debug Panel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-center">
              <Badge 
                className={userData?.tier === 'premium_user' ? 
                  "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
              >
                {userData?.tier === 'premium_user' ? 'PREMIUM DETECTED' : 'FREE DETECTED'}
              </Badge>
            </div>
            
            <div className="text-sm space-y-2">
              <div><strong>User ID:</strong> {user.id.slice(-8)}...</div>
              <div><strong>Email:</strong> {user.emailAddresses[0]?.emailAddress}</div>
              <div><strong>Convex Tier:</strong> {userData?.tier || 'Not Found'}</div>
              <div><strong>Subscription Type:</strong> {userData?.subscriptionType || 'Not Set'}</div>
              <div><strong>Limit:</strong> {userData?.subscriptionLimit === -1 ? '∞ (Unlimited)' : userData?.subscriptionLimit || 'Not Set'}</div>
              <div><strong>Created:</strong> {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString() : 'Unknown'}</div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Status */}
        <Card className={userData?.tier === 'premium_user' ? 'border-green-500' : 'border-red-500'}>
          <CardContent className="p-4 text-center">
            <div className="text-2xl mb-2">
              {userData?.tier === 'premium_user' ? '✅' : '❌'}
            </div>
            <div className="font-semibold">
              {userData?.tier === 'premium_user' ? 
                'PREMIUM STATUS ACTIVE' : 
                'NOT DETECTED AS PREMIUM'
              }
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>🚀 Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={testSync} 
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {loading ? "Working..." : "🔄 Test Sync"}
            </Button>
            
            <Button 
              onClick={checkApi} 
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              📊 Check Clerk Data
            </Button>
            
            <Button 
              onClick={forceUpgrade} 
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              🚀 Force Premium Override
            </Button>
            
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline"
              className="w-full"
            >
              🔄 Refresh Page
            </Button>
          </CardContent>
        </Card>

        {/* Clerk Metadata */}
        <Card>
          <CardHeader>
            <CardTitle>📋 Your Clerk Account Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs">
              <div className="mb-2"><strong>Public Metadata:</strong></div>
              <pre className="bg-muted p-2 rounded overflow-auto whitespace-pre-wrap">
                {JSON.stringify(user.publicMetadata, null, 2) || '{}'}
              </pre>
            </div>
            
            {user.organizationMemberships && user.organizationMemberships.length > 0 && (
              <div className="mt-3 text-xs">
                <div className="mb-2"><strong>Organizations:</strong></div>
                <pre className="bg-muted p-2 rounded overflow-auto whitespace-pre-wrap">
                  {JSON.stringify(user.organizationMemberships.map(m => ({
                    org: m.organization.name,
                    slug: m.organization.slug,
                    role: m.role
                  })), null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sync Result */}
        {syncResult && (
          <Card className="border-blue-500">
            <CardHeader>
              <CardTitle>🔄 Sync Test Result</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-muted p-2 rounded overflow-auto whitespace-pre-wrap">
                {JSON.stringify(syncResult, null, 2)}
              </pre>
              
              {syncResult && (
                <div className="mt-2 text-center">
                  <Badge className="bg-green-100 text-green-800">
                    SYNC COMPLETED
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* API Result */}
        {apiResult && (
          <Card className="border-green-500">
            <CardHeader>
              <CardTitle>📊 Raw Clerk API Data</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-muted p-2 rounded overflow-auto whitespace-pre-wrap">
                {JSON.stringify(apiResult, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card className="border-orange-500">
          <CardHeader>
            <CardTitle>📱 What This Shows</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p><strong>🔄 Test Sync:</strong> Runs tier detection manually</p>
            <p><strong>📊 Check Clerk Data:</strong> Shows raw data from your Clerk account</p>  
            <p><strong>🚀 Force Override:</strong> Bypasses detection and sets premium status</p>
            <p className="text-orange-600"><strong>Problem?</strong> Screenshot this entire page and share it!</p>
          </CardContent>
        </Card>

        {/* Back Button */}
        <Card>
          <CardContent className="p-4 text-center">
            <Button 
              onClick={() => window.location.href = '/dashboard'}
              variant="outline" 
              className="w-full"
            >
              ← Back to Dashboard
            </Button>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
