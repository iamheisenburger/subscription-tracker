"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings, Bell, Globe, Palette } from "lucide-react";
import { ThemeToggle } from "@/components/landing/theme-toggle";

interface PreferencesSettingsProps {
  userId: string;
}

export function PreferencesSettings({ userId }: PreferencesSettingsProps) {
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
              <Switch id="email-notifications" defaultChecked />
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
              <Switch id="push-notifications" defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="reminder-timing" className="font-sans">
                  Reminder Timing
                </Label>
                <p className="text-sm text-muted-foreground font-sans">
                  When to send renewal reminders
                </p>
              </div>
              <Select defaultValue="3-days">
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-day" className="font-sans">1 day</SelectItem>
                  <SelectItem value="3-days" className="font-sans">3 days</SelectItem>
                  <SelectItem value="1-week" className="font-sans">1 week</SelectItem>
                  <SelectItem value="2-weeks" className="font-sans">2 weeks</SelectItem>
                </SelectContent>
              </Select>
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
              <Select defaultValue="USD">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD" className="font-sans">USD ($)</SelectItem>
                  <SelectItem value="EUR" className="font-sans">EUR (€)</SelectItem>
                  <SelectItem value="GBP" className="font-sans">GBP (£)</SelectItem>
                  <SelectItem value="CAD" className="font-sans">CAD ($)</SelectItem>
                  <SelectItem value="AUD" className="font-sans">AUD ($)</SelectItem>
                </SelectContent>
              </Select>
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
          <Button className="font-sans">Save Preferences</Button>
        </div>
      </CardContent>
    </Card>
  );
}
