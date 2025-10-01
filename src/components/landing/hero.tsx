import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight as ArrowUpRight, CreditCard, TrendingUp, Bell } from "lucide-react";
import Link from "next/link";
import React from "react";

export const Hero = () => {
  return (
    <div className="min-h-[calc(100vh-6rem)] flex flex-col items-center py-20 px-6">
      <div className="md:mt-6 flex items-center justify-center">
        <div className="text-center max-w-4xl">
          <Badge className="bg-primary rounded-full py-1 border-none">
            🚀 Save money, stay organized
          </Badge>
          <h1 className="mt-6 max-w-[20ch] mx-auto text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-bold !leading-[1.2] tracking-tight font-sans">
            Stop Overpaying For{" "}
            <span className="text-primary">Subscriptions</span> You Forgot About
          </h1>
          <p className="mt-6 max-w-[60ch] mx-auto xs:text-lg text-muted-foreground font-sans">
            SubWise tracks your recurring payments, sends intelligent alerts, and helps you save money with real-time spending analytics across 5 global currencies.
          </p>
          
          {/* Key Features Preview */}
          <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm text-muted-foreground font-sans">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              <span>5 global currencies (USD, EUR, GBP, CAD, AUD)</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span>Real-time spending analytics</span>
            </div>
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              <span>Smart budget & renewal alerts</span>
            </div>
          </div>

          <div className="mt-12 flex flex-col sm:flex-row items-center sm:justify-center gap-4">
                   {/* Start Free Trial - Direct to pricing */}
                   <Link href="/pricing">
                     <Button
                       size="lg"
                       className="w-full sm:w-auto rounded-full text-base"
                     >
                       Start Free Trial <ArrowUpRight className="!h-5 !w-5" />
                     </Button>
                   </Link>
          </div>
          
          <div className="mt-6 text-sm text-muted-foreground font-sans">
            <span>✅ Free 7-day trial</span>
            <span className="mx-2">•</span>
            <span>✅ Cancel anytime</span>
          </div>
        </div>
      </div>
      
      {/* Hero Image/Dashboard Preview */}
      <div className="mt-24 max-w-6xl mx-auto">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-purple-500/20 blur-3xl -z-10" />
          <div className="bg-card border rounded-2xl p-6 shadow-2xl">
            <div className="bg-muted rounded-lg p-4 mb-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-3 h-3 bg-red-500 rounded-full" />
                <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <div className="flex-1 bg-background rounded px-3 py-1 text-xs text-muted-foreground">
                  usesubwise.app/dashboard
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-background rounded border">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                      N
                    </div>
                    <div>
                      <div className="font-medium text-sm">Netflix</div>
                      <div className="text-xs text-muted-foreground">Monthly • Entertainment</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">$15.49</div>
                    <div className="text-xs text-muted-foreground">Next: Jan 15</div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-background rounded border">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                      S
                    </div>
                    <div>
                      <div className="font-medium text-sm">Spotify</div>
                      <div className="text-xs text-muted-foreground">Monthly • Music</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">$9.99</div>
                    <div className="text-xs text-muted-foreground">Next: Jan 20</div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-background rounded border">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                      F
                    </div>
                    <div>
                      <div className="font-medium text-sm">Figma</div>
                      <div className="text-xs text-muted-foreground">Monthly • Design</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">$12.00</div>
                    <div className="text-xs text-muted-foreground">Next: Jan 25</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-center text-sm text-muted-foreground">
              💡 Your subscription dashboard - clean, organized, and insightful
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
