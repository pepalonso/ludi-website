import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ClubDropdownComponent } from "../utils/club-dropdown/club-dropdown.component";
import { CdkStep, CdkStepper } from '@angular/cdk/stepper';
import { PrevisualitzacioService } from '../serveis/previsualitzacio.service';
import { Categories, Sexe } from '../interfaces/ludi.interface';

@Component({
  selector: 'app-dades-generals',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, ClubDropdownComponent],
  templateUrl: './dades-generals.component.html',
  styleUrl: './dades-generals.component.css',
  providers: [{ provide: CdkStep, useExisting: CdkStepper }],
})
export class DadesGeneralsComponent {
  dadesForm: FormGroup;

  categories = Object.values(Categories);
  sexes = Object.values(Sexe);

  constructor(
    private fb: FormBuilder,
    private stepper: CdkStepper,
    private previService: PrevisualitzacioService
  ) {
    this.dadesForm = this.fb.group({
      club: ['', Validators.required],
      nomEquip: [''],
      categoria: ['', Validators.required],
      sexe: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telefon: ['', [Validators.required, Validators.pattern('^[0-9]{9}$')]],
    });
  }

  onSubmit() {
    if (this.dadesForm.valid) {
      console.log('Form Data:', this.dadesForm.value);
    } else {
      console.log('Form is invalid');
    }
  }

  nextStep() {
    this.previService.setFormData(this.dadesForm);
    this.stepper.next();
  }
}
