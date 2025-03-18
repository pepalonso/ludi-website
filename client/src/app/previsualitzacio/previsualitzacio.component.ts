import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { CdkStepper } from '@angular/cdk/stepper';
import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormArray, FormGroup } from '@angular/forms';
import { Sexe, TallaSamarreta, Team } from '../interfaces/ludi.interface';
import { TeamMobileComponent } from '../detalls-equip/mobile/detalls-equip-monile.component';
import { TeamDesktopComponent } from '../detalls-equip/desktop/detalls-equip-desktop.component';

@Component({
  selector: 'app-previsualitzacio',
  standalone: true,
  imports: [CommonModule, TeamMobileComponent, TeamDesktopComponent],
  templateUrl: './previsualitzacio.component.html',
  styleUrl: './previsualitzacio.component.css',
})
export class PrevisualitzacioComponent {
  public team: Team = {
    nomEquip: 'Equip Exemple',
    email: 'equip@exemple.com',
    telefon: '666777888',
    categoria: 'Cadet',
    sexe: Sexe.MASC,
    club: 'Club Esportiu Exemple',
    intolerancies: [
      { name: 'Gluten', count: 2 },
      { name: 'Lactosa', count: 1 },
    ],
    jugadors: [
      {
        nom: 'Marc',
        cognoms: 'Garcia Puig',
        tallaSamarreta: TallaSamarreta.M,
      },
      {
        nom: 'Laura',
        cognoms: 'Martínez Font',
        tallaSamarreta: TallaSamarreta.M,
      },
    ],
    entrenadors: [
      {
        nom: 'Joan',
        cognoms: 'Ferrer Sala',
        tallaSamarreta: TallaSamarreta.M,
        esPrincipal: 1,
      },
      {
        nom: 'Marta',
        cognoms: 'López Vidal',
        tallaSamarreta: TallaSamarreta.M,
        esPrincipal: 0,
      },
    ],
    logoUrl: 'assets/logo-exemple.png',
  };
  public isDesktop: boolean = false;

  constructor(private breakpointObserver: BreakpointObserver) {}

  ngOnInit() {
    this.breakpointObserver
      .observe([Breakpoints.Handset])
      .subscribe((result) => {
        this.isDesktop = !result.matches;
      });
  }
}
