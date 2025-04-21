// app.routes.ts
import { Routes } from '@angular/router';
import { LudiCountdown } from './countdown/countdown.component';
import { Ludi3x3Component } from './3x3/inscipcions/ludi3x3.component';
import { TeamFormComponent } from './team-form/team-form.component';
import { DetallsEquipComponent } from './detalls-equip/detalls-equip.component';
import { SteperComponent } from './steper/steper.component';
import { RedirectorComponent } from './utils/redirector/redirector.component';
import { RegistrationSuccessComponent } from './registration-success/registration-success.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { InformacioInscripcioComponent } from './informacio-inscripcio/informacio-inscripcio.component';
import { EditRegistrationComponent } from './editar-equip/editar-equip.component';
import { LoginComponent } from './login/login.component';
import { PanellAdminComponent } from './panell-admin/panell-admin.component';
import { EditarEquipAuthComponent } from './editar-equip-auth/editar-equip-auth.component';

export const routes: Routes = [
  { path: 'administrador-login', component: LoginComponent},
  { path: 'administrador', component: PanellAdminComponent},
  { path: 'equip', component: DetallsEquipComponent },
  { path: 'countdown', component: LudiCountdown },
  { path: 'ludi3x3', component: Ludi3x3Component },
  { path: 'info-inscripcions', component: InformacioInscripcioComponent},
  { path: 'inscripcions', component: TeamFormComponent },
  { path: 'stepper', component: SteperComponent },
  { path: 'contactawha', component: RedirectorComponent },
  { path: 'inscripcio-completa', component: RegistrationSuccessComponent },
  { path: '404', component: NotFoundComponent},
  { path: 'editar-inscripcio', component: EditRegistrationComponent},
  { path: 'editar-inscripcio-autentificacio', component: EditarEquipAuthComponent},
  { path: '**', redirectTo: '/countdown', pathMatch: 'full' },
];
