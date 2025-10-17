"use client";

/**
 * Activity Feed Component
 * Displays unified timeline of automation events (detections, price changes, alerts)
 */

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp, AlertCircle, CheckCircle2, XCircle, Bell } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

interface ActivityItem {
  id: string;
  type: "detection_accepted" | "detection_dismissed" | "price_change" | "notification";
  timestamp: number;
  data: Record<string, unknown>;
}

export function ActivityFeed() {
  const { user } = useUser();
  const feed = useQuery(
    api.insights.getActivityFeed,
    user?.id ? { clerkUserId: user.id, limit: 50 } : "skip"
  );

  if (feed === undefined) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (feed.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="rounded-full bg-muted p-6 mb-4">
            <Sparkles className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg mb-2 font-sans">No activity yet</h3>
          <p className="text-sm text-muted-foreground text-center max-w-md font-sans">
            As we detect subscriptions, track price changes, and monitor your spending,
            all activity will appear here in real-time.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground font-sans">
        Showing {feed.length} recent {feed.length === 1 ? "event" : "events"}
      </p>
      {feed.map((item: ActivityItem) => (
        <ActivityFeedItem key={item.id} item={item} />
      ))}
    </div>
  );
}

function ActivityFeedItem({ item }: { item: ActivityItem }) {
  const getIcon = () => {
    switch (item.type) {
      case "detection_accepted":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "detection_dismissed":
        return <XCircle className="h-5 w-5 text-muted-foreground" />;
      case "price_change":
        return <TrendingUp className="h-5 w-5 text-orange-600" />;
      case "notification":
        return <Bell className="h-5 w-5 text-blue-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getBadgeVariant = () => {
    switch (item.type) {
      case "detection_accepted":
        return "default";
      case "detection_dismissed":
        return "secondary";
      case "price_change":
        return "destructive";
      case "notification":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getBadgeText = () => {
    switch (item.type) {
      case "detection_accepted":
        return "Accepted";
      case "detection_dismissed":
        return "Dismissed";
      case "price_change":
        return "Price Change";
      case "notification":
        return "Alert";
      default:
        return "Activity";
    }
  };

  const getTitle = () => {
    switch (item.type) {
      case "detection_accepted":
        return `Detected: ${item.data.proposedName}`;
      case "detection_dismissed":
        return `Dismissed detection: ${item.data.proposedName}`;
      case "price_change":
        return `Price change: ${item.data.subscriptionName}`;
      case "notification":
        return item.data.title;
      default:
        return "Activity";
    }
  };

  const getDescription = () => {
    switch (item.type) {
      case "detection_accepted":
        return (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-foreground">
              ${item.data.proposedAmount.toFixed(2)}
            </span>
            <span className="text-muted-foreground">/{item.data.proposedCadence}</span>
            <Badge variant="outline" className="text-xs">
              {Math.round(item.data.confidence * 100)}% confidence
            </Badge>
          </div>
        );
      case "detection_dismissed":
        return (
          <span className="text-muted-foreground">
            ${item.data.proposedAmount.toFixed(2)}/{item.data.proposedCadence}
          </span>
        );
      case "price_change":
        const change = item.data.percentChange > 0 ? "+" : "";
        const color = item.data.percentChange > 0 ? "text-red-600" : "text-green-600";
        return (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">
              ${item.data.oldPrice.toFixed(2)} → ${item.data.newPrice.toFixed(2)}
            </span>
            <span className={`font-medium ${color}`}>
              ({change}{item.data.percentChange.toFixed(1)}%)
            </span>
          </div>
        );
      case "notification":
        return <span className="text-muted-foreground">{item.data.message}</span>;
      default:
        return null;
    }
  };

  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardContent className="flex items-start gap-4 p-4">
        {/* Icon */}
        <div className="rounded-full bg-muted p-2.5 flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Title and Time */}
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-medium font-sans leading-tight">{getTitle()}</h4>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge variant={getBadgeVariant()} className="text-xs font-sans">
                {getBadgeText()}
              </Badge>
            </div>
          </div>

          {/* Description */}
          <div className="text-sm font-sans">{getDescription()}</div>

          {/* Timestamp */}
          <div className="text-xs text-muted-foreground font-sans">
            {formatDistanceToNow(item.timestamp, { addSuffix: true })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
