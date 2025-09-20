import { Button } from "@/components/ui/button";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

export const CTABanner = () => {
  return (
    <div className="w-full py-12 xs:py-20 px-6">
      <div className="max-w-screen-lg mx-auto">
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-3xl xs:text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            Ready to take control of your subscriptions?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of users who have already saved money and gained peace of mind 
            with SubTracker. Start your free trial today.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/sign-up">
              <Button size="lg" className="text-base px-8">
                Start Free Trial <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="outline" size="lg" className="text-base px-8">
                View Pricing
              </Button>
            </Link>
          </div>
          
          <div className="mt-6 text-sm text-muted-foreground">
            <span>✅ 7-day free trial</span>
            <span className="mx-2">•</span>
            <span>✅ No credit card required</span>
            <span className="mx-2">•</span>
            <span>✅ Cancel anytime</span>
          </div>
        </div>
      </div>
    </div>
  );
};
