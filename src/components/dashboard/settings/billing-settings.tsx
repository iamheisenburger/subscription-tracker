"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
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
  const user = useQuery(api.users.getUserByClerkId, { clerkId: userId });
  const userTier = user?.tier || "free_user";
  const isPaid = userTier === "plus" || userTier === "automate_1" || userTier === "premium_user";
  const isAutomate = userTier === "automate_1";
  const isPlus = userTier === "plus" || userTier === "premium_user";

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
            <div className={`p-2 rounded-lg ${isPaid ? 'bg-primary/10' : 'bg-muted'}`}>
              {isPaid ? (
                <Crown className="h-5 w-5 text-primary" />
              ) : (
                <DollarSign className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium font-sans">
                  {isAutomate ? "Automate Plan" : isPlus ? "Plus Plan" : "Free Plan"}
                </h3>
                <Badge variant={isPaid ? "default" : "secondary"} className="font-sans">
                  {isPaid ? "Active" : "Current"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground font-sans">
                {isAutomate
                  ? "Automated bank sync + subscription detection"
                  : isPlus
                    ? "Unlimited subscriptions with advanced features"
                    : "Up to 3 subscriptions with basic features"
                }
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-semibold font-sans">
              {isAutomate ? "$9.00/month" : isPlus ? "$5.00/month" : "Free"}
            </p>
            {isPaid && (
              <p className="text-sm text-muted-foreground font-sans">
                Billed {user?.subscriptionType === "annual" ? "annually" : "monthly"}
              </p>
            )}
          </div>
        </div>

        {!isPaid && (
          <>
            <Separator />

            {/* Upgrade Section */}
            <div className="space-y-4">
              <h4 className="font-medium font-sans">Upgrade Your Plan</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium font-sans">Monthly</h5>
                    <span className="font-semibold font-sans">From $5.00/mo</span>
                  </div>
                  <p className="text-sm text-muted-foreground font-sans mb-4">
                    Plus at $5.00/mo or Automate at $9.00/mo
                  </p>
                  <Link href="/dashboard/upgrade">
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
                      <span className="font-semibold font-sans">From $3.50/mo</span>
                      <p className="text-xs text-muted-foreground font-sans">
                        Plus $42/yr • Automate $78/yr
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground font-sans mb-4">
                    Best value with 2 months free
                  </p>
                  <Link href="/dashboard/upgrade">
                    <Button className="w-full font-sans">
                      Choose Annual
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}

        {isPaid && (
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
                      <p className="font-medium font-sans">
                        {isAutomate ? "Automate" : "Plus"}{" "}
                        {user?.subscriptionType === "annual" ? "Annual" : "Monthly"}
                      </p>
                      <p className="text-sm text-muted-foreground font-sans">
                        January 21, 2025
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium font-sans">
                      {user?.subscriptionType === "annual"
                        ? (isAutomate ? "$78.00" : "$42.00")
                        : (isAutomate ? "$9.00" : "$5.00")
                      }
                    </p>
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
