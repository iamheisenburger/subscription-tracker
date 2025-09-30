"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, XCircle, Users, Zap } from "lucide-react";
import { toast } from "sonner";

interface ClerkUser {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email_addresses: Array<{ email_address: string }>;
  public_metadata: Record<string, unknown>;
}

export default function AdminSyncPage() {
  const [adminSecret, setAdminSecret] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [premiumUsers, setPremiumUsers] = useState<ClerkUser[]>([]);
  const [syncResults, setSyncResults] = useState<{ success: string[]; failed: Array<{ userId: string; error: string }>; total: number } | null>(null);

  const authorize = () => {
    // Simple client-side check (real auth happens server-side)
    if (adminSecret.length > 10) {
      setIsAuthorized(true);
      toast.success("Authorized");
    } else {
      toast.error("Invalid admin secret");
    }
  };

  const fetchPremiumUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/list-premium-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminSecret })
      });

      const data = await response.json();
      
      if (response.ok) {
        setPremiumUsers(data.users || []);
        toast.success(`Found ${data.users?.length || 0} premium subscribers`);
      } else {
        toast.error(data.error || "Failed to fetch users");
      }
    } catch {
      toast.error("Failed to fetch premium users");
    } finally {
      setLoading(false);
    }
  };

  const syncAllUsers = async () => {
    if (premiumUsers.length === 0) {
      toast.error("No users to sync");
      return;
    }

    setLoading(true);
    setSyncResults(null);

    try {
      const userIds = premiumUsers.map(u => u.id);
      
      const response = await fetch('/api/admin/sync-premium-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminSecret,
          userIds,
          subscriptionType: 'annual' // Default, adjust as needed
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setSyncResults(data.results);
        toast.success(`✅ Synced ${data.results.success.length}/${data.results.total} users`);
      } else {
        toast.error(data.error || "Sync failed");
      }
    } catch {
      toast.error("Failed to sync users");
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="container mx-auto p-8 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Admin Access Required</CardTitle>
            <CardDescription>
              Enter your admin secret to access user sync tools
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              type="password"
              placeholder="Admin secret"
              value={adminSecret}
              onChange={(e) => setAdminSecret(e.target.value)}
              className="w-full p-2 border rounded"
              onKeyPress={(e) => e.key === 'Enter' && authorize()}
            />
            <Button onClick={authorize} className="w-full">
              Authorize
            </Button>
            <p className="text-xs text-muted-foreground">
              Admin secret is set in Vercel environment variables (ADMIN_SECRET)
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Premium User Sync</h1>
        <p className="text-muted-foreground">
          Sync metadata for premium users whose webhooks failed
        </p>
      </div>

      <div className="grid gap-6">
        {/* Step 1: Fetch Premium Users */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Step 1: Find Premium Users
            </CardTitle>
            <CardDescription>
              Fetches all users with active Clerk subscriptions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={fetchPremiumUsers} 
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Fetching...
                </>
              ) : (
                <>
                  <Users className="mr-2 h-4 w-4" />
                  Fetch Premium Subscribers
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Display Found Users */}
        {premiumUsers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Found {premiumUsers.length} Premium Users</CardTitle>
              <CardDescription>
                Review users before syncing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {premiumUsers.map(user => (
                  <div 
                    key={user.id}
                    className="flex items-center justify-between p-3 border rounded"
                  >
                    <div>
                      <p className="font-medium">
                        {user.first_name} {user.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {user.email_addresses[0]?.email_address}
                      </p>
                    </div>
                    <Badge variant={
                      Object.keys(user.public_metadata).length === 0 
                        ? "destructive" 
                        : "default"
                    }>
                      {Object.keys(user.public_metadata).length === 0 
                        ? "Needs Sync" 
                        : "Has Metadata"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Sync All */}
        {premiumUsers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Step 2: Sync All Users
              </CardTitle>
              <CardDescription>
                Updates metadata for all users shown above
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={syncAllUsers} 
                disabled={loading}
                className="w-full"
                variant="default"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Sync All {premiumUsers.length} Users
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Sync Results */}
        {syncResults && (
          <Card>
            <CardHeader>
              <CardTitle>Sync Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="font-medium">
                    {syncResults.success.length} users synced successfully
                  </span>
                </div>
                
                {syncResults.failed.length > 0 && (
                  <div className="flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-red-500" />
                    <span className="font-medium">
                      {syncResults.failed.length} users failed
                    </span>
                  </div>
                )}

                <div className="mt-4 p-4 bg-green-50 dark:bg-green-950 rounded border border-green-200">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    ✅ All users can now log out and log back in to see premium features
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="mt-8 p-4 border rounded bg-muted/20">
        <h3 className="font-semibold mb-2">How This Works:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
          <li>Fetches all users with active Clerk subscriptions</li>
          <li>Updates their publicMetadata with tier: &quot;premium_user&quot;</li>
          <li>Updates Convex database to match</li>
          <li>Users see premium features on next login</li>
        </ol>
      </div>
    </div>
  );
}
