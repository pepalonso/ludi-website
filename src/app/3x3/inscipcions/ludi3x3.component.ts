import { Component } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { TeamData } from '../../interfaces/team-data.interface';
import axios from 'axios';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-ludi3x3',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './ludi3x3.component.html',
  styleUrls: ['./ludi3x3.component.css'],
})
export class Ludi3x3Component {
  teamForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.teamForm = this.fb.group({
      teamName: ['', Validators.required],
      players: this.fb.array([]), // Dynamically add players (3 to 5)
      contactPhone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      contactEmail: ['', [Validators.required, Validators.email]],
    });

    this.addPlayer(); // Add initial players
  }

  // Getter for players array
  get players(): FormArray {
    return this.teamForm.get('players') as FormArray;
  }

  // Add a new player to the players array
  addPlayer() {
    if (this.players.length < 5) {
      this.players.push(
        this.fb.group({
          playerName: ['', Validators.required],
          birthDate: ['', Validators.required],
          shirtSize: ['', Validators.required],
        })
      );
    }
  }

  // Remove a player from the list
  removePlayer(index: number) {
    if (this.players.length > 3) {
      this.players.removeAt(index);
    }
  }

  async onSubmit() {
    if (this.teamForm.valid) {
      const teamData: TeamData = this.teamForm.value;

      try {
        const response = await axios.post(
          environment.apiUrl + '/put-item',
          teamData
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
