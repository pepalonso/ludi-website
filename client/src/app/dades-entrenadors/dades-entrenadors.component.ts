import { CdkStepper } from '@angular/cdk/stepper';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TallaSamarreta } from '../interfaces/ludi.interface';
import { PrevisualitzacioService } from '../serveis/previsualitzacio.service';

@Component({
  selector: 'app-dades-entrenadors',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './dades-entrenadors.component.html',
  styleUrl: './dades-entrenadors.component.css',
})
export class DadesEntrenadorsComponent {
  entrenadorForm: FormGroup;
  entrenadores: any[] = [];

  //tallas = ['S', 'M', 'L', 'XL', 'XXL'];
  tallas = Object.values(TallaSamarreta);

  constructor(
    private fb: FormBuilder, 
    private stepper: CdkStepper,
    private previService: PrevisualitzacioService
  ) {
    this.entrenadorForm = this.fb.group({
      nom: ['', Validators.required],
      cognoms: ['', Validators.required],
      tallaSamarreta: ['', Validators.required],
      esPrincipal: [false]
    });
  }

  agregarEntrenador() {
    if (this.entrenadorForm.valid && this.entrenadores.length < 2) {
      this.entrenadores.push(this.entrenadorForm.value);
      this.entrenadorForm.reset();
    } else if (this.entrenadores.length >= 2) {
      alert('Solo se pueden agregar 2 entrenadores.');
    }
  }

  eliminarEntrenador(index: number) {
    this.entrenadores.splice(index, 1);
  }

  nextStep() {
    this.previService.setFormData({entrenadors: this.entrenadores});
    this.stepper.next();
  }
}
