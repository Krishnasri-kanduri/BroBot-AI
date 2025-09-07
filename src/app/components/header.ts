import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink],
  template: `
    <header class="sticky top-0 z-40 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-slate-200">
      <div class="container mx-auto px-4 py-3 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="h-9 w-9 rounded-xl bg-gradient-to-br from-brand-500 to-fuchsia-500 grid place-items-center text-white font-black">B</div>
          <div>
            <div class="font-semibold text-slate-900 leading-tight">BroBot AI</div>
            <div class="text-xs text-slate-500 -mt-0.5">Your intelligent brother for safety</div>
          </div>
        </div>
        <nav class="hidden md:flex items-center gap-6 text-sm text-slate-600">
          <a routerLink="/" class="hover:text-slate-900 transition-colors">Home</a>
          <a href="#chat" class="hover:text-slate-900 transition-colors">Chat</a>
          <a href="#reminders" class="hover:text-slate-900 transition-colors">Reminders</a>
          <a href="#sos" class="hover:text-slate-900 transition-colors">SOS</a>
          <a href="#health" class="hover:text-slate-900 transition-colors">Health</a>
        </nav>
      </div>
    </header>
  `
})
export class HeaderComponent {}
