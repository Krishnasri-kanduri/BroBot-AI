import { Component, signal } from '@angular/core';
import { GeolocationService } from '../services/geolocation.service';
import { load, save } from '../utils/storage';

interface Contact { id: string; name: string; phone?: string; email?: string }

@Component({
  selector: 'app-sos-panel',
  standalone: true,
  template: `
  <section id="sos" class="bg-white/80 rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
    <div class="px-5 py-4 border-b border-slate-200">
      <h2 class="font-semibold text-slate-900">Alerts & SOS</h2>
      <p class="text-xs text-slate-500">Send a quick alert with your location to trusted contacts</p>
    </div>

    <div class="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="flex flex-col items-center justify-center rounded-2xl border p-6 bg-gradient-to-b from-rose-50 to-white">
        <button (mousedown)="press(true)" (mouseup)="press(false)" (mouseleave)="press(false)"
                class="h-40 w-40 rounded-full bg-rose-600 text-white font-semibold text-xl shadow hover:bg-rose-700 active:scale-[.98]">
          SOS
        </button>
        <div class="mt-3 text-sm text-slate-600">Press and hold to send alert</div>
        <div *ngIf="countdown()>0" class="mt-1 text-xs text-rose-700">Sending in {{countdown()}}s...</div>
      </div>

      <div class="rounded-2xl border p-4">
        <div class="font-medium text-slate-800 mb-3">Trusted contacts</div>
        <form (submit)="add($event)" class="grid grid-cols-1 sm:grid-cols-5 gap-2 mb-3">
          <input [(ngModel)]="name" name="name" required placeholder="Name" class="sm:col-span-2 px-3 py-2 rounded-xl border" />
          <input [(ngModel)]="phone" name="phone" placeholder="Phone (sms:)" class="px-3 py-2 rounded-xl border" />
          <input [(ngModel)]="email" name="email" placeholder="Email (mailto:)" class="px-3 py-2 rounded-xl border" />
          <button class="px-4 py-2 rounded-xl bg-brand-600 text-white">Add</button>
        </form>
        <div class="space-y-2">
          <div *ngFor="let c of contacts()" class="flex items-center justify-between p-3 border rounded-xl">
            <div>
              <div class="font-medium">{{c.name}}</div>
              <div class="text-xs text-slate-500">{{c.phone || c.email}}</div>
            </div>
            <button (click)="remove(c)" class="px-3 py-1.5 rounded-lg border text-xs">Remove</button>
          </div>
          <div *ngIf="contacts().length===0" class="text-sm text-slate-500">No contacts yet.</div>
        </div>
      </div>
    </div>
  </section>
  `
})
export class SosPanelComponent {
  contacts = signal<Contact[]>(load<Contact[]>('brobot_contacts', []));
  countdown = signal(0);
  private timer?: any;

  name = '';
  phone = '';
  email = '';

  constructor(private geo: GeolocationService) {}

  private persist() { save('brobot_contacts', this.contacts()); }

  add(e: Event) {
    e.preventDefault();
    const c: Contact = { id: crypto.randomUUID(), name: this.name.trim(), phone: this.phone.trim() || undefined, email: this.email.trim() || undefined };
    if (!c.name || (!c.phone && !c.email)) return;
    this.contacts.update((arr) => [c, ...arr]);
    this.persist();
    this.name = this.phone = this.email = '';
  }

  remove(c: Contact) {
    this.contacts.update(arr => arr.filter(x => x.id!==c.id));
    this.persist();
  }

  press(down: boolean) {
    if (down) {
      if (this.timer) clearInterval(this.timer);
      this.countdown.set(3);
      this.timer = setInterval(() => {
        const v = this.countdown() - 1;
        this.countdown.set(v);
        if (v <= 0) {
          clearInterval(this.timer);
          this.sendAlert();
        }
      }, 1000);
    } else {
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = undefined;
        this.countdown.set(0);
      }
    }
  }

  private async sendAlert() {
    const mapLink = await this.geo.getShareableMapLink();
    const msg = `SOS from BroBot: I need help.${mapLink ? ` My location: ${mapLink}` : ''}`;

    // Try Web Share API first
    if (navigator.share) {
      try {
        await navigator.share({ title: 'SOS', text: msg });
      } catch {}
    }

    // Fallback to sms/mailto for each contact
    for (const c of this.contacts()) {
      if (c.phone) {
        const href = `sms:${encodeURIComponent(c.phone)}?&body=${encodeURIComponent(msg)}`;
        window.open(href, '_blank');
      }
      if (c.email) {
        const href = `mailto:${encodeURIComponent(c.email)}?subject=${encodeURIComponent('SOS - Need Help')}&body=${encodeURIComponent(msg)}`;
        window.open(href, '_blank');
      }
    }
  }
}
