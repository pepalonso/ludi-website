import { CdkStepper } from '@angular/cdk/stepper';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PrevisualitzacioService } from '../serveis/previsualitzacio.service';

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

  tallas = ['S', 'M', 'L', 'XL', 'XXL']; 

  constructor(private fb: FormBuilder, private stepper: CdkStepper, private previService: PrevisualitzacioService) {
    this.jugadorForm = this.fb.group({
      nom: ['', Validators.required],
      cognoms: ['', Validators.required],
      tallaSamarreta: ['', Validators.required]
    });

    // this.jugadores = [{
    //   nombre: 'aram',
    //   primerApellido: 'a',
    //   segundoApellido: 'a',
    //   talla: 'S'
    // },
    // {
    //   nombre: 'aram',
    //   primerApellido: 'a',
    //   segundoApellido: 'a',
    //   talla: 'S'
    // },
    // {
    //   nombre: 'aram',
    //   primerApellido: 'a',
    //   segundoApellido: 'a',
    //   talla: 'S'
    // }]
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
    this.previService.setFormData({jugadors: this.jugadores});
    this.stepper.next();
  }
}
