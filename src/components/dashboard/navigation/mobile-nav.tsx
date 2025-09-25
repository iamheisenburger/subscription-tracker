"use client";

import { Home, CreditCard, BarChart3, Settings, Plus, DollarSign } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AddSubscriptionDialog } from "@/components/dashboard/add-subscription-dialog";
// import { useUserTier } from "@/hooks/use-user-tier";

const navigation = [
  { name: "Overview", href: "/dashboard", icon: Home },
  { name: "Subscriptions", href: "/dashboard/subscriptions", icon: CreditCard },
  { name: "Budget", href: "/dashboard/budget", icon: DollarSign, premium: true },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3, premium: true },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();
  // Remove unused tier detection since we're showing all features now
  // const { isLoading, isPremium } = useUserTier();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t">
      <div className="flex items-center justify-around px-2 py-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          
          // SHOW ALL FEATURES - don't hide premium features, tease them instead
          return (
            <Link key={item.name} href={item.href} className="flex-1">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-12 w-full flex-col gap-1 text-xs font-sans",
                  isActive && "text-primary bg-primary/10"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Button>
            </Link>
          );
        })}
        
        {/* FAB Add Button */}
        <div className="flex-1 flex justify-center">
          <AddSubscriptionDialog>
            <Button
              size="sm"
              className="h-12 w-12 rounded-full shadow-lg"
              aria-label="Add Subscription"
            >
              <Plus className="h-5 w-5" />
            </Button>
          </AddSubscriptionDialog>
        </div>
      </div>
    </div>
  );
}
