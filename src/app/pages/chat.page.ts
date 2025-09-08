import { Component } from "@angular/core";
import { ChatBoardComponent } from "../components/chat-board";

@Component({
  selector: "app-chat-page",
  standalone: true,
  imports: [ChatBoardComponent],
  template: `
    <section class="container mx-auto px-4 py-6">
      <app-chat-board></app-chat-board>
    </section>
  `,
})
export class ChatPage {}
