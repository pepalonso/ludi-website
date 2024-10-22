import { Routes } from '@angular/router';
import { AppComponent } from './app.component';

export const routes: Routes = [
  // Redirigeix per defecte a /ludi3x3
  { path: '', redirectTo: '/ludi3x3', pathMatch: 'full' },

  // ruta per les incripcions del 3x3
  { path: 'ludi3x3', component: AppComponent },
];
