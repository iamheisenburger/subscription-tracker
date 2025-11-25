"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Settings, Bell, Crown, Sparkles, Lock } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useUserTier } from "@/hooks/use-user-tier";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface PreferencesSettingsProps {
  // No props needed - uses useUser hook
}

export function PreferencesSettings({ }: PreferencesSettingsProps) {
  const { user } = useUser();
  const { isPlus, isAutomate } = useUserTier();
  const canCustomizeReminders = isPlus || isAutomate;
  const canUseSmartAlerts = isAutomate;
  const preferences = useQuery(api.notifications.getNotificationPreferences, 
    user?.id ? { clerkId: user.id } : "skip"
  );
  const updatePreferences = useMutation(api.notifications.updateNotificationPreferences);

  // Local state for form
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [renewalReminders, setRenewalReminders] = useState(true);
  const [spendingAlerts, setSpendingAlerts] = useState(false);
  const [spendingThreshold, setSpendingThreshold] = useState<string>("");
  const [reminderDays, setReminderDays] = useState<number[]>([7, 3, 1]);
  const [isSaving, setIsSaving] = useState(false);

  // Update local state when preferences load
  useEffect(() => {
    if (preferences) {
      setEmailEnabled(preferences.emailEnabled);
      setPushEnabled(preferences.pushEnabled);
      setRenewalReminders(preferences.renewalReminders);
      // Price change alerts disabled - feature not ready
      setSpendingAlerts(preferences.spendingAlerts);
      setSpendingThreshold(preferences.spendingThreshold?.toString() || "");
      setReminderDays(preferences.reminderDays);
    }
  }, [preferences]);

  // Enforce tier-based limits client-side as well
  useEffect(() => {
    if (!canCustomizeReminders) {
      setReminderDays([3]);
    }
    if (!canUseSmartAlerts) {
      setSpendingAlerts(false);
      setSpendingThreshold("");
    }
  }, [canCustomizeReminders, canUseSmartAlerts]);

  const handleSavePreferences = async () => {
    if (!user?.id) return;

    setIsSaving(true);
    try {
      await updatePreferences({
        clerkId: user.id,
        emailEnabled,
        pushEnabled,
        renewalReminders,
        priceChangeAlerts: false, // Disabled for now - feature not ready (handled server-side)
        spendingAlerts: canUseSmartAlerts ? spendingAlerts : false,
        spendingThreshold: canUseSmartAlerts && spendingThreshold
          ? parseFloat(spendingThreshold)
          : undefined,
        reminderDays,
      });
      toast.success("Notification preferences saved!");
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast.error("Failed to save preferences. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleReminderDay = (day: number) => {
    setReminderDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day].sort((a, b) => b - a)
    );
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-sans">
          <Settings className="h-5 w-5" />
          Notification Preferences
        </CardTitle>
        <CardDescription className="font-sans">
          Control email and alert settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Notification Settings */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <Label className="font-sans">Notifications</Label>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="email-notifications" className="font-sans">
                  Email Notifications
                </Label>
                <p className="text-sm text-muted-foreground font-sans">
                  Receive email alerts for upcoming renewals
                </p>
              </div>
              <Switch 
                id="email-notifications" 
                checked={emailEnabled}
                onCheckedChange={setEmailEnabled}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="push-notifications" className="font-sans">
                  Push Notifications
                </Label>
                <p className="text-sm text-muted-foreground font-sans">
                  Get browser notifications for important updates
                </p>
              </div>
              <Switch 
                id="push-notifications" 
                checked={pushEnabled}
                onCheckedChange={setPushEnabled}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="renewal-reminders" className="font-sans">
                  Renewal Reminders
                </Label>
                <p className="text-sm text-muted-foreground font-sans">
                  Get notified before subscriptions renew
                </p>
              </div>
              <Switch 
                id="renewal-reminders" 
                checked={renewalReminders}
                onCheckedChange={setRenewalReminders}
              />
            </div>

            {/* Reminder Days Selection */}
            {renewalReminders && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label className="font-sans">Reminder Schedule</Label>
                  {!canCustomizeReminders && <Crown className="h-4 w-4 text-primary" />}
                </div>
                <p className="text-sm text-muted-foreground font-sans">
                  {canCustomizeReminders
                    ? "Select your preferred reminder schedule"
                    : "Basic reminders are sent 3 days before renewal"}
                </p>
                <div className="flex flex-wrap gap-2">
                  {canCustomizeReminders ? (
                    // Plus & Automate: Full customization
                    [30, 14, 7, 3, 1].map((day) => (
                      <Badge
                        key={day}
                        variant={reminderDays.includes(day) ? "default" : "secondary"}
                        className="cursor-pointer font-sans transition-colors hover:bg-primary/20"
                        onClick={() => toggleReminderDay(day)}
                      >
                        {day} day{day !== 1 ? 's' : ''} before
                      </Badge>
                    ))
                  ) : (
                    // Free: Fixed 3-day reminder with upgrade hint
                    <div className="space-y-2 w-full">
                      <Badge variant="outline" className="font-sans">
                        3 days before
                      </Badge>
                      <div className="text-xs text-muted-foreground font-sans">
                        Want custom timing?{" "}
                        <Link href="/dashboard/upgrade" className="text-primary underline-offset-2 hover:underline">
                          Upgrade to Plus
                        </Link>{" "}
                        for flexible reminder schedules.
                      </div>
                    </div>
                  )}
                </div>
                {canCustomizeReminders && (
                  <div className="mt-2 p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Sparkles className="h-4 w-4 text-primary mt-0.5" />
                      <div className="text-xs text-muted-foreground font-sans">
                        <strong>Enhanced emails</strong> with spending insights, subscription context, 
                        and direct action buttons to manage your subscriptions.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Advanced Alerts */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="spending-alerts" className="font-sans">
                      Spending Alerts
                    </Label>
                    {!canUseSmartAlerts && <Lock className="h-4 w-4 text-primary" />}
                  </div>
                  <p className="text-sm text-muted-foreground font-sans">
                    {canUseSmartAlerts
                      ? "Monitor your spending with Gmail-powered smart alerts"
                      : "Connect Gmail with Automate to monitor spending automatically"}
                  </p>
                  {!canUseSmartAlerts && (
                    <p className="text-xs text-muted-foreground font-sans">
                      Available with Automate (includes Gmail detection & duplicate protection)
                    </p>
                  )}
                </div>
                <Switch 
                  id="spending-alerts" 
                  checked={canUseSmartAlerts && spendingAlerts}
                  onCheckedChange={(checked) => {
                    if (canUseSmartAlerts) {
                      setSpendingAlerts(checked);
                    }
                  }}
                  disabled={!canUseSmartAlerts}
                />
              </div>

              {/* Spending Threshold moved to Budget page */}

              {!canUseSmartAlerts && (
                <div className="p-3 bg-primary/10 rounded-lg border border-primary/20 space-y-2">
                  <p className="text-sm text-primary font-sans">
                    Upgrade to Automate to unlock Gmail-powered alerts, duplicate protection, and automatic detection.
                  </p>
                  <Link href="/dashboard/upgrade">
                    <Button variant="outline" size="sm" className="font-sans">
                      Upgrade to Automate
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button 
            onClick={handleSavePreferences}
            disabled={isSaving}
            className="font-sans"
          >
            {isSaving ? "Saving..." : "Save Preferences"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
