import { Component } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { TeamData, JugadorData } from '../../interfaces/team-data.interface';
import { environment } from '../../../environments/environment';
import { MatIconModule } from '@angular/material/icon';
import { DateTime } from 'luxon';

@Component({
  selector: 'app-ludi3x3',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  templateUrl: './ludi3x3.component.html',
  styleUrls: ['./ludi3x3.component.css'],
})
export class Ludi3x3Component {
  teamForm: FormGroup;
  jugadorForm: FormGroup;
  playersList: Array<any> = [];
  loading: boolean = false;

  constructor(private fb: FormBuilder) {
    this.teamForm = this.fb.group({
      teamName: ['', Validators.required],
      contactPhone: ['', [Validators.required, Validators.pattern(/^\d{9}$/)]],
      contactEmail: ['', [Validators.required, Validators.email]],
    });
    this.jugadorForm = this.fb.group({
      playerName: ['', Validators.required],
      birthDate: ['', [Validators.required, this.validadorEdatMinima(15)]],
      pantsSize: ['', Validators.required],
    });
  }

  validadorEdatMinima(edatMinima: number) {
    return (control: AbstractControl): ValidationErrors | null => {
      const neixament = DateTime.fromISO(control.value);
      const avui = DateTime.now();
      const edatJugador = avui.diff(neixament, 'years').years;
      return edatJugador >= edatMinima
        ? null
        : {
            minimumAge: {
              requiredAge: edatMinima,
              actualAge: Math.floor(edatJugador),
            },
          };
    };
  }

  get players(): FormArray {
    return this.teamForm.get('players') as FormArray;
  }

  addPlayerToList() {
    if (this.jugadorForm.valid || this.playersList.length < 5) {
      this.playersList.push(this.jugadorForm.value);

      this.jugadorForm.reset();
    } else {
      this.jugadorForm.markAllAsTouched();
    }
  }

  editPlayer(player: JugadorData) {
    this.removePlayerFromList(player);
    this.jugadorForm.reset(player);
  }

  removePlayerFromList(player: JugadorData) {
    const index = this.playersList.indexOf(player);
    if (index !== -1) {
      this.playersList.splice(index, 1);
    }
  }

  async onSubmit() {
    this.loading = true;
    if (this.teamForm.valid && this.playersList.length >= 3) {
      const teamData: TeamData = {
        NOM_EQUIP: this.teamForm.value.teamName,
        NUMERO_CONTACTE: this.teamForm.value.contactPhone,
        MAIL_CONTACTE: this.teamForm.value.contactEmail,
        JUGADORS: this.playersList.map((jugador) => ({
          NOM: jugador.playerName,
          NEIXAMENT: jugador.birthDate,
          TALLA_SAMARRETA: jugador.pantsSize,
        })),
      };

      try {
        const response = await fetch(`${environment.apiUrl}/put-item`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(teamData),
        });

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const data = await response.json();
        console.log('Form submitted successfully', data);
        this.showToast();
        this.teamForm.reset();
        this.jugadorForm.reset();
        this.playersList = [];
        this.loading = false;
      } catch (error) {
        this.loading = false;
        console.error('Error submitting form', error);
        this.showToast2();
      }
    } else {
      this.loading = false;
      console.log('Form is invalid');
      this.showToast2();
    }
  }

  private showToast() {
    const toast = document.getElementById('toast');
    toast!.classList.add('show');
  }

  private showToast2() {
    const toast = document.getElementById('toast2');
    toast!.classList.add('show2');
  }

  public closeToast() {
    const toast = document.getElementById('toast');
    toast!.classList.remove('show');
  }

  public closeToast2() {
    const toast = document.getElementById('toast2');
    toast!.classList.remove('show2');
  }
}
