import { Component } from '@angular/core';
import { HeaderComponent } from './components/header';
import { ChatBoardComponent } from './components/chat-board';
import { RemindersComponent } from './components/reminders';
import { SosPanelComponent } from './components/sos-panel';
import { StepsCounterComponent } from './components/steps-counter';
import { MobileNavComponent } from './components/mobile-nav';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HeaderComponent, ChatBoardComponent, RemindersComponent, SosPanelComponent, StepsCounterComponent, MobileNavComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  year = new Date().getFullYear();
}
