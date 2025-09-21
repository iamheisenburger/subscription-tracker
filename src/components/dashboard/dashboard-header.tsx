"use client";

import { UserButton } from "@clerk/nextjs";
import { Bell, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddSubscriptionDialog } from "./add-subscription-dialog";

interface DashboardHeaderProps {
  firstName: string | null;
}

export function DashboardHeader({ firstName }: DashboardHeaderProps) {
  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Welcome Message */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {firstName || "there"}!
          </h1>
          <p className="text-sm text-muted-foreground">
            Here&apos;s an overview of your subscription activity
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-4">
          <AddSubscriptionDialog
            trigger={
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Subscription
              </Button>
            }
          />
          
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-red-500 text-xs text-white">
              2
            </span>
          </Button>
          
          <UserButton 
            afterSignOutUrl="/sign-in"
            appearance={{
              elements: {
                avatarBox: "w-8 h-8"
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}