"use client";

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RefreshCw, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

interface DebugData {
  timestamp: string;
  userId: string;
  clerk: any;
  convex: any;
  tierDetection: any;
  premiumDetection: any;
  environment: any;
  analysis: any;
  recommendations: string[];
}

export default function DebugTierPage() {
  const { user, isLoaded } = useUser();
  const [debugData, setDebugData] = useState<DebugData | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const loadDebugData = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/debug-tier');
      const data = await response.json();
      setDebugData(data);
    } catch (error) {
      console.error('Failed to load debug data:', error);
    } finally {
      setLoading(false);
    }
  };

  const forceSyncTier = async () => {
    if (!user?.id) return;
    
    setSyncing(true);
    try {
      const response = await fetch('/api/sync/tier', { method: 'POST' });
      const result = await response.json();
      
      if (result.success) {
        alert(`✅ Sync successful! Tier: ${result.tier}`);
        // Reload debug data and page
        await loadDebugData();
        window.location.reload();
      } else {
        alert(`⚠️ Sync result: ${result.message}`);
        await loadDebugData();
      }
    } catch (error) {
      console.error('Sync failed:', error);
      alert('❌ Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    if (isLoaded && user?.id) {
      loadDebugData();
    }
  }, [isLoaded, user?.id]);

  if (!isLoaded) {
    return <div className="p-8">Loading...</div>;
  }

  if (!user) {
    return <div className="p-8">Please sign in to debug tier status.</div>;
  }

  const getRecommendationIcon = (rec: string) => {
    if (rec.includes('❌') || rec.includes('ISSUE')) return <XCircle className="h-4 w-4 text-red-500" />;
    if (rec.includes('⚠️') || rec.includes('WARNING')) return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    if (rec.includes('✅')) return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <Info className="h-4 w-4 text-blue-500" />;
  };

  return (
    <div className="container max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tier Debug Dashboard</h1>
          <p className="text-muted-foreground">
            Debug why your tier isn&apos;t being detected correctly
          </p>
        </div>
        <div className="space-x-2">
          <Button 
            onClick={loadDebugData} 
            disabled={loading}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            onClick={forceSyncTier}
            disabled={syncing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            Force Sync Tier
          </Button>
        </div>
      </div>

      {debugData && (
        <>
          {/* Status Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Status Overview</CardTitle>
              <CardDescription>
                Last updated: {new Date(debugData.timestamp).toLocaleString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Current Tier</p>
                  <Badge variant={debugData.convex.tier === 'premium_user' ? 'default' : 'secondary'}>
                    {debugData.convex.tier || 'Unknown'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Should Be Premium</p>
                  <Badge variant={debugData.analysis.shouldBePremium ? 'default' : 'secondary'}>
                    {debugData.analysis.shouldBePremium ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Issue Detected</p>
                  <Badge variant={debugData.analysis.issueDetected ? 'destructive' : 'default'}>
                    {debugData.analysis.issueDetected ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          {debugData.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
                <CardDescription>Actions to resolve tier detection issues</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {debugData.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start gap-3">
                      {getRecommendationIcon(rec)}
                      <p className="text-sm">{rec}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Detailed Data */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Clerk Data */}
            <Card>
              <CardHeader>
                <CardTitle>Clerk Data</CardTitle>
                <CardDescription>User data from Clerk authentication</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium">Public Metadata</p>
                  <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto">
                    {JSON.stringify(debugData.clerk.publicMetadata, null, 2)}
                  </pre>
                </div>
                <Separator />
                <div>
                  <p className="text-sm font-medium">External Accounts</p>
                  <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto">
                    {JSON.stringify(debugData.clerk.externalAccounts, null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>

            {/* Convex Data */}
            <Card>
              <CardHeader>
                <CardTitle>Convex Database</CardTitle>
                <CardDescription>User data stored in Convex</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Exists:</span>
                    <Badge variant={debugData.convex.exists ? 'default' : 'destructive'}>
                      {debugData.convex.exists ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Tier:</span>
                    <Badge>{debugData.convex.tier || 'None'}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Subscription Type:</span>
                    <Badge variant="outline">{debugData.convex.subscriptionType || 'None'}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Subscription Limit:</span>
                    <Badge variant="outline">{debugData.convex.subscriptionLimit || 'Unknown'}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tier Detection */}
            <Card>
              <CardHeader>
                <CardTitle>Tier Detection Result</CardTitle>
                <CardDescription>Result from tier detection algorithm</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Detected Tier:</span>
                    <Badge>{debugData.tierDetection.tier}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Confidence:</span>
                    <Badge variant={debugData.tierDetection.confidence === 'high' ? 'default' : 
                      debugData.tierDetection.confidence === 'medium' ? 'secondary' : 'destructive'}>
                      {debugData.tierDetection.confidence}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Source:</span>
                    <Badge variant="outline">{debugData.tierDetection.source}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Premium Detection */}
            <Card>
              <CardHeader>
                <CardTitle>Premium Detection Result</CardTitle>
                <CardDescription>Result from premium detection algorithm</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Is Premium:</span>
                    <Badge variant={debugData.premiumDetection.isPremium ? 'default' : 'secondary'}>
                      {debugData.premiumDetection.isPremium ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Confidence:</span>
                    <Badge variant={debugData.premiumDetection.confidence === 'high' ? 'default' : 
                      debugData.premiumDetection.confidence === 'medium' ? 'secondary' : 'destructive'}>
                      {debugData.premiumDetection.confidence}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Source:</span>
                    <Badge variant="outline">{debugData.premiumDetection.source}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Environment Check */}
          <Card>
            <CardHeader>
              <CardTitle>Environment Check</CardTitle>
              <CardDescription>Required environment variables</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(debugData.environment).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center">
                    <span className="text-sm">{key}:</span>
                    <Badge variant={value ? 'default' : 'destructive'}>
                      {typeof value === 'boolean' ? (value ? 'Set' : 'Missing') : String(value)}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
