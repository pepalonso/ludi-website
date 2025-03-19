import { CdkStepper } from '@angular/cdk/stepper';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TallaSamarreta } from '../interfaces/ludi.interface';

@Component({
  selector: 'app-dades-jugadors',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './dades-jugadors.component.html',
  styleUrl: './dades-jugadors.component.css'
})
export class DadesJugadorsComponent {
  jugadorForm: FormGroup;
  jugadores: any[] = [];

  tallas = Object.values(TallaSamarreta);

  constructor(private fb: FormBuilder, private stepper: CdkStepper) {
    this.jugadorForm = this.fb.group({
      nombre: ['', Validators.required],
      primerApellido: ['', Validators.required],
      talla: ['', Validators.required]
    });

    this.jugadores = [{
      nombre: 'aram',
      primerApellido: 'a',
      segundoApellido: 'a',
      talla: 'S'
    },
    {
      nombre: 'aram',
      primerApellido: 'a',
      segundoApellido: 'a',
      talla: 'S'
    },
    {
      nombre: 'aram',
      primerApellido: 'a',
      segundoApellido: 'a',
      talla: 'S'
    }]
  }

  agregarJugador() {
    if (this.jugadorForm.valid) {
      this.jugadores.push(this.jugadorForm.value);
      this.jugadorForm.reset();
    }
  }

  eliminarJugador(index: number) {
    this.jugadores.splice(index, 1);
  }

  nextStep() {
    this.stepper.next();
  }
}
