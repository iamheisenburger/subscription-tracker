"use client";

import { Home, CreditCard, BarChart3, Settings, Crown, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Overview", href: "/dashboard", icon: Home },
  { name: "Subscriptions", href: "/dashboard/subscriptions", icon: CreditCard },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3, premium: true },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-64 flex-col bg-card border-r">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <CreditCard className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold font-sans">SubWise</span>
        </Link>
      </div>

      {/* Quick Add */}
      <div className="p-4">
        <Button className="w-full font-sans" size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Subscription
        </Button>
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          
          return (
            <Link key={item.name} href={item.href}>
              <Button
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 font-sans",
                  item.premium && "relative"
                )}
                size="sm"
              >
                <item.icon className="h-4 w-4" />
                {item.name}
                {item.premium && (
                  <Crown className="ml-auto h-3 w-3 text-yellow-500" />
                )}
              </Button>
            </Link>
          );
        })}
      </nav>

      <Separator />

      {/* Upgrade CTA */}
      <div className="p-4">
        <div className="rounded-lg bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Crown className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            <span className="text-sm font-semibold text-yellow-900 dark:text-yellow-100 font-sans">
              Upgrade to Premium
            </span>
          </div>
          <p className="text-xs text-yellow-700 dark:text-yellow-300 font-sans mb-3">
            Unlimited subscriptions & advanced analytics
          </p>
          <Link href="/pricing">
            <Button size="sm" className="w-full bg-yellow-600 hover:bg-yellow-700 font-sans">
              Start Free Trial
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
