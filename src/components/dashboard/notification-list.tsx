"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bell, 
  Calendar, 
  DollarSign, 
  AlertCircle, 
  CheckCheck,
  Trash2,
  Crown
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import Link from "next/link";

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

export function NotificationList() {
  const { user } = useUser();
  const [filter, setFilter] = useState<'all' | 'unread' | 'renewal' | 'alerts'>('all');
  
  const subscriptions = useQuery(
    api.subscriptions.getUserSubscriptions,
    user?.id ? { clerkId: user.id, activeOnly: true } : "skip"
  );

  const userProfile = useQuery(
    api.users.getUserByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  // Generate notifications (same logic as notification center)
  const allNotifications = subscriptions ? generateNotifications(subscriptions, userProfile?.tier || "free_user") : [];
  
  // Filter notifications based on active filter
  const filteredNotifications = allNotifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.isRead;
      case 'renewal':
        return notification.type === 'renewal';
      case 'alerts':
        return ['price_change', 'limit_warning', 'trial_ending'].includes(notification.type);
      default:
        return true;
    }
  });

  const unreadCount = allNotifications.filter(n => !n.isRead).length;

  const markAllAsRead = () => {
    // In production, this would make API call to mark all as read
    console.log('Mark all as read');
  };

  const clearAll = () => {
    // In production, this would make API call to clear all notifications
    console.log('Clear all notifications');
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Notifications</CardTitle>
              <CardDescription>
                {allNotifications.length} total notifications
                {unreadCount > 0 && `, ${unreadCount} unread`}
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button variant="outline" size="sm" onClick={markAllAsRead}>
                  <CheckCheck className="h-4 w-4 mr-2" />
                  Mark All Read
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={clearAll}>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Filter Tabs */}
      <Tabs value={filter} onValueChange={(value) => setFilter(value as typeof filter)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">
            All ({allNotifications.length})
          </TabsTrigger>
          <TabsTrigger value="unread">
            Unread ({unreadCount})
          </TabsTrigger>
          <TabsTrigger value="renewal">
            Renewals ({allNotifications.filter(n => n.type === 'renewal').length})
          </TabsTrigger>
          <TabsTrigger value="alerts">
            Alerts ({allNotifications.filter(n => ['price_change', 'limit_warning', 'trial_ending'].includes(n.type)).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-6">
          {filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <div className="text-center">
                  <Bell className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No notifications
                  </h3>
                  <p className="text-gray-600">
                    {filter === 'all' 
                      ? "You don't have any notifications yet." 
                      : `No ${filter} notifications found.`}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notification) => (
                <NotificationCard key={notification.id} notification={notification} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function NotificationCard({ notification }: { notification: Notification }) {
  const [isRead, setIsRead] = useState(notification.isRead);

  const getIcon = () => {
    switch (notification.type) {
      case 'renewal':
        return <Calendar className="h-5 w-5 text-blue-500" />;
      case 'price_change':
        return <DollarSign className="h-5 w-5 text-amber-500" />;
      case 'limit_warning':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'trial_ending':
        return <Crown className="h-5 w-5 text-yellow-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getPriorityColor = () => {
    switch (notification.priority) {
      case 'high':
        return 'border-l-red-500 bg-red-50';
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50';
      default:
        return 'border-l-blue-500 bg-blue-50';
    }
  };

  const markAsRead = () => {
    if (!isRead) {
      setIsRead(true);
      // In production, make API call to mark as read
    }
  };

  return (
    <Card 
      className={`transition-colors cursor-pointer hover:bg-gray-50 border-l-4 ${
        isRead ? 'bg-white border-l-gray-200' : getPriorityColor()
      }`}
      onClick={markAsRead}
    >
      <CardContent className="p-4">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 mt-1">
            {getIcon()}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className={`text-sm ${isRead ? 'font-normal text-gray-900' : 'font-semibold text-gray-900'}`}>
                  {notification.title}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {notification.message}
                </p>
                
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                  </span>
                  <span className="text-xs text-gray-500">
                    {format(new Date(notification.createdAt), 'MMM dd, yyyy')}
                  </span>
                  
                  <Badge 
                    variant={notification.priority === 'high' ? 'destructive' : 'secondary'}
                    className="text-xs"
                  >
                    {notification.priority}
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {!isRead && (
                  <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                )}
                
                {notification.actionUrl && (
                  <Button asChild variant="outline" size="sm">
                    <Link href={notification.actionUrl}>
                      View
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Generate notifications function (reused from notification-center.tsx)
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
        createdAt: now - (Math.random() * 24 * 60 * 60 * 1000),
        isRead: Math.random() > 0.5,
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

  // Premium features promotion
  if (userTier === 'free_user') {
    notifications.push({
      id: 'premium-features',
      type: 'trial_ending',
      title: 'Discover Premium features',
      message: 'Get unlimited subscriptions, advanced analytics, and smart alerts with Premium.',
      createdAt: now - (5 * 24 * 60 * 60 * 1000),
      isRead: true,
      priority: 'low',
      actionUrl: '/pricing'
    });
  }

  // Add some sample notifications for demo purposes
  if (subscriptions.length > 0) {
    notifications.push({
      id: 'price-change-demo',
      type: 'price_change',
      title: 'Netflix price increase',
      message: 'Netflix has increased their monthly subscription from $12.99 to $14.99. Your next billing will reflect this change.',
      createdAt: now - (3 * 24 * 60 * 60 * 1000),
      isRead: false,
      priority: 'high',
      actionUrl: '/dashboard/subscriptions'
    });

    notifications.push({
      id: 'general-tip',
      type: 'general',
      title: 'Tip: Review your subscriptions monthly',
      message: 'Regular reviews help you identify unused subscriptions and save money. Set a monthly reminder to check your active subscriptions.',
      createdAt: now - (7 * 24 * 60 * 60 * 1000),
      isRead: true,
      priority: 'low'
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
