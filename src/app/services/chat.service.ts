import { Injectable } from '@angular/core';

export type ChatRole = 'system' | 'user' | 'assistant';
export interface ChatMessage { role: ChatRole; content: string }

const SYS_PROMPT = `You are BroBot, a supportive, protective older-brother style AI.
- Speak warmly, concise, and practical.
- Offer step-by-step help when asked for code or how-tos.
- When appropriate, suggest safety tips, reminders, or SOS features.
- If user asks for code, provide runnable, minimal examples.
- Keep responses under ~150 words unless teaching.
`;

function has(text?: string) { return !!text && text.trim().length > 0; }

@Injectable({ providedIn: 'root' })
export class ChatService {
  // Set your Gemini API key directly in this constant if you prefer code-based configuration.
  // Leave empty to use the in-app Settings panel or env.
  static readonly DEFAULT_GEMINI_KEY = 'AIzaSyCWg8CZXzRuLrLCHw_0NF8-Jw21zha7iNM';

  get provider(): 'openai' | 'gemini' | 'endpoint' | 'none' {
    const p = localStorage.getItem('brobot_ai_provider') as any;
    if (p === 'openai' || p === 'gemini' || p === 'endpoint') return p;
    return this.geminiKey ? 'gemini' : 'none';
  }
  set provider(v: 'openai' | 'gemini' | 'endpoint' | 'none') { localStorage.setItem('brobot_ai_provider', v); }

  get openaiKey() { return localStorage.getItem('brobot_openai_key') || ''; }
  set openaiKey(v: string) { localStorage.setItem('brobot_openai_key', v); }

  get geminiKey() { return localStorage.getItem('brobot_gemini_key') || ChatService.DEFAULT_GEMINI_KEY; }
  set geminiKey(v: string) { localStorage.setItem('brobot_gemini_key', v); }

  get endpoint() { return localStorage.getItem('brobot_chat_endpoint') || ''; }
  set endpoint(v: string) { localStorage.setItem('brobot_chat_endpoint', v); }

  get model() { return localStorage.getItem('brobot_model') || 'gpt-4o-mini'; }
  set model(v: string) { localStorage.setItem('brobot_model', v); }

  async send(messages: ChatMessage[]): Promise<string> {
    const payload = [{ role: 'system', content: SYS_PROMPT } as ChatMessage, ...messages];

    if (this.provider === 'endpoint' && has(this.endpoint)) {
      try {
        const res = await fetch(this.endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ messages: payload, model: this.model }) });
        const data = await res.json();
        const text = data?.content || data?.message || data?.choices?.[0]?.message?.content;
        if (has(text)) return text;
      } catch {}
    }

    if (this.provider === 'openai' && has(this.openaiKey)) {
      try {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'authorization': `Bearer ${this.openaiKey}` },
          body: JSON.stringify({ model: this.model || 'gpt-4o-mini', messages: payload })
        });
        const data = await res.json();
        const text = data?.choices?.[0]?.message?.content;
        if (has(text)) return text;
      } catch {}
    }

    if ((this.provider === 'gemini' || (!this.provider && this.geminiKey)) && has(this.geminiKey)) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.geminiKey}`;
        const parts = payload.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
        const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ contents: parts }) });
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (has(text)) return text;
      } catch {}
    }

    // Fallback lightweight heuristics
    const last = messages[messages.length - 1]?.content || '';
    if (/python|code|algorithm|example/i.test(last)) {
      return 'Sure! Here is a quick example. What language and level of detail do you prefer? I can give runnable snippets and tips like a big brother.';
    }
    if (/hi|hello|hey/i.test(last)) return 'Hey! I am here for anything — want tips, a plan, or just a vibe check?';
    return 'Got it. I can answer anything like ChatGPT. If you want full power, add an API key in settings to enable real AI responses.';
  }
}
