import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavigationComponent } from './components/navigation/navigation.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavigationComponent],
  template: `
    <app-navigation>
      <router-outlet></router-outlet>
    </app-navigation>
  `,
  styleUrl: './app.scss'
})
export class App {
}