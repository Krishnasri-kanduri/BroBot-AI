import { Component, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { load, save } from '../utils/storage';
import { NotificationService } from '../services/notification.service';

type ReminderType = 'daily' | 'occasion';
interface Reminder { id: string; title: string; type: ReminderType; time?: string; date?: string; done?: boolean }

@Component({
  selector: 'app-reminders',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  template: `
  <section id="reminders" class="bg-white/80 rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
    <div class="px-5 py-4 border-b border-slate-200">
      <h2 class="font-semibold text-slate-900">Reminders</h2>
      <p class="text-xs text-slate-500">Daily routines and one-off occasions</p>
    </div>

    <div *ngIf="perm!=='granted'" class="mx-4 mt-4 mb-0 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm flex items-center justify-between">
      <div>Notifications are off. Enable to get popup alerts at reminder time.</div>
      <button (click)="enableNotifications()" class="px-3 py-1.5 rounded-lg bg-amber-600 text-white">Enable</button>
    </div>

    <form (submit)="add($event)" class="p-4 grid grid-cols-1 md:grid-cols-5 gap-3">
      <input [(ngModel)]="title" name="title" required placeholder="Reminder title" class="md:col-span-2 px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500" />
      <select [(ngModel)]="type" name="type" class="px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500">
        <option value="daily">Daily</option>
        <option value="occasion">Occasion</option>
      </select>
      <input *ngIf="type==='daily'" [(ngModel)]="time" name="time" type="time" class="px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500" />
      <input *ngIf="type==='occasion'" [(ngModel)]="date" name="date" type="datetime-local" class="px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500" />
      <button type="submit" class="px-4 py-2 rounded-xl bg-brand-600 text-white hover:bg-brand-700">Add</button>
    </form>

    <div class="px-4 pb-4 space-y-3">
      <div *ngFor="let r of reminders()" class="flex items-center justify-between p-3 rounded-xl border bg-white">
        <div>
          <div class="font-medium text-slate-800" [class.line-through]="r.done">{{ r.title }}</div>
          <div class="text-xs text-slate-500">
            <ng-container *ngIf="r.type==='daily'">Daily at {{ r.time }}</ng-container>
            <ng-container *ngIf="r.type==='occasion'">On {{ r.date | date:'medium' }}</ng-container>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button (click)="toggleDone(r)" class="px-3 py-1.5 rounded-lg border text-xs" [class.bg-green-50]="r.done">{{ r.done ? 'Done' : 'Mark done' }}</button>
          <button (click)="remove(r)" class="px-3 py-1.5 rounded-lg border text-xs">Delete</button>
        </div>
      </div>
      <div *ngIf="reminders().length===0" class="text-sm text-slate-500 p-4 text-center">No reminders yet. Add one above.</div>
    </div>
  </section>
  `
})
export class RemindersComponent {
  reminders = signal<Reminder[]>(load<Reminder[]>('brobot_reminders', []));
  title = '';
  type: ReminderType = 'daily';
  time = '18:00';
  date = '';
  perm: NotificationPermission = (typeof Notification !== 'undefined') ? Notification.permission : 'denied';

  constructor(private notify: NotificationService) {
    // schedule existing on load
    for (const r of this.reminders()) this.schedule(r);
  }

  async enableNotifications() {
    this.perm = await this.notify.ensurePermission();
  }

  private persist() {
    save('brobot_reminders', this.reminders());
  }

  private schedule(r: Reminder) {
    const when = this.nextTriggerTime(r);
    if (!when) return;
    this.notify.schedule(r.id, when, r.title, 'It\'s time.');
  }

  private nextTriggerTime(r: Reminder): number | null {
    const now = new Date();
    if (r.type === 'daily' && r.time) {
      const [hh, mm] = r.time.split(':').map(Number);
      const d = new Date();
      d.setHours(hh, mm || 0, 0, 0);
      if (d.getTime() <= now.getTime()) d.setDate(d.getDate() + 1);
      return d.getTime();
    }
    if (r.type === 'occasion' && r.date) {
      const t = new Date(r.date).getTime();
      return t > now.getTime() ? t : null;
    }
    return null;
  }

  add(e: Event) {
    e.preventDefault();
    const r: Reminder = { id: crypto.randomUUID(), title: this.title.trim(), type: this.type };
    if (!r.title) return;
    if (this.type === 'daily') r.time = this.time;
    if (this.type === 'occasion') r.date = this.date;
    this.reminders.update((arr) => [r, ...arr]);
    this.persist();
    this.schedule(r);
    this.title = '';
  }

  toggleDone(r: Reminder) {
    this.reminders.update(arr => arr.map(x => x.id===r.id ? { ...x, done: !x.done } : x));
    this.persist();
  }

  remove(r: Reminder) {
    this.reminders.update(arr => arr.filter(x => x.id!==r.id));
    this.persist();
    this.notify.cancel(r.id);
  }
}
