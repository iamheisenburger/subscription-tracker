"use client";

import { Home, CreditCard, BarChart3, Settings, Crown, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { AddSubscriptionDialog } from "./add-subscription-dialog";
import { useTierAccess } from "./tier-gate";

const navigation = [
  { name: "Overview", href: "/dashboard", icon: Home },
  { name: "Subscriptions", href: "/dashboard/subscriptions", icon: CreditCard },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3, premium: true },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const { isPremium } = useTierAccess();

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <CreditCard className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold">SubWise</span>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-4 py-4">
        <div className="mb-4">
          <AddSubscriptionDialog
            trigger={
              <Button className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Add Subscription
              </Button>
            }
          />
        </div>

        <SidebarSeparator />

        <SidebarMenu>
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const isDisabled = item.premium && !isPremium;
            
            return (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  className={isDisabled ? "opacity-50" : ""}
                >
                  <Link href={isDisabled ? "#" : item.href}>
                    <item.icon className="h-4 w-4" />
                    <span>{item.name}</span>
                    {item.premium && (
                      <Crown className="ml-auto h-3 w-3 text-yellow-500" />
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20 p-4">
          <div className="flex items-center space-x-2">
            <Crown className="h-5 w-5 text-yellow-600" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                {isPremium ? "Premium Active" : "Upgrade to Premium"}
              </h3>
              <p className="text-xs text-yellow-600 dark:text-yellow-300">
                {isPremium ? "All features unlocked" : "Unlimited subscriptions & more"}
              </p>
            </div>
          </div>
          {!isPremium && (
            <Link href="/pricing">
              <Button
                size="sm"
                className="mt-3 w-full bg-yellow-600 hover:bg-yellow-700"
              >
                Upgrade Now
              </Button>
            </Link>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
