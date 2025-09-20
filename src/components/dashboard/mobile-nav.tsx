"use client";

import { Home, CreditCard, Settings, HelpCircle, Crown, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

export function MobileNav() {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="p-6">
        <h2 className="text-lg font-semibold">SubTracker</h2>
        <p className="text-sm text-muted-foreground">
          Manage your subscriptions
        </p>
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          <Link href="/dashboard">
            <Button
              variant="ghost"
              className="w-full justify-start"
            >
              <Home className="mr-3 h-4 w-4" />
              Dashboard
            </Button>
          </Link>
          
          <Link href="/premium">
            <Button
              variant="ghost"
              className="w-full justify-start"
            >
              <Zap className="mr-3 h-4 w-4" />
              Premium Features
            </Button>
          </Link>
          
          <Link href="/pricing">
            <Button
              variant="ghost"
              className="w-full justify-start"
            >
              <CreditCard className="mr-3 h-4 w-4" />
              Pricing
            </Button>
          </Link>
          
          <Button
            variant="ghost"
            className="w-full justify-start"
          >
            <Settings className="mr-3 h-4 w-4" />
            Settings
          </Button>
          
          <Button
            variant="ghost"
            className="w-full justify-start"
          >
            <HelpCircle className="mr-3 h-4 w-4" />
            Help & Support
          </Button>
        </div>
      </nav>

      <Separator />

      {/* Upgrade CTA */}
      <div className="p-4">
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <div className="flex items-center space-x-2">
            <Crown className="h-5 w-5 text-yellow-600" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-yellow-800">
                Upgrade to Premium
              </h3>
              <p className="text-xs text-yellow-600">
                Unlimited subscriptions & more
              </p>
            </div>
          </div>
          <Link href="/pricing">
            <Button 
              size="sm" 
              className="mt-3 w-full bg-yellow-600 hover:bg-yellow-700"
            >
              Upgrade Now
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
