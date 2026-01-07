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

export function DashboardSidebar() {
  const pathname = usePathname();
  const { tier } = useUserTier();
  const navItems = useNavItems(tier);

  return (
    <div className="w-64 bg-card border-r border-border flex flex-col h-screen">
      {/* Logo */}
      <div className="p-4 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center">
            <Plus className="w-5 h-5 text-primary-foreground stroke-[2.5px]" />
          </div>
          <span className="text-xl font-bold tracking-tight">SubWise</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 font-medium rounded-xl h-11",
                  isActive 
                    ? "bg-primary/10 text-primary hover:bg-primary/15" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="text-xs text-muted-foreground text-center">
          © 2025 SubWise
        </div>
      </div>
    </div>
  );
}
