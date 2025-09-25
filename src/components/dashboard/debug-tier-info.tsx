"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface EnvironmentStatus {
  valid: boolean;
  missing: string[];
  warnings: string[];
  additional: Record<string, unknown>;
  safeValues: Record<string, string>;
}

export function DebugTierInfo() {
  const { user } = useUser();
  const userData = useQuery(
    api.users.getUserByClerkId, 
    user?.id ? { clerkId: user.id } : "skip"
  );
  const [syncing, setSyncing] = useState(false);
  const [envStatus, setEnvStatus] = useState<EnvironmentStatus | null>(null);

  const forceSync = async () => {
    setSyncing(true);
    try {
      const response = await fetch('/api/sync/tier', { method: 'POST' });
      const result = await response.json();
      
      if (result.success) {
        toast.success(`✅ Synced! Tier: ${result.tier} (${result.confidence} confidence)`, {
          description: result.subscriptionType ? `Type: ${result.subscriptionType}` : undefined
        });
        window.location.reload();
      } else {
        toast.error(`❌ Sync failed: ${result.message}`, {
          description: `Confidence: ${result.confidence}`
        });
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

  const checkEnvironment = async () => {
    try {
      const response = await fetch('/api/debug/env-check');
      const result = await response.json();
      setEnvStatus(result.environment);
      
      if (result.environment.valid) {
        toast.success("✅ Environment configuration looks good!");
      } else {
        toast.warning("⚠️ Environment issues detected", {
          description: `Missing: ${result.environment.missing.join(', ')}`
        });
      }
    } catch (error) {
      toast.error("Failed to check environment");
    }
  };

  if (!user) return null;

  const tierColor = userData?.tier === 'premium_user' ? 'text-green-600' : 'text-red-600';
  const tierBadge = userData?.tier === 'premium_user' ? 
    <Badge className="bg-green-100 text-green-800">PREMIUM</Badge> : 
    <Badge variant="secondary">FREE</Badge>;

  return (
    <Card className="border-2 border-orange-500 bg-orange-50 dark:bg-orange-950/20">
      <CardHeader>
        <CardTitle className="text-orange-700 dark:text-orange-400 flex items-center gap-2">
          🔧 Enhanced Tier Debug Panel
          {tierBadge}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="status" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="status">Status</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
            <TabsTrigger value="environment">Environment</TabsTrigger>
          </TabsList>
          
          <TabsContent value="status" className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Clerk User ID:</strong>
                <br />
                <code className="text-xs bg-muted p-1 rounded">{user.id}</code>
              </div>
              <div>
                <strong>Email:</strong>
                <br />
                {user.emailAddresses[0]?.emailAddress}
              </div>
              <div>
                <strong>Convex Tier:</strong>
                <br />
                <span className={tierColor}>
                  {userData?.tier || 'NOT FOUND'}
                </span>
              </div>
              <div>
                <strong>Subscription Type:</strong>
                <br />
                <Badge variant={userData?.subscriptionType === 'annual' ? 'default' : 'secondary'}>
                  {userData?.subscriptionType || 'NOT SET'}
                </Badge>
              </div>
              <div>
                <strong>Subscription Limit:</strong>
                <br />
                {userData?.subscriptionLimit === -1 ? '∞ (Unlimited)' : userData?.subscriptionLimit || 'NOT SET'}
              </div>
              <div>
                <strong>User Synced:</strong>
                <br />
                <span className={userData ? 'text-green-600' : 'text-red-600'}>
                  {userData ? 'YES' : 'NO'}
                </span>
              </div>
              {userData?.createdAt && (
                <div className="col-span-2">
                  <strong>Created:</strong>
                  <br />
                  {new Date(userData.createdAt).toLocaleString()}
                </div>
              )}
            </div>

            <div className="text-xs text-muted-foreground border-t pt-4">
              <strong>Clerk Metadata:</strong>
              <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto max-h-32">
                {JSON.stringify(user.publicMetadata, null, 2)}
              </pre>
            </div>
          </TabsContent>

          <TabsContent value="actions" className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button onClick={forceSync} disabled={syncing} className="bg-blue-600 hover:bg-blue-700">
                {syncing ? "Syncing..." : "🔄 Force Sync Tier"}
              </Button>
              <Button onClick={getClerkData} variant="outline">
                📊 Debug Clerk Data
              </Button>
              <Button onClick={checkEnvironment} variant="outline">
                🔧 Check Environment
              </Button>
              <Button 
                onClick={() => {
                  fetch('/api/admin/set-subscription-type', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ subscriptionType: 'monthly' })
                  }).then(r => r.json()).then(result => {
                    if (result.success) {
                      toast.success("✅ Manually upgraded to premium!");
                      window.location.reload();
                    } else {
                      toast.error("❌ Manual upgrade failed");
                    }
                  });
                }} 
                className="bg-green-600 hover:bg-green-700"
              >
                🚀 Force Premium
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="environment" className="space-y-4">
            {envStatus ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge className={envStatus.valid ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                    {envStatus.valid ? "✅ VALID" : "❌ INVALID"}
                  </Badge>
                </div>
                
                {envStatus.missing.length > 0 && (
                  <div>
                    <strong className="text-red-600">Missing Variables:</strong>
                    <ul className="list-disc list-inside text-sm text-red-600">
                      {envStatus.missing.map(missing => (
                        <li key={missing}>{missing}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {envStatus.warnings.length > 0 && (
                  <div>
                    <strong className="text-yellow-600">Warnings:</strong>
                    <ul className="list-disc list-inside text-sm text-yellow-600">
                      {envStatus.warnings.map(warning => (
                        <li key={warning}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div>
                  <strong>Configuration Status:</strong>
                  <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                    {Object.entries(envStatus.safeValues).map(([key, value]) => (
                      <div key={key}>
                        <code>{key}:</code> {value}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <Button onClick={checkEnvironment}>Check Environment</Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
