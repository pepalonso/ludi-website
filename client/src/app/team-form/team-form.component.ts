import { Component, forwardRef, OnInit } from '@angular/core'
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms'
import { ReactiveFormsModule } from '@angular/forms'
import { CommonModule } from '@angular/common'
import { SteperComponent } from '../steper/steper.component'
import { CdkStepperModule } from '@angular/cdk/stepper'
import { DadesGeneralsComponent } from '../dades-generals/dades-generals.component'
import { DadesJugadorsComponent } from '../dades-jugadors/dades-jugadors.component'
import { DadesEntrenadorsComponent } from '../dades-entrenadors/dades-entrenadors.component'
import { PrevisualitzacioComponent } from '../previsualitzacio/previsualitzacio.component'
import { FooterComponent } from '../utils/footer/footer.component'
import { FitxesJugadorsComponent } from '../fitxes-jugadors/fitxes-jugadors.component'
import { DretsImatgeComponent } from '../drets-imatge/drets-imatge.component'
import { IntoleranciesAlergiesComponent } from '../intolerancies-alergies/intolerancies-alergies.component'

export interface StepInterface {
  id: number
  name: string
}

@Component({
  selector: 'app-team-form',
  templateUrl: './team-form.component.html',
  styleUrls: ['./team-form.component.css'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    forwardRef(() => SteperComponent),
    FitxesJugadorsComponent,
    CdkStepperModule,
    DadesGeneralsComponent,
    DadesJugadorsComponent,
    DadesEntrenadorsComponent,
    PrevisualitzacioComponent,
    FooterComponent,
    DretsImatgeComponent,
    IntoleranciesAlergiesComponent,
  ],
})
export class TeamFormComponent implements OnInit {
  teamForm: FormGroup

  public steps!: Array<StepInterface>

  constructor(private fb: FormBuilder) {
    this.teamForm = this.fb.group({
      nomEquip: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telefon: ['', Validators.required],
      sexe: ['', Validators.required],
      club: ['', Validators.required],
      intolerancies: [''],
      jugadors: this.fb.array([]),
      entrenadors: this.fb.array([]),
    })
  }

  ngOnInit(): void {
    this.addPlayer()
    this.addCoach()
    this.agregarSteps()
  }

  get players(): FormArray {
    return this.teamForm.get('jugadors') as FormArray
  }

  get coaches(): FormArray {
    return this.teamForm.get('entrenadors') as FormArray
  }

  addPlayer(): void {
    const playerForm = this.fb.group({
      nom: ['', Validators.required],
      cognoms: ['', Validators.required],
      tallaSamarreta: ['', Validators.required],
    })
    this.players.push(playerForm)
  }

  removePlayer(index: number): void {
    this.players.removeAt(index)
  }

  addCoach(): void {
    const coachForm = this.fb.group({
      nom: ['', Validators.required],
      cognoms: ['', Validators.required],
      tallaSamarreta: ['', Validators.required],
      esPrincipal: [false],
    })
    this.coaches.push(coachForm)
  }

  removeCoach(index: number): void {
    this.coaches.removeAt(index)
  }

  onClubSelected(selectedClub: string): void {
    this.teamForm.patchValue({ club: selectedClub })
  }

  onSubmit(): void {
    if (this.teamForm.valid) {
      const formValue = this.teamForm.value
      formValue.intolerancies = formValue.intolerancies
        ? formValue.intolerancies.split(',').map((s: string) => s.trim())
        : []
      console.log('Team Form Submitted:', formValue)
    } else {
      console.log('Form is invalid')
    }
  }

  private agregarSteps() {
    this.steps = [
      {
        id: 0,
        name: 'Dades Generals',
      },
      {
        id: 1,
        name: 'Dades Jugadors',
      },
      {
        id: 2,
        name: 'Fitxes Jugadors',
      },
      {
        id: 3,
        name: 'Dades Entrenadors',
      },
      {
        id: 4,
        name: 'Intoleràncies',
      },
      {
        id: 5,
        name: 'Documents',
      },
      {
        id: 6,
        name: 'Resum',
      },
    ]
  }
}
