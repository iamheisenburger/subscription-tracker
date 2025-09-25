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
  const [syncResult, setSyncResult] = useState<any>(null);
  const [apiResult, setApiResult] = useState<any>(null);
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
    return <div className="p-4">Please sign in first</div>;
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
                {userData?.tier === 'premium_user' ? 'PREMIUM' : 'FREE'}
              </Badge>
            </div>
            
            <div className="text-sm space-y-2">
              <div><strong>User ID:</strong> {user.id.slice(-8)}...</div>
              <div><strong>Email:</strong> {user.emailAddresses[0]?.emailAddress}</div>
              <div><strong>Convex Tier:</strong> {userData?.tier || 'Not Found'}</div>
              <div><strong>Subscription Type:</strong> {userData?.subscriptionType || 'Not Set'}</div>
              <div><strong>Limit:</strong> {userData?.subscriptionLimit === -1 ? '∞' : userData?.subscriptionLimit}</div>
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
              📊 Check Raw Data
            </Button>
            
            <Button 
              onClick={forceUpgrade} 
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              🚀 Force Premium (Override)
            </Button>
          </CardContent>
        </Card>

        {/* Clerk Metadata */}
        <Card>
          <CardHeader>
            <CardTitle>📋 Clerk Metadata</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted p-2 rounded overflow-auto">
              {JSON.stringify(user.publicMetadata, null, 2)}
            </pre>
          </CardContent>
        </Card>

        {/* Sync Result */}
        {syncResult && (
          <Card className="border-blue-500">
            <CardHeader>
              <CardTitle>🔄 Sync Result</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                {JSON.stringify(syncResult, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* API Result */}
        {apiResult && (
          <Card className="border-green-500">
            <CardHeader>
              <CardTitle>📊 Raw API Data</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                {JSON.stringify(apiResult, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card className="border-orange-500">
          <CardHeader>
            <CardTitle>📱 Mobile Debug Instructions</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p><strong>1. Test Sync:</strong> Runs the same sync as the main app</p>
            <p><strong>2. Check Raw Data:</strong> Shows what Clerk has in your account</p>  
            <p><strong>3. Force Premium:</strong> Bypasses detection and sets you to premium</p>
            <p><strong>Problem?</strong> Screenshot this page and send it!</p>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
