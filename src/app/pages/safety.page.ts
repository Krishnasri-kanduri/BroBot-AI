import { Component } from "@angular/core";
import { SosPanelComponent } from "../components/sos-panel";
import { StepsCounterComponent } from "../components/steps-counter";
import { WaterIntakeComponent } from "../components/water-intake";

@Component({
  selector: "app-safety-page",
  standalone: true,
  imports: [SosPanelComponent, StepsCounterComponent, WaterIntakeComponent],
  template: `
    <section class="container mx-auto px-4 py-6">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <app-sos-panel></app-sos-panel>
        <app-steps-counter></app-steps-counter>
        <app-water-intake class="lg:col-span-2"></app-water-intake>
      </div>
    </section>
  `,
})
export class SafetyPage {}
