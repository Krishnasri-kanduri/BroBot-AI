import { Component } from "@angular/core";
import { RemindersComponent } from "../components/reminders";

@Component({
  selector: "app-reminders-page",
  standalone: true,
  imports: [RemindersComponent],
  template: `
    <section class="container mx-auto px-4 py-6">
      <app-reminders></app-reminders>
    </section>
  `,
})
export class RemindersPage {}
