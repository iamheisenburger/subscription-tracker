"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  CreditCard, 
  BarChart3, 
  Bell, 
  Settings,
  Crown
} from "lucide-react";
import { useTierAccess } from "./tier-gate";
import { Badge } from "@/components/ui/badge";

const navigation = [
  {
    name: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    name: "Subscriptions", 
    href: "/dashboard/subscriptions",
    icon: CreditCard,
  },
  {
    name: "Analytics",
    href: "/dashboard/analytics", 
    icon: BarChart3,
    premium: true,
  },
  {
    name: "Notifications",
    href: "/dashboard/notifications",
    icon: Bell,
  },
  {
    name: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export function BottomNav() {
  const pathname = usePathname();
  const { isPremium } = useTierAccess();

  return (
    <>
      {/* Spacer for fixed bottom nav */}
      <div className="h-16 md:hidden" />
      
      {/* Bottom Navigation - Mobile Only */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white/90 backdrop-blur-sm md:hidden">
        <div className="grid h-16 grid-cols-5">
          {navigation.map((item) => {
            const isActive = item.exact 
              ? pathname === item.href
              : pathname.startsWith(item.href);
            
            const isPremiumFeature = item.premium && !isPremium;
            
            return (
              <Link
                key={item.name}
                href={isPremiumFeature ? "/pricing" : item.href}
                className={cn(
                  "flex flex-col items-center justify-center space-y-1 px-2 py-2 text-xs font-medium transition-colors",
                  isActive 
                    ? "text-blue-600" 
                    : isPremiumFeature
                    ? "text-gray-400"
                    : "text-gray-500 hover:text-gray-900"
                )}
              >
                <div className="relative">
                  <item.icon 
                    className={cn(
                      "h-5 w-5",
                      isPremiumFeature && "opacity-50"
                    )} 
                  />
                  {item.premium && !isPremium && (
                    <div className="absolute -right-1 -top-1">
                      <Crown className="h-3 w-3 text-yellow-500" />
                    </div>
                  )}
                </div>
                <span className={cn(
                  "text-[10px]",
                  isPremiumFeature && "opacity-50"
                )}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

// Desktop Sidebar Navigation
export function SidebarNav() {
  const pathname = usePathname();  
  const { isPremium } = useTierAccess();

  return (
    <div className="hidden md:flex md:w-64 md:flex-col">
      <div className="flex flex-col flex-grow pt-5 bg-white border-r border-gray-200 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">SW</span>
            </div>
            <span className="text-xl font-bold text-gray-900">SubWise</span>
          </div>
        </div>
        
        <div className="mt-8 flex-grow flex flex-col">
          <nav className="flex-1 px-2 pb-4 space-y-1">
            {navigation.map((item) => {
              const isActive = item.exact 
                ? pathname === item.href
                : pathname.startsWith(item.href);
              
              const isPremiumFeature = item.premium && !isPremium;
              
              return (
                <Link
                  key={item.name}
                  href={isPremiumFeature ? "/pricing" : item.href}
                  className={cn(
                    "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors",
                    isActive
                      ? "bg-blue-100 text-blue-700"
                      : isPremiumFeature
                      ? "text-gray-400 hover:bg-gray-50"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <item.icon 
                    className={cn(
                      "mr-3 h-5 w-5 flex-shrink-0",
                      isActive ? "text-blue-500" : isPremiumFeature ? "text-gray-400" : "text-gray-400 group-hover:text-gray-500",
                      isPremiumFeature && "opacity-50"
                    )}
                  />
                  <div className="flex items-center justify-between flex-1">
                    <span className={isPremiumFeature ? "opacity-50" : ""}>
                      {item.name}
                    </span>
                    {item.premium && !isPremium && (
                      <Badge variant="secondary" className="ml-2 bg-yellow-100 text-yellow-800">
                        <Crown className="h-3 w-3 mr-1" />
                        Pro
                      </Badge>
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}
