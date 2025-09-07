import { Component, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { load, save } from '../utils/storage';

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

  private persist() {
    save('brobot_reminders', this.reminders());
  }

  add(e: Event) {
    e.preventDefault();
    const r: Reminder = { id: crypto.randomUUID(), title: this.title.trim(), type: this.type };
    if (!r.title) return;
    if (this.type === 'daily') r.time = this.time;
    if (this.type === 'occasion') r.date = this.date;
    this.reminders.update((arr) => [r, ...arr]);
    this.persist();
    this.title = '';
  }

  toggleDone(r: Reminder) {
    this.reminders.update(arr => arr.map(x => x.id===r.id ? { ...x, done: !x.done } : x));
    this.persist();
  }

  remove(r: Reminder) {
    this.reminders.update(arr => arr.filter(x => x.id!==r.id));
    this.persist();
  }
}
