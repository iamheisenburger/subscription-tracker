"use client";

import { UserButton } from "@clerk/nextjs";
import { ThemeToggle } from "@/components/landing/theme-toggle";
import { NotificationCenter } from "../notification-center";

export function DashboardHeader() {
  return (
    <header className="h-16 border-b border-border/50 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-full items-center justify-between px-6">
        {/* Logo/Brand space on mobile (removed redundant hamburger) */}
        <div className="lg:hidden">
          <h1 className="text-lg font-bold font-sans">SubWise</h1>
        </div>

        {/* Spacer */}
        <div className="flex-1 max-w-md mx-6">
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