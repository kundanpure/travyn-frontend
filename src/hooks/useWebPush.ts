import { useEffect, useCallback } from 'react';
import api from '@/lib/api';

// Helper to convert base64 url string to Uint8Array for push manager
function urlBase64ToUint8Array(base64String: string) {
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

export function useWebPush(user: any) {
  
  const subscribeToPush = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('Push messaging is not supported');
      return;
    }

    try {
      // 1. Register Service Worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('ServiceWorker registered:', registration);

      // Wait until service worker is active
      await navigator.serviceWorker.ready;

      // 2. Ask for permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.log('Push notification permission denied');
        return;
      }

      // 3. Get Public Key from Backend
      const res = await api.get('/push/public-key');
      const applicationServerKey = urlBase64ToUint8Array(res.data.publicKey);

      // 4. Subscribe the user
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey
      });

      // 5. Send subscription to backend
      const subscriptionJson = subscription.toJSON();
      if (subscriptionJson.endpoint && subscriptionJson.keys) {
        await api.post('/push/subscribe', {
          endpoint: subscriptionJson.endpoint,
          p256dh: subscriptionJson.keys.p256dh,
          auth: subscriptionJson.keys.auth
        });
        console.log('User successfully subscribed to push notifications');
      }
    } catch (error) {
      console.error('Failed to subscribe the user: ', error);
    }
  }, []);

  useEffect(() => {
    if (user && user.id) {
      // Small delay to not block initial render
      const timer = setTimeout(() => {
        subscribeToPush();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [user, subscribeToPush]);

  return { subscribeToPush };
}
