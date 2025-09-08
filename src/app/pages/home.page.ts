import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";

@Component({
  selector: "app-home-page",
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="relative">
      <div
        class="absolute inset-0 bg-gradient-to-b from-accent-400 via-accent-300 to-white"
      ></div>
      <div class="relative container mx-auto px-4 py-10 text-center">
        <img
          src="https://cdn.builder.io/api/v1/image/assets%2F01577c1cf32546459d931bd87d36ba97%2F95ab5d90f15f413681559542011ba792?format=webp&width=200"
          alt="BroBot AI"
          class="h-20 w-20 mx-auto rounded-2xl shadow ring-2 ring-white/50"
        />
        <h1
          class="mt-4 text-2xl md:text-4xl font-extrabold text-white drop-shadow"
        >
          BroBot AI
        </h1>
        <p class="mt-1 text-white/90">
          Your intelligent companion for Safety & Assistance
        </p>

        <a routerLink="/chat" class="mt-6 block md:max-w-3xl md:mx-auto">
          <div
            class="rounded-2xl p-4 bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-card flex items-center justify-between"
          >
            <div class="text-left">
              <div class="font-semibold">Smart Chat with BroBot</div>
              <div class="text-xs opacity-90">
                Ask about anything — your caring AI brother
              </div>
            </div>
            <div class="text-2xl">➜</div>
          </div>
        </a>

        <div
          class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 md:max-w-4xl md:mx-auto"
        >
          <a routerLink="/reminders" class="block">
            <div
              class="rounded-2xl p-5 bg-white/90 backdrop-blur border border-white/60 shadow-card text-left"
            >
              <div class="text-xl font-semibold text-slate-800">Reminders</div>
              <div class="text-xs text-slate-500">Daily & Occasions</div>
            </div>
          </a>
          <a routerLink="/safety" class="block">
            <div
              class="rounded-2xl p-5 bg-white/90 backdrop-blur border border-white/60 shadow-card text-left"
            >
              <div class="text-xl font-semibold text-slate-800">Safety Hub</div>
              <div class="text-xs text-slate-500">
                SOS & Trusted Contacts + Health
              </div>
            </div>
          </a>
        </div>
      </div>
    </section>
  `,
})
export class HomePage {}
