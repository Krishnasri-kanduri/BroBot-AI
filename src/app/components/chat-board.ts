import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService, ChatMessage } from '../services/chat.service';

interface Message { role: 'user' | 'bro'; text: string; ts: number }

@Component({
  selector: 'app-chat-board',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <section id="chat" class="bg-white/80 rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
    <div class="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
      <div>
        <h2 class="font-semibold text-slate-900">Chat with Bro</h2>
        <p class="text-xs text-slate-500">Ask anything — advice, tips, safety questions</p>
      </div>
      <div class="flex items-center gap-2">
        <span class="inline-flex items-center gap-1 text-xs text-brand-700 bg-brand-50 px-2 py-1 rounded-full">{{ onlineLabel() }}<span class="h-1.5 w-1.5 rounded-full" [class.bg-brand-500]="isOnline()" [class.bg-slate-400]="!isOnline()"></span></span>
        <button (click)="showSettings = !showSettings" class="text-xs px-2 py-1 rounded-lg border">Settings</button>
      </div>
    </div>

    <div *ngIf="showSettings" class="px-4 py-3 border-b bg-slate-50/70 grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
      <label class="flex flex-col">
        <span class="text-xs text-slate-600">Provider</span>
        <select [(ngModel)]="provider" name="provider" class="px-2 py-1.5 rounded-lg border">
          <option value="none">Fallback (demo)</option>
          <option value="openai">OpenAI</option>
          <option value="gemini">Gemini</option>
          <option value="endpoint">Custom Endpoint</option>
        </select>
      </label>
      <label *ngIf="provider==='openai'" class="flex flex-col">
        <span class="text-xs text-slate-600">OpenAI API Key</span>
        <input [(ngModel)]="openaiKey" name="openaiKey" type="password" class="px-2 py-1.5 rounded-lg border" placeholder="sk-..."/>
      </label>
      <label *ngIf="provider==='gemini'" class="flex flex-col">
        <span class="text-xs text-slate-600">Gemini API Key</span>
        <input [(ngModel)]="geminiKey" name="geminiKey" type="password" class="px-2 py-1.5 rounded-lg border" placeholder="AIza..."/>
      </label>
      <label *ngIf="provider==='endpoint'" class="flex flex-col md:col-span-2">
        <span class="text-xs text-slate-600">Endpoint URL</span>
        <input [(ngModel)]="endpoint" name="endpoint" class="px-2 py-1.5 rounded-lg border" placeholder="https://your-domain.com/api/chat"/>
      </label>
      <label class="flex flex-col">
        <span class="text-xs text-slate-600">Model</span>
        <input [(ngModel)]="model" name="model" class="px-2 py-1.5 rounded-lg border" placeholder="gpt-4o-mini / gemini-1.5-flash"/>
      </label>
      <div class="md:col-span-3 text-xs text-slate-500">Keys/endpoint are stored only on this device (localStorage). For production, route via a secure server.</div>
      <div class="md:col-span-1 flex items-end justify-end"><button (click)="saveSettings()" class="px-3 py-2 rounded-lg bg-brand-600 text-white">Save</button></div>
    </div>

    <div class="h-80 md:h-96 overflow-y-auto px-4 py-3 space-y-3 bg-gradient-to-b from-white to-slate-50">
      <div *ngFor="let m of messages()">
        <div [class]="m.role === 'user' ? 'flex justify-end' : 'flex justify-start'">
          <div [class]="m.role === 'user' ? 'max-w-[80%] rounded-2xl rounded-tr-sm px-4 py-2 bg-brand-600 text-white shadow' : 'max-w-[80%] rounded-2xl rounded-tl-sm px-4 py-2 bg-white border border-slate-200 text-slate-800 shadow-sm'">
            <div class="text-sm whitespace-pre-wrap">{{ m.text }}</div>
            <div class="mt-1 text-[10px] opacity-70">{{ m.ts | date:'shortTime' }}</div>
          </div>
        </div>
      </div>
      <div *ngIf="typing" class="text-xs text-slate-500">BroBot is typing…</div>
      <div *ngIf="messages().length === 0" class="h-full grid place-items-center text-center text-slate-500 text-sm">
        Say hi! I can set reminders, watch your back with SOS, and track your steps.
      </div>
    </div>

    <form (submit)="send($event)" class="p-3 flex items-center gap-2 bg-white border-t border-slate-200">
      <input [(ngModel)]="draft" name="draft" required placeholder="Type a message..." class="flex-1 px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"/>
      <button type="submit" class="px-4 py-2 rounded-xl bg-brand-600 text-white hover:bg-brand-700 active:scale-[.99]">Send</button>
    </form>
  </section>
  `
})
export class ChatBoardComponent {
  messages = signal<Message[]>([]);
  draft = '';
  typing = false;
  showSettings = false;

  provider = localStorage.getItem('brobot_ai_provider') || 'none';
  openaiKey = localStorage.getItem('brobot_openai_key') || '';
  geminiKey = localStorage.getItem('brobot_gemini_key') || '';
  endpoint = localStorage.getItem('brobot_chat_endpoint') || '';
  model = localStorage.getItem('brobot_model') || 'gpt-4o-mini';

  constructor(private ai: ChatService) {}

  isOnline() { return this.provider !== 'none'; }
  onlineLabel() { return this.isOnline() ? 'Online' : 'Demo'; }

  saveSettings() {
    localStorage.setItem('brobot_ai_provider', this.provider);
    localStorage.setItem('brobot_openai_key', this.openaiKey);
    localStorage.setItem('brobot_gemini_key', this.geminiKey);
    localStorage.setItem('brobot_chat_endpoint', this.endpoint);
    localStorage.setItem('brobot_model', this.model);
  }

  async send(e: Event) {
    e.preventDefault();
    const text = this.draft.trim();
    if (!text) return;
    this.messages.update((arr) => [...arr, { role: 'user', text, ts: Date.now() }]);
    this.draft = '';

    this.typing = true;
    const history: ChatMessage[] = this.messages().map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text }));
    try {
      const reply = await this.ai.send(history);
      this.messages.update((arr) => [...arr, { role: 'bro', text: reply || 'Sorry, I had trouble responding.', ts: Date.now() }]);
    } catch {
      this.messages.update((arr) => [...arr, { role: 'bro', text: 'Hmm, something went wrong. Try again in a moment.', ts: Date.now() }]);
    } finally {
      this.typing = false;
    }
  }
}
