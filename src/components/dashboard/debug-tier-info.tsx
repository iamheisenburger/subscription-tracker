"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

export function DebugTierInfo() {
  const { user } = useUser();
  const userData = useQuery(
    api.users.getUserByClerkId, 
    user?.id ? { clerkId: user.id } : "skip"
  );
  const [syncing, setSyncing] = useState(false);

  const forceSync = async () => {
    setSyncing(true);
    try {
      const response = await fetch('/api/sync/tier', { method: 'POST' });
      const result = await response.json();
      
      if (result.success) {
        toast.success(`✅ Synced! You are: ${result.tier}`);
        window.location.reload();
      } else {
        toast.error(`❌ Sync failed: ${result.error}`);
      }
    } catch (error) {
      toast.error("❌ Sync request failed");
    } finally {
      setSyncing(false);
    }
  };

  const getClerkData = async () => {
    try {
      const response = await fetch('/api/sync/tier', { method: 'GET' });
      const result = await response.json();
      console.log('🔍 Clerk Data:', result);
      toast.info("Check console for Clerk data");
    } catch (error) {
      toast.error("Failed to get Clerk data");
    }
  };

  if (!user) return null;

  return (
    <Card className="border-2 border-red-500 bg-red-50 dark:bg-red-950/20">
      <CardHeader>
        <CardTitle className="text-red-700 dark:text-red-400">🐛 DEBUG: Tier Detection</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Clerk User ID:</strong>
            <br />
            {user.id}
          </div>
          <div>
            <strong>Clerk Email:</strong>
            <br />
            {user.emailAddresses[0]?.emailAddress}
          </div>
          <div>
            <strong>Convex Tier:</strong>
            <br />
            <span className={userData?.tier === 'premium_user' ? 'text-green-600' : 'text-red-600'}>
              {userData?.tier || 'NOT FOUND'}
            </span>
          </div>
          <div>
            <strong>Subscription Type:</strong>
            <br />
            {userData?.subscriptionType || 'NOT SET'}
          </div>
          <div>
            <strong>Subscription Limit:</strong>
            <br />
            {userData?.subscriptionLimit || 'NOT SET'}
          </div>
          <div>
            <strong>User Data Exists:</strong>
            <br />
            <span className={userData ? 'text-green-600' : 'text-red-600'}>
              {userData ? 'YES' : 'NO'}
            </span>
          </div>
        </div>

        <div className="flex gap-2 pt-4 border-t">
          <Button onClick={forceSync} disabled={syncing} className="bg-red-600 hover:bg-red-700">
            {syncing ? "Syncing..." : "🔄 Force Sync Tier"}
          </Button>
          <Button onClick={getClerkData} variant="outline">
            📊 Debug Clerk Data
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">
          <strong>Clerk Public Metadata:</strong>
          <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto">
            {JSON.stringify(user.publicMetadata, null, 2)}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}
