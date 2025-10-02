import { Component, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { load, save, todayKey } from "../utils/storage";
import { NotificationService } from "../services/notification.service";

interface WaterLog { amount: number; ts: number }
interface WaterState { dateKey: string; totalMl: number; targetMl: number; log: WaterLog[] }

@Component({
  selector: "app-water-intake",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <section id="water" class="bg-white/80 rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
    <div class="px-5 py-4 border-b border-slate-200">
      <h2 class="font-semibold text-slate-900">Health • Water Intake</h2>
      <p class="text-xs text-slate-500">Track your daily hydration goal</p>
    </div>

    <div class="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
      <div class="col-span-1 rounded-2xl border p-5 bg-gradient-to-b from-accent-50 to-white">
        <div class="text-sm text-slate-600">Today</div>
        <div class="mt-1 text-4xl font-black tracking-tight text-slate-900">{{ state().totalMl }}<span class="text-base font-semibold ml-1">ml</span></div>
        <div class="mt-1 text-xs text-slate-500">Target: {{ state().targetMl }} ml</div>
        <div class="mt-3 w-full h-2 rounded bg-slate-200 overflow-hidden">
          <div class="h-full bg-accent-500" [style.width.%]="progress()"></div>
        </div>
        <div class="mt-4 flex items-center gap-2">
          <button (click)="add(250)" class="px-3 py-2 rounded-xl border">+250ml</button>
          <button (click)="add(500)" class="px-3 py-2 rounded-xl border">+500ml</button>
          <button (click)="add(1000)" class="px-3 py-2 rounded-xl border">+1L</button>
        </div>
      </div>

      <div class="col-span-2 rounded-2xl border p-5 space-y-3">
        <div class="grid grid-cols-2 md:grid-cols-3 gap-3 items-end">
          <label class="flex flex-col">
            <span class="text-xs text-slate-600">Custom amount (ml)</span>
            <input type="number" min="50" step="50" [(ngModel)]="custom" class="px-3 py-2 rounded-xl border" />
          </label>
          <button (click)="add(custom)" class="px-4 py-2 rounded-xl bg-slate-800 text-white">Add</button>
          <label class="flex flex-col">
            <span class="text-xs text-slate-600">Daily target (ml)</span>
            <input type="number" min="500" step="100" [(ngModel)]="target" (change)="setTarget()" class="px-3 py-2 rounded-xl border" />
          </label>
        </div>

        <div class="pt-2 border-t">
          <div class="flex items-center justify-between">
            <div class="font-medium text-slate-800">Reminder</div>
            <label class="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" [(ngModel)]="remind" (change)="toggleReminders()" />
              <span>Every 2 hours (10–18h)</span>
            </label>
          </div>
          <div class="text-xs text-slate-500 mt-1">Requires notifications permission. Schedules local alerts at 10:00, 12:00, 14:00, 16:00, 18:00.</div>
        </div>

        <div>
          <div class="font-medium text-slate-800 mb-2">History (today)</div>
          <div *ngIf="state().log.length === 0" class="text-sm text-slate-500">No entries yet.</div>
          <ul class="space-y-1 max-h-40 overflow-y-auto">
            <li *ngFor="let l of state().log" class="text-sm text-slate-700 flex justify-between">
              <span>{{ l.amount }} ml</span>
              <span class="text-xs text-slate-500">{{ l.ts | date:'shortTime' }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>
  `
})
export class WaterIntakeComponent {
  state = signal<WaterState>(this.loadToday());
  custom = 250;
  target = this.state().targetMl;
  remind = (localStorage.getItem('brobot_water_remind') || '0') === '1';

  constructor(private notify: NotificationService) {}

  private loadToday(): WaterState {
    const key = todayKey();
    const saved = load<WaterState>('brobot_water', { dateKey: key, totalMl: 0, targetMl: 2500, log: [] });
    if (saved.dateKey !== key) return { dateKey: key, totalMl: 0, targetMl: saved.targetMl || 2500, log: [] };
    return saved;
  }

  private persist() {
    save('brobot_water', this.state());
  }

  progress() {
    const p = Math.min(100, Math.round((this.state().totalMl / Math.max(500, this.state().targetMl)) * 100));
    return p;
  }

  add(n?: number) {
    const amt = Math.max(0, Math.round(Number(n || 0)));
    if (!amt) return;
    const s = this.state();
    const next: WaterState = { ...s, totalMl: s.totalMl + amt, log: [{ amount: amt, ts: Date.now() }, ...s.log] };
    this.state.set(next);
    this.persist();
  }

  setTarget() {
    const t = Math.max(500, Math.round(Number(this.target || 0)));
    this.target = t;
    const s = this.state();
    this.state.set({ ...s, targetMl: t });
    this.persist();
  }

  async toggleReminders() {
    localStorage.setItem('brobot_water_remind', this.remind ? '1' : '0');
    const ids = ['10','12','14','16','18'];
    if (this.remind) {
      const perm = await this.notify.ensurePermission();
      if (perm !== 'granted') { this.remind = false; localStorage.setItem('brobot_water_remind','0'); return; }
      const now = new Date();
      for (const hh of ids) {
        const d = new Date();
        d.setHours(Number(hh), 0, 0, 0);
        if (d.getTime() <= now.getTime()) d.setDate(d.getDate() + 1);
        this.notify.schedule(`water-${hh}`, d.getTime(), 'Hydration reminder', 'Have a glass of water.');
      }
    } else {
      for (const hh of ids) this.notify.cancel(`water-${hh}`);
    }
  }
}
