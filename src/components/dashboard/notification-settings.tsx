"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Bell, Mail, Smartphone, Calendar, DollarSign } from "lucide-react";
import { toast } from "sonner";

interface NotificationPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  renewalReminders: boolean;
  priceChangeAlerts: boolean;
  weeklyDigest: boolean;
  trialExpirationWarnings: boolean;
}

export function NotificationSettings() {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailNotifications: true,
    pushNotifications: false,
    renewalReminders: true,
    priceChangeAlerts: true,
    weeklyDigest: false,
    trialExpirationWarnings: true,
  });

  const [isSaving, setIsSaving] = useState(false);

  const updatePreference = (key: keyof NotificationPreferences, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const savePreferences = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    toast.success("Notification preferences saved");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>
            Choose how you want to be notified about your subscriptions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Delivery Methods */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Delivery Methods</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label htmlFor="email-notifications">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                </div>
                <Switch
                  id="email-notifications"
                  checked={preferences.emailNotifications}
                  onCheckedChange={(checked) => updatePreference('emailNotifications', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Smartphone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label htmlFor="push-notifications">Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive browser push notifications
                    </p>
                  </div>
                </div>
                <Switch
                  id="push-notifications"
                  checked={preferences.pushNotifications}
                  onCheckedChange={(checked) => updatePreference('pushNotifications', checked)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Notification Types */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">What to notify me about</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label htmlFor="renewal-reminders">Renewal Reminders</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified before subscriptions renew
                    </p>
                  </div>
                </div>
                <Switch
                  id="renewal-reminders"
                  checked={preferences.renewalReminders}
                  onCheckedChange={(checked) => updatePreference('renewalReminders', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label htmlFor="price-change-alerts">Price Change Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when subscription prices change
                    </p>
                  </div>
                </div>
                <Switch
                  id="price-change-alerts"
                  checked={preferences.priceChangeAlerts}
                  onCheckedChange={(checked) => updatePreference('priceChangeAlerts', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label htmlFor="weekly-digest">Weekly Digest</Label>
                    <p className="text-sm text-muted-foreground">
                      Weekly summary of your subscription activity
                    </p>
                  </div>
                </div>
                <Switch
                  id="weekly-digest"
                  checked={preferences.weeklyDigest}
                  onCheckedChange={(checked) => updatePreference('weeklyDigest', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label htmlFor="trial-expiration">Trial Expiration Warnings</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when free trials are about to end
                    </p>
                  </div>
                </div>
                <Switch
                  id="trial-expiration"
                  checked={preferences.trialExpirationWarnings}
                  onCheckedChange={(checked) => updatePreference('trialExpirationWarnings', checked)}
                />
              </div>
            </div>
          </div>

          <Separator />

          <Button 
            onClick={savePreferences} 
            disabled={isSaving}
            className="w-full"
          >
            {isSaving ? "Saving..." : "Save Preferences"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}