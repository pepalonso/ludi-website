import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Categories, Sexe, TallaSamarreta, Team } from '../interfaces/ludi.interface';
import { TeamMobileComponent } from '../detalls-equip/mobile/detalls-equip-monile.component';
import { TeamDesktopComponent } from '../detalls-equip/desktop/detalls-equip-desktop.component';
import { PrevisualitzacioService } from '../serveis/previsualitzacio.service';
import { CdkStepper } from '@angular/cdk/stepper';
import { CLUBS_DATA } from '../data/club-data';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';
import { getUrlImage } from '../detalls-equip/data-mapper';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-previsualitzacio',
  standalone: true,
  imports: [CommonModule, TeamMobileComponent, TeamDesktopComponent],
  templateUrl: './previsualitzacio.component.html',
  styleUrl: './previsualitzacio.component.css',
})
export class PrevisualitzacioComponent {
  //public team: Team = {
  //  nomEquip: 'Equip Exemple',
  //  email: 'equip@exemple.com',
  //  telefon: '666777888',
  //  categoria: Categories.MINI,
  //  sexe: Sexe.MASC,
  //  club: 'Club Esportiu Exemple',
  //  intolerancies: [
  //    { name: 'Gluten', count: 2 },
  //    { name: 'Lactosa', count: 1 },
  //  ],
  //  jugadors: [
  //    {
  //      nom: 'Marc',
  //      cognoms: 'Garcia Puig',
  //      tallaSamarreta: TallaSamarreta.M,
  //    },
  //    {
  //      nom: 'Laura',
  //      cognoms: 'Martínez Font',
  //      tallaSamarreta: TallaSamarreta.M,
  //    },
  //  ],
  //  entrenadors: [
  //    {
  //      nom: 'Joan',
  //      cognoms: 'Ferrer Sala',
  //      tallaSamarreta: TallaSamarreta.M,
  //      esPrincipal: 1,
  //    },
  //    {
  //      nom: 'Marta',
  //      cognoms: 'López Vidal',
  //      tallaSamarreta: TallaSamarreta.M,
  //      esPrincipal: 0,
  //    },
  //  ],
  //  fitxes: ['exaple']
  //};
  public team!: Team;
  public isDesktop: boolean = false;
  public apiResponse: any;


  constructor(
    private breakpointObserver: BreakpointObserver,
    private previService: PrevisualitzacioService,
    private stepper: CdkStepper,
    private router: Router,
    private http: HttpClient,
  ) {}

  ngOnInit() {
    this.breakpointObserver
      .observe([Breakpoints.Handset])
      .subscribe((result) => {
        this.isDesktop = !result.matches;
      });

    this.previService.getFormData().subscribe((data) => {
      if (data.value) {
        this.team = data.value;
        this.team.logoUrl = getUrlImage(this.team.club);
      }
      if (data.entrenadors) {
        this.team.entrenadors = data.entrenadors;
      }
      if (data.jugadors) {
        this.team.jugadors = data.jugadors;
      }
      if (data.intolerancies) {
        this.team.intolerancies = data.intolerancies;
      }
      if (data.fitxes) {
        this.team.fitxes = data.fitxes;
      }
      console.log('Datos de previsualización:', data.value);
    });
  }

  enviarForm() {

    if (this.team.fitxes) {
      this.team.fitxes = this.team.fitxes.map((fitxa) =>
        fitxa.normalize('NFC')
      );
    }

    console.log('Enviando formulario', this.team);

    const url = `https://${environment.apiUrl}/registrar-incripcio`;
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });

    this.http.post(url, this.team, { headers }).subscribe({
      next: (response: any) => {
        const { registration_url, registration_path, wa_token } = response;
        this.apiResponse = { registration_url, registration_path, wa_token };

        console.log('Registration successful', this.apiResponse);

        this.router.navigate(['/registration-success'], {
          state: this.apiResponse,
        });
      },
      error: (error) => {
        console.error('Error submitting form', error);
      },
    });
  }

  previStep() {
    this.stepper.previous();
  }
}
