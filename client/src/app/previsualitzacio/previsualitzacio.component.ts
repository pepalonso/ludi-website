import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import type { Team } from '../interfaces/ludi.interface';
import { TeamMobileComponent } from '../detalls-equip/mobile/detalls-equip-monile.component';
import { TeamDesktopComponent } from '../detalls-equip/desktop/detalls-equip-desktop.component';
import { PrevisualitzacioService } from '../serveis/previsualitzacio.service';
import { CdkStepper } from '@angular/cdk/stepper';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';
import { getUrlImage } from '../detalls-equip/data-mapper';
import {
  HttpClient,
  HttpHeaders,
   HttpErrorResponse,
} from '@angular/common/http';
import { RegistrationStateService } from '../serveis/registration-data.service';

@Component({
  selector: 'app-previsualitzacio',
  standalone: true,
  imports: [CommonModule, TeamMobileComponent, TeamDesktopComponent],
  templateUrl: './previsualitzacio.component.html',
  styleUrl: './previsualitzacio.component.css',
})
export class PrevisualitzacioComponent {
  public team!: Team;
  public isDesktop = false;
  public apiResponse: any;
  public isSubmitting = false;
  public errorMessage: string | null = null;
  public contactPhone = '659173158';

  // Toast properties
  public showToast = false;
  public toastMessage = '';
  public toastType: 'success' | 'error' = 'error';

  constructor(
    private breakpointObserver: BreakpointObserver,
    private previService: PrevisualitzacioService,
    private stepper: CdkStepper,
    private router: Router,
    private http: HttpClient,
    private registrationStateService: RegistrationStateService
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
    if (this.isSubmitting) return;

    this.isSubmitting = true;
    this.errorMessage = null;

    if (this.team.fitxes) {
      this.team.fitxes = this.team.fitxes.map((fitxa) =>
        fitxa.normalize('NFC')
      );
    }

    const payload = {
      ...this.team,
      intolerancies: this.team.intolerancies?.flatMap((item) =>
        Array(item.count).fill(item.name)
      ),
    };

    const url = `https://${environment.apiUrl}/registrar-incripcio`;
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });

    this.http.post(url, payload, { headers }).subscribe({
      next: (response: any) => {
        this.isSubmitting = false;
        const { registration_url, registration_path, wa_token } = response;

        const state = {
          registration_url,
          registration_path,
          wa_token,
          team: this.team,
        };

        console.log('Registration successful', state);

        this.registrationStateService.state = state;
        this.router.navigate(['/inscripcio-completa'], {
          state: state,
        });
      },
      error: (error: HttpErrorResponse) => {
        this.isSubmitting = false;
        console.error('Error submitting form', error);

        let errorMsg =
          'Hi ha hagut un error en processar la sol·licitud. Si us plau, contacta amb el suport.';

        if (error.status === 400) {
          if (error.error && typeof error.error === 'object') {
            if (error.error.message) {
              errorMsg = error.error.message;
            } else if (error.error.error) {
              errorMsg = error.error.error;
            } else if (error.error.detail) {
              errorMsg = error.error.detail;
            }
          }

          this.showToastMessage(errorMsg, 'error');
        } else {
          this.errorMessage = errorMsg;
        }
      },
    });
  }

  public showToastMessage(message: string, type: 'success' | 'error') {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;

    setTimeout(() => {
      this.showToast = false;
    }, 5000);
  }

  public hideToast() {
    this.showToast = false;
  }

  previStep() {
    this.stepper.previous();
  }

  getWhatsAppLink(): string {
    return `https://wa.me/${this.contactPhone}`;
  }
}
