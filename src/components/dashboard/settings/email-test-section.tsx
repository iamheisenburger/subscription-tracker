"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Mail, ExternalLink, TestTube, Clock, Zap } from "lucide-react";
import { toast } from "sonner";
import { useUserTier } from "@/hooks/use-user-tier";

export function EmailTestSection() {
  const { user } = useUser();
  const { isPremium } = useUserTier();
  const subscriptions = useQuery(api.subscriptions.getUserSubscriptions, 
    user?.id ? { clerkId: user.id } : "skip"
  );

  const [selectedSubscription, setSelectedSubscription] = useState<string>("");
  const [emailType, setEmailType] = useState<string>("renewal_reminder");
  const [isSending, setIsSending] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    try {
      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'test_connection' }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success("Email service connection successful!");
      } else {
        toast.error(`Connection failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Test connection error:', error);
      toast.error("Failed to test connection");
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!selectedSubscription) {
      toast.error("Please select a subscription");
      return;
    }

    setIsSending(true);
    try {
      const emailData: Record<string, unknown> = {
        type: emailType,
        subscriptionId: selectedSubscription,
      };

      // Add type-specific data
      switch (emailType) {
        case 'renewal_reminder':
          emailData.daysUntil = 3;
          break;
        case 'price_change':
          emailData.oldPrice = 12.99;
          emailData.newPrice = 15.99;
          break;
        case 'spending_alert':
          emailData.currentSpending = 350.75;
          emailData.threshold = 300;
          break;
      }

      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailData),
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success(`Test ${emailType.replace('_', ' ')} email sent successfully!`);
      } else {
        console.error('Email failed with result:', result);
        toast.error(`Failed to send email: ${result.error}${result.details ? ` - ${result.details}` : ''}`);
      }
    } catch (error) {
      console.error('Send email error:', error);
      toast.error(`Failed to send test email: ${error instanceof Error ? error.message : 'Network error'}`);
    } finally {
      setIsSending(false);
    }
  };

  const openEmailPreview = (type: string) => {
    const url = `/api/notifications/preview?type=${type.replace('_', '-')}`;
    window.open(url, '_blank', 'width=800,height=600');
  };


  // Only show for premium users or in development
  if (!isPremium && process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-sans">
          <Mail className="h-5 w-5" />
          Email Notifications {/* Production Ready */}
        </CardTitle>
        <CardDescription className="font-sans">
          Manage your email notification preferences and test delivery
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Connection Test */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium font-sans">Email Service Connection</h4>
              <p className="text-sm text-muted-foreground font-sans">
                Test if the email service is properly configured
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleTestConnection}
              disabled={isTestingConnection}
              className="font-sans"
            >
              <TestTube className="mr-2 h-4 w-4" />
              {isTestingConnection ? "Testing..." : "Test Connection"}
            </Button>
          </div>
        </div>

        <Separator />

        {/* Email Preview */}
        <div className="space-y-4">
          <div>
            <h4 className="font-medium font-sans">Email Templates</h4>
            <p className="text-sm text-muted-foreground font-sans">
              Preview email templates in a new window
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { type: 'renewal_reminder', label: 'Renewal Reminder' },
              { type: 'price_change', label: 'Price Change Alert' },
              { type: 'spending_alert', label: 'Spending Alert' },
            ].map(({ type, label }) => (
              <Button
                key={type}
                variant="outline"
                onClick={() => openEmailPreview(type)}
                className="font-sans"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                {label}
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Send Test Email */}
        <div className="space-y-4">
          <div>
            <h4 className="font-medium font-sans">Send Test Email</h4>
            <p className="text-sm text-muted-foreground font-sans">
              Send a test email to your account using real subscription data
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium font-sans">Email Type</label>
              <Select value={emailType} onValueChange={setEmailType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="renewal_reminder" className="font-sans">
                    Renewal Reminder
                  </SelectItem>
                  <SelectItem value="price_change" className="font-sans">
                    Price Change Alert
                  </SelectItem>
                  <SelectItem value="spending_alert" className="font-sans">
                    Spending Alert
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium font-sans">Subscription</label>
              <Select value={selectedSubscription} onValueChange={setSelectedSubscription}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subscription" />
                </SelectTrigger>
                <SelectContent>
                  {subscriptions?.map((sub) => (
                    <SelectItem key={sub._id} value={sub._id} className="font-sans">
                      {sub.name} - ${sub.cost}/{sub.billingCycle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Button
            onClick={handleSendTestEmail}
            disabled={isSending || !selectedSubscription}
            className="font-sans"
          >
            <Mail className="mr-2 h-4 w-4" />
            {isSending ? "Sending..." : "Send Test Email"}
          </Button>
        </div>

        <Separator />

        {/* Cron Job Testing */}
        <div className="space-y-4">
          <div>
            <h4 className="font-medium font-sans">Notification System Status</h4>
            <p className="text-sm text-muted-foreground font-sans">
              Automated notification system is running in the background
            </p>
          </div>
          
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="font-sans">Renewal reminders are automatically sent 3 days before billing</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="font-sans">Price change alerts are sent when subscription costs change</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="font-sans">Spending alerts notify you when approaching budget thresholds</span>
            </div>
          </div>
          
          <div className="text-xs text-muted-foreground font-sans">
            <p>All notifications are processed automatically every hour. You can customize your preferences in the section above.</p>
          </div>
        </div>

        {!isPremium && (
          <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
            <p className="text-sm text-primary font-sans">
              Email testing is available in development mode. Premium users get access to advanced notification features in production.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
