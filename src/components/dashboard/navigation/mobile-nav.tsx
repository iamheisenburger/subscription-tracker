"use client";

import {
  Home,
  CreditCard,
  BarChart3,
  Settings,
  DollarSign,
  Sparkles,
  Plus,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUserTier } from "@/hooks/use-user-tier";
import { AddSubscriptionDialog } from "../add-subscription-dialog";

type NavItem = {
  name: string;
  href: string;
  icon: LucideIcon;
};

const NAV_ITEMS: Record<string, NavItem> = {
  overview: { name: "Home", href: "/dashboard", icon: Home },
  subscriptions: { name: "Subs", href: "/dashboard/subscriptions", icon: CreditCard },
  insights: { name: "Insights", href: "/dashboard/insights", icon: Sparkles },
  analytics: { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  budget: { name: "Budget", href: "/dashboard/budget", icon: DollarSign },
  settings: { name: "Settings", href: "/dashboard/settings", icon: Settings },
};

const NAV_ORDER = {
  automate_1: ["overview", "analytics", "settings"],
  plus: ["overview", "analytics", "settings"],
  premium_user: ["overview", "analytics", "settings"],
  default: ["overview", "analytics", "settings"],
} as const;

type NavKey = keyof typeof NAV_ITEMS;

function useNavItems(tier: string | undefined) {
  const order = NAV_ORDER[tier as keyof typeof NAV_ORDER] || NAV_ORDER.default;
  return order
    .map((key) => NAV_ITEMS[key as NavKey])
    .filter(Boolean);
}

export function MobileNav() {
  const pathname = usePathname();
  const { tier, isPremium } = useUserTier();
  const navItems = useNavItems(tier);

  // Split items for left and right of FAB
  const leftItems = navItems.slice(0, Math.ceil(navItems.length / 2));
  const rightItems = navItems.slice(Math.ceil(navItems.length / 2));

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border pb-safe">
      <div className="flex items-center justify-around px-4 py-3">
        {/* Left nav items */}
        {leftItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <div className="flex flex-col items-center gap-1 min-w-[60px]">
                <item.icon className={cn(
                  "h-6 w-6 transition-colors",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )} />
                <span className={cn(
                  "text-[10px] font-medium",
                  isActive ? "text-foreground font-bold" : "text-muted-foreground"
                )}>
                  {item.name}
                </span>
              </div>
            </Link>
          );
        })}

        {/* Center FAB */}
        <AddSubscriptionDialog>
          <button className="w-14 h-14 -mt-8 bg-primary rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform">
            <Plus className="w-8 h-8 text-primary-foreground stroke-[2.5px]" />
          </button>
        </AddSubscriptionDialog>

        {/* Right nav items */}
        {rightItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <div className="flex flex-col items-center gap-1 min-w-[60px]">
                <item.icon className={cn(
                  "h-6 w-6 transition-colors",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )} />
                <span className={cn(
                  "text-[10px] font-medium",
                  isActive ? "text-foreground font-bold" : "text-muted-foreground"
                )}>
                  {item.name}
                </span>
              </div>
            </Link>
          );
        })}

        {/* Plus/Upgrade link */}
        <Link href={isPremium ? "/dashboard/settings" : "/pricing"}>
          <div className="flex flex-col items-center gap-1 min-w-[60px] relative">
            {!isPremium && (
              <div className="absolute -top-1 right-3 w-2 h-2 bg-destructive rounded-full" />
            )}
            <span className={cn(
              "text-2xl font-bold",
              isPremium ? "text-success" : "text-muted-foreground"
            )}>+</span>
            <span className="text-[10px] font-medium text-muted-foreground">
              {isPremium ? "Plus" : "Upgrade"}
            </span>
          </div>
        </Link>
      </div>
    </div>
  );
}
