"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react';
import { useUserTier } from '@/hooks/use-user-tier';

interface SyncResult {
  success: boolean;
  tier: string;
  confidence: string;
  source: string;
  message: string;
  debug?: any;
}

/**
 * Manual Tier Sync Button Component
 * 
 * Provides a manual sync button for users experiencing tier detection issues.
 * Shows detailed feedback about the sync process and results.
 */
export function ManualTierSyncButton() {
  const { isPremium, tier, isLoading } = useUserTier();
  const [syncing, setSyncing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    
    try {
      const response = await fetch('/api/sync/tier', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      setSyncResult(result);
      
      // If sync was successful and tier changed, reload page after delay
      if (result.success && result.tier !== tier) {
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
      
    } catch (error) {
      setSyncResult({
        success: false,
        tier: 'unknown',
        confidence: 'low',
        source: 'error',
        message: `Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setSyncing(false);
    }
  };

  // Don't show the button if user is already premium and not loading
  if (!isLoading && isPremium) {
    return null;
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          Sync Premium Status
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Sync Premium Status</DialogTitle>
          <DialogDescription>
            If you&apos;ve purchased premium but still see free tier limitations, 
            use this to manually sync your subscription status.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Current Status */}
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">Current Status:</p>
            <div className="flex items-center gap-2">
              <Badge variant={isPremium ? 'default' : 'secondary'}>
                {isLoading ? 'Loading...' : tier}
              </Badge>
              {!isPremium && !isLoading && (
                <span className="text-sm text-muted-foreground">
                  (Showing as free tier)
                </span>
              )}
            </div>
          </div>

          {/* Sync Results */}
          {syncResult && (
            <div className={`p-3 rounded-lg border ${
              syncResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-start gap-2">
                {syncResult.success ? (
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {syncResult.success ? 'Sync Successful' : 'Sync Failed'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {syncResult.message}
                  </p>
                  
                  {syncResult.success && (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs">Detected Tier:</span>
                        <Badge size="sm">{syncResult.tier}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs">Confidence:</span>
                        <Badge size="sm" variant="outline">{syncResult.confidence}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs">Source:</span>
                        <Badge size="sm" variant="outline">{syncResult.source}</Badge>
                      </div>
                    </div>
                  )}
                  
                  {syncResult.success && syncResult.tier !== tier && (
                    <p className="text-xs text-green-600 mt-2">
                      ✨ Page will reload automatically in 2 seconds...
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button 
              onClick={handleSync}
              disabled={syncing}
              className="flex-1"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync Now'}
            </Button>
            
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => window.open('/debug-tier', '_blank')}
              title="Open Debug Dashboard"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>

          {/* Help Text */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p>
              <strong>Still having issues?</strong> This sync checks your Clerk billing status
              and updates your tier accordingly.
            </p>
            <p>
              If the sync doesn&apos;t work, check your Clerk dashboard or contact support.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Simplified version for inline use (without dialog)
 */
export function InlineTierSyncButton({ className }: { className?: string }) {
  const { isPremium, isLoading } = useUserTier();
  const [syncing, setSyncing] = useState(false);

  if (!isLoading && isPremium) {
    return null;
  }

  const handleQuickSync = async () => {
    setSyncing(true);
    try {
      const response = await fetch('/api/sync/tier', { method: 'POST' });
      const result = await response.json();
      
      if (result.success && result.tier === 'premium_user') {
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch (error) {
      console.error('Quick sync failed:', error);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={handleQuickSync}
      disabled={syncing}
      className={`gap-1 text-xs ${className}`}
    >
      <RefreshCw className={`h-3 w-3 ${syncing ? 'animate-spin' : ''}`} />
      {syncing ? 'Syncing...' : 'Sync Premium'}
    </Button>
  );
}
