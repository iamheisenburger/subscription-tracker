"use client";

/**
 * Predictions List Component
 * Shows upcoming subscription renewals with ML-predicted dates and confidence scores
 */

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, CreditCard, Sparkles, TrendingUp } from "lucide-react";
import { format, formatDistanceToNow, differenceInDays } from "date-fns";
import { formatCurrency } from "@/lib/currency";

export function PredictionsList() {
  const { user } = useUser();
  const predictions = useQuery(
    api.insights.getUpcomingRenewals,
    user?.id ? { clerkUserId: user.id, daysAhead: 30 } : "skip"
  );

  if (predictions === undefined) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (predictions.length === 0) {
    return (
      <Card>
        <CardContent className="py-16">
          <div className="text-center space-y-3">
            <div className="rounded-full bg-muted p-6 w-fit mx-auto">
              <Calendar className="h-10 w-10 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-lg font-sans mb-1">No upcoming renewals</h3>
              <p className="text-sm text-muted-foreground font-sans max-w-md mx-auto">
                You don&apos;t have any subscriptions renewing in the next 30 days.
                We&apos;ll show predictions here as renewal dates approach.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-primary/10 p-2">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="font-sans">Upcoming Renewals</CardTitle>
              <CardDescription className="font-sans">
                Next 30 days • {predictions.length} {predictions.length === 1 ? "subscription" : "subscriptions"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4">
        {predictions.map((prediction) => (
          <PredictionCard key={prediction._id} prediction={prediction} />
        ))}
      </div>
    </div>
  );
}

interface PredictionCardProps {
  prediction: Record<string, unknown>;
}

function PredictionCard({ prediction }: PredictionCardProps) {
  const daysUntil = differenceInDays(prediction.renewalDate, Date.now());
  const confidence = prediction.predictionConfidence || 0.8;
  const isPredicted = prediction.isPredicted;

  // Determine urgency color
  const getUrgencyColor = () => {
    if (daysUntil <= 3) return "text-red-600 border-red-200 bg-red-50 dark:bg-red-950/20";
    if (daysUntil <= 7) return "text-orange-600 border-orange-200 bg-orange-50 dark:bg-orange-950/20";
    return "text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-950/20";
  };

  const getUrgencyBadge = () => {
    if (daysUntil <= 3) return { variant: "destructive" as const, label: "Due Soon" };
    if (daysUntil <= 7) return { variant: "default" as const, label: "This Week" };
    return { variant: "secondary" as const, label: "Upcoming" };
  };

  const urgencyBadge = getUrgencyBadge();

  return (
    <Card className={`${getUrgencyColor()} border-2 transition-all hover:shadow-md`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          {/* Left: Subscription Info */}
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className="rounded-full bg-white/50 dark:bg-black/20 p-3 flex-shrink-0">
              <CreditCard className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              {/* Name and Badge */}
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-lg font-sans">{prediction.name}</h3>
                <Badge variant={urgencyBadge.variant} className="font-sans">
                  {urgencyBadge.label}
                </Badge>
                {isPredicted && (
                  <Badge variant="outline" className="font-sans flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    AI Predicted
                  </Badge>
                )}
              </div>

              {/* Amount and Cycle */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-2xl">
                    {formatCurrency(prediction.cost, prediction.currency)}
                  </span>
                  <span className="text-muted-foreground">
                    /{prediction.billingCycle}
                  </span>
                </div>
              </div>

              {/* Renewal Date */}
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4" />
                <span className="font-medium">
                  {format(prediction.renewalDate, "MMM dd, yyyy")}
                </span>
                <span className="text-muted-foreground">
                  ({formatDistanceToNow(prediction.renewalDate, { addSuffix: true })})
                </span>
              </div>

              {/* Confidence Score (if predicted) */}
              {isPredicted && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-sans flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Prediction Confidence
                    </span>
                    <span className="font-medium font-sans">{Math.round(confidence * 100)}%</span>
                  </div>
                  <Progress value={confidence * 100} className="h-2" />
                </div>
              )}

              {/* Prediction Details (if predicted) */}
              {isPredicted && prediction.predictedCadence && (
                <div className="text-xs text-muted-foreground font-sans">
                  Based on {prediction.predictedCadence} billing pattern
                </div>
              )}
            </div>
          </div>

          {/* Right: Days Countdown */}
          <div className="text-center flex-shrink-0">
            <div className="rounded-lg bg-white/50 dark:bg-black/20 p-4">
              <div className="text-4xl font-bold font-sans">
                {daysUntil}
              </div>
              <div className="text-sm text-muted-foreground font-sans mt-1">
                {daysUntil === 1 ? "day" : "days"}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
