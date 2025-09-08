import { Component } from '@angular/core';
import { HeaderComponent } from './components/header';
import { MobileNavComponent } from './components/mobile-nav';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HeaderComponent, RouterOutlet, MobileNavComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  year = new Date().getFullYear();
}
