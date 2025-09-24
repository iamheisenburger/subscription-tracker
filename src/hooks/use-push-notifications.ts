"use client";

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

// VAPID public key - would be set in environment variables in production
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'YOUR_VAPID_PUBLIC_KEY_HERE';

export interface PushNotificationState {
  permission: NotificationPermission;
  isSupported: boolean;
  isSubscribed: boolean;
  isLoading: boolean;
  error: string | null;
}

export function usePushNotifications() {
  const { user } = useUser();
  const [state, setState] = useState<PushNotificationState>({
    permission: 'default',
    isSupported: false,
    isSubscribed: false,
    isLoading: true,
    error: null,
  });

  const storePushSubscription = useMutation(api.users.storePushSubscription);
  const removePushSubscription = useMutation(api.users.removePushSubscription);

  // Check browser support and current state
  useEffect(() => {
    const checkPushSupport = async () => {
      if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
        setState(prev => ({
          ...prev,
          isSupported: false,
          isLoading: false,
          error: 'Push notifications are not supported in this browser',
        }));
        return;
      }

      try {
        // Check current permission
        const permission = Notification.permission;
        
        // Check if service worker is registered
        const registration = await navigator.serviceWorker.ready;
        
        // Check if already subscribed
        const subscription = await registration.pushManager.getSubscription();
        
        setState(prev => ({
          ...prev,
          permission,
          isSupported: true,
          isSubscribed: !!subscription,
          isLoading: false,
        }));
      } catch (error) {
        console.error('Error checking push notification support:', error);
        setState(prev => ({
          ...prev,
          isSupported: false,
          isLoading: false,
          error: 'Failed to check push notification support',
        }));
      }
    };

    checkPushSupport();
  }, []);

  // Request permission and subscribe to push notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported || !user) {
      return false;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Request permission
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        setState(prev => ({
          ...prev,
          permission,
          isLoading: false,
          error: 'Push notification permission was denied',
        }));
        return false;
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: (urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as unknown) as BufferSource,
      });

      // Store subscription in backend
      await storePushSubscription({
        clerkId: user.id,
        subscription: JSON.parse(JSON.stringify(subscription)),
      });

      setState(prev => ({
        ...prev,
        permission: 'granted',
        isSubscribed: true,
        isLoading: false,
      }));

      return true;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to subscribe to push notifications',
      }));
      return false;
    }
  }, [state.isSupported, user, storePushSubscription]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported || !user) {
      return false;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;
      
      // Get current subscription
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        // Unsubscribe from push notifications
        await subscription.unsubscribe();
      }

      // Remove subscription from backend
      await removePushSubscription({
        clerkId: user.id,
      });

      setState(prev => ({
        ...prev,
        isSubscribed: false,
        isLoading: false,
      }));

      return true;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to unsubscribe from push notifications',
      }));
      return false;
    }
  }, [state.isSupported, user, removePushSubscription]);

  // Test push notification
  const testNotification = useCallback(async (): Promise<boolean> => {
    if (!state.isSubscribed || !user) {
      return false;
    }

    try {
      // Send test notification through backend
      const response = await fetch('/api/notifications/test-push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clerkId: user.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send test notification');
      }

      return true;
    } catch (error) {
      console.error('Error sending test notification:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to send test notification',
      }));
      return false;
    }
  }, [state.isSubscribed, user]);

  return {
    ...state,
    subscribe,
    unsubscribe,
    testNotification,
  };
}

// Helper function to convert VAPID public key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
