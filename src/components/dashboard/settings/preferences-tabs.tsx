"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Globe2, PlugZap } from "lucide-react";
import { PreferencesSettings } from "./preferences-settings";
import { EmailConnectionSettings } from "./email-connection-settings";
import { CurrencyLocaleSettings } from "./currency-locale-settings";

const PREFERENCES_SUBTAB_STORAGE_KEY = "settings-preferences-subtab";
const VALID_SUBTABS = ["notifications", "integrations", "currency"] as const;
type PreferencesSubtab = (typeof VALID_SUBTABS)[number];

export function PreferencesTabs() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeSubtab, setActiveSubtab] = useState<PreferencesSubtab>("notifications");

  // Initialize from URL or localStorage
  useEffect(() => {
    const subFromUrl = searchParams.get("sub");

    if (subFromUrl && (VALID_SUBTABS as readonly string[]).includes(subFromUrl)) {
      setActiveSubtab(subFromUrl as PreferencesSubtab);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(PREFERENCES_SUBTAB_STORAGE_KEY, subFromUrl);
      }
      return;
    }

    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem(PREFERENCES_SUBTAB_STORAGE_KEY);
      if (stored && (VALID_SUBTABS as readonly string[]).includes(stored)) {
        setActiveSubtab(stored as PreferencesSubtab);
        const params = new URLSearchParams(searchParams.toString());
        params.set("tab", "preferences");
        params.set("sub", stored);
        router.replace(`/dashboard/settings?${params.toString()}`);
      }
    }
  }, [searchParams, router]);

  const handleSubtabChange = (value: string) => {
    if (!(VALID_SUBTABS as readonly string[]).includes(value)) return;
    const subtab = value as PreferencesSubtab;
    setActiveSubtab(subtab);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(PREFERENCES_SUBTAB_STORAGE_KEY, subtab);
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", "preferences");
      params.set("sub", subtab);
      router.replace(`/dashboard/settings?${params.toString()}`);
    }
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeSubtab} onValueChange={handleSubtabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="notifications" className="flex items-center gap-2 font-sans">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-2 font-sans">
            <PlugZap className="h-4 w-4" />
            <span className="hidden sm:inline">Integrations</span>
          </TabsTrigger>
          <TabsTrigger value="currency" className="flex items-center gap-2 font-sans">
            <Globe2 className="h-4 w-4" />
            <span className="hidden sm:inline">Currency &amp; locale</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="mt-6 space-y-4">
          <PreferencesSettings />
        </TabsContent>

        <TabsContent value="integrations" className="mt-6 space-y-4">
          <EmailConnectionSettings />
        </TabsContent>

        <TabsContent value="currency" className="mt-6 space-y-4">
          <CurrencyLocaleSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}


