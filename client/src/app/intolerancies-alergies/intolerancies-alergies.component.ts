import { CdkStepper } from '@angular/cdk/stepper'
import { CommonModule } from '@angular/common'
import { Component } from '@angular/core'
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms'
import { PrevisualitzacioService } from '../serveis/previsualitzacio.service'

interface Intolerance {
  name: string
  count: number
}

@Component({
  selector: 'app-intolerancies-alergies',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './intolerancies-alergies.component.html',
  styleUrl: './intolerancies-alergies.component.css',
})
export class IntoleranciesAlergiesComponent {
  observacions: FormGroup
  intoleranceForm: FormGroup
  intolerancesList: Intolerance[] = []

  constructor(
    private fb: FormBuilder,
    private stepper: CdkStepper,
    private previService: PrevisualitzacioService
  ) {
    this.intoleranceForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      count: ['', [Validators.required, Validators.min(1)]],
    })

    this.observacions = this.fb.group({
      observacio: [''],
    })
  }

  addIntolerance(): void {
    if (this.intoleranceForm.valid) {
      const newIntolerance: Intolerance = {
        name: this.intoleranceForm.value.name,
        count: this.intoleranceForm.value.count,
      }

      this.intolerancesList.push(newIntolerance)
      this.intoleranceForm.reset()
    } else {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.intoleranceForm.controls).forEach(key => {
        this.intoleranceForm.get(key)?.markAsTouched()
      })
    }
  }

  removeIntolerance(index: number): void {
    this.intolerancesList.splice(index, 1)
  }

  nextStep() {
    this.previService.setFormData({ intolerancies: this.intolerancesList })
    this.previService.setFormData({ observacions: this.observacions.value })
    this.stepper.next()
  }

  previStep() {
    this.stepper.previous()
  }
}
