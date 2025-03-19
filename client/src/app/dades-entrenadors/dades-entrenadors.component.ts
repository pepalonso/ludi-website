import { CdkStepper } from '@angular/cdk/stepper';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TallaSamarreta } from '../interfaces/ludi.interface';

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

  constructor(private fb: FormBuilder, private stepper: CdkStepper) {
    this.entrenadorForm = this.fb.group({
      nombre: ['', Validators.required],
      primerApellido: ['', Validators.required],
      tallaCamiseta: ['', Validators.required],
      primerEntrenador: [false],
    });
  }

  get maxCoachesReached(): boolean {
    return this.entrenadores.length >= 3;
  }

  get duplicatePrincipal(): boolean {
    return (
      this.entrenadorForm.get('primerEntrenador')?.value === true &&
      this.entrenadores.some((e) => e.primerEntrenador === true)
    );
  }

  get thirdCoachPrincipalMissing(): boolean {
    return (
      this.entrenadores.length === 2 &&
      !this.entrenadores.some((e) => e.primerEntrenador === true) &&
      this.entrenadorForm.get('primerEntrenador')?.value === false
    );
  }

  agregarEntrenador() {
    if (
      this.entrenadorForm.valid &&
      !this.maxCoachesReached &&
      !this.duplicatePrincipal &&
      !this.thirdCoachPrincipalMissing
    ) {
      this.entrenadores.push(this.entrenadorForm.value);
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
    this.stepper.next();
  }
}
