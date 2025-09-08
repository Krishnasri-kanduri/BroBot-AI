import { Component } from '@angular/core';

@Component({
  selector: 'app-mobile-nav',
  standalone: true,
  template: `
    <nav class="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 md:hidden">
      <div class="bg-white/90 backdrop-blur border border-slate-200 shadow-xl rounded-2xl px-3 py-2 flex items-center gap-2">
        <a routerLink="/chat" class="px-3 py-2 rounded-xl text-slate-700 hover:bg-brand-50 hover:text-brand-700">💬<span class="sr-only">Chat</span></a>
        <a routerLink="/reminders" class="px-3 py-2 rounded-xl text-slate-700 hover:bg-accent-50 hover:text-accent-700">📝<span class="sr-only">Reminders</span></a>
        <a routerLink="/safety" class="px-3 py-2 rounded-xl text-rose-700 hover:bg-rose-50">🆘<span class="sr-only">Safety</span></a>
      </div>
    </nav>
  `
})
export class MobileNavComponent {}
