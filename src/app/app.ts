import { Component } from "@angular/core";
import { HeaderComponent } from "./components/header";
import { MobileNavComponent } from "./components/mobile-nav";
import { ToastContainerComponent } from "./components/toast-container";
import { RouterOutlet } from "@angular/router";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [HeaderComponent, RouterOutlet, MobileNavComponent, ToastContainerComponent],
  templateUrl: "./app.html",
  styleUrl: "./app.css",
})
export class App {
  year = new Date().getFullYear();
}
