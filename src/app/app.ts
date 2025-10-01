import { Component } from "@angular/core";
import { HeaderComponent } from "./components/header";
import { MobileNavComponent } from "./components/mobile-nav";
import { ToastContainerComponent } from "./components/toast-container";
import { Router, RouterOutlet } from "@angular/router";
import { Location } from "@angular/common";
import { getCapacitor, onHardwareBack } from "./utils/native";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [HeaderComponent, RouterOutlet, MobileNavComponent, ToastContainerComponent],
  templateUrl: "./app.html",
  styleUrl: "./app.css",
})
export class App {
  year = new Date().getFullYear();
  constructor(private router: Router, private location: Location) {
    // Hardware back handling for Android builds
    onHardwareBack(() => {
      if (this.router.url !== "/") {
        this.location.back();
        return false; // prevent default
      }
      try {
        const cap: any = getCapacitor();
        const App = (cap?.Plugins?.App || cap?.App) as any;
        if (App?.exitApp) App.exitApp();
      } catch {}
      return false;
    });
  }
}
