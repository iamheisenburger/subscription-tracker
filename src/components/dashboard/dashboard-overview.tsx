"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  Target, 
  Plus,
  Crown,
  BarChart3,
  Download,
  Bell
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { AddSubscriptionDialog } from "./add-subscription-dialog";

interface DashboardOverviewProps {
  userId: string;
  firstName: string | null;
}

export function DashboardOverview({ userId, firstName }: DashboardOverviewProps) {
  const stats = useQuery(api.subscriptions.getSubscriptionStats, { clerkId: userId });
  const subscriptions = useQuery(api.subscriptions.getUserSubscriptions, { clerkId: userId });

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight font-sans">
          Welcome back, {firstName || "there"}!
        </h1>
        <p className="text-muted-foreground font-sans">
          Here&apos;s an overview of your subscription activity
        </p>
      </div>

      {/* Upgrade Banner */}
      <Card className="border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 dark:border-yellow-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="rounded-full bg-yellow-100 p-3 dark:bg-yellow-900/30">
                <Crown className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100">
                  Upgrade to Premium
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Unlock unlimited subscriptions, advanced analytics, and more features.
                </p>
                <div className="flex items-center space-x-4 mt-2 text-xs text-yellow-600 dark:text-yellow-400">
                  <div className="flex items-center space-x-1">
                    <Crown className="h-3 w-3" />
                    <span>Unlimited subscriptions</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <BarChart3 className="h-3 w-3" />
                    <span>Advanced analytics</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Download className="h-3 w-3" />
                    <span>Export data</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                $9<span className="text-sm font-normal">/mo</span>
              </div>
              <div className="text-sm text-yellow-700 dark:text-yellow-300">
                or $7.50/mo annually
              </div>
              <Link href="/pricing">
                <Button className="mt-3 bg-yellow-600 hover:bg-yellow-700 text-white">
                  Start 7-Day Free Trial
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-sans">Total Subscriptions</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {stats === undefined ? (
              <Skeleton className="h-7 w-16 mb-1" />
            ) : (
              <div className="text-2xl font-bold font-sans">{stats.totalSubscriptions}</div>
            )}
            <p className="text-xs text-muted-foreground font-sans">
              {stats === undefined ? (
                <Skeleton className="h-3 w-24" />
              ) : (
                `${stats.activeSubscriptions} active`
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-sans">Monthly Spend</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {stats === undefined ? (
              <Skeleton className="h-7 w-16 mb-1" />
            ) : (
              <div className="text-2xl font-bold font-sans">${stats.monthlyTotal.toFixed(2)}</div>
            )}
            <p className="text-xs text-muted-foreground font-sans">
              {stats === undefined ? (
                <Skeleton className="h-3 w-24" />
              ) : (
                "Total monthly cost"
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-sans">Yearly Spend</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {stats === undefined ? (
              <Skeleton className="h-7 w-16 mb-1" />
            ) : (
              <div className="text-2xl font-bold font-sans">${stats.yearlyTotal.toFixed(2)}</div>
            )}
            <p className="text-xs text-muted-foreground font-sans">
              {stats === undefined ? (
                <Skeleton className="h-3 w-24" />
              ) : (
                "Projected annual cost"
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-sans">Next Renewal</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {stats === undefined ? (
              <Skeleton className="h-7 w-16 mb-1" />
            ) : (
              <div className="text-2xl font-bold font-sans">
                {stats.nextRenewal ? format(stats.nextRenewal, "MMM dd") : "N/A"}
              </div>
            )}
            <p className="text-xs text-muted-foreground font-sans">
              {stats === undefined ? (
                <Skeleton className="h-3 w-24" />
              ) : (
                "Upcoming billing date"
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Subscriptions List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-sans">Your Subscriptions</CardTitle>
                <CardDescription className="font-sans">
                  Manage your active and upcoming subscriptions.
                </CardDescription>
              </div>
              <AddSubscriptionDialog
                trigger={
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Subscription
                  </Button>
                }
              />
            </CardHeader>
            <CardContent>
              {subscriptions === undefined ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-12 w-12 rounded-lg" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                      <Skeleton className="h-8 w-16" />
                    </div>
                  ))}
                </div>
              ) : subscriptions.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
                    <Target className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold font-sans mb-2">No subscriptions yet</h3>
                  <p className="text-muted-foreground font-sans mb-4">
                    Add your first subscription to get started!
                  </p>
                  <AddSubscriptionDialog
                    trigger={
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Your First Subscription
                      </Button>
                    }
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  {subscriptions.slice(0, 5).map((subscription) => (
                    <div key={subscription._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Target className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold font-sans">{subscription.name}</h3>
                          <p className="text-sm text-muted-foreground font-sans">
                            Next billing: {format(subscription.nextBillingDate, "MMM dd, yyyy")} ({subscription.billingCycle})
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold font-sans">
                          {subscription.currency} {subscription.cost.toFixed(2)}
                        </div>
                        {subscription.category && (
                          <Badge variant="secondary" className="text-xs">
                            {subscription.category}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  {subscriptions.length > 5 && (
                    <div className="text-center pt-4">
                      <Link href="/dashboard/subscriptions">
                        <Button variant="outline" size="sm">
                          View All Subscriptions
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Renewals */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="font-sans">Upcoming Renewals</CardTitle>
              <CardDescription className="font-sans">Next 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              {subscriptions === undefined ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                      <Skeleton className="h-6 w-12" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {subscriptions
                    .filter(sub => {
                      const daysUntil = Math.ceil((sub.nextBillingDate - Date.now()) / (1000 * 60 * 60 * 24));
                      return daysUntil >= 0 && daysUntil <= 30;
                    })
                    .sort((a, b) => a.nextBillingDate - b.nextBillingDate)
                    .slice(0, 3)
                    .map((subscription) => {
                      const daysUntil = Math.ceil((subscription.nextBillingDate - Date.now()) / (1000 * 60 * 60 * 24));
                      return (
                        <div key={subscription._id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Calendar className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium font-sans">{subscription.name}</p>
                              <p className="text-sm text-muted-foreground font-sans">
                                {format(subscription.nextBillingDate, "MMM dd, yyyy")}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold font-sans">
                              {subscription.currency} {subscription.cost.toFixed(2)}
                            </div>
                            <Badge 
                              variant={daysUntil <= 3 ? "destructive" : daysUntil <= 7 ? "secondary" : "outline"}
                              className="text-xs"
                            >
                              {daysUntil === 0 ? "Today" : `${daysUntil} days`}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  {subscriptions.filter(sub => {
                    const daysUntil = Math.ceil((sub.nextBillingDate - Date.now()) / (1000 * 60 * 60 * 24));
                    return daysUntil >= 0 && daysUntil <= 30;
                  }).length === 0 && (
                    <div className="text-center text-muted-foreground py-4 font-sans">
                      No upcoming renewals in the next 30 days.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
