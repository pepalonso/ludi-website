import { Component, Input } from '@angular/core';
import {
  Categories,
  Sexe,
  TallaSamarreta,
  Team,
} from '../../interfaces/ludi.interface';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../serveis/auth.service';

@Component({
  selector: 'app-team-mobile',
  templateUrl: './detalls-equip-mobile.component.html',
  styleUrls: ['./detalls-equip-mobile.component.css'],
  imports: [CommonModule],
  standalone: true,
})
export class TeamMobileComponent {
  public TallaSamarreta = TallaSamarreta;
  public Sexe = Sexe;
  public showEditForm = false;
  public isAdmin = false;

  public showToast: boolean = false;
  public toastMessage: string = '';
  public toastType: 'success' | 'error' = 'success';
  @Input() team!: Team;
  @Input() token?: string;

  constructor(private router: Router, private authService: AuthService) {
    this.authService.user$.subscribe((user) => {
      this.isAdmin = user !== null;
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

  public paymentInfo() {
    if (!this.team) return { account: '', import: 0, concepte: '' };
    const pricePerPlayer = this.team.categoria === Categories.PREMINI ? 40 : 50;
    return {
      account: 'ES70 2100 8118 8023 0004 2564',
      import: `${
        pricePerPlayer * this.team.jugadors.length +
        10 * this.team.entrenadors.length
      } €`,
      concepte: `LUDIBÀSQUET 2025 - ${this.team.club || 'Equip'} - ${
        this.team.categoria
      } - ${this.team.sexe}`,
    };
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

  navigateToEdit() {
    if (this.token && this.team) {
      this.router.navigate(['/editar-inscripcio-autentificacio'], {
        queryParams: { token: this.token },
        state: { team: this.team },
      });
    }
  }
}
