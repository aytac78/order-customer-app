'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface PushNotificationState {
  isSupported: boolean;
  isSubscribed: boolean;
  permission: NotificationPermission | 'default';
  isLoading: boolean;
  error: string | null;
}

interface UseNotificationsReturn extends PushNotificationState {
  requestPermission: () => Promise<boolean>;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  showNotification: (title: string, options?: NotificationOptions) => void;
}

// VAPID public key - Bu gerçek projede .env'den gelecek
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function useNotifications(): UseNotificationsReturn {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    isSubscribed: false,
    permission: 'default',
    isLoading: true,
    error: null,
  });

  // Check if notifications are supported
  useEffect(() => {
    const checkSupport = async () => {
      const isSupported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
      
      let isSubscribed = false;
      let permission: NotificationPermission = 'default';

      if (isSupported) {
        permission = Notification.permission;
        
        try {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          isSubscribed = !!subscription;
        } catch (error) {
          console.error('Error checking subscription:', error);
        }
      }

      setState({
        isSupported,
        isSubscribed,
        permission,
        isLoading: false,
        error: null,
      });
    };

    checkSupport();
  }, []);

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) {
      setState(prev => ({ ...prev, error: 'Notifications not supported' }));
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setState(prev => ({ ...prev, permission }));
      return permission === 'granted';
    } catch (error) {
      setState(prev => ({ ...prev, error: 'Failed to request permission' }));
      return false;
    }
  }, [state.isSupported]);

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) return false;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Register service worker if not already registered
      let registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        registration = await navigator.serviceWorker.register('/sw.js');
      }
      await navigator.serviceWorker.ready;

      // Request permission if not granted
      if (Notification.permission !== 'granted') {
        const granted = await requestPermission();
        if (!granted) {
          setState(prev => ({ ...prev, isLoading: false, error: 'Permission denied' }));
          return false;
        }
      }

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      // Save subscription to database
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('push_subscriptions').upsert({
          user_id: user.id,
          subscription: JSON.stringify(subscription),
          created_at: new Date().toISOString(),
        });
      }

      setState(prev => ({
        ...prev,
        isSubscribed: true,
        isLoading: false,
        error: null,
      }));

      return true;
    } catch (error) {
      console.error('Subscription error:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to subscribe',
      }));
      return false;
    }
  }, [state.isSupported, requestPermission]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();

        // Remove from database
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('user_id', user.id);
        }
      }

      setState(prev => ({
        ...prev,
        isSubscribed: false,
        isLoading: false,
        error: null,
      }));

      return true;
    } catch (error) {
      console.error('Unsubscribe error:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to unsubscribe',
      }));
      return false;
    }
  }, []);

  // Show a local notification
  const showNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (!state.isSupported || Notification.permission !== 'granted') return;

    const defaultOptions: NotificationOptions = {
      icon: '/icons/icon-192.png',
      badge: '/icons/badge-72.png',
      ...options,
    };

    // Use service worker for notification if available
    navigator.serviceWorker.ready.then(registration => {
      registration.showNotification(title, defaultOptions);
    }).catch(() => {
      // Fallback to regular notification
      new Notification(title, defaultOptions);
    });
  }, [state.isSupported]);

  return {
    ...state,
    requestPermission,
    subscribe,
    unsubscribe,
    showNotification,
  };
}

// Notification types for the app
export type NotificationType = 
  | 'order_update'
  | 'reservation_update'
  | 'new_message'
  | 'waiter_response'
  | 'promotion'
  | 'here_wave';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  read: boolean;
  created_at: string;
}
