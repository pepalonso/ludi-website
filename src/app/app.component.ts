import { Component } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'ludi-front';
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

  // Submit form
  onSubmit() {
    if (this.teamForm.valid) {
      console.log(this.teamForm.value);
    } else {
      console.log('Form is invalid');
    }
  }
}
