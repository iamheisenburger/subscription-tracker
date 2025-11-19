"use client";

import { AccountSettings } from "./account-settings";
import { PreferencesSettings } from "./preferences-settings";
import { CurrencyLocaleSettings } from "./currency-locale-settings";

interface GeneralSettingsProps {
  user: {
    id?: string;
    firstName?: string | null;
    lastName?: string | null;
    imageUrl?: string;
    emailAddresses?: Array<{ emailAddress: string }>;
    createdAt?: string | number;
  } | null;
}

export function GeneralSettings({ user }: GeneralSettingsProps) {
  return (
    <div className="space-y-6">
      <AccountSettings user={user} />
      <CurrencyLocaleSettings />
      <PreferencesSettings />
    </div>
  );
}

