import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FooterComponent } from '../utils/footer/footer.component';
import { Categories, Sexe, Team } from '../interfaces/ludi.interface';
import { RegistrationStateService } from '../serveis/registration-data.service';
import { environment } from '../../environments/environment';

export interface RegistrationProps {
  message: string;
  teamId: string;
  registrationUrl: string;
  registrationPath: string;
}

@Component({
  selector: 'app-registration-success',
  standalone: true,
  imports: [CommonModule, FooterComponent],
  templateUrl: './registration-success.component.html',
  styleUrls: ['./registration-success.component.css'],
})
export class RegistrationSuccessComponent {
  @Input() registration: RegistrationProps = {
    message: 'Inscripció realitzada correctament',
    teamId: '123456',
    registrationUrl: '',
    registrationPath: '/equip',
  };
  public numPlayers?: number;
  public numEntrenadors?: number;
  public teamName?: string;
  public imageUrl?: string;
  public categoria?: string;
  public sexe?: Sexe;
  public club?: string;
  public telefon?: string;

  public showToast: boolean = false;
  public toastMessage: string = '';
  public toastType: 'success' | 'error' = 'success';

  private priceErrorMessage = `Per saber l'import posat en contacte amb nosaltres`;

  paymentInfo = {
    accountNumber: 'ES70 2100 8118 8023 0004 2564',
    amount: '0€',
    concept: '',
  };

  public constructor(
    private router: Router,
    private registrationStateService: RegistrationStateService
  ) {}

  ngOnInit(): void {
    let state = this.router.getCurrentNavigation()?.extras.state;

    if (!state) {
      state = this.registrationStateService.state;
    }

    if (state) {
      console.log('Registration state:', state);

      this.registration = {
        message: 'Inscripció realitzada correctament',
        teamId: state['team_id'] || '123456',
        registrationUrl: state['registration_url'] || '',
        registrationPath: state['registration_path'] || '/equip',
      };

      if (state['team']) {
        const team = state['team'];
        this.club = team.club;
        this.teamName = team.nomEquip;
        this.categoria = team.categoria;
        this.sexe = team.sexe;
        this.imageUrl = team.logoUrl;
        this.telefon = team.telefon;

        if (team.jugadors && Array.isArray(team.jugadors)) {
          console.log('Jugadors:', team.jugadors);
          this.numPlayers = team.jugadors.length;
        }
        if (team.entrenadors && Array.isArray(team.entrenadors)) {
          console.log('Entrenadors:', team.entrenadors);
          this.numEntrenadors = team.entrenadors.length;
        }
      }

      this.updatePaymentConcept();
    } else {
      console.error('No registration state available');
      alert(
        "La teva incscripció s'ha pogut realitzar correctament 🎉 \nPer a més informació posa't en contacte amb nosaltres"
      );
      this.router.navigate(['/inscripcions']);
    }
  }

  private updatePaymentConcept() {
    const pricePerPlayer =
      this.categoria === Categories.PREMINI
        ? environment.pricePerPlayerPremini
        : environment.pricePerPlayer;
    this.paymentInfo.amount =
      this.numPlayers && this.numEntrenadors
        ? (
            this.numPlayers * pricePerPlayer +
            this.numEntrenadors * environment.pricePerEntrenador
          ).toString() + '€'
        : this.priceErrorMessage;

    this.paymentInfo.concept = `LUDIBÀSQUET 2025 - ${this.club || 'Equip'} - ${
      this.categoria
    } - ${this.sexe}${
      this.registration.teamId
        ? ' - ID: ' + this.numPlayers + this.registration.teamId
        : ''
    }`;
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

  public navigateTeamDetails() {
    if (this.registration.registrationPath) {
      this.router.navigateByUrl(this.registration.registrationPath);
    }
  }

  public copyToClipboard(value: string) {
    navigator.clipboard
      .writeText(value)
      .then(() => {
        this.showToastMessage('Copiat al portapapers', 'success');
      })
      .catch((err) => {
        console.error('Error copying text: ', err);
        this.showToastMessage('Error al copiar', 'error');
      });
  }
}
