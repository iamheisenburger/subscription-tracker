"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings, Bell, Globe, Palette, Crown, Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/landing/theme-toggle";
import { CurrencySelector } from "./currency-selector";
import { toast } from "sonner";
import { useUserTier } from "@/hooks/use-user-tier";

interface PreferencesSettingsProps {
  userId: string;
}

export function PreferencesSettings({ }: PreferencesSettingsProps) {
  const { user } = useUser();
  const { isPremium } = useUserTier();
  const preferences = useQuery(api.notifications.getNotificationPreferences, 
    user?.id ? { clerkId: user.id } : "skip"
  );
  const updatePreferences = useMutation(api.notifications.updateNotificationPreferences);

  // Local state for form
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [renewalReminders, setRenewalReminders] = useState(true);
  const [priceChangeAlerts, setPriceChangeAlerts] = useState(false);
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
      setPriceChangeAlerts(preferences.priceChangeAlerts);
      setSpendingAlerts(preferences.spendingAlerts);
      setSpendingThreshold(preferences.spendingThreshold?.toString() || "");
      setReminderDays(preferences.reminderDays);
    }
  }, [preferences]);

  const handleSavePreferences = async () => {
    if (!user?.id) return;

    setIsSaving(true);
    try {
      await updatePreferences({
        clerkId: user.id,
        emailEnabled,
        pushEnabled,
        renewalReminders,
        priceChangeAlerts: isPremium ? priceChangeAlerts : false,
        spendingAlerts: isPremium ? spendingAlerts : false,
        spendingThreshold: spendingThreshold ? parseFloat(spendingThreshold) : undefined,
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
          Preferences
        </CardTitle>
        <CardDescription className="font-sans">
          Customize your SubWise experience
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Theme Settings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                <Label className="font-sans">Theme</Label>
              </div>
              <p className="text-sm text-muted-foreground font-sans">
                Choose your preferred theme
              </p>
            </div>
            <ThemeToggle />
          </div>
        </div>

        <Separator />

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
                  {!isPremium && <Crown className="h-4 w-4 text-primary" />}
                </div>
                <p className="text-sm text-muted-foreground font-sans">
                  {isPremium 
                    ? "Select your preferred reminder schedule"
                    : "Basic reminders are sent 3 days before renewal"
                  }
                </p>
                <div className="flex flex-wrap gap-2">
                  {isPremium ? (
                    // Premium: Full customization
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
                        Want custom timing? <span className="text-primary">Upgrade to Premium</span> for 1, 3, 7, 14, or 30-day reminders.
                      </div>
                    </div>
                  )}
                </div>
                {isPremium && (
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
                    <Label htmlFor="price-change-alerts" className="font-sans">
                      Price Change Alerts
                    </Label>
                    {!isPremium && <Crown className="h-4 w-4 text-primary" />}
                  </div>
                  <p className="text-sm text-muted-foreground font-sans">
                    {isPremium 
                      ? "Instant notifications when subscription prices change"
                      : "Get notified when prices change"
                    }
                  </p>
                  {!isPremium && (
                    <p className="text-xs text-muted-foreground font-sans">
                      Available with Premium plan
                    </p>
                  )}
                </div>
                <Switch 
                  id="price-change-alerts" 
                  checked={isPremium && priceChangeAlerts}
                  onCheckedChange={setPriceChangeAlerts}
                  disabled={!isPremium}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="spending-alerts" className="font-sans">
                      Spending Alerts
                    </Label>
                    {!isPremium && <Crown className="h-4 w-4 text-primary" />}
                  </div>
                  <p className="text-sm text-muted-foreground font-sans">
                    {isPremium 
                      ? "Monitor your spending with smart threshold alerts"
                      : "Get alerts when exceeding budget thresholds"
                    }
                  </p>
                  {!isPremium && (
                    <p className="text-xs text-muted-foreground font-sans">
                      Available with Premium plan
                    </p>
                  )}
                </div>
                <Switch 
                  id="spending-alerts" 
                  checked={isPremium && spendingAlerts}
                  onCheckedChange={setSpendingAlerts}
                  disabled={!isPremium}
                />
              </div>

              {/* Spending Threshold */}
              {isPremium && spendingAlerts && (
                <div className="space-y-2">
                  <Label htmlFor="spending-threshold" className="font-sans">
                    Monthly Spending Threshold
                  </Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground font-sans">$</span>
                    <Input
                      id="spending-threshold"
                      type="number"
                      placeholder="500"
                      value={spendingThreshold}
                      onChange={(e) => setSpendingThreshold(e.target.value)}
                      className="w-32 font-sans"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground font-sans">
                    You&apos;ll be notified if your monthly spending exceeds this amount
                  </p>
                </div>
              )}

              {!isPremium && (
                <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                  <p className="text-sm text-primary font-sans">
                    Upgrade to Premium to unlock advanced notification features like price change alerts and spending thresholds.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* Regional Settings */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            <Label className="font-sans">Regional Settings</Label>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="currency" className="font-sans">Default Currency</Label>
              <CurrencySelector />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="date-format" className="font-sans">Date Format</Label>
              <Select defaultValue="MM/dd/yyyy">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MM/dd/yyyy" className="font-sans">MM/DD/YYYY</SelectItem>
                  <SelectItem value="dd/MM/yyyy" className="font-sans">DD/MM/YYYY</SelectItem>
                  <SelectItem value="yyyy-MM-dd" className="font-sans">YYYY-MM-DD</SelectItem>
                </SelectContent>
              </Select>
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
