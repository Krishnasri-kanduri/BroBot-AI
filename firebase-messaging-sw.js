importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCd2A27fm1-VDdy9XZoqNGvY6YaE1lcfbg",
  authDomain: "brobot-15ab2.firebaseapp.com",
  projectId: "brobot-15ab2",
  storageBucket: "brobot-15ab2.firebasestorage.app",
  messagingSenderId: "503420377692",
  appId: "1:503420377692:web:47486bc262922cead9e499"
});

self.addEventListener('install', (e) => { self.skipWaiting(); });
self.addEventListener('activate', (e) => { e.waitUntil(self.clients.claim()); });

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'BroBot Reminder';
  const body = payload.notification?.body || 'You have a reminder.';
  self.registration.showNotification(title, { body, icon: '/favicon.ico', badge: '/favicon.ico' });
});

self.addEventListener('notificationclick', (event) => {
  const title = event.notification?.title || 'BroBot Reminder';
  const body = event.notification?.body || "It's time.";
  event.notification.close();
  event.waitUntil((async () => {
    const clientsArr = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    if (clientsArr.length) {
      await clientsArr[0].focus();
      clientsArr[0].postMessage({ type: 'REMINDER_ALERT', title, body });
      return;
    }
    if (self.clients.openWindow) {
      await self.clients.openWindow('/reminders');
    }
  })());
});
