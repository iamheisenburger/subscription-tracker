"use client";

/**
 * Notifications Bell Component
 * Header notification bell with unread count badge and dropdown preview
 */

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, Sparkles, TrendingUp, AlertTriangle, Calendar, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

export function NotificationsBell() {
  const { user } = useUser();

  // Get unread count
  const unreadCount = useQuery(
    api.insights.getUnreadNotificationCount,
    user?.id ? { clerkUserId: user.id } : "skip"
  );

  // Get recent notifications for dropdown
  const recentNotifications = useQuery(
    api.insights.getNotificationHistory,
    user?.id ? { clerkUserId: user.id, limit: 5 } : "skip"
  );

  const displayCount = unreadCount || 0;
  const hasNotifications = recentNotifications && recentNotifications.length > 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative font-sans">
          <Bell className="h-5 w-5" />
          {displayCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {displayCount > 9 ? "9+" : displayCount}
            </Badge>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="font-sans flex items-center justify-between">
          <span>Notifications</span>
          {displayCount > 0 && (
            <Badge variant="secondary" className="font-sans">
              {displayCount} new
            </Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {!hasNotifications && (
          <div className="p-4 text-center text-sm text-muted-foreground font-sans">
            No notifications yet
          </div>
        )}

        {hasNotifications && (
          <>
            {recentNotifications!.slice(0, 5).map((notification) => (
              <NotificationItem key={notification._id} notification={notification} />
            ))}

            <DropdownMenuSeparator />

            <Link href="/dashboard/insights?tab=alerts">
              <DropdownMenuItem className="font-sans flex items-center justify-between cursor-pointer">
                <span>View All Alerts</span>
                <ChevronRight className="h-4 w-4" />
              </DropdownMenuItem>
            </Link>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface NotificationItemProps {
  notification: Record<string, unknown>;
}

function NotificationItem({ notification }: NotificationItemProps) {
  const getIcon = () => {
    const type = notification.type;
    if (type.includes("price")) {
      return <TrendingUp className="h-4 w-4 text-orange-600" />;
    } else if (type.includes("duplicate")) {
      return <AlertTriangle className="h-4 w-4 text-red-600" />;
    } else if (type.includes("detection")) {
      return <Sparkles className="h-4 w-4 text-primary" />;
    } else if (type.includes("renewal")) {
      return <Calendar className="h-4 w-4 text-blue-600" />;
    }
    return <Bell className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <Link href="/dashboard/insights?tab=alerts">
      <DropdownMenuItem className="flex items-start gap-3 p-3 cursor-pointer">
        <div className="rounded-full bg-muted p-1.5 flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <p className="text-sm font-medium font-sans leading-tight line-clamp-2">
            {notification.title}
          </p>
          <p className="text-xs text-muted-foreground font-sans line-clamp-1">
            {notification.message}
          </p>
          <p className="text-xs text-muted-foreground font-sans">
            {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
          </p>
        </div>
        {!notification.read && (
          <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-2" />
        )}
      </DropdownMenuItem>
    </Link>
  );
}
