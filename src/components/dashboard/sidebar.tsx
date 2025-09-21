"use client";

import { Home, CreditCard, BarChart3, Settings, Crown } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const navigation = [
  { name: "Overview", href: "/dashboard", icon: Home },
  { name: "Subscriptions", href: "/dashboard/subscriptions", icon: CreditCard },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3, premium: true },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center px-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <CreditCard className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold">SubWise</span>
        </div>
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
                  "w-full justify-start gap-3",
                  item.premium && "relative"
                )}
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
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20 p-4">
          <div className="flex items-center space-x-2">
            <Crown className="h-5 w-5 text-yellow-600" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Upgrade to Premium
              </h3>
              <p className="text-xs text-yellow-600 dark:text-yellow-300">
                Unlimited subscriptions & more
              </p>
            </div>
          </div>
          <Link href="/pricing">
            <Button
              size="sm"
              className="mt-3 w-full bg-yellow-600 hover:bg-yellow-700"
            >
              Upgrade Now
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
