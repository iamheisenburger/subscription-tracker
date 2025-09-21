"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Bell, Mail, Smartphone, Crown, Settings } from "lucide-react";
import { useTierAccess } from "./tier-gate";

export function NotificationSettings() {
  const { isPremium } = useTierAccess();
  
  // Local state for demo purposes - in production, this would sync with backend
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    renewalReminders: true,
    priceChangeAlerts: isPremium,
    weeklyDigest: true,
    smartAlerts: isPremium,
    reminderTiming: '7', // days before
    digestDay: 'monday'
  });

  const updateSetting = (key: string, value: boolean | string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>
            Choose how and when you want to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Delivery Methods */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900">Delivery Methods</h3>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-gray-500" />
                <div>
                  <Label htmlFor="email-notifications" className="text-sm font-medium">
                    Email Notifications
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Receive notifications via email
                  </p>
                </div>
              </div>
              <Switch
                id="email-notifications"
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => updateSetting('emailNotifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Smartphone className="h-4 w-4 text-gray-500" />
                <div>
                  <Label htmlFor="push-notifications" className="text-sm font-medium">
                    Push Notifications
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Browser push notifications
                  </p>
                </div>
              </div>
              <Switch
                id="push-notifications"
                checked={settings.pushNotifications}
                onCheckedChange={(checked) => updateSetting('pushNotifications', checked)}
              />
            </div>
          </div>

          <Separator />

          {/* Notification Types */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900">Notification Types</h3>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="renewal-reminders" className="text-sm font-medium">
                  Renewal Reminders
                </Label>
                <p className="text-xs text-muted-foreground">
                  Get notified before subscriptions renew
                </p>
              </div>
              <Switch
                id="renewal-reminders"
                checked={settings.renewalReminders}
                onCheckedChange={(checked) => updateSetting('renewalReminders', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div>
                  <Label 
                    htmlFor="price-change-alerts" 
                    className={`text-sm font-medium ${!isPremium ? 'text-gray-400' : ''}`}
                  >
                    Price Change Alerts
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Get notified when subscription prices change
                  </p>
                </div>
                {!isPremium && (
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    <Crown className="h-3 w-3 mr-1" />
                    Premium
                  </Badge>
                )}
              </div>
              <Switch
                id="price-change-alerts"
                checked={settings.priceChangeAlerts}
                onCheckedChange={(checked) => updateSetting('priceChangeAlerts', checked)}
                disabled={!isPremium}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div>
                  <Label 
                    htmlFor="smart-alerts" 
                    className={`text-sm font-medium ${!isPremium ? 'text-gray-400' : ''}`}
                  >
                    Smart Alerts
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    AI-powered spending insights and recommendations
                  </p>
                </div>
                {!isPremium && (
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    <Crown className="h-3 w-3 mr-1" />
                    Premium
                  </Badge>
                )}
              </div>
              <Switch
                id="smart-alerts"
                checked={settings.smartAlerts}
                onCheckedChange={(checked) => updateSetting('smartAlerts', checked)}
                disabled={!isPremium}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="weekly-digest" className="text-sm font-medium">
                  Weekly Digest
                </Label>
                <p className="text-xs text-muted-foreground">
                  Weekly summary of your subscriptions and spending
                </p>
              </div>
              <Switch
                id="weekly-digest"
                checked={settings.weeklyDigest}
                onCheckedChange={(checked) => updateSetting('weeklyDigest', checked)}
              />
            </div>
          </div>

          <Separator />

          {/* Timing Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900">Timing Settings</h3>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="reminder-timing" className="text-sm font-medium">
                  Renewal Reminder Timing
                </Label>
                <p className="text-xs text-muted-foreground">
                  How many days before renewal to remind you
                </p>
              </div>
              <Select value={settings.reminderTiming} onValueChange={(value) => updateSetting('reminderTiming', value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 day</SelectItem>
                  <SelectItem value="3">3 days</SelectItem>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="14">14 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {settings.weeklyDigest && (
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="digest-day" className="text-sm font-medium">
                    Weekly Digest Day
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Which day to receive your weekly digest
                  </p>
                </div>
                <Select value={settings.digestDay} onValueChange={(value) => updateSetting('digestDay', value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monday">Monday</SelectItem>
                    <SelectItem value="tuesday">Tuesday</SelectItem>
                    <SelectItem value="wednesday">Wednesday</SelectItem>
                    <SelectItem value="thursday">Thursday</SelectItem>
                    <SelectItem value="friday">Friday</SelectItem>
                    <SelectItem value="saturday">Saturday</SelectItem>
                    <SelectItem value="sunday">Sunday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Test Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Test Notifications
          </CardTitle>
          <CardDescription>
            Send test notifications to verify your settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              size="sm"
              disabled={!settings.emailNotifications}
            >
              Test Email
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              disabled={!settings.pushNotifications}
            >
              Test Push
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Test notifications help ensure you receive important alerts
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
