import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-3 inset-x-0 z-[60] pointer-events-none">
      <div class="mx-auto max-w-md space-y-2">
        <div *ngFor="let t of toast.toasts()" class="pointer-events-auto rounded-xl shadow-xl border p-3 flex items-start gap-3"
             [class.bg-emerald-50]="t.type==='success'" [class.border-emerald-200]="t.type==='success'"
             [class.bg-amber-50]="t.type==='warning'" [class.border-amber-200]="t.type==='warning'"
             [class.bg-rose-50]="t.type==='error'" [class.border-rose-200]="t.type==='error'"
             [class.bg-white]="!t.type" [class.border-slate-200]="!t.type">
          <div class="flex-1">
            <div class="font-semibold text-slate-900">{{t.title}}</div>
            <div class="text-xs text-slate-600" *ngIf="t.body">{{t.body}}</div>
          </div>
          <button class="text-xs px-2 py-1 rounded-lg border" (click)="toast.dismiss(t.id)">Close</button>
        </div>
      </div>
    </div>
  `
})
export class ToastContainerComponent {
  constructor(public toast: ToastService) {}
}
