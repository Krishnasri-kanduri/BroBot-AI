import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";

@Component({
  selector: "app-header",
  standalone: true,
  imports: [RouterLink],
  template: `
    <header
      class="sticky top-0 z-40 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-slate-200"
    >
      <div
        class="container mx-auto px-4 py-3 flex items-center justify-between"
      >
        <div class="flex items-center gap-3">
          <img
            src="https://cdn.builder.io/api/v1/image/assets%2F01577c1cf32546459d931bd87d36ba97%2F95ab5d90f15f413681559542011ba792?format=webp&width=128"
            alt="BroBot AI logo"
            class="h-9 w-9 rounded-lg shadow ring-2 ring-brand-200"
          />
          <div>
            <div class="font-semibold text-slate-900 leading-tight">
              BroBot AI
            </div>
            <div class="text-xs text-slate-500 -mt-0.5">
              Your intelligent brother for safety
            </div>
          </div>
        </div>
        <nav class="hidden md:flex items-center gap-6 text-sm text-slate-600">
          <a routerLink="/" class="hover:text-slate-900 transition-colors"
            >Home</a
          >
          <a routerLink="/chat" class="hover:text-slate-900 transition-colors"
            >Chat</a
          >
          <a
            routerLink="/reminders"
            class="hover:text-slate-900 transition-colors"
            >Reminders</a
          >
          <a routerLink="/safety" class="hover:text-slate-900 transition-colors"
            >Safety</a
          >
        </nav>
      </div>
      <div
        class="h-1 bg-gradient-to-r from-brand-500 via-accent-500 to-rose-500"
      ></div>
    </header>
  `,
})
export class HeaderComponent {}
