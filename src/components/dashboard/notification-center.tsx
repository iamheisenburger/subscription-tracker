"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, Check, CheckCheck, Clock, DollarSign, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

export function NotificationCenter() {
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  
  // Fetch notifications
  const notifications = useQuery(api.notifications.getNotificationHistory, 
    user?.id ? { clerkId: user.id, limit: 20 } : "skip"
  );
  
  const unreadCount = useQuery(api.notifications.getUnreadNotificationCount,
    user?.id ? { clerkId: user.id } : "skip"
  );
  
  // Mutations
  const markAsRead = useMutation(api.notifications.markNotificationAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllNotificationsAsRead);
  
  // Handle marking individual notification as read
  const handleMarkAsRead = async (notificationId: string) => {
    if (!user?.id) return;
    
    try {
      await markAsRead({
        clerkId: user.id,
        notificationId: notificationId as Parameters<typeof markAsRead>[0]['notificationId'],
      });
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };
  
  // Handle marking all notifications as read
  const handleMarkAllAsRead = async () => {
    if (!user?.id) return;
    
    try {
      await markAllAsRead({ clerkId: user.id });
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };
  
  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'renewal_reminder':
        return <RefreshCw className="h-4 w-4 text-blue-500" />;
      case 'spending_alert':
        return <DollarSign className="h-4 w-4 text-orange-500" />;
      case 'price_change':
        return <Clock className="h-4 w-4 text-red-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };
  
  // Get notification color based on type
  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'renewal_reminder':
        return 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800';
      case 'spending_alert':
        return 'bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800';
      case 'price_change':
        return 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800';
      default:
        return 'bg-gray-50 border-gray-200 dark:bg-gray-950 dark:border-gray-800';
    }
  };
  
  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount && unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs font-bold"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="px-4 py-3 border-b">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold font-sans">Notifications</h4>
            {unreadCount && unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="text-xs font-sans"
              >
                <CheckCheck className="mr-1 h-3 w-3" />
                Mark all read
              </Button>
            )}
            </div>
        </div>
        
        <ScrollArea className="max-h-96">
          {!notifications || notifications.length === 0 ? (
            <div className="p-4 text-center">
              <Bell className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground font-sans">
                No notifications yet
              </p>
              <p className="text-xs text-muted-foreground font-sans mt-1">
                We&apos;ll notify you about subscription renewals and spending alerts
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 text-xs font-sans"
                onClick={() => {
                  setIsOpen(false);
                  router.push("/dashboard/settings");
                }}
              >
                Manage preferences
              </Button>
            </div>
          ) : (
            <div className="p-2">
              {notifications.map((notification, index) => (
                <div key={notification._id}>
                  <div
                    className={cn(
                      "p-3 rounded-lg border mb-2 cursor-pointer transition-colors hover:bg-accent/50",
                      !notification.read && getNotificationColor(notification.type),
                      notification.read && "bg-muted/20"
                    )}
                    onClick={() => !notification.read && handleMarkAsRead(notification._id)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h5 className={cn(
                            "text-sm font-sans truncate",
                            !notification.read && "font-semibold"
                          )}>
                            {notification.title}
                          </h5>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 ml-2" />
                          )}
                        </div>
                        
                        <p className="text-xs text-muted-foreground font-sans mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-muted-foreground font-sans">
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                          </span>
                          
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsRead(notification._id);
                              }}
                              className="text-xs h-6 px-2 font-sans"
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Mark read
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {index < notifications.length - 1 && <Separator className="my-1" />}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        
        {notifications && notifications.length > 0 && (
          <div className="border-t p-2">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="ghost"
                className="text-xs font-sans"
                onClick={() => {
                  setIsOpen(false);
                  router.push("/dashboard/settings");
                }}
              >
                Manage preferences
              </Button>
              <Button
                variant="ghost"
                className="text-xs font-sans"
                onClick={() => {
                  setIsOpen(false);
                  router.push("/dashboard/settings"); // placeholder for future notifications page
                }}
              >
                View all
              </Button>
            </div>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
