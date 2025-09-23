"use client";

import { UserButton } from "@clerk/nextjs";
import { Search, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/landing/theme-toggle";
import { NotificationCenter } from "../notification-center";

export function DashboardHeader() {
  return (
    <header className="h-16 border-b border-border/50 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-full items-center justify-between px-6">
        {/* Mobile Menu Button */}
        <div className="lg:hidden">
          <Button variant="ghost" size="icon">
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-md mx-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search subscriptions..."
              className="pl-10 h-10 bg-muted/30 border-0 focus:bg-background focus:ring-2 focus:ring-primary/20 font-sans rounded-xl transition-all duration-200"
            />
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <ThemeToggle />
          
          {/* Notifications */}
          <NotificationCenter />

          {/* User Menu */}
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
