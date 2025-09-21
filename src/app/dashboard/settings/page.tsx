import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Settings, User, Bell, CreditCard, Download, Trash2, Crown } from "lucide-react";
import Link from "next/link";

export default async function SettingsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Account Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account
            </CardTitle>
            <CardDescription>
              Manage your account information and security
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Profile</h3>
              <p className="text-sm text-muted-foreground">
                Update your personal information and profile settings
              </p>
              <Button variant="outline" size="sm">
                Edit Profile
              </Button>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Security</h3>
              <p className="text-sm text-muted-foreground">
                Change password and enable two-factor authentication
              </p>
              <Button variant="outline" size="sm">
                Security Settings
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Control how and when you receive notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Preferences</h3>
              <p className="text-sm text-muted-foreground">
                Customize your notification preferences and timing
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/notifications">
                  Manage Notifications
                </Link>
              </Button>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Smart Alerts</h3>
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground flex-1">
                  AI-powered insights and recommendations
                </p>
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  <Crown className="h-3 w-3 mr-1" />
                  Premium
                </Badge>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/pricing">
                  Upgrade to Premium
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Subscription Plan
            </CardTitle>
            <CardDescription>
              Manage your SubWise subscription
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Current Plan</h3>
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">
                  Free Plan - 3 subscription limit
                </p>
                <Badge variant="outline">Free</Badge>
              </div>
              <Button variant="default" size="sm" asChild>
                <Link href="/pricing">
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrade to Premium
                </Link>
              </Button>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Billing History</h3>
              <p className="text-sm text-muted-foreground">
                View your payment history and invoices
              </p>
              <Button variant="outline" size="sm" disabled>
                View Billing
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Data & Privacy */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Data & Privacy
            </CardTitle>
            <CardDescription>
              Control your data and privacy settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Export Data</h3>
              <p className="text-sm text-muted-foreground">
                Download a copy of your subscription data
              </p>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Delete Account</h3>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all data
              </p>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Premium Features CTA */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-800">
            <Crown className="h-5 w-5" />
            Unlock Premium Features
          </CardTitle>
          <CardDescription className="text-yellow-700">
            Get unlimited subscriptions, advanced analytics, smart alerts, and priority support
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-yellow-800">
                Premium Plan - $9/month or $90/year
              </p>
              <p className="text-xs text-yellow-600">
                Save $18 with annual billing
              </p>
            </div>
            <Button asChild className="bg-yellow-600 hover:bg-yellow-700">
              <Link href="/pricing">
                Upgrade Now
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
