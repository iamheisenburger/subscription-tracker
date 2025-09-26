/**
 * MOBILE-FRIENDLY TIER DETECTION DEBUG PAGE
 */

"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useState } from "react";

export default function MobileDebugPage() {
  const { user, isLoaded } = useUser();
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
      const response = await fetch('/api/sync/tier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const result = await response.json();
      setSyncResult(result);
      toast.success("Sync test completed");
      // Refresh page after 2 seconds if upgraded
      if (result.upgraded) {
        setTimeout(() => window.location.reload(), 2000);
      }
    } catch (error) {
      setSyncResult({ error: String(error) });
      toast.error("Sync test failed");
    } finally {
      setLoading(false);
    }
  };

  const checkClerkData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/debug/env-check');
      const result = await response.json();
      setApiResult(result);
      toast.success("Environment check completed");
    } catch (error) {
      setApiResult({ error: String(error) });
      toast.error("Environment check failed");
    } finally {
      setLoading(false);
    }
  };

  const autoDetectPremium = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auto-detect-premium', { method: 'POST' });
      const result = await response.json();
      if (result.upgraded) {
        setSyncResult({ ...result, message: '🎉 AUTOMATIC PREMIUM DETECTION SUCCESSFUL!' });
        toast.success("Premium tier detected and upgraded!");
        setTimeout(() => window.location.reload(), 2000);
      } else {
        setSyncResult({ ...result, message: 'No premium status detected automatically' });
        toast.info("No premium subscription found");
      }
    } catch (error) {
      setSyncResult({ error: String(error) });
      toast.error("Auto-detect failed");
    } finally {
      setLoading(false);
    }
  };

  const emergencyFix = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/fix-plan-id', { method: 'POST' });
      const result = await response.json();
      setSyncResult(result);
      if (result.fixed) {
        toast.success("Emergency fix applied!");
        setTimeout(() => window.location.reload(), 2000);
      } else {
        toast.error("Emergency fix failed");
      }
    } catch (error) {
      setSyncResult({ error: String(error) });
      toast.error("Emergency fix failed");
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) return <div className="p-4 text-center">Loading user data...</div>;
  if (!user) return <div className="p-4 text-center">Please sign in to debug.</div>;

  const tierColor = userData?.tier === 'premium_user' ? 'text-green-600' : 'text-red-600';
  const tierBadge = userData?.tier === 'premium_user' ?
    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">PREMIUM</Badge> :
    <Badge variant="secondary">FREE</Badge>;

  return (
    <div className="p-4 space-y-4 max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">🔍 Mobile Tier Debug</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Current Tier:</span>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-bold ${tierColor}`}>
                {userData?.tier || 'loading...'}
              </span>
              {tierBadge}
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Subscription Limit:</span>
            <span className="text-sm">{userData?.subscriptionLimit || 'N/A'}</span>
          </div>

          <div className="text-xs text-gray-500 space-y-1">
            <div>User ID: {user.id.slice(-8)}</div>
            <div>Email: {user.emailAddresses[0]?.emailAddress}</div>
            <div>Environment: Development</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">🧪 Test Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            onClick={testSync}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {loading ? "Testing..." : "🔄 Test Sync"}
          </Button>

          <Button
            onClick={autoDetectPremium}
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {loading ? "Detecting..." : "🔮 Auto-Detect Premium"}
          </Button>

          <Button
            onClick={checkClerkData}
            disabled={loading}
            className="w-full bg-yellow-600 hover:bg-yellow-700"
          >
            {loading ? "Checking..." : "🔍 Check Environment"}
          </Button>

          <Button
            onClick={emergencyFix}
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700"
          >
            {loading ? "Fixing..." : "🚨 Emergency Fix"}
          </Button>
        </CardContent>
      </Card>

      {user?.publicMetadata && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">📋 Clerk Metadata</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto">
              {JSON.stringify(user.publicMetadata, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {syncResult && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">📊 Last Test Result</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto">
              {JSON.stringify(syncResult, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {apiResult && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">🔧 Environment Info</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto">
              {JSON.stringify(apiResult, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      <div className="text-xs text-center text-gray-500 mt-6">
        🧹 This is a debug page - delete after testing
      </div>
    </div>
  );
}