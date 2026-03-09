import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ClubDropdownComponent } from "../utils/club-dropdown/club-dropdown.component";
import { CdkStep, CdkStepper } from '@angular/cdk/stepper';
import { PrevisualitzacioService } from '../serveis/previsualitzacio.service';
import { Categories, Sexe } from '../interfaces/ludi.interface';
import { environment } from '../../environments/environment';

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

  /** Modal shown when user selects Pre-mini category. */
  showPreminiModal = false;

  /** Message for Pre-mini info modal (price from env). */
  preminiModalMessage = `La categoria premini només participarà el diumenge i només la final serà després del show. La inscripció no inclou el dormir ni l'esmorzar de l'any passat. El preu per jugador és de ${environment.pricePerPlayerPremini}€.`;

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

  onCategoriaChange(value: string): void {
    if (value === Categories.PREMINI) {
      this.showPreminiModal = true;
    }
  }

  closePreminiModal(): void {
    this.showPreminiModal = false;
  }
}
