import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Store } from './store';

@Component({
  imports: [RouterOutlet],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  readonly store = inject(Store);
}
