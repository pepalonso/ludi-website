import { Component } from '@angular/core';
import { PrevisualitzacioService } from '../serveis/previsualitzacio.service';
import { CdkStepper } from '@angular/cdk/stepper';

@Component({
  selector: 'app-drets-imatge',
  standalone: true,
  imports: [],
  templateUrl: './drets-imatge.component.html',
  styleUrl: './drets-imatge.component.css'
})
export class DretsImatgeComponent {

  public habilitarNext: boolean = true;

  constructor(private previService: PrevisualitzacioService, private stepper: CdkStepper,){

  }
  downloadPDF(): void {
    const link = document.createElement('a');
    link.href = 'assets/Drets_Imatge_Ludibàsquet_2025.pdf';
    link.download = 'Drets_Imatge_Ludibàsquet_2025.pdf';
    link.click();
    this.habilitarNext = false;
  }

  nextStep() {
    // this.previService.setFormData({entrenadors: this.entrenadores});
    this.stepper.next();
  }

  previStep() {
    this.stepper.previous();
  }
}
