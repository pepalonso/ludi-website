import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FooterComponent } from '../utils/footer/footer.component';
import { Sexe, Team } from '../interfaces/ludi.interface';
import { RegistrationStateService } from '../serveis/registration-data.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface RegistrationProps {
  message: string;
  teamId: string;
  registrationUrl: string;
  registrationPath: string;
  waToken: string;
}

interface NotificationPayload {
  wa_number: string;
  path: string;
  team_name: string;
  club_name: string;
  num_players: string;
  num_coaches: string;
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
    waToken: '',
  };
  public numPlayers?: number;
  public numEntrenadors?: number;
  public teamName?: string;
  public imageUrl?: string;
  public categoria?: string;
  public sexe?: Sexe;
  public club?: string;
  public telefon?: string;

  private _waToken: string = '';
  public showToast: boolean = false;
  public toastMessage: string = '';
  public toastType: 'success' | 'error' = 'success';

  private inscriptionPriceJugadors = 50;
  private inscriptionPriceEntrenadors = 10;
  private priceErrorMessage = `Per saber l'import posat en contacte amb nosaltres`;

  paymentInfo = {
    accountNumber: 'ES12 3456 7890 1234 5678 9012',
    amount: '0€',
    concept: '',
  };

  public constructor(
    private router: Router,
    private registrationStateService: RegistrationStateService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    let state = this.router.getCurrentNavigation()?.extras.state;

    if (!state) {
      state = this.registrationStateService.state;
    }

    if (state) {
      console.log('Registration state:', state);
      this._waToken = state['wa_token'] || '';

      this.registration = {
        message: 'Inscripció realitzada correctament',
        teamId: state['team_id'] || '123456',
        registrationUrl: state['registration_url'] || '',
        registrationPath: state['registration_path'] || '/equip',
        waToken: this._waToken,
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
      this.sendNotification();
    } else {
      console.error('No registration state available');
      alert(
        "La teva incscripció s'ha pogut realitzar correctament 🎉 \nPer a més informació posa't en contacte amb nosaltres"
      );
      this.router.navigate(['/inscripcions']);
    }

    console.log('Registration data:', this.registration);
    console.log('WhatsApp token:', this._waToken);
  }

  private updatePaymentConcept() {
    this.paymentInfo.amount =
      this.numPlayers && this.numEntrenadors
        ? (
            this.numPlayers * this.inscriptionPriceJugadors +
            this.numEntrenadors * this.inscriptionPriceEntrenadors
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

  private sendNotification() {
    if (!this.telefon || !this.registration.registrationPath) {
      console.error('Missing required data for notification');
      this.showToastMessage("No s'ha pogut enviar la notificació", 'error');
      return;
    }

    const formattedPhone =
      '34' + this.telefon.replace(/\s+/g, '').replace(/^\+/, '');

    const payload: NotificationPayload = {
      wa_number: formattedPhone,
      path: this.registration.registrationPath,
      team_name: this.teamName || `${this.categoria} ${this.sexe}`,
      club_name: this.club || 'No especificat',
      num_players: this.numPlayers?.toString() || '0',
      num_coaches: this.numEntrenadors?.toString() || '0',
    };

    console.log('Sending notification with payload:', payload);

    const url = `https://${environment.apiUrl}/enviar-notificacio`;
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this._waToken}`,
    });

    this.http.post(url, payload, { headers }).subscribe({
      next: (response) => {
        console.log('Notification sent successfully:', response);
        this.showToastMessage('Notificació enviada correctament', 'success');
      },
      error: (error) => {
        console.error('Error sending notification:', error);
        this.showToastMessage("No s'ha pogut enviar la notificació", 'error');
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

  public navigateTeamDetails() {
    if (this.registration.registrationPath) {
      this.router.navigate([this.registration.registrationPath]);
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
