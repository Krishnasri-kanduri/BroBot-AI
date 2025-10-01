import { Injectable } from '@angular/core';
import { ToastService } from './toast.service';
import { getPlugin, isNativeCapacitor } from '../utils/native';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private timers = new Map<string, number>();
  constructor(private toast: ToastService) {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (ev: MessageEvent) => {
        if (ev.data?.type === 'REMINDER_ALERT') {
          const { title, body } = ev.data;
          this.toast.show(title || 'Reminder', body || "It's time.", 'warning');
          this.playBeep(5000);
        }
      });
    }
  }

  async ensurePermission(): Promise<NotificationPermission> {
    // On native Android, use Capacitor PushNotifications permission if available
    try {
      if (isNativeCapacitor()) {
        const Push: any = getPlugin('PushNotifications');
        if (Push?.requestPermissions) {
          const res = await Push.requestPermissions();
          return (res?.receive === 'granted') ? 'granted' : 'denied';
        }
      }
    } catch {}

    if (!('Notification' in window)) return 'denied';
    if (Notification.permission === 'default') {
      try { return await Notification.requestPermission(); } catch { return Notification.permission; }
    }
    return Notification.permission;
  }

  async show(title: string, body: string) {
    try {
      const reg = await navigator.serviceWorker?.getRegistration();
      if (reg) {
        await reg.showNotification(title, { body, icon: '/favicon.ico', badge: '/favicon.ico' });
      } else if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body });
      }
    } catch {}
    if (document.visibilityState === 'visible') {
      this.toast.show(title, body, 'warning');
      this.playBeep(5000);
    }
  }

  schedule(id: string, atMs: number, title: string, body: string) {
    this.cancel(id);
    const delay = Math.max(0, atMs - Date.now());
    const timer = window.setTimeout(() => {
      this.show(title, body);
      this.timers.delete(id);
      // auto-reschedule daily reminders handled by caller if needed
    }, delay);
    this.timers.set(id, timer);
  }

  cancel(id: string) {
    const t = this.timers.get(id);
    if (t) { clearTimeout(t); this.timers.delete(id); }
  }

  private playBeep(durationMs: number) {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = 880;
      o.connect(g);
      g.connect(ctx.destination);
      g.gain.setValueAtTime(0.001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.05);
      o.start();
      setTimeout(() => { g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.05); o.stop(); ctx.close(); }, durationMs);
    } catch {}
  }
}
