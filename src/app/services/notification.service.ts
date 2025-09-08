import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private timers = new Map<string, number>();

  async ensurePermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) return 'denied';
    if (Notification.permission === 'default') {
      try { return await Notification.requestPermission(); } catch { return Notification.permission; }
    }
    return Notification.permission;
  }

  show(title: string, body: string) {
    if ('Notification' in window && Notification.permission === 'granted') {
      try { new Notification(title, { body }); } catch {}
    }
    this.playBeep(3_000);
  }

  schedule(id: string, atMs: number, title: string, body: string) {
    this.cancel(id);
    const delay = Math.max(0, atMs - Date.now());
    const timer = window.setTimeout(() => {
      this.show(title, body);
      this.timers.delete(id);
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
