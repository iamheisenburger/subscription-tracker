"use client";

import { UserButton } from "@clerk/nextjs";
import { Bell, Plus, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { MobileNav } from "./mobile-nav";
import { AddSubscriptionDialog } from "./add-subscription-dialog";

interface DashboardHeaderProps {
  firstName: string | null;
}

export function DashboardHeader({ firstName }: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        {/* Mobile Menu */}
        <div className="mr-4 md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <MobileNav />
            </SheetContent>
          </Sheet>
        </div>

        {/* Logo/Brand */}
        <div className="flex items-center space-x-2">
          <div className="hidden md:flex">
            <h1 className="text-xl font-bold">SubTracker</h1>
          </div>
        </div>

        {/* Desktop Welcome Message */}
        <div className="hidden md:flex flex-1 items-center justify-center px-6">
          <div className="text-center">
            <h2 className="text-lg font-semibold">
              Welcome back, {firstName || "there"}!
            </h2>
            <p className="text-sm text-muted-foreground">
              Manage your subscriptions and track your spending
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          <AddSubscriptionDialog 
            trigger={
              <Button size="sm" className="hidden sm:flex">
                <Plus className="mr-2 h-4 w-4" />
                Add Subscription
              </Button>
            }
          />
          
          <AddSubscriptionDialog 
            trigger={
              <Button size="sm" className="sm:hidden" aria-label="Add Subscription">
                <Plus className="h-4 w-4" />
              </Button>
            }
          />
          
          <Button variant="ghost" size="icon">
            <Bell className="h-4 w-4" />
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
    </header>
  );
}
