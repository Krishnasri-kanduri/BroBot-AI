import { Injectable, signal } from '@angular/core';
import { load, save, todayKey } from '../utils/storage';

interface StepsState {
  dateKey: string;
  steps: number;
}

@Injectable({ providedIn: 'root' })
export class StepCounterService {
  steps = signal<StepsState>({ dateKey: todayKey(), steps: this.loadSteps(todayKey()) });
  permission = signal<'granted' | 'denied' | 'prompt'>('prompt');
  tracking = signal(false);
  private lastMagnitude = 0;
  private lastStepTime = 0;
  private moveHandler?: (e: DeviceMotionEvent) => void;
  private fallHandler?: (e: DeviceMotionEvent) => void;
  fallDetected = signal(false);

  private loadSteps(key: string): number {
    const all = load<Record<string, number>>('brobot_steps', {});
    return all[key] || 0;
  }

  private persist() {
    const all = load<Record<string, number>>('brobot_steps', {});
    all[this.steps().dateKey] = this.steps().steps;
    save('brobot_steps', all);
  }

  resetToday(date = new Date()) {
    const key = todayKey(date);
    this.steps.set({ dateKey: key, steps: this.loadSteps(key) });
  }

  addSteps(n = 1) {
    const next = { ...this.steps(), steps: this.steps().steps + n };
    this.steps.set(next);
    this.persist();
  }

  async requestPermission(): Promise<boolean> {
    // iOS requires permission via DeviceMotionEvent.requestPermission
    // @ts-expect-error: webkit specific
    if (typeof DeviceMotionEvent !== 'undefined' && typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      try {
        // @ts-expect-error: iOS API
        const res = await (DeviceMotionEvent as any).requestPermission();
        this.permission.set(res === 'granted' ? 'granted' : 'denied');
        return res === 'granted';
      } catch {
        this.permission.set('denied');
        return false;
      }
    }
    this.permission.set('granted');
    return true;
  }

  startTracking() {
    if (this.tracking()) return;
    this.tracking.set(true);
    let baselineSet = false;
    let baseline = 0;
    this.moveHandler = (e: DeviceMotionEvent) => {
      const ax = e.accelerationIncludingGravity?.x || 0;
      const ay = e.accelerationIncludingGravity?.y || 0;
      const az = e.accelerationIncludingGravity?.z || 0;
      const magnitude = Math.sqrt(ax * ax + ay * ay + az * az);

      if (!baselineSet) {
        baseline = magnitude;
        baselineSet = true;
      }

      const delta = Math.abs(magnitude - baseline);
      const now = Date.now();

      // Step detection: threshold and debounce
      if (delta > 1.2 && now - this.lastStepTime > 350) {
        this.lastStepTime = now;
        this.addSteps(1);
      }

      // Fall detection: very high delta spike
      if (delta > 6.5) {
        this.fallDetected.set(true);
      }

      this.lastMagnitude = magnitude;
    };

    window.addEventListener('devicemotion', this.moveHandler, { passive: true });
  }

  stopTracking() {
    if (!this.tracking()) return;
    this.tracking.set(false);
    if (this.moveHandler) {
      window.removeEventListener('devicemotion', this.moveHandler as any);
      this.moveHandler = undefined;
    }
  }

  clearFallFlag() {
    this.fallDetected.set(false);
  }
}
