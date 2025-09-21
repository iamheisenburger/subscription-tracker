"use client";

import { CardDescription, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp } from "lucide-react";

export function AnalyticsHeader() {
  return (
    <div className="flex items-center justify-between">
      <div>
        <CardTitle className="font-sans text-2xl tracking-tight flex items-center gap-2">
          <BarChart3 className="h-6 w-6" /> Analytics
        </CardTitle>
        <CardDescription className="font-sans">
          Advanced insights into your subscription spending patterns and trends.
        </CardDescription>
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <TrendingUp className="h-4 w-4" />
        <span className="font-sans">Premium Feature</span>
      </div>
    </div>
  );
}
