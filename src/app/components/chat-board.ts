import { Component, effect, signal } from '@angular/core';

interface Message { role: 'user' | 'bro'; text: string; ts: number }

function broReply(input: string): string {
  const txt = input.toLowerCase();
  if (/help|sos|emergency|unsafe/.test(txt)) return "I'm here. If this is urgent, hit SOS. Sharing your live location now can help. Breathe, I'm with you.";
  if (/hello|hi|hey/.test(txt)) return "Hey! What's up? Need advice, a reminder, or just a vibe check?";
  if (/tip|advice|study|work/.test(txt)) return "Quick tip: break tasks into 25-min sprints, then 5-min reset. Add it as a reminder if you want me to keep you on track.";
  if (/sad|anxious|stress|tired/.test(txt)) return "You got this. Inhale 4, hold 4, exhale 6. Want a short walk goal? I can track steps and nudge you gently.";
  if (/steps|health|walk/.test(txt)) return "Let's aim 6k steps today. Start tracking in Health below. I’ll flag sudden falls too—safety first.";
  if (/remind|reminder|schedule|event|birthday/.test(txt)) return "Tell me what to remind and when. Example: ‘Remind me 7pm to call mom’ or add it in the Reminders section.";
  return "Noted. I’ve got your back. Want me to set a reminder, share a quick tip, or check in later?";
}

@Component({
  selector: 'app-chat-board',
  standalone: true,
  template: `
  <section id="chat" class="bg-white/80 rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
    <div class="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
      <div>
        <h2 class="font-semibold text-slate-900">Chat with Bro</h2>
        <p class="text-xs text-slate-500">Ask anything — advice, tips, safety questions</p>
      </div>
      <span class="inline-flex items-center gap-1 text-xs text-brand-700 bg-brand-50 px-2 py-1 rounded-full">Online<span class="h-1.5 w-1.5 rounded-full bg-brand-500"></span></span>
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
      <div *ngIf="messages().length === 0" class="h-full grid place-items-center text-center text-slate-500 text-sm">
        Say hi! I can set reminders, watch your back with SOS, and track your steps.
      </div>
    </div>
    <form (submit)="send($event)" class="p-3 flex items-center gap-2 bg-white border-t border-slate-200">
      <input [(ngModel)]="draft" name="draft" required placeholder="Type a message..." class="flex-1 px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"/>
      <button type="submit" class="px-4 py-2 rounded-xl bg-brand-600 text-white hover:bg-brand-700 active:scale-[.99]">Send</button>
    </form>
  </section>
  `,
  imports: [],
})
export class ChatBoardComponent {
  messages = signal<Message[]>([]);
  draft = '';

  send(e: Event) {
    e.preventDefault();
    const text = this.draft.trim();
    if (!text) return;
    this.messages.update((arr) => [...arr, { role: 'user', text, ts: Date.now() }]);
    this.draft = '';
    const reply = broReply(text);
    setTimeout(() => {
      this.messages.update((arr) => [...arr, { role: 'bro', text: reply, ts: Date.now() }]);
    }, 250);
  }
}
