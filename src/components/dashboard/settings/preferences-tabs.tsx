"use client";

import { PreferencesSettings } from "./preferences-settings";
import { EmailConnectionSettings } from "./email-connection-settings";
import { CurrencyLocaleSettings } from "./currency-locale-settings";

// Despite the name, this is now a single clean column of preference cards:
// Notifications, Email connection, and Currency/Theme.
export function PreferencesTabs() {
  return (
    <div className="space-y-6">
      <PreferencesSettings />
      <EmailConnectionSettings />
      <CurrencyLocaleSettings />
    </div>
  );
}



