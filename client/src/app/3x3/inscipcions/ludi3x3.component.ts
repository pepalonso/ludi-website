import { Component } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { TeamData } from '../../interfaces/team-data.interface';
import axios from 'axios';
import { environment } from '../../../environments/environment';
import { MatIconModule } from '@angular/material/icon';


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

  constructor(private fb: FormBuilder) {
    this.teamForm = this.fb.group({
      teamName: ['', Validators.required],
      players: this.fb.array([]), // Dynamically add players (3 to 5)
      contactPhone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      contactEmail: ['', [Validators.required, Validators.email]],
    });
    this.jugadorForm = this.fb.group({
      playerName: ['', Validators.required],
      birthDate: ['', Validators.required],
      shirtSize: ['', Validators.required]
    });
  }

  // Getter for players array
  get players(): FormArray {
    return this.teamForm.get('players') as FormArray;
  }

  addPlayerToList() {
    if (this.jugadorForm.valid) {
      // Agrega una copia del formulario del jugador a la lista
      this.playersList.push(this.jugadorForm.value);

      // Reinicia el formulario del jugador para que esté vacío nuevamente
      this.jugadorForm.reset();
    } else {
      // Marca todos los campos como "touched" para mostrar errores si no están llenos
      this.jugadorForm.markAllAsTouched();
    }
  }

  addPlayer() {
    const playerForm = this.fb.group({
      playerName: ['', Validators.required],
      birthDate: ['', Validators.required],
      shirtSize: ['', Validators.required]
    });

    this.players.push(playerForm);
  }

  savePlayer(i: number) {
    const playerData = this.players.at(i).value; // Obtiene los datos del jugador actual
    this.playersList.push(playerData); // Agrega los datos a la lista de jugadores
    this.players.removeAt(i); // Opcional: elimina el formulario de la lista
  }

  async onSubmit() {
    if (this.teamForm.valid) {
      const teamData: TeamData = {
        NOM_EQUIP: this.teamForm.value.teamName,
        NUMERO_CONTACTE: this.teamForm.value.contactPhone,
        MAIL_CONTACTE: this.teamForm.value.contactEmail,
        JUGADORS: this.players.value.map((player: any) => ({
          NOM: player.playerName,
          NEIXAMENT: player.birthDate,
          TALLA_SAMARRETA: player.shirtSize,
        })),
      };

      try {
        const response = await axios.post(
          environment.apiUrl + '/put-item',
          teamData,
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        console.log('Form submitted successfully', response.data);
      } catch (error) {
        console.error('Error submitting form', error);
      }
    } else {
      console.log('Form is invalid');
    }
  }
}
