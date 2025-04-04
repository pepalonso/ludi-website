import { Component, Input } from '@angular/core';
import { Sexe, TallaSamarreta, Team } from '../../interfaces/ludi.interface';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-team-desktop',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './detalls-equip-desktop.component.html',
  styleUrl: './detalls-equip-desktop.component.css',
})
export class TeamDesktopComponent {
  public TallaSamarreta = TallaSamarreta;
  public Sexe = Sexe;

  public showToast: boolean = false;
  public toastMessage: string = '';
  public toastType: 'success' | 'error' = 'success';

  @Input() team!: Team;
  @Input() token?: string;

  constructor(private router: Router) {}

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

    return {
      account: 'ES70 2100 8118 8023 0004 2564',
      import: `${
        50 * this.team.jugadors.length + 10 * this.team.entrenadors.length
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
    if (this.token) {
      this.router.navigate(['/edit-team'], {
        queryParams: { token: this.token },
      });
    }
  }
}
