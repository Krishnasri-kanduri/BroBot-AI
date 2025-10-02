import { Injectable } from "@angular/core";

export type ChatRole = "system" | "user" | "assistant";
export interface ChatMessage {
  role: ChatRole;
  content: string;
}

function sysPrompt(name: string): string {
  return `You are ${name}, a supportive, protective older-brother style AI.
- Speak warmly, concise, and practical.
- Offer step-by-step help when asked for code or how-tos.
- When appropriate, suggest safety tips, reminders, or SOS features.
- If user asks for code, provide runnable, minimal examples.
- Keep responses under ~150 words unless teaching.`;
}

function has(text?: string) {
  return !!text && text.trim().length > 0;
}

@Injectable({ providedIn: "root" })
export class ChatService {
  // Do not hard-code secrets in code. Defaults to empty.
  static readonly DEFAULT_GEMINI_KEY = "";

  // Force provider by code (Gemini when key present)
  get provider(): "openai" | "gemini" | "endpoint" | "none" {
    return this.geminiKey ? "gemini" : "none";
  }
  set provider(v: "openai" | "gemini" | "endpoint" | "none") {
    localStorage.setItem("brobot_ai_provider", v);
  }

  get openaiKey() {
    return localStorage.getItem("brobot_openai_key") || "";
  }
  set openaiKey(v: string) {
    localStorage.setItem("brobot_openai_key", v);
  }

  get geminiKey() {
    const k = localStorage.getItem("brobot_gemini_key");
    const w = (globalThis as any).BROBOT_GEMINI_KEY as string | undefined;
    return (k && k.trim()) || (w && w.trim()) || ChatService.DEFAULT_GEMINI_KEY;
  }
  set geminiKey(v: string) {
    localStorage.setItem("brobot_gemini_key", v);
  }

  get endpoint() {
    return localStorage.getItem("brobot_chat_endpoint") || "";
  }
  set endpoint(v: string) {
    localStorage.setItem("brobot_chat_endpoint", v);
  }

  get model() {
    return localStorage.getItem("brobot_model") || "gemini-1.5-flash";
  }
  set model(v: string) {
    localStorage.setItem("brobot_model", v);
  }

  get botName() {
    return localStorage.getItem("brobot_bot_name") || "BroBot";
  }
  set botName(v: string) {
    localStorage.setItem("brobot_bot_name", v);
  }

  get theme() {
    return (
      (localStorage.getItem("brobot_theme") as "light" | "dark") || "light"
    );
  }
  set theme(v: "light" | "dark") {
    localStorage.setItem("brobot_theme", v);
    this.applyTheme(v);
  }
  applyTheme(v = this.theme) {
    try {
      document.documentElement.setAttribute("data-theme", v);
    } catch {}
  }

  async send(messages: ChatMessage[]): Promise<string> {
    const payload = [
      { role: "system", content: sysPrompt(this.botName) } as ChatMessage,
      ...messages,
    ];

    if (this.provider === "endpoint" && has(this.endpoint)) {
      try {
        const res = await fetch(this.endpoint, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ messages: payload, model: this.model }),
        });
        const data = await res.json();
        const text =
          data?.content ||
          data?.message ||
          data?.choices?.[0]?.message?.content;
        if (has(text)) return text;
      } catch {}
    }

    if (this.provider === "openai" && has(this.openaiKey)) {
      try {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${this.openaiKey}`,
          },
          body: JSON.stringify({
            model: this.model || "gpt-4o-mini",
            messages: payload,
          }),
        });
        const data = await res.json();
        const text = data?.choices?.[0]?.message?.content;
        if (has(text)) return text;
      } catch {}
    }

    if (
      (this.provider === "gemini" || (!this.provider && this.geminiKey)) &&
      has(this.geminiKey)
    ) {
      try {
        const parts = payload.map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        }));

        // Try configured/candidate models first
        const candidates = Array.from(new Set([
          this.model,
          "gemini-1.5-flash",
          "gemini-1.5-flash-latest",
          "gemini-1.5-pro",
        ].filter(Boolean))) as string[];

        const tryGen = async (mdl: string): Promise<string | null> => {
          const urlV1beta = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(mdl)}:generateContent?key=${this.geminiKey}`;
          const urlV1 = `https://generativelanguage.googleapis.com/v1/models/${encodeURIComponent(mdl)}:generateContent?key=${this.geminiKey}`;
          try {
            let res = await fetch(urlV1beta, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ contents: parts }) });
            let data = await res.json();
            let text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (has(text)) return text;
            if (!res.ok && data?.error?.status !== 'NOT_FOUND') return data?.error?.message ? `Error from Gemini: ${data.error.message}` : null;
          } catch {}
          try {
            let res = await fetch(urlV1, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ contents: parts }) });
            let data = await res.json();
            let text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (has(text)) return text;
            if (!res.ok && data?.error?.status !== 'NOT_FOUND') return data?.error?.message ? `Error from Gemini: ${data.error.message}` : null;
          } catch {}
          return null;
        };

        for (const mdl of candidates) {
          const out = await tryGen(mdl!);
          if (has(out || undefined)) return out!;
        }

        // If all failed with NOT_FOUND, list available models and pick the first supporting generateContent
        try {
          const list = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${this.geminiKey}`);
          const j = await list.json();
          const found = (j?.models || []).find((m: any) => Array.isArray(m?.supportedGenerationMethods) && m.supportedGenerationMethods.includes('generateContent'));
          if (found?.name) {
            const name = String(found.name).replace(/^models\//, '');
            const out = await tryGen(name);
            if (has(out || undefined)) return out!;
          }
        } catch {}
      } catch (e: any) {
        // ignore and fallback below
      }
    }

    // Fallback lightweight heuristics
    const last = messages[messages.length - 1]?.content || "";
    if (/python|code|algorithm|example/i.test(last)) {
      return "Sure! Here is a quick example. What language and level of detail do you prefer? I can give runnable snippets and tips like a big brother.";
    }
    if (/hi|hello|hey/i.test(last))
      return "Hey! I am here for anything — want tips, a plan, or just a vibe check?";
    return "Got it. I can answer anything like ChatGPT. If you want full power, add an API key in settings to enable real AI responses.";
  }
}
