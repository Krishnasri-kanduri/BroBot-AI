import { Routes } from "@angular/router";
import { HomePage } from "./pages/home.page";
import { RemindersPage } from "./pages/reminders.page";
import { SafetyPage } from "./pages/safety.page";

export const routes: Routes = [
  { path: "", component: HomePage },
  { path: "reminders", component: RemindersPage },
  { path: "safety", component: SafetyPage },
  { path: "**", redirectTo: "" },
];
