"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";

export function AdminDebugPanel() {
  const { user } = useUser();
  const [loading, setLoading] = useState<string | null>(null);
  
  const addSubWise = useMutation(api.users.addMissingSubWiseSubscription);
  const subscriptions = useQuery(api.subscriptions.getUserSubscriptions, user?.id ? { clerkId: user.id } : "skip");
  const userInfo = useQuery(api.users.getUserByClerkId, user?.id ? { clerkId: user.id } : "skip");

  const handleAddSubWise = async () => {
    if (!user?.id) return;
    setLoading("subwise");
    
    try {
      const result = await addSubWise({ clerkId: user.id });
      toast.success(`✅ ${result.message}`, {
        description: `Cost: $${result.cost}/${result.subscriptionId ? 'added' : 'existing'}`
      });
    } catch (error) {
      toast.error("❌ Failed to add SubWise subscription", {
        description: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setLoading(null);
    }
  };

  const handleTestNotification = async (type: "test" | "renewal_reminder" | "spending_alert") => {
    if (!user?.id) return;
    setLoading(type);
    
    try {
      if (type === "renewal_reminder") {
        // Find actual subscription that's due soon
        const upcomingSubs = subscriptions?.filter(sub => {
          const daysUntil = Math.ceil((sub.nextBillingDate - Date.now()) / (1000 * 60 * 60 * 24));
          return daysUntil >= 0 && daysUntil <= 7; // Due within 7 days
        }).sort((a, b) => a.nextBillingDate - b.nextBillingDate);
        
        const targetSub = upcomingSubs?.[0] || subscriptions?.[0];
        if (!targetSub) {
          throw new Error("No subscriptions found to test renewal reminder");
        }
        
        const actualDaysUntil = Math.ceil((targetSub.nextBillingDate - Date.now()) / (1000 * 60 * 60 * 24));
        
        const payload = {
          type: "renewal_reminder",
          subscriptionId: targetSub._id,
          daysUntil: actualDaysUntil
        };

        const res = await fetch("/api/notifications/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || "Email send failed");
        }

        toast.success(`✅ Renewal reminder sent`, {
          description: `${targetSub.name} renews in ${actualDaysUntil} days`
        });
        
      } else if (type === "spending_alert") {
        // Call the Convex test notification directly - uses SAME logic as backend
        const res = await fetch("/api/test-features", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "notifications" }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || "Email send failed");
        }

        // Show success with user's actual currency preference
        const userCurrency = userInfo?.preferredCurrency || 'USD';
        const currencySymbol = userCurrency === 'CAD' ? 'C$' : userCurrency === 'GBP' ? '£' : userCurrency === 'EUR' ? '€' : userCurrency === 'AUD' ? 'A$' : '$';
        
        toast.success(`✅ Spending alert sent`, {
          description: `Using real ${userCurrency} amounts from your budget`
        });

      } else {
        // Simple test email
        const res = await fetch("/api/notifications/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "test" }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || "Email send failed");
        }

        toast.success(`✅ Test email sent`, {
          description: "Check your inbox"
        });
      }
      
    } catch (error) {
      toast.error(`❌ Failed to send ${type} notification`, {
        description: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setLoading(null);
    }
  };

  if (!user) return null;

  return (
    <Card className="border-yellow-500/20 bg-yellow-500/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🧪 Debug & Testing Panel
          <Badge variant="outline" className="text-yellow-600">Dev Tools</Badge>
        </CardTitle>
        <CardDescription>
          Test SubWise features and verify functionality
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* SubWise Subscription */}
        <div className="space-y-2">
          <h4 className="font-semibold">SubWise Subscription</h4>
          <div className="flex gap-2">
            <Button 
              onClick={handleAddSubWise}
              disabled={loading === "subwise"}
              size="sm"
            >
              {loading === "subwise" ? "Adding..." : "➕ Add SubWise Subscription"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Adds your SubWise subscription to track your own premium plan
          </p>
        </div>

        {/* Notification Tests */}
        <div className="space-y-2">
          <h4 className="font-semibold">Email Notification Tests</h4>
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={() => handleTestNotification("test")}
              disabled={loading === "test"}
              variant="outline"
              size="sm"
            >
              {loading === "test" ? "Sending..." : "📧 Test Email"}
            </Button>
            <Button 
              onClick={() => handleTestNotification("renewal_reminder")}
              disabled={loading === "renewal_reminder"}
              variant="outline"
              size="sm"
            >
              {loading === "renewal_reminder" ? "Sending..." : "🔔 Renewal Reminder"}
            </Button>
            <Button 
              onClick={() => handleTestNotification("spending_alert")}
              disabled={loading === "spending_alert"}
              variant="outline"
              size="sm"
            >
              {loading === "spending_alert" ? "Sending..." : "💰 Spending Alert"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Test if email notifications actually work - check your inbox after clicking
          </p>
        </div>

        {/* Current Status */}
        <div className="pt-4 border-t border-border/50">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="font-medium">User ID:</span>
              <br />
              <code className="text-muted-foreground">{user.id}</code>
            </div>
            <div>
              <span className="font-medium">Email:</span>
              <br />
              <code className="text-muted-foreground">{user.emailAddresses[0]?.emailAddress}</code>
            </div>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
