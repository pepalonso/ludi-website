// app.routes.ts
import { Routes } from '@angular/router';
import { LudiCountdown } from './countdown/countdown.component';
import { Ludi3x3Component } from './3x3/inscipcions/ludi3x3.component';

export const routes: Routes = [
  { path: 'countdown', component: LudiCountdown },
  {path: 'ludi3x3', component: Ludi3x3Component},
  { path: '**', redirectTo: '/countdown', pathMatch: 'full' },
];
