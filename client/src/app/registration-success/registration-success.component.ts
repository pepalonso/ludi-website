import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FooterComponent } from '../utils/footer/footer.component';
import { Sexe, Team } from '../interfaces/ludi.interface';

export interface RegistrationProps {
  message: string;
  teamId: string;
  registrationUrl: string;
  registrationPath: string;
  waToken: string;
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
  @Input() numPlayers?: number;
  @Input() teamName?: string;
  @Input() imageUrl?: string;
  @Input() categoria?: string;
  @Input() sexe?: Sexe;

  public constructor(private router: Router) {}

  private inscriptionPrice = 50;
  private priceErrorMessage = `Per saber l'import posat en cntacte amb nsaoltres`;

  // Payment information
  paymentInfo = {
    accountNumber: 'ES12 3456 7890 1234 5678 9012',
    amount: this.numPlayers
      ? (this.numPlayers * this.inscriptionPrice).toString() + '€'
      : this.priceErrorMessage,
    concept: `LUDIBÀSQUET 2025 - ${
      this.teamName
    }${this.numPlayers?.toString()}${this.registration.teamId}`,
  };

  public navigateTeamDetails() {
    this.router.navigate([this.registration.registrationPath]);
  }

  public copyToClipboard(value: string) {
    navigator.clipboard
      .writeText(value)
  }
}

