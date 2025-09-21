"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Crown, Calendar, DollarSign } from "lucide-react";
import Link from "next/link";

interface BillingSettingsProps {
  userId: string;
}

export function BillingSettings({ userId }: BillingSettingsProps) {
  // TODO: Get user tier from Convex
  const userTier = ("free_user" as "free_user" | "premium_user"); // This should come from user data
  const isPremium = userTier === "premium_user";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-sans">
          <CreditCard className="h-5 w-5" />
          Billing & Subscription
        </CardTitle>
        <CardDescription className="font-sans">
          Manage your SubWise subscription and billing information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Plan */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isPremium ? 'bg-primary/10' : 'bg-muted'}`}>
              {isPremium ? (
                <Crown className="h-5 w-5 text-primary" />
              ) : (
                <DollarSign className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium font-sans">
                  {isPremium ? "Premium Plan" : "Free Plan"}
                </h3>
                <Badge variant={isPremium ? "default" : "secondary"} className="font-sans">
                  {isPremium ? "Active" : "Current"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground font-sans">
                {isPremium 
                  ? "Unlimited subscriptions with advanced features"
                  : "Up to 3 subscriptions with basic features"
                }
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-semibold font-sans">
              {isPremium ? "$9.00/month" : "Free"}
            </p>
            {isPremium && (
              <p className="text-sm text-muted-foreground font-sans">
                Billed monthly
              </p>
            )}
          </div>
        </div>

        {!isPremium && (
          <>
            <Separator />
            
            {/* Upgrade Section */}
            <div className="space-y-4">
              <h4 className="font-medium font-sans">Upgrade to Premium</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium font-sans">Monthly</h5>
                    <span className="font-semibold font-sans">$9.00/mo</span>
                  </div>
                  <p className="text-sm text-muted-foreground font-sans mb-4">
                    Perfect for trying out premium features
                  </p>
                  <Link href="/pricing">
                    <Button variant="outline" className="w-full font-sans">
                      Choose Monthly
                    </Button>
                  </Link>
                </div>
                
                <div className="p-4 border rounded-lg bg-primary/5 border-primary/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h5 className="font-medium font-sans">Annual</h5>
                      <Badge variant="secondary" className="font-sans text-xs">
                        Save 17%
                      </Badge>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold font-sans">$7.50/mo</span>
                      <p className="text-xs text-muted-foreground font-sans">
                        $90.00/year
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground font-sans mb-4">
                    Best value with 2 months free
                  </p>
                  <Link href="/pricing">
                    <Button className="w-full font-sans">
                      Choose Annual
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}

        {isPremium && (
          <>
            <Separator />
            
            {/* Billing History */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium font-sans">Billing History</h4>
                <Button variant="outline" size="sm" className="font-sans">
                  View All
                </Button>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium font-sans">Premium Monthly</p>
                      <p className="text-sm text-muted-foreground font-sans">
                        January 21, 2025
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium font-sans">$9.00</p>
                    <Badge variant="secondary" className="font-sans text-xs">
                      Paid
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Manage Subscription */}
            <div className="space-y-4">
              <h4 className="font-medium font-sans">Manage Subscription</h4>
              <div className="flex gap-2">
                <Button variant="outline" className="font-sans">
                  Update Payment Method
                </Button>
                <Button variant="outline" className="font-sans">
                  Change Plan
                </Button>
                <Button variant="outline" className="text-destructive hover:text-destructive font-sans">
                  Cancel Subscription
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
