"use client";

import { Crown, TrendingUp, BarChart3, PieChart } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function AnalyticsPremiumFallback() {
  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 dark:from-primary/10 dark:to-accent/10">
      <CardHeader className="text-center pb-4">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Crown className="w-8 h-8 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold font-sans flex items-center justify-center gap-2">
          <BarChart3 className="w-6 h-6 text-primary" />
          Advanced Analytics
        </CardTitle>
        <CardDescription className="text-lg font-sans">
          Get detailed insights into your subscription spending patterns
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex items-start gap-3 p-4 bg-card/50 rounded-lg border border-border/50">
            <TrendingUp className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold font-sans text-foreground mb-1">
                Spending Trends
              </h3>
              <p className="text-sm text-muted-foreground font-sans">
                Track monthly and yearly spending patterns with interactive charts
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-card/50 rounded-lg border border-border/50">
            <PieChart className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold font-sans text-foreground mb-1">
                Category Breakdown
              </h3>
              <p className="text-sm text-muted-foreground font-sans">
                Visualize spending by category and identify cost-saving opportunities
              </p>
            </div>
          </div>
        </div>

        <div className="bg-muted/30 border border-border rounded-lg p-6 text-center">
          <h4 className="font-semibold font-sans text-foreground mb-2">
            Unlock Advanced Analytics
          </h4>
          <p className="text-sm text-muted-foreground font-sans mb-4">
            Upgrade to Premium to access detailed spending trends, interactive charts, and powerful insights.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/dashboard/upgrade">
              <Button className="w-full sm:w-auto font-sans">
                <Crown className="mr-2 h-4 w-4" />
                Start 7-Day Free Trial
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" className="w-full sm:w-auto font-sans">
                Back to Overview
              </Button>
            </Link>
          </div>
        </div>

        <div className="text-center text-xs text-muted-foreground font-sans">
          <p>✅ 7-day free trial • ✅ Cancel anytime</p>
        </div>
      </CardContent>
    </Card>
  );
}
