// app.routes.ts
import { Routes } from '@angular/router';
import { LudiCountdown } from './countdown/countdown.component';
import { Ludi3x3Component } from './3x3/inscipcions/ludi3x3.component';
import { TeamFormComponent } from './team-form/team-form.component';
import { DetallsEquipComponent } from './detalls-equip/detalls-equip.component';
import { SteperComponent } from './steper/steper.component';
import { RedirectorComponent } from './utils/redirector/redirector.component';
import { RegistrationSuccessComponent } from './registration-success/registration-success.component';

export const routes: Routes = [
  { path: 'equip', component: DetallsEquipComponent },
  { path: 'countdown', component: LudiCountdown },
  { path: 'ludi3x3', component: Ludi3x3Component },
  { path: 'inscripcions', component: TeamFormComponent },
  { path: 'stepper', component: SteperComponent },
  { path: 'contactawha', component: RedirectorComponent },
  { path: 'inscripcio-completa', component: RegistrationSuccessComponent },
  { path: '**', redirectTo: '/countdown', pathMatch: 'full' },
];
