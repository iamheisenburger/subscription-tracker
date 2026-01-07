"use client";

import {
  Home,
  BarChart3,
  Settings,
  Crown,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUserTier } from "@/hooks/use-user-tier";
import { AddSubscriptionDialog } from "../add-subscription-dialog";

/**
 * Mobile Bottom Navigation - Matching mobile app style
 * 5 items: Home, Analytics, Add (+), Settings, Plus/Upgrade
 */
export function MobileNav() {
  const pathname = usePathname();
  const { isPremium } = useUserTier();

  const isHome = pathname === "/dashboard";
  const isAnalytics = pathname === "/dashboard/analytics";
  const isSettings = pathname === "/dashboard/settings";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border pb-safe md:hidden">
      <div className="flex items-center justify-around px-2 py-2">
        {/* Home */}
        <Link href="/dashboard" className="flex-1">
          <div className="flex flex-col items-center gap-1 py-1">
            <Home
              className={cn(
                "h-6 w-6 transition-colors",
                isHome ? "text-[#1F2937] dark:text-white" : "text-muted-foreground"
              )}
              strokeWidth={isHome ? 2.5 : 2}
            />
            <span
              className={cn(
                "text-[10px] font-medium",
                isHome ? "text-[#1F2937] dark:text-white font-bold" : "text-muted-foreground"
              )}
            >
              Home
            </span>
          </div>
        </Link>

        {/* Analytics */}
        <Link href="/dashboard/analytics" className="flex-1">
          <div className="flex flex-col items-center gap-1 py-1">
            <BarChart3
              className={cn(
                "h-6 w-6 transition-colors",
                isAnalytics ? "text-[#1F2937] dark:text-white" : "text-muted-foreground"
              )}
              strokeWidth={isAnalytics ? 2.5 : 2}
            />
            <span
              className={cn(
                "text-[10px] font-medium",
                isAnalytics ? "text-[#1F2937] dark:text-white font-bold" : "text-muted-foreground"
              )}
            >
              Analytics
            </span>
          </div>
        </Link>

        {/* Center FAB - Add Button */}
        <div className="flex-1 flex justify-center">
          <AddSubscriptionDialog>
            <button className="w-14 h-14 -mt-6 bg-[#1F2937] dark:bg-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl active:scale-95 transition-all">
              <Plus className="w-7 h-7 text-white dark:text-[#1F2937] stroke-[3px]" />
            </button>
          </AddSubscriptionDialog>
        </div>

        {/* Settings */}
        <Link href="/dashboard/settings" className="flex-1">
          <div className="flex flex-col items-center gap-1 py-1">
            <Settings
              className={cn(
                "h-6 w-6 transition-colors",
                isSettings ? "text-[#1F2937] dark:text-white" : "text-muted-foreground"
              )}
              strokeWidth={isSettings ? 2.5 : 2}
            />
            <span
              className={cn(
                "text-[10px] font-medium",
                isSettings ? "text-[#1F2937] dark:text-white font-bold" : "text-muted-foreground"
              )}
            >
              Settings
            </span>
          </div>
        </Link>

        {/* Plus/Upgrade */}
        <Link href={isPremium ? "/dashboard/settings" : "/pricing"} className="flex-1">
          <div className="flex flex-col items-center gap-1 py-1 relative">
            {!isPremium && (
              <div className="absolute -top-0.5 right-1/3 w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            )}
            <Crown
              className={cn(
                "h-6 w-6 transition-colors",
                isPremium ? "text-amber-500" : "text-muted-foreground"
              )}
              strokeWidth={2}
              fill={isPremium ? "#F59E0B" : "none"}
            />
            <span
              className={cn(
                "text-[10px] font-medium",
                isPremium ? "text-amber-500 font-bold" : "text-muted-foreground"
              )}
            >
              {isPremium ? "Plus" : "Upgrade"}
            </span>
          </div>
        </Link>
      </div>
    </nav>
  );
}
