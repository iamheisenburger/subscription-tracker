import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight as ArrowUpRight, CreditCard, TrendingUp, Bell } from "lucide-react";
import Link from "next/link";
import React from "react";

export const Hero = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 pt-32 pb-16 sm:pt-36">
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

    </div>
  );
};
