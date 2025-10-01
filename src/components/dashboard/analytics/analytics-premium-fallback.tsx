"use client";

import { Crown, TrendingUp, DollarSign, AlertTriangle } from "lucide-react";
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
          <TrendingUp className="w-6 h-6 text-primary" />
          Budget Management
        </CardTitle>
        <CardDescription className="text-lg font-sans">
          Take control of your subscription spending with advanced budget insights
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex items-start gap-3 p-4 bg-card/50 rounded-lg border border-border/50">
            <TrendingUp className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold font-sans text-foreground mb-1">
                Smart Budget Thresholds
              </h3>
              <p className="text-sm text-muted-foreground font-sans">
                Set monthly and yearly spending limits with intelligent alerts
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-card/50 rounded-lg border border-border/50">
            <AlertTriangle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold font-sans text-foreground mb-1">
                Spending Alerts
              </h3>
              <p className="text-sm text-muted-foreground font-sans">
                Get notified when you're approaching or exceeding your budget
              </p>
            </div>
          </div>
        </div>

        <div className="bg-muted/30 border border-border rounded-lg p-6 text-center">
          <h4 className="font-semibold font-sans text-foreground mb-2">
            Unlock Advanced Budget Management
          </h4>
          <p className="text-sm text-muted-foreground font-sans mb-4">
            Upgrade to Premium to access powerful budget tracking, smart alerts, and detailed spending insights.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/pricing">
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
