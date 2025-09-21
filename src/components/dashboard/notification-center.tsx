"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
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
import { Bell, Calendar, DollarSign, AlertCircle, Settings } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

interface NotificationCenterProps {
  className?: string;
}

export function NotificationCenter({ className }: NotificationCenterProps) {
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  
  const subscriptions = useQuery(
    api.subscriptions.getUserSubscriptions,
    user?.id ? { clerkId: user.id, activeOnly: true } : "skip"
  );

  const userProfile = useQuery(
    api.users.getUserByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  // Generate notifications from subscription data
  const notifications = subscriptions ? generateNotifications(subscriptions, userProfile?.tier || "free_user") : [];
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={`relative ${className}`}>
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-red-500 hover:bg-red-600"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className="w-80 max-h-96 overflow-y-auto"
        sideOffset={5}
      >
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Badge variant="secondary">{unreadCount} new</Badge>
          )}
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />

        {notifications.length === 0 ? (
          <div className="py-6 text-center text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No notifications</p>
            <p className="text-xs">You&apos;re all caught up!</p>
          </div>
        ) : (
          <>
            {notifications.slice(0, 5).map((notification, index) => (
              <NotificationItem 
                key={index} 
                notification={notification}
                onClick={() => setIsOpen(false)}
              />
            ))}
            
            {notifications.length > 5 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link 
                    href="/dashboard/notifications" 
                    className="w-full text-center text-blue-600 hover:text-blue-700"
                  >
                    View all {notifications.length} notifications
                  </Link>
                </DropdownMenuItem>
              </>
            )}
          </>
        )}

        <DropdownMenuSeparator />
        
        <DropdownMenuItem asChild>
          <Link href="/dashboard/notifications" className="w-full flex items-center">
            <Settings className="h-4 w-4 mr-2" />
            Notification Settings
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NotificationItem({ 
  notification, 
  onClick 
}: { 
  notification: Notification;
  onClick: () => void;
}) {
  const getIcon = () => {
    switch (notification.type) {
      case 'renewal':
        return <Calendar className="h-4 w-4 text-blue-500" />;
      case 'price_change':
        return <DollarSign className="h-4 w-4 text-amber-500" />;
      case 'limit_warning':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <DropdownMenuItem 
      className={`p-3 cursor-pointer ${!notification.isRead ? 'bg-blue-50' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start space-x-3 w-full">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className={`text-sm ${!notification.isRead ? 'font-medium' : 'font-normal'}`}>
            {notification.title}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {notification.message}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
          </p>
        </div>
        
        {!notification.isRead && (
          <div className="flex-shrink-0">
            <div className="h-2 w-2 rounded-full bg-blue-500"></div>
          </div>
        )}
      </div>
    </DropdownMenuItem>
  );
}

// Types
interface Notification {
  id: string;
  type: 'renewal' | 'price_change' | 'limit_warning' | 'trial_ending' | 'general';
  title: string;
  message: string;
  createdAt: number;
  isRead: boolean;
  priority: 'high' | 'medium' | 'low';
  actionUrl?: string;
}

// Generate notifications from subscription data
function generateNotifications(
  subscriptions: Array<{
    _id: string;
    name: string;
    cost: number;
    currency: string;
    nextBillingDate: number;
  }>, 
  userTier: string
): Notification[] {
  const notifications: Notification[] = [];
  const now = Date.now();
  const sevenDaysFromNow = now + (7 * 24 * 60 * 60 * 1000);

  // Renewal reminders
  subscriptions.forEach((sub) => {
    const daysUntilRenewal = Math.ceil((sub.nextBillingDate - now) / (24 * 60 * 60 * 1000));
    
    if (sub.nextBillingDate <= sevenDaysFromNow && sub.nextBillingDate > now) {
      notifications.push({
        id: `renewal-${sub._id}`,
        type: 'renewal',
        title: `${sub.name} renews soon`,
        message: `Your subscription renews in ${daysUntilRenewal} day${daysUntilRenewal !== 1 ? 's' : ''} for ${sub.currency} ${sub.cost}`,
        createdAt: now - (Math.random() * 24 * 60 * 60 * 1000), // Random time within last day
        isRead: Math.random() > 0.7, // 30% chance of being unread
        priority: daysUntilRenewal <= 3 ? 'high' : 'medium',
        actionUrl: `/dashboard/subscriptions`
      });
    }
  });

  // Free tier limit warning
  if (userTier === 'free_user' && subscriptions.length >= 2) {
    notifications.push({
      id: 'limit-warning',
      type: 'limit_warning',
      title: 'Subscription limit approaching',
      message: `You have ${subscriptions.length}/3 subscriptions. Upgrade to Premium for unlimited subscriptions.`,
      createdAt: now - (2 * 24 * 60 * 60 * 1000),
      isRead: false,
      priority: 'medium',
      actionUrl: '/pricing'
    });
  }

  // Trial ending (if user is on trial)
  // This would typically come from user profile data
  if (userTier === 'free_user') {
    notifications.push({
      id: 'trial-reminder',
      type: 'trial_ending',
      title: 'Discover Premium features',
      message: 'Get unlimited subscriptions, advanced analytics, and smart alerts with Premium.',
      createdAt: now - (5 * 24 * 60 * 60 * 1000),
      isRead: true,
      priority: 'low',
      actionUrl: '/pricing'
    });
  }

  return notifications.sort((a, b) => {
    // Sort by read status (unread first), then by priority, then by date
    if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
    
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    if (a.priority !== b.priority) {
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }
    
    return b.createdAt - a.createdAt;
  });
}
