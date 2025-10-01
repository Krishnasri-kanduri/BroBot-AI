import { Component, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { GeolocationService } from "../services/geolocation.service";
import { load, save } from "../utils/storage";
import { ToastService } from "../services/toast.service";

interface Contact {
  id: string;
  name: string;
  phone?: string;
  email?: string;
}

@Component({
  selector: "app-sos-panel",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section
      id="sos"
      class="bg-white/80 rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
    >
      <div class="px-5 py-4 border-b border-slate-200">
        <h2 class="font-semibold text-slate-900">Alerts & SOS</h2>
        <p class="text-xs text-slate-500">
          Send a quick alert with your location to trusted contacts
        </p>
      </div>

      <div class="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          class="flex flex-col items-center justify-center rounded-2xl border p-6 bg-gradient-to-b from-rose-50 to-white"
        >
          <button
            (mousedown)="press(true)"
            (mouseup)="press(false)"
            (mouseleave)="press(false)"
            (touchstart)="press(true)"
            (touchend)="press(false)"
            (touchcancel)="press(false)"
            class="h-40 w-40 rounded-full bg-rose-600 text-white font-semibold text-xl shadow hover:bg-rose-700 active:scale-[.98]"
          >
            SOS
          </button>
          <div class="mt-3 text-sm text-slate-600">
            Press and hold to send alert
          </div>
          <div *ngIf="countdown() > 0" class="mt-1 text-xs text-rose-700">
            Sending in {{ countdown() }}s...
          </div>
          <div class="mt-3 text-xs text-slate-600 w-full">
            <ng-container *ngIf="loc(); else noLoc">
              <div class="rounded-xl border bg-white p-3">
                <div class="font-medium text-slate-800 mb-1">
                  Current Location
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                  <div>
                    Latitude:
                    <span class="font-mono">{{
                      loc()?.lat | number: "1.6-6"
                    }}</span>
                  </div>
                  <div>
                    Longitude:
                    <span class="font-mono">{{
                      loc()?.lon | number: "1.6-6"
                    }}</span>
                  </div>
                  <div>
                    Accuracy:
                    <span class="font-mono"
                      >{{ loc()?.acc | number: "1.0-0" }}m</span
                    >
                  </div>
                  <div>
                    Retrieved at:
                    <span class="font-mono">{{
                      retrievedAt | date: "medium"
                    }}</span>
                  </div>
                  <div class="sm:col-span-2">
                    Address:
                    <span class="font-mono break-words">{{
                      address || "Finding address…"
                    }}</span>
                  </div>
                </div>
                <div class="mt-2 flex gap-2">
                  <button
                    (click)="copyCoords()"
                    class="px-2 py-1 rounded border"
                  >
                    Copy Coords
                  </button>
                  <button
                    (click)="copyAddress()"
                    class="px-2 py-1 rounded border"
                    [disabled]="!address"
                  >
                    Copy Address
                  </button>
                  <button
                    (click)="refreshLocation()"
                    class="ml-auto px-2 py-1 rounded border"
                  >
                    Get Exact Location
                  </button>
                </div>
              </div>
            </ng-container>
            <ng-template #noLoc>
              <div class="rounded-xl border bg-white p-3">
                Location not available.
                <button
                  (click)="refreshLocation()"
                  class="ml-2 px-2 py-1 rounded border"
                >
                  Enable
                </button>
              </div>
            </ng-template>
          </div>
        </div>

        <div class="rounded-2xl border p-4">
          <div class="font-medium text-slate-800 mb-3">Trusted contacts</div>
          <form
            (submit)="add($event)"
            class="grid grid-cols-1 sm:grid-cols-5 gap-2 mb-3"
          >
            <input
              [(ngModel)]="name"
              name="name"
              required
              placeholder="Name"
              class="sm:col-span-2 px-3 py-2 rounded-xl border"
            />
            <input
              [(ngModel)]="phone"
              name="phone"
              placeholder="Phone (sms:)"
              class="px-3 py-2 rounded-xl border"
            />
            <input
              [(ngModel)]="email"
              name="email"
              placeholder="Email (mailto:)"
              class="px-3 py-2 rounded-xl border"
            />
            <button class="px-4 py-2 rounded-xl bg-brand-600 text-white">
              Add
            </button>
          </form>
          <div class="space-y-2">
            <div
              *ngFor="let c of contacts()"
              class="flex items-center justify-between p-3 border rounded-xl"
            >
              <div>
                <div class="font-medium">{{ c.name }}</div>
                <div class="text-xs text-slate-500">
                  {{ c.phone || c.email }}
                </div>
              </div>
              <button
                (click)="remove(c)"
                class="px-3 py-1.5 rounded-lg border text-xs"
              >
                Remove
              </button>
            </div>
            <div *ngIf="contacts().length === 0" class="text-sm text-slate-500">
              No contacts yet.
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class SosPanelComponent {
  contacts = signal<Contact[]>(load<Contact[]>("brobot_contacts", []));
  countdown = signal(0);
  private timer?: any;

  name = "";
  phone = "";
  email = "";

  constructor(
    private geo: GeolocationService,
    private toast: ToastService,
  ) {
    setTimeout(() => this.refreshLocation(), 0);
  }

  private persist() {
    save("brobot_contacts", this.contacts());
  }

  add(e: Event) {
    e.preventDefault();
    const c: Contact = {
      id: crypto.randomUUID(),
      name: this.name.trim(),
      phone: this.phone.trim() || undefined,
      email: this.email.trim() || undefined,
    };
    if (!c.name || (!c.phone && !c.email)) return;
    this.contacts.update((arr) => [c, ...arr]);
    this.persist();
    this.name = this.phone = this.email = "";
  }

  remove(c: Contact) {
    this.contacts.update((arr) => arr.filter((x) => x.id !== c.id));
    this.persist();
  }

  press(down: boolean) {
    if (down) {
      if (this.contacts().length === 0) {
        this.toast.show(
          "Add a trusted contact",
          "Phone or email required to send SOS",
          "warning",
        );
        return;
      }
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

  loc = signal<{ lat: number; lon: number; acc?: number } | null>(null);
  locErr = signal<string | null>(null);
  address: string | null = null;
  retrievedAt: number | null = null;

  async refreshLocation() {
    // Race a quick fix (3s) with a best-fix watcher (up to 30s) for speed
    const quick = (async () => {
      try { return await this.geo.getCurrentPosition(); } catch { return null; }
    })();
    const bestP = this.geo.watchBestFix(30000, 10);

    const first = await Promise.race([quick, bestP]);
    const pos = first || (await bestP) || (await this.geo.getCurrentPosition());

    if (pos) {
      this.loc.set({
        lat: pos.coords.latitude,
        lon: pos.coords.longitude,
        acc: pos.coords.accuracy,
      });
      this.retrievedAt = Date.now();
      this.locErr.set(null);
      this.address = await this.geo.reverseGeocode(
        pos.coords.latitude,
        pos.coords.longitude,
      );
    } else {
      this.loc.set(null);
      this.address = null;
      this.retrievedAt = null;
      this.locErr.set("Location unavailable");
    }
  }

  copyCoords() {
    const l = this.loc();
    if (!l) return;
    navigator.clipboard?.writeText(`${l.lat}, ${l.lon}`).catch(() => {});
  }

  copyAddress() {
    if (!this.address) return;
    navigator.clipboard?.writeText(this.address).catch(() => {});
  }

  private isIOS() {
    return (
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    );
  }
  private isAndroid() {
    return /Android/.test(navigator.userAgent);
  }
  private normalizePhone(input: string): string {
    const raw = String(input || "");
    const digits = raw.replace(/\D+/g, "");
    if (raw.startsWith("+")) return raw;
    if (digits.startsWith("91") && digits.length === 12) return `+${digits}`;
    if (digits.length === 10) return `+91${digits}`;
    if (digits.startsWith("0") && digits.length === 11)
      return `+91${digits.slice(1)}`;
    return raw;
  }
  private smsHref(phone: string, body: string) {
    // iOS often needs sms:number&body=...; Android prefers sms:number?body=...
    const norm = this.normalizePhone(phone);
    const p = encodeURIComponent(norm);
    const b = encodeURIComponent(body);
    if (this.isIOS()) return `sms:${p}&body=${b}`;
    if (this.isAndroid()) return `sms:${p}?body=${b}`;
    return null; // desktop likely has no handler
  }

  private async sendAlert() {
    const l = this.loc();
    const maps = l ? ` https://maps.google.com/?q=${l.lat},${l.lon}` : "";
    const msg =
      `SOS from BroBot: I need help.` +
      (l
        ? ` My coordinates: ${l.lat}, ${l.lon}${this.address ? ` | ${this.address}` : ""}${maps}`
        : "");

    const list = this.contacts();
    if (!list.length) {
      this.toast.show("No contacts", "Add a phone or email first", "warning");
      return;
    }

    // 1) Native Android bridge (for Capacitor/Cordova builds). Sends SMS silently when allowed.
    if (this.tryNativeSms(list, msg)) {
      this.toast.show(
        "SOS sent",
        "SMS dispatched to trusted contacts",
        "success",
      );
      return;
    }

    // 2) Web Share API (best UX on mobile)
    if (navigator.share) {
      try {
        await navigator.share({ title: "SOS", text: msg });
        this.toast.show(
          "SOS shared",
          "Message opened in your share sheet",
          "success",
        );
        return;
      } catch {}
    }

    // 3) sms:/mailto: fallbacks
    // Compose primary link by device capabilities
    let primaryHref: string | null = null;
    for (const c of list) {
      if (!primaryHref && c.phone) primaryHref = this.smsHref(c.phone, msg);
      if (!primaryHref && c.email)
        primaryHref = `mailto:${encodeURIComponent(c.email)}?subject=${encodeURIComponent("SOS - Need Help")}&body=${encodeURIComponent(msg)}`;
    }

    let opened = false;
    if (primaryHref) {
      try {
        window.location.assign(primaryHref);
        opened = true;
      } catch {}
    } else if (this.isAndroid() || this.isIOS()) {
      // If phone present but no handler constructed (rare), fallback to generic sms: with body only
      const anyPhone = list.find((c) => c.phone)?.phone;
      if (anyPhone) {
        const alt = this.isIOS()
          ? `sms:&body=${encodeURIComponent(msg)}`
          : `sms:?body=${encodeURIComponent(msg)}`;
        try {
          window.location.assign(alt);
          opened = true;
        } catch {}
      }
    }

    // Secondary sends (may be blocked). Do not spam on desktop.
    if (this.isAndroid() || this.isIOS()) {
      for (const c of list) {
        if (c.email) {
          const href = `mailto:${encodeURIComponent(c.email)}?subject=${encodeURIComponent("SOS - Need Help")}&body=${encodeURIComponent(msg)}`;
          try {
            window.open(href, "_blank");
          } catch {}
        }
      }
    }

    try {
      await navigator.clipboard?.writeText(msg);
    } catch {}
    this.toast.show(
      opened ? "SOS initiated" : "SOS prepared",
      opened
        ? "Check your messaging/email app"
        : "Copy pasted to clipboard—open your app and send.",
      opened ? "success" : "warning",
    );
  }

  private tryNativeSms(
    list: { phone?: string; email?: string }[],
    body: string,
  ): boolean {
    try {
      const withPhones = list
        .filter((c) => c.phone)
        .map((c) => ({ phone: this.normalizePhone(String(c.phone)), body }));
      if (!withPhones.length) return false;
      const w: any = window as any;
      // Preferred bulk method
      if (w.BroBot?.sendBulkSms) {
        const ok = w.BroBot.sendBulkSms(JSON.stringify(withPhones));
        return !!ok;
      }
      // Fallback per-recipient methods commonly exposed by native bridges
      if (w.BroBot?.sendSms) {
        for (const r of withPhones) {
          w.BroBot.sendSms(r.phone, r.body);
        }
        return true;
      }
      if (w.Android?.sendSms) {
        for (const r of withPhones) {
          w.Android.sendSms(r.phone, r.body);
        }
        return true;
      }
    } catch {}
    return false;
  }
}
