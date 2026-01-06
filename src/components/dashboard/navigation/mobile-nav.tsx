"use client";

import {
  Home,
  CreditCard,
  BarChart3,
  Settings,
  DollarSign,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUserTier } from "@/hooks/use-user-tier";

type NavItem = {
  name: string;
  href: string;
  icon: LucideIcon;
};

const NAV_ITEMS: Record<string, NavItem> = {
  overview: { name: "Overview", href: "/dashboard", icon: Home },
  subscriptions: { name: "Subscriptions", href: "/dashboard/subscriptions", icon: CreditCard },
  insights: { name: "Insights", href: "/dashboard/insights", icon: Sparkles },
  analytics: { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  budget: { name: "Budget", href: "/dashboard/budget", icon: DollarSign },
  settings: { name: "Settings", href: "/dashboard/settings", icon: Settings },
};

const NAV_ORDER = {
  automate_1: ["overview", "subscriptions", "insights", "analytics", "budget", "settings"],
  plus: ["overview", "subscriptions", "analytics", "budget", "settings"],
  premium_user: ["overview", "subscriptions", "analytics", "budget", "settings"],
  default: ["overview", "subscriptions", "analytics", "budget", "settings"],
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
  const { tier } = useUserTier();
  const navItems = useNavItems(tier);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-t border-border/50 pb-safe">
      <div className="flex items-center gap-1 px-3 py-3 overflow-x-auto sm:overflow-x-visible sm:justify-around [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {navItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link key={item.name} href={item.href} className="flex-1 min-w-[70px]">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-14 w-full flex flex-col gap-1.5 text-[10px] font-bold font-sans transition-all duration-300 rounded-xl",
                  isActive ? "text-primary bg-primary/10 shadow-sm" : "text-muted-foreground hover:bg-muted/40"
                )}
              >
                <item.icon className={cn("h-5 w-5 transition-transform duration-300", isActive && "scale-110")} />
                {item.name}
              </Button>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
