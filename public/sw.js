self.addEventListener('install', (e) => {
  self.skipWaiting();
});
self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch {}
  const title = data.title || 'BroBot Reminder';
  const body = data.body || 'You have a reminder.';
  const options = {
    body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [150, 70, 150, 70, 150]
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  const title = event.notification?.title || 'BroBot Reminder';
  const body = event.notification?.body || 'It\'s time.';
  event.notification.close();
  event.waitUntil((async () => {
    const clientsArr = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    if (clientsArr.length) {
      await clientsArr[0].focus();
      clientsArr[0].postMessage({ type: 'REMINDER_ALERT', title, body });
      return;
    }
    if (self.clients.openWindow) {
      const cl = await self.clients.openWindow('/reminders');
      // Cannot reliably postMessage to new window immediately; it will show toast on load if implemented.
    }
  })());
});
