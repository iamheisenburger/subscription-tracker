"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { CustomPricingDashboard } from "@/components/dashboard/custom-pricing-dashboard";

/**
 * Dashboard Upgrade Page - Custom Pricing Table
 * Shows beautiful custom pricing UI with Clerk billing integration
 */
export default function UpgradePage() {
  const router = useRouter();

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="text-center">
        <h1 className="text-3xl font-bold font-sans mb-2">
          Upgrade to Premium
        </h1>
        <p className="text-muted-foreground font-sans">
          Unlock unlimited subscriptions and advanced features
        </p>
      </div>

      {/* Custom Pricing Table */}
      <CustomPricingDashboard />

      {/* Back Button */}
      <div className="text-center">
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="font-sans"
        >
          ← Back to Dashboard
        </Button>
      </div>
    </div>
  );
}
