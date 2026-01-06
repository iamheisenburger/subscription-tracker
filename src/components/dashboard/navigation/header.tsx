"use client";

import { UserButton } from "@clerk/nextjs";
import { ThemeToggle } from "@/components/landing/theme-toggle";
import { NotificationCenter } from "../notification-center";
import { DetectionBadge } from "../detection/detection-badge";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddSubscriptionDialog } from "../add-subscription-dialog";

export function DashboardHeader() {
  return (
    <header className="h-20 border-b border-border/50 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-full items-center justify-between px-6">
        {/* Logo/Brand space on mobile */}
        <div className="lg:hidden">
          <h1 className="text-xl font-black font-sans tracking-tighter text-primary">SubWise</h1>
        </div>

        {/* Desktop Title Placeholder */}
        <div className="hidden lg:block">
          <p className="text-sm font-medium text-muted-foreground font-sans">Dashboard</p>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Add Button - Native Mobile feel */}
          <AddSubscriptionDialog>
            <Button size="icon" className="h-10 w-10 rounded-full shadow-lg transition-transform active:scale-95 bg-primary text-primary-foreground">
              <Plus className="h-6 w-6" />
            </Button>
          </AddSubscriptionDialog>

          <div className="h-6 w-[1px] bg-border mx-1" />

          {/* Detection Badge */}
          <DetectionBadge />

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Notifications */}
          <NotificationCenter />

          {/* User Menu */}
          <UserButton 
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: "w-8 h-8"
              }
            }}
          >
            <UserButton.UserProfilePage 
              label="Billing" 
              labelIcon={<span>💳</span>}
              url="billing"
            >
              <div className="p-4">
                <h3 className="text-lg font-semibold mb-4">Billing & Subscription</h3>
                <p>Manage your subscription, payment methods, and billing history.</p>
              </div>
            </UserButton.UserProfilePage>
          </UserButton>
        </div>
      </div>
    </header>
  );
}
