"use client";

import { Home, CreditCard, BarChart3, Settings, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AddSubscriptionDialog } from "./add-subscription-dialog";
import { useTierAccess } from "./tier-gate";

const navigation = [
  { name: "Overview", href: "/dashboard", icon: Home },
  { name: "Subscriptions", href: "/dashboard/subscriptions", icon: CreditCard },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function DashboardMobileNav() {
  const pathname = usePathname();
  const { isPremium } = useTierAccess();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t">
      <div className="flex items-center justify-around px-2 py-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const isDisabled = item.name === "Analytics" && !isPremium;
          
          return (
            <Link key={item.name} href={isDisabled ? "#" : item.href} className="flex-1">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-12 w-full flex-col gap-1 text-xs font-sans",
                  isActive && "text-primary",
                  isDisabled && "opacity-50"
                )}
                disabled={isDisabled}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Button>
            </Link>
          );
        })}
        
        {/* FAB Add Button */}
        <div className="flex-1 flex justify-center">
          <AddSubscriptionDialog
            trigger={
              <Button
                size="sm"
                className="h-12 w-12 rounded-full shadow-lg"
                aria-label="Add Subscription"
              >
                <Plus className="h-5 w-5" />
              </Button>
            }
          />
        </div>
      </div>
    </div>
  );
}
