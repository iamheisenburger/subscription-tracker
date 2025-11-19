"use client";

import { EmailConnectionSettings } from "./email-connection-settings";
import { FeaturesSection } from "./features-section";

export function AutomationSettings() {
  return (
    <div className="space-y-6">
      <EmailConnectionSettings />
      <FeaturesSection />
    </div>
  );
}

