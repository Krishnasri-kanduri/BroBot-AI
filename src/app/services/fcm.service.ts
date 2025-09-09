import { Injectable } from '@angular/core';
import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, isSupported, onMessage } from 'firebase/messaging';
import { firebaseConfig, VAPID_PUBLIC_KEY } from './firebase-config';
import { ToastService } from './toast.service';
import { NotificationService } from './notification.service';

@Injectable({ providedIn: 'root' })
export class FcmService {
  private ready: Promise<boolean>;

  constructor(private toast: ToastService, private notify: NotificationService) {
    this.ready = this.init();
  }

  private async init(): Promise<boolean> {
    try {
      if (!getApps().length) initializeApp(firebaseConfig);
      return await isSupported();
    } catch {
      return false;
    }
  }

  async ensureToken(): Promise<string | null> {
    const supported = await this.ready;
    if (!supported || !('Notification' in window)) return null;
    if (Notification.permission !== 'granted') {
      const p = await Notification.requestPermission();
      if (p !== 'granted') return null;
    }
    try {
      const messaging = getMessaging();
      const token = await getToken(messaging, { vapidKey: VAPID_PUBLIC_KEY, serviceWorkerRegistration: await navigator.serviceWorker.getRegistration() || undefined });
      if (token) {
        localStorage.setItem('brobot_fcm_token', token);
        this.toast.show('Push enabled', 'You will receive reminder alerts even when closed.', 'success');
        onMessage(messaging, (payload) => {
          const title = payload.notification?.title || 'Reminder';
          const body = payload.notification?.body || "It's time.";
          this.notify.show(title, body);
        });
        return token;
      }
    } catch {}
    return null;
  }
}
