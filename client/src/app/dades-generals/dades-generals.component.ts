import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ClubDropdownComponent } from "../utils/club-dropdown/club-dropdown.component";

@Component({
  selector: 'app-dades-generals',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, ClubDropdownComponent],
  templateUrl: './dades-generals.component.html',
  styleUrl: './dades-generals.component.css'
})
export class DadesGeneralsComponent {
  dadesForm: FormGroup;

  categories = ['Escoleta', 'Pre-mini', 'Mini', 'Pre-infantil', 'Infantil', 'Cadet', 'Júnior'];
  sexes = ['Masculí', 'Femení'];

  constructor(private fb: FormBuilder) {
    this.dadesForm = this.fb.group({
      club: ['', Validators.required],
      categoria: ['', Validators.required],
      sexe: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telefon: ['', [Validators.required, Validators.pattern('^[0-9]{9,15}$')]]
    });
  }

  onSubmit() {
    if (this.dadesForm.valid) {
      console.log('Form Data:', this.dadesForm.value);
    } else {
      console.log('Form is invalid');
    }
  }
}
