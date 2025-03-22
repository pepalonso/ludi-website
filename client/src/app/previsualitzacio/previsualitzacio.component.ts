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
     categoria: Categories.MINI,
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
     fitxes: ['exaple']
   };
  //public team!: Team;
  public isDesktop: boolean = false;
  public apiResponse: any;

  constructor(private breakpointObserver: BreakpointObserver, private previService: PrevisualitzacioService, private stepper: CdkStepper,) {}

  ngOnInit() {
    this.breakpointObserver
      .observe([Breakpoints.Handset])
      .subscribe((result) => {
        this.isDesktop = !result.matches;
      });

    this.previService.getFormData().subscribe(data => {
      if(data.value){
        this.team = data.value;
        this.team.logoUrl = CLUBS_DATA.find((club) => club.club_name === this.team.club)?.logo_url;
      }
      if(data.entrenadors){
        this.team.entrenadors = data.entrenadors;
      }
      if(data.jugadors){
        this.team.jugadors = data.jugadors;
      }
      if(data.intolerancies) {
        this.team.intolerancies = data.intolerancies;
      }
      if(data.fitxes){
        this.team.fitxes = data.fitxes;
      }
      console.log('Datos de previsualización:', data.value);
    });
  }

  async enviarForm() {
    console.log('Enviando formulario', this.team);

    try{
      const response = await fetch(`https://${environment.apiUrl}/registrar-incripcio`, {
        method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': `${environment.apiKey}`,
          },
          body: JSON.stringify(this.team),
        });

        this.apiResponse = await response.json();

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
    }catch(error){
      console.error('Error submitting form', error);
    }

  }

  previStep() {
    this.stepper.previous();
  }
}
