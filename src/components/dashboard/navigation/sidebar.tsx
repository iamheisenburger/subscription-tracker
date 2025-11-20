"use client";

import { Home, CreditCard, BarChart3, Settings, Crown, Plus, DollarSign, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { AddSubscriptionDialog } from "@/components/dashboard/add-subscription-dialog";
import { useUserTier } from "@/hooks/use-user-tier";

const navigation = [
  { name: "Overview", href: "/dashboard", icon: Home },
  { name: "Insights", href: "/dashboard/insights", icon: Sparkles, automate: true },
  { name: "Subscriptions", href: "/dashboard/subscriptions", icon: CreditCard },
  { name: "Budget", href: "/dashboard/budget", icon: DollarSign, premium: true },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3, premium: true },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const { tier, isLoading, isPaid, subscriptionType } = useUserTier();
  const isAutomate = tier === "automate_1";
  const subscriptionInterval = subscriptionType === "annual" ? "annual" : "monthly";
  const shouldShowAnnualSavings = !isLoading && isPaid && subscriptionInterval !== "annual";
  const shouldShowUpgrade = !isLoading && !isPaid;

  return (
    <div className="flex h-screen w-64 flex-col bg-card border-r border-border/50">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b border-border/50">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
            <CreditCard className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold font-sans tracking-tight">SubWise</span>
        </Link>
      </div>

      {/* Quick Add */}
      <div className="p-4">
        <AddSubscriptionDialog>
          <Button className="w-full font-sans" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Subscription
          </Button>
        </AddSubscriptionDialog>
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 space-y-2 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;

          // Hide Insights if not Automate user
          if (item.automate && !isAutomate) {
            return null;
          }

          // SHOW ALL FEATURES - don't hide premium features, tease them instead
          return (
            <Link key={item.name} href={item.href}>
              <Button
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 font-sans h-11 px-4 rounded-lg transition-all duration-200",
                  item.premium && "relative",
                  isActive && "shadow-sm",
                  !isActive && "hover:bg-muted/60"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.name}</span>
                {item.premium && (
                  <Crown className="ml-auto h-4 w-4 text-primary" />
                )}
              </Button>
            </Link>
          );
        })}
      </nav>

      <Separator />

      {/* Upgrade CTA (smart) */}
      <div className="p-4">
        {shouldShowAnnualSavings ? (
          <div className="rounded-lg bg-gradient-to-br from-primary/5 to-accent/5 dark:from-primary/10 dark:to-accent/10 border border-primary/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground font-sans">
                Save with Annual Billing
              </span>
            </div>
            <p className="text-xs text-muted-foreground font-sans mb-3">
              {isAutomate
                ? "Switch to annual and save $30/year (billed $78/year)"
                : "Switch to annual and save $18/year (billed $42/year)"}
            </p>
            <Link href="/dashboard/upgrade">
              <Button size="sm" className="w-full font-sans">
                {isAutomate ? "Switch Automate to Annual" : "Switch Plus to Annual"}
              </Button>
            </Link>
          </div>
        ) : (
          shouldShowUpgrade && (
            <div className="rounded-lg bg-gradient-to-br from-primary/5 to-accent/5 dark:from-primary/10 dark:to-accent/10 border border-primary/20 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-foreground font-sans">
                  Upgrade your plan
                </span>
              </div>
              <p className="text-xs text-muted-foreground font-sans mb-3">
                Unlock Plus analytics or Automate detection whenever you need them.
              </p>
              <Link href="/dashboard/upgrade">
                <Button size="sm" className="w-full font-sans">
                  View Plans
                </Button>
              </Link>
            </div>
          )
        )}
      </div>
    </div>
  );
}
