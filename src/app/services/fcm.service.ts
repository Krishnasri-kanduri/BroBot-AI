import { Injectable } from '@angular/core';
import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, isSupported, onMessage } from 'firebase/messaging';
import { firebaseConfig, VAPID_PUBLIC_KEY } from './firebase-config';
import { ToastService } from './toast.service';
import { NotificationService } from './notification.service';
import { getPlugin, isNativeCapacitor } from '../utils/native';

@Injectable({ providedIn: 'root' })
export class FcmService {
  private ready: Promise<boolean>;
  private CF_BASE = `https://us-central1-${firebaseConfig.projectId}.cloudfunctions.net`;
  private nativeRegistered = false;

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
    // Prefer native PushNotifications when running inside the Android app
    try {
      if (isNativeCapacitor()) {
        const Push: any = getPlugin('PushNotifications');
        if (Push?.requestPermissions && Push?.register && !this.nativeRegistered) {
          const perm = await Push.requestPermissions();
          if (perm?.receive !== 'granted') return null;

          const token = await new Promise<string | null>((resolve) => {
            try {
              Push.addListener('registration', async (data: any) => {
                const t = data?.value || data?.token || null;
                if (t) {
                  localStorage.setItem('brobot_fcm_token', t);
                  const tzOffset = -new Date().getTimezoneOffset();
                  try {
                    await fetch(`${this.CF_BASE}/registerToken`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ token: t, tzOffset, userAgent: navigator.userAgent })
                    });
                  } catch {}
                  this.toast.show('Push enabled', 'You will receive reminder alerts.', 'success');
                }
                resolve(t);
              });
              Push.addListener('registrationError', () => resolve(null));
              Push.addListener('pushNotificationReceived', (notif: any) => {
                const title = notif?.title || notif?.notification?.title || 'Reminder';
                const body = notif?.body || notif?.notification?.body || "It's time.";
                this.notify.show(title, body);
              });
              Push.register();
              this.nativeRegistered = true;
            } catch {
              resolve(null);
            }
          });
          return token;
        }
      }
    } catch {}

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
        const tzOffset = -new Date().getTimezoneOffset();
        try {
          await fetch(`${this.CF_BASE}/registerToken`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, tzOffset, userAgent: navigator.userAgent })
          });
        } catch {}
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

  async syncReminders(reminders: any[]): Promise<void> {
    const token = localStorage.getItem('brobot_fcm_token');
    if (!token) return;
    try {
      await fetch(`${this.CF_BASE}/syncReminders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, reminders })
      });
    } catch {}
  }
}
