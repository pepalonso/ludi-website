// app.routes.ts
import { Routes } from '@angular/router';
import { Ludi3x3Component } from './3x3/inscipcions/ludi3x3.component';

export const routes: Routes = [
  { path: '', redirectTo: '/ludi3x3', pathMatch: 'full' },
  { path: 'ludi3x3', component: Ludi3x3Component },
];
