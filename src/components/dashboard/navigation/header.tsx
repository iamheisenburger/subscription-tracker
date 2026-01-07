"use client";

import { UserButton } from "@clerk/nextjs";
import { Bell, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/landing/theme-toggle";
import { AddSubscriptionDialog } from "../add-subscription-dialog";
import Link from "next/link";

export function DashboardHeader() {
  return (
    <header className="bg-card border-b border-border sticky top-0 z-40">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Logo - Mobile */}
        <div className="lg:hidden flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center">
            <Plus className="w-5 h-5 text-primary-foreground stroke-[2.5px]" />
          </div>
          <span className="text-xl font-bold tracking-tight">SubWise</span>
        </div>

        {/* Desktop: Dashboard title */}
        <div className="hidden lg:block">
          <h1 className="text-lg font-semibold">Dashboard</h1>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {/* Add button - Desktop */}
          <AddSubscriptionDialog>
            <Button size="sm" className="hidden lg:flex items-center gap-2 rounded-xl font-semibold">
              <Plus className="w-4 h-4" />
              Add
            </Button>
          </AddSubscriptionDialog>

          <ThemeToggle />
          
          <Button variant="ghost" size="icon" className="relative rounded-xl">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full" />
          </Button>
          
          <UserButton 
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: "h-8 w-8 rounded-xl",
              },
            }}
          />
        </div>
      </div>
    </header>
  );
}
