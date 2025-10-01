import { Injectable } from '@angular/core';
import { ToastService } from './toast.service';
import { getPlugin, isNativeCapacitor } from '../utils/native';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private timers = new Map<string, number>();
  private channelReady = false;
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

  private idToInt(id: string): number { // stable hash for native scheduling ids
    let h = 0;
    for (let i = 0; i < id.length; i++) h = ((h << 5) - h) + id.charCodeAt(i) | 0;
    return Math.abs(h) || 1;
  }

  private async ensureNativeChannel() {
    try {
      if (!isNativeCapacitor() || this.channelReady) return;
      const Local: any = getPlugin('LocalNotifications');
      if (Local?.createChannel) {
        await Local.createChannel({ id: 'reminders', name: 'Reminders', description: 'Scheduled reminder alerts', importance: 4, visibility: 1, sound: undefined, vibration: true });
      }
      this.channelReady = true;
    } catch {}
  }

  async ensurePermission(): Promise<NotificationPermission> {
    try {
      if (isNativeCapacitor()) {
        const Push: any = getPlugin('PushNotifications');
        const Local: any = getPlugin('LocalNotifications');
        if (Local?.requestPermissions) {
          try { await Local.requestPermissions(); } catch {}
        }
        if (Push?.requestPermissions) {
          const res = await Push.requestPermissions();
          return (res?.receive === 'granted') ? 'granted' : 'denied';
        }
        return 'granted';
      }
    } catch {}

    if (!('Notification' in window)) return 'denied';
    if (Notification.permission === 'default') {
      try { return await Notification.requestPermission(); } catch { return Notification.permission; }
    }
    return Notification.permission;
  }

  async show(title: string, body: string) {
    // Native immediate notification
    try {
      if (isNativeCapacitor()) {
        const Local: any = getPlugin('LocalNotifications');
        if (Local?.schedule) {
          await this.ensureNativeChannel();
          await Local.schedule({ notifications: [{ id: Date.now() % 2147483647, title, body, channelId: 'reminders' }] });
          return;
        }
      }
    } catch {}

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

  async schedule(id: string, atMs: number, title: string, body: string) {
    this.cancel(id);

    // Native scheduled notification
    try {
      if (isNativeCapacitor()) {
        const Local: any = getPlugin('LocalNotifications');
        if (Local?.schedule) {
          await this.ensureNativeChannel();
          await Local.schedule({
            notifications: [{ id: this.idToInt(id), title, body, channelId: 'reminders', schedule: { at: new Date(atMs) } }]
          });
          return;
        }
      }
    } catch {}

    const delay = Math.max(0, atMs - Date.now());
    const timer = window.setTimeout(() => {
      this.show(title, body);
      this.timers.delete(id);
    }, delay);
    this.timers.set(id, timer);
  }

  async cancel(id: string) {
    const t = this.timers.get(id);
    if (t) { clearTimeout(t); this.timers.delete(id); }
    try {
      if (isNativeCapacitor()) {
        const Local: any = getPlugin('LocalNotifications');
        if (Local?.cancel) await Local.cancel({ notifications: [{ id: this.idToInt(id) }] });
      }
    } catch {}
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
