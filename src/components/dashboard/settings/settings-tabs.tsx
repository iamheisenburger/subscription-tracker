"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Settings, CreditCard, AlertTriangle } from "lucide-react";
import { AccountSettings } from "./account-settings";
import { PreferencesSettings } from "./preferences-settings";
import { BillingSettings } from "./billing-settings";
import { DangerZone } from "./danger-zone";
import { ErrorBoundary } from "@/components/error-boundary";

interface SettingsTabsProps {
  user: {
    id?: string;
    firstName?: string | null;
    lastName?: string | null;
    imageUrl?: string;
    emailAddresses?: Array<{ emailAddress: string }>;
    createdAt?: string | number;
  } | null;
  userId: string;
}

export function SettingsTabs({ user, userId }: SettingsTabsProps) {
  const [activeTab, setActiveTab] = useState("account");

  const tabs = [
    {
      id: "account",
      label: "Account",
      icon: User,
      component: <AccountSettings user={user} />
    },
    {
      id: "preferences",
      label: "Preferences", 
      icon: Settings,
      component: <PreferencesSettings />
    },
    {
      id: "billing",
      label: "Billing",
      icon: CreditCard,
      component: <BillingSettings userId={userId} />
    },
    {
      id: "danger",
      label: "Danger Zone",
      icon: AlertTriangle,
      component: <DangerZone userId={userId} />
    }
  ];

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <TabsTrigger 
              key={tab.id} 
              value={tab.id}
              className="flex items-center gap-2 font-sans"
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          );
        })}
      </TabsList>

      {tabs.map((tab) => (
        <TabsContent key={tab.id} value={tab.id} className="mt-6">
          <ErrorBoundary
            fallback={({ resetError }) => (
              <div className="p-6 border border-destructive/20 rounded-lg bg-destructive/5">
                <h3 className="font-semibold text-destructive mb-2">
                  Error Loading {tab.label}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  There was an issue loading this settings section. Please refresh the page and try again.
                </p>
                <button 
                  onClick={resetError}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm"
                >
                  Try Again
                </button>
              </div>
            )}
          >
            {tab.component}
          </ErrorBoundary>
        </TabsContent>
      ))}
    </Tabs>
  );
}
