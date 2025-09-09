import { Injectable, signal } from '@angular/core';

export interface Toast { id: string; title: string; body?: string; type?: 'info'|'success'|'warning'|'error' }

@Injectable({ providedIn: 'root' })
export class ToastService {
  toasts = signal<Toast[]>([]);

  show(title: string, body?: string, type: Toast['type']='info', durationMs=5000) {
    const t: Toast = { id: crypto.randomUUID(), title, body, type };
    this.toasts.update(arr => [t, ...arr]);
    setTimeout(() => this.dismiss(t.id), durationMs);
  }

  dismiss(id: string) {
    this.toasts.update(arr => arr.filter(x => x.id !== id));
  }
}
