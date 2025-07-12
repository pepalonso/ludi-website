import { Component } from '@angular/core'
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  Validators,
} from '@angular/forms'
import { CommonModule } from '@angular/common'
import { ReactiveFormsModule } from '@angular/forms'
import { TeamData, JugadorData, ApiResponse } from '../../interfaces/ludi3x3.interface'
import { environment } from '../../../environments/environment'
import { MatIconModule } from '@angular/material/icon'
import { DateTime } from 'luxon'

@Component({
  selector: 'app-ludi3x3',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  templateUrl: './ludi3x3.component.html',
  styleUrls: ['./ludi3x3.component.css'],
})
export class Ludi3x3Component {
  teamForm: FormGroup
  jugadorForm: FormGroup
  playersList: Array<any> = []
  loading: boolean = false
  errorMessage: string = ''
  apiResponse: ApiResponse | undefined

  constructor(private fb: FormBuilder) {
    this.teamForm = this.fb.group({
      teamName: ['', Validators.required],
      contactPhone: ['', [Validators.required, Validators.pattern(/^\d{9}$/)]],
      contactEmail: ['', [Validators.required, Validators.email]],
    })
    this.jugadorForm = this.fb.group({
      playerName: ['', Validators.required],
      birthDate: ['', [Validators.required, this.validadorEdatMinima(15)]],
      pantsSize: ['', Validators.required],
    })
  }

  validadorEdatMinima(edatMinima: number) {
    return (control: AbstractControl): ValidationErrors | null => {
      const neixament = DateTime.fromISO(control.value)
      const avui = DateTime.now()
      const edatJugador = avui.diff(neixament, 'years').years
      return edatJugador >= edatMinima
        ? null
        : {
            minimumAge: {
              requiredAge: edatMinima,
              actualAge: Math.floor(edatJugador),
            },
          }
    }
  }

  getDateError(): string | null {
    const birthDateControl = this.jugadorForm.get('birthDate')

    if (birthDateControl?.hasError('required')) {
      return 'Es obligatori la data de naixement.' // The date of birth is required.
    }

    if (birthDateControl?.hasError('minimumAge')) {
      const requiredAge = birthDateControl.getError('minimumAge').requiredAge
      return `El jugador ha de tenir al menys ${requiredAge} anys.` // Player must be at least {requiredAge} years old.
    }

    return null
  }

  get players(): FormArray {
    return this.teamForm.get('players') as FormArray
  }

  get numeroJugadors(): number {
    return this.playersList.length
  }

  addPlayerToList() {
    if (this.jugadorForm.valid || this.playersList.length < 5) {
      this.playersList.push(this.jugadorForm.value)

      this.jugadorForm.reset()
    } else {
      this.jugadorForm.markAllAsTouched()
    }
  }

  editPlayer(player: JugadorData) {
    this.removePlayerFromList(player)
    this.jugadorForm.reset(player)
  }

  removePlayerFromList(player: JugadorData) {
    const index = this.playersList.indexOf(player)
    if (index !== -1) {
      this.playersList.splice(index, 1)
    }
  }

  async onSubmit() {
    this.loading = true
    const dissabled = true
    //Disable the form temporarly
    //if (this.teamForm.valid && this.playersList.length >= 3) {
    if (!dissabled) {
      const teamData: TeamData = {
        NOM_EQUIP: this.teamForm.value.teamName,
        NUMERO_CONTACTE: this.teamForm.value.contactPhone,
        MAIL_CONTACTE: this.teamForm.value.contactEmail,
        JUGADORS: this.playersList.map(jugador => ({
          NOM: jugador.playerName,
          NEIXAMENT: jugador.birthDate,
          TALLA_SAMARRETA: jugador.pantsSize,
        })),
      }

      try {
        const response = await fetch(`${environment.apiUrl}/put-item`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': `${environment.apiKey}`,
          },
          body: JSON.stringify(teamData),
        })

        this.apiResponse = await response.json()

        if (!response.ok) {
          throw new Error('Network response was not ok')
        }

        console.log(' api response', this.apiResponse)
        console.log('Form submitted successfully', this.apiResponse)
        this.showToast()
        this.teamForm.reset()
        this.jugadorForm.reset()
        this.playersList = []
        this.loading = false
        this.errorMessage = ''
      } catch (error) {
        this.loading = false
        console.error('Error submitting form', error)
        this.showToast2(`Error incrivint el equip: ${this.apiResponse?.message || ''}`)
      }
    } else {
      this.loading = false
      console.log('Form is invalid')
      //hotfix: temp fix to show error message
      //this.showToast2('El formulari no és vàlid. Comproveu els camps.');
      this.showToast2('El formulari actualment esta desactivat.')
    }
  }

  private showToast() {
    const toast = document.getElementById('toast')
    toast!.classList.add('show')
  }

  private showToast2(message: string) {
    this.errorMessage = message
    const toast = document.getElementById('toast2')
    toast!.classList.add('show2')
  }

  public closeToast() {
    const toast = document.getElementById('toast')
    toast!.classList.remove('show')
  }

  public closeToast2() {
    const toast = document.getElementById('toast2')
    toast!.classList.remove('show2')
  }
}
