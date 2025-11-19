"use client";

/**
 * Alerts Tab Component
 * Notification center showing all alerts (price changes, duplicates, renewals, detections)
 */

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, TrendingUp, AlertTriangle, Sparkles, Calendar, CheckCircle2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useSearchParams } from "next/navigation";

export function AlertsTab() {
  const { user } = useUser();
  const searchParams = useSearchParams();
  const subscriptionFilter = searchParams.get("sub");
  const notifications = useQuery(
    api.insights.getNotificationHistory,
    user?.id ? { clerkUserId: user.id, limit: 100 } : "skip"
  );

  const filteredNotifications = useMemo(() => {
    if (!notifications) return [];
    if (!subscriptionFilter) return notifications;

    return notifications.filter((n) => {
      const meta = n.metadata as { subscriptionId?: string } | undefined;
      const subId = meta?.subscriptionId;
      return subId && String(subId) === subscriptionFilter;
    });
  }, [notifications, subscriptionFilter]);

  if (notifications === undefined) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (filteredNotifications.length === 0) {
    return (
      <Card>
        <CardContent className="py-16">
          <div className="text-center space-y-3">
            <div className="rounded-full bg-muted p-6 w-fit mx-auto">
              <Bell className="h-10 w-10 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-lg font-sans mb-1">No alerts yet</h3>
              <p className="text-sm text-muted-foreground font-sans max-w-md mx-auto">
                We&apos;ll notify you about price changes, upcoming renewals, new detections,
                and duplicate charges. All notifications will appear here.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group notifications by read/unread
  const unread = filteredNotifications.filter((n) => !n.read);
  const read = filteredNotifications.filter((n) => n.read);

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold font-sans">{filteredNotifications.length}</p>
                <p className="text-xs text-muted-foreground font-sans">
                  {subscriptionFilter ? "Alerts for this subscription" : "Total Alerts"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-2xl font-bold font-sans text-orange-600">{unread.length}</p>
                <p className="text-xs text-muted-foreground font-sans">Unread</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-2xl font-bold font-sans text-green-600">{read.length}</p>
                <p className="text-xs text-muted-foreground font-sans">Read</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <div>
                <p className="text-2xl font-bold font-sans">
                  {notifications.filter((n) => n.type.includes("price")).length}
                </p>
                <p className="text-xs text-muted-foreground font-sans">Price Alerts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for filtering */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all" className="font-sans">
            All ({filteredNotifications.length})
          </TabsTrigger>
          <TabsTrigger value="unread" className="font-sans">
            Unread ({unread.length})
          </TabsTrigger>
          <TabsTrigger value="read" className="font-sans">
            Read ({read.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-3">
          {filteredNotifications.map((notification) => (
            <NotificationCard key={notification._id} notification={notification} />
          ))}
        </TabsContent>

        <TabsContent value="unread" className="space-y-3">
          {unread.length > 0 ? (
            unread.map((notification) => (
              <NotificationCard key={notification._id} notification={notification} />
            ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle2 className="h-12 w-12 mx-auto text-green-600 mb-3" />
                <p className="text-muted-foreground font-sans">All caught up! No unread alerts.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="read" className="space-y-3">
          {read.length > 0 ? (
            read.map((notification) => (
              <NotificationCard key={notification._id} notification={notification} />
            ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground font-sans">No read notifications yet.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: number;
  metadata?: Record<string, unknown>;
}

interface NotificationCardProps {
  notification: Notification;
}

function NotificationCard({ notification }: NotificationCardProps) {
  const getIcon = () => {
    const type = notification.type;
    if (type.includes("price")) {
      return <TrendingUp className="h-5 w-5 text-orange-600" />;
    } else if (type.includes("duplicate")) {
      return <AlertTriangle className="h-5 w-5 text-red-600" />;
    } else if (type.includes("detection")) {
      return <Sparkles className="h-5 w-5 text-primary" />;
    } else if (type.includes("renewal")) {
      return <Calendar className="h-5 w-5 text-blue-600" />;
    }
    return <Bell className="h-5 w-5 text-muted-foreground" />;
  };

  const getTypeLabel = () => {
    const type = notification.type;
    if (type.includes("price")) return "Price Change";
    if (type.includes("duplicate")) return "Duplicate Charge";
    if (type.includes("detection")) return "New Detection";
    if (type.includes("renewal")) return "Renewal Reminder";
    return "Notification";
  };

  return (
    <Card className={notification.read ? "opacity-60" : "border-primary/20"}>
      <CardContent className="flex items-start gap-4 p-4">
        {/* Icon */}
        <div className="rounded-full bg-muted p-2.5 flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Title and Status */}
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <h4 className="font-medium font-sans leading-tight">{notification.title}</h4>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge variant={notification.read ? "secondary" : "default"} className="text-xs font-sans">
                {getTypeLabel()}
              </Badge>
              {!notification.read && (
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              )}
            </div>
          </div>

          {/* Message */}
          <p className="text-sm text-muted-foreground font-sans">{notification.message}</p>

          {/* Timestamp */}
          <div className="text-xs text-muted-foreground font-sans">
            {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
