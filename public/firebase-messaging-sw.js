// Firebase Messaging Service Worker
// This file should be placed in public/firebase-messaging-sw.js

importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize Firebase in service worker
firebase.initializeApp({
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_AUTH_DOMAIN',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_STORAGE_BUCKET',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId: 'YOUR_APP_ID',
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);

  const notificationTitle = payload.notification?.title || 'ORDER';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: payload.notification?.icon || '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    image: payload.notification?.image,
    data: payload.data,
    actions: getNotificationActions(payload.data?.type),
    tag: payload.data?.tag || 'order-notification',
    renotify: true,
    requireInteraction: payload.data?.requireInteraction === 'true',
    vibrate: [200, 100, 200],
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Get notification actions based on type
function getNotificationActions(type) {
  switch (type) {
    case 'order':
      return [
        { action: 'view', title: 'Görüntüle', icon: '/icons/view.png' },
        { action: 'track', title: 'Takip Et', icon: '/icons/track.png' },
      ];
    case 'reservation':
      return [
        { action: 'view', title: 'Detaylar', icon: '/icons/view.png' },
        { action: 'cancel', title: 'İptal Et', icon: '/icons/cancel.png' },
      ];
    case 'message':
      return [
        { action: 'reply', title: 'Yanıtla', icon: '/icons/reply.png' },
        { action: 'view', title: 'Görüntüle', icon: '/icons/view.png' },
      ];
    case 'here_match':
      return [
        { action: 'view', title: 'Profili Gör', icon: '/icons/view.png' },
        { action: 'message', title: 'Mesaj At', icon: '/icons/message.png' },
      ];
    default:
      return [
        { action: 'view', title: 'Görüntüle', icon: '/icons/view.png' },
      ];
  }
}

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click:', event);

  event.notification.close();

  const data = event.notification.data || {};
  let url = '/';

  // Determine URL based on action and notification type
  if (event.action === 'view' || !event.action) {
    switch (data.type) {
      case 'order':
        url = `/orders/my`;
        break;
      case 'reservation':
        url = `/reservations/my`;
        break;
      case 'message':
        url = `/messages`;
        break;
      case 'here_match':
        url = `/here`;
        break;
      case 'waiter_call':
        url = data.venueId ? `/venue/${data.venueId}` : '/';
        break;
      case 'promotion':
        url = data.venueId ? `/venue/${data.venueId}` : '/discover';
        break;
      default:
        url = data.url || '/';
    }
  } else if (event.action === 'track') {
    url = `/orders/my`;
  } else if (event.action === 'reply' || event.action === 'message') {
    url = `/messages`;
  }

  // Open or focus the app window
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there is already a window open
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Handle push subscription change
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('[firebase-messaging-sw.js] Push subscription changed');
  
  event.waitUntil(
    self.registration.pushManager.subscribe({ userVisibleOnly: true })
      .then((subscription) => {
        console.log('[firebase-messaging-sw.js] New subscription:', subscription);
        // Send new subscription to server
        return fetch('/api/push/update-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subscription),
        });
      })
  );
});
