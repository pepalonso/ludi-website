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

  get maxCoachesReached(): boolean {
    return this.entrenadores.length >= 3;
  }

  get duplicatePrincipal(): boolean {
    return (
      this.entrenadorForm.get('esPrincipal')?.value === true &&
      this.entrenadores.some((e) => e.esPrincipal === true)
    );
  }

  get thirdCoachPrincipalMissing(): boolean {
    return (
      this.entrenadores.length === 2 &&
      !this.entrenadores.some((e) => e.esPrincipal === true) &&
      this.entrenadorForm.get('esPrincipal')?.value === false
    );
  }

  agregarEntrenador() {
    if (
      this.entrenadorForm.valid &&
      !this.maxCoachesReached &&
      !this.duplicatePrincipal &&
      !this.thirdCoachPrincipalMissing
    ) {
      const entrenador = { ...this.entrenadorForm.value };
      if (entrenador.esPrincipal == null) {
        entrenador.esPrincipal = false;
      }
      this.entrenadores.push(entrenador);
      this.entrenadorForm.reset();
    } else {
      alert(
        'Hay errores en el formulario o se han cumplido las condiciones para no poder agregar más entrenadores.'
      );
    }
  }

  eliminarEntrenador(index: number) {
    this.entrenadores.splice(index, 1);
  }

  nextStep() {
    this.previService.setFormData({entrenadors: this.entrenadores});
    this.stepper.next();
  }

  previStep() {
    this.stepper.previous();
  }
}
