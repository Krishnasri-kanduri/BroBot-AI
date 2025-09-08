import { Component } from "@angular/core";
import { SosPanelComponent } from "../components/sos-panel";
import { StepsCounterComponent } from "../components/steps-counter";

@Component({
  selector: "app-safety-page",
  standalone: true,
  imports: [SosPanelComponent, StepsCounterComponent],
  template: `
    <section class="container mx-auto px-4 py-6">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <app-sos-panel></app-sos-panel>
        <app-steps-counter></app-steps-counter>
      </div>
    </section>
  `,
})
export class SafetyPage {}
