import { Routes } from '@angular/router';
import { HomePage } from './pages/home.page';
import { ChatPage } from './pages/chat.page';
import { RemindersPage } from './pages/reminders.page';
import { SafetyPage } from './pages/safety.page';

export const routes: Routes = [
  { path: '', component: HomePage },
  { path: 'chat', component: ChatPage },
  { path: 'reminders', component: RemindersPage },
  { path: 'safety', component: SafetyPage },
  { path: '**', redirectTo: '' }
];
