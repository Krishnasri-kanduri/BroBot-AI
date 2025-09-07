import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StepCounterService } from '../services/step-counter.service';

@Component({
  selector: 'app-steps-counter',
  standalone: true,
  imports: [CommonModule],
  template: `
  <section id="health" class="bg-white/80 rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
    <div class="px-5 py-4 border-b border-slate-200">
      <h2 class="font-semibold text-slate-900">Health • Steps</h2>
      <p class="text-xs text-slate-500">Basic step tracking with on-device motion sensors</p>
    </div>

    <div class="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
      <div class="col-span-1 rounded-2xl border p-5 bg-gradient-to-b from-brand-50 to-white">
        <div class="text-sm text-slate-600">Today</div>
        <div class="mt-1 text-5xl font-black tracking-tight text-slate-900">{{ sc.steps().steps }}</div>
        <div class="mt-4 flex items-center gap-2">
          <button *ngIf="!sc.tracking()" (click)="start()" class="px-4 py-2 rounded-xl bg-brand-600 text-white">Start</button>
          <button *ngIf="sc.tracking()" (click)="sc.stopTracking()" class="px-4 py-2 rounded-xl bg-slate-800 text-white">Stop</button>
          <button (click)="sc.addSteps()" class="px-3 py-2 rounded-xl border">Add +1</button>
        </div>
        <div class="mt-3 text-xs text-slate-500">Permission: {{ sc.permission() }}</div>
      </div>

      <div class="col-span-2 rounded-2xl border p-5">
        <div class="font-medium text-slate-800 mb-3">Status</div>
        <ul class="text-sm text-slate-600 list-disc pl-5 space-y-1">
          <li>Works best on mobile with motion sensors enabled.</li>
          <li>iOS requires a tap to grant motion permission.</li>
          <li>Fall detection triggers an SOS suggestion.</li>
        </ul>
        <div *ngIf="sc.fallDetected()" class="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700">
          Sudden fall detected. If you need help, tap SOS.
          <button (click)="sc.clearFallFlag()" class="ml-3 px-3 py-1.5 rounded-lg border">Dismiss</button>
        </div>
      </div>
    </div>
  </section>
  `
})
export class StepsCounterComponent {
  constructor(public sc: StepCounterService) {}

  async start() {
    const ok = await this.sc.requestPermission();
    if (ok) this.sc.startTracking();
  }
}
