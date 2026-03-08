import { Component, OnInit, OnDestroy } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute, Router } from '@angular/router'
import { Entrenador, Jugador, TallaSamarreta, Team } from '../interfaces/ludi.interface'
import { mapTeamResponse } from '../detalls-equip/data-mapper'
import { environment } from '../../environments/environment'
import { interval, Subscription } from 'rxjs'
import { firstValueFrom } from 'rxjs'
import { ClubService } from '../utils/club-dropdown/club.service'
import { takeWhile } from 'rxjs/operators'

type EditOption =
  | 'player-add'
  | 'player-edit'
  | 'player-delete'
  | 'coach-add'
  | 'coach-edit'
  | 'coach-delete'
  | 'intolerancies'
  | 'observations'
  | 'none'

@Component({
  selector: 'app-edit-registration',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './editar-equip.component.html',
  styleUrls: ['./editar-equip.component.scss'],
})
export class EditRegistrationComponent implements OnInit, OnDestroy {
  public teamToken?: string
  public team?: Team
  public error: boolean = false
  public isLoading: boolean = true
  public isDesktop: boolean = false

  // Session token properties
  public sessionToken: string | null = null
  public tokenExpiryTime: number = 0
  public timeRemaining: number = 0
  public timerSubscription?: Subscription
  public showTimer: boolean = true
  public isTimerCritical: boolean = false

  public selectedOption: EditOption = 'none'
  public selectedPlayerId: number = -1
  public selectedCoachId: number = -1

  public newPlayer: Jugador = {
    nom: '',
    cognoms: '',
    tallaSamarreta: TallaSamarreta.M,
  }
  public newCoach: Entrenador = {
    nom: '',
    cognoms: '',
    tallaSamarreta: TallaSamarreta.M,
    esPrincipal: 0,
  }

  public newIntoleranceText: string = ''
  public observationsText: string = ''
  /** Allergies from GET /api/me/allergies (for DELETE by id) */
  public meAllergies: { id: number; description: string | null }[] = []

  public tallaSamarretaOptions = Object.values(TallaSamarreta)
  public isFormValid = false

  // Toast notification properties
  public showToast: boolean = false
  public toastMessage: string = ''
  public toastType: 'success' | 'error' = 'success'

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private clubService: ClubService
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.teamToken = params['token'] || null
      if (this.teamToken) {
        this.fetchTeamDetails(this.teamToken)
        this.initializeSessionToken()
      } else {
        this.error = true
        this.isLoading = false
        this.showToastNotification("No s'ha trobat el token de l'equip", 'error')
      }
    })
  }

  ngOnDestroy() {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe()
    }
  }

  private initializeSessionToken() {
    // Get session token from sessionStorage
    this.sessionToken = sessionStorage.getItem('session_token')
    const expiryString = sessionStorage.getItem('token_expiry')

    if (this.sessionToken && expiryString) {
      this.tokenExpiryTime = parseInt(expiryString, 10)
      this.startExpiryTimer()
    } else {
      // If no session token is found, we'll continue using teamToken
      this.showToastNotification("No s'ha trobat un token de sessió vàlid", 'error')
    }
  }

  private startExpiryTimer() {
    // Calculate initial time remaining
    this.updateTimeRemaining()

    // Start a timer that updates every second
    this.timerSubscription = interval(1000)
      .pipe(takeWhile(() => this.timeRemaining > 0))
      .subscribe(() => {
        this.updateTimeRemaining()

        // Check if time is critical (less than 5 minutes)
        this.isTimerCritical = this.timeRemaining < 5 * 60 * 1000

        // Handle expiration
        if (this.timeRemaining <= 0) {
          this.handleTokenExpiration()
        }
      })
  }

  private updateTimeRemaining() {
    const now = new Date().getTime()
    this.timeRemaining = Math.max(0, this.tokenExpiryTime - now)
  }

  private handleTokenExpiration() {
    sessionStorage.removeItem('session_token')
    sessionStorage.removeItem('token_expiry')

    this.showToastNotification('La sessió ha expirat. Redirigint...', 'error')

    setTimeout(() => {
      this.router.navigate(['/equip'], {
        queryParams: { token: this.teamToken },
      })
    }, 2000)
  }

  // Format the remaining time as mm:ss
  public formatTimeRemaining(): string {
    const totalSeconds = Math.floor(this.timeRemaining / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  private async fetchTeamDetails(token: string): Promise<void> {
    this.isLoading = true
    const base = environment.apiBaseUrl
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    }

    try {
      const clubs = await firstValueFrom(this.clubService.loadClubs())
      const response = await fetch(`${base}/api/me/team`, { method: 'GET', headers })
      if (!response.ok) {
        console.error('Error fetching team details:', response.statusText)
        this.error = true
        this.isLoading = false
        this.showToastNotification("Error carregant les dades de l'equip", 'error')
        return
      }
      const responseData = await response.json()
      this.team = await mapTeamResponse(responseData, clubs)
      this.observationsText = this.team.observacions || ''
      await this.fetchMeAllergies(token)
      this.isLoading = false
    } catch (error) {
      this.error = true
      this.isLoading = false
      console.error('Error fetching team details:', error)
      this.showToastNotification("Error carregant les dades de l'equip", 'error')
    }
  }

  private async fetchMeAllergies(token: string): Promise<void> {
    try {
      const base = environment.apiBaseUrl
      const response = await fetch(`${base}/api/me/allergies`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) return
      const list = (await response.json()) as { id: number; description?: string | null }[]
      this.meAllergies = Array.isArray(list)
        ? list.map(a => ({ id: a.id, description: a.description ?? null }))
        : []
    } catch {
      this.meAllergies = []
    }
  }

  // Helper method to get the appropriate token for requests.
  // Always read from sessionStorage so we use the latest token (avoids stale in-memory token
  // when another tab validated or when init ran before sessionStorage was set after redirect).
  private getAuthToken(): string {
    const stored = sessionStorage.getItem('session_token')
    if (stored) {
      this.sessionToken = stored
      const expiryStr = sessionStorage.getItem('token_expiry')
      if (expiryStr) this.tokenExpiryTime = parseInt(expiryStr, 10)
      return stored
    }
    return this.teamToken || ''
  }

  onOptionChange() {
    // Reset form state when changing options
    this.selectedPlayerId = -1
    this.selectedCoachId = -1
    this.resetNewPlayerForm()
    this.resetNewCoachForm()
    this.newIntoleranceText = ''
    this.validateForm()
  }

  // Player methods
  resetNewPlayerForm() {
    this.newPlayer = { nom: '', cognoms: '', tallaSamarreta: TallaSamarreta.M }
  }

  selectPlayerToEdit(index: number) {
    this.selectedPlayerId = index
    if (this.team && index >= 0 && index < this.team.jugadors.length) {
      const player = this.team.jugadors[index]
      this.newPlayer = { ...player }
    }
    this.validateForm()
  }

  async addPlayer() {
    if (!this.team) return
    if (this.newPlayer.nom && this.newPlayer.cognoms) {
      try {
        const base = environment.apiBaseUrl
        const response = await fetch(`${base}/api/me/players`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.getAuthToken()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            first_name: this.newPlayer.nom,
            last_name: this.newPlayer.cognoms,
            shirt_size: this.newPlayer.tallaSamarreta,
          }),
        })
        if (!response.ok) throw new Error('Failed to add player')
        if (!this.teamToken) {
          this.showToastNotification("Error: No es pot actualitzar l'equip", 'error')
          return
        }
        await this.fetchTeamDetails(this.teamToken)
        this.resetNewPlayerForm()
        this.showToastNotification('Jugador afegit correctament', 'success')
      } catch (error) {
        console.error('Error adding player:', error)
        this.showToastNotification('Error afegint jugador', 'error')
      }
    }
  }

  async updatePlayer() {
    if (!this.team) return
    if (this.selectedPlayerId >= 0 && this.newPlayer.nom && this.newPlayer.cognoms) {
      try {
        const base = environment.apiBaseUrl
        const player = this.team.jugadors[this.selectedPlayerId]
        const playerId = typeof player.id === 'number' ? player.id : Number(player.id)
        const response = await fetch(`${base}/api/me/players/${playerId}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${this.getAuthToken()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            first_name: this.newPlayer.nom,
            last_name: this.newPlayer.cognoms,
            shirt_size: this.newPlayer.tallaSamarreta,
          }),
        })
        if (!response.ok) throw new Error('Failed to update player')
        await this.fetchTeamDetails(this.teamToken!)
        this.resetNewPlayerForm()
        this.selectedPlayerId = -1
        this.showToastNotification('Jugador actualitzat correctament', 'success')
      } catch (error) {
        console.error('Error updating player:', error)
        this.showToastNotification('Error actualitzant jugador', 'error')
      }
    }
  }

  async deletePlayer(index: number) {
    if (!this.team) return
    try {
      const base = environment.apiBaseUrl
      const player = this.team.jugadors[index]
      const playerId = typeof player.id === 'number' ? player.id : Number(player.id)
      const response = await fetch(`${base}/api/me/players/${playerId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${this.getAuthToken()}` },
      })
      if (!response.ok) throw new Error('Failed to delete player')
      await this.fetchTeamDetails(this.teamToken!)
      this.showToastNotification('Jugador eliminat correctament', 'success')
    } catch (error) {
      console.error('Error deleting player:', error)
      this.showToastNotification('Error eliminant jugador', 'error')
    }
  }

  // Coach methods
  resetNewCoachForm() {
    this.newCoach = {
      nom: '',
      cognoms: '',
      tallaSamarreta: TallaSamarreta.M,
      esPrincipal: 0,
    }
  }

  selectCoachToEdit(index: number) {
    this.selectedCoachId = index
    if (this.team && index >= 0 && index < this.team.entrenadors.length) {
      const coach = this.team.entrenadors[index]
      this.newCoach = { ...coach }
    }
    this.validateForm()
  }

  async addCoach() {
    if (!this.team) return
    if (this.newCoach.nom && this.newCoach.cognoms) {
      if (this.newCoach.esPrincipal === 1 && this.team.entrenadors.some(e => e.esPrincipal === 1)) {
        this.showToastNotification('Ja existeix un entrenador principal', 'error')
        return
      }
      try {
        const base = environment.apiBaseUrl
        const response = await fetch(`${base}/api/me/coaches`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.getAuthToken()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            first_name: this.newCoach.nom,
            last_name: this.newCoach.cognoms,
            shirt_size: this.newCoach.tallaSamarreta,
            is_head_coach: this.newCoach.esPrincipal === 1,
            phone: this.team.telefon,
          }),
        })
        if (!response.ok) throw new Error('Failed to add coach')
        await this.fetchTeamDetails(this.teamToken!)
        this.resetNewCoachForm()
        this.showToastNotification('Entrenador afegit correctament', 'success')
      } catch (error) {
        console.error('Error adding coach:', error)
        this.showToastNotification('Error afegint entrenador', 'error')
      }
    }
  }

  async updateCoach() {
    if (!this.team) return
    if (this.selectedCoachId >= 0 && this.newCoach.nom && this.newCoach.cognoms) {
      const isPrincipalChange =
        this.newCoach.esPrincipal === 1 &&
        this.team.entrenadors[this.selectedCoachId].esPrincipal !== 1
      if (
        isPrincipalChange &&
        this.team.entrenadors.some((e, i) => e.esPrincipal === 1 && i !== this.selectedCoachId)
      ) {
        this.showToastNotification('Ja existeix un entrenador principal', 'error')
        return
      }
      try {
        const base = environment.apiBaseUrl
        const coach = this.team.entrenadors[this.selectedCoachId]
        const coachId = typeof coach.id === 'number' ? coach.id : Number(coach.id)
        const response = await fetch(`${base}/api/me/coaches/${coachId}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${this.getAuthToken()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            first_name: this.newCoach.nom,
            last_name: this.newCoach.cognoms,
            shirt_size: this.newCoach.tallaSamarreta,
            is_head_coach: this.newCoach.esPrincipal === 1,
            phone: this.team.telefon,
          }),
        })
        if (!response.ok) throw new Error('Failed to update coach')
        await this.fetchTeamDetails(this.teamToken!)
        this.resetNewCoachForm()
        this.selectedCoachId = -1
        this.showToastNotification('Entrenador actualitzat correctament', 'success')
      } catch (error) {
        console.error('Error updating coach:', error)
        this.showToastNotification('Error actualitzant entrenador', 'error')
      }
    }
  }

  async deleteCoach(index: number) {
    if (!this.team) return
    const coach = this.team.entrenadors[index]
    if (coach.esPrincipal === 1) {
      this.showToastNotification("No es pot eliminar l'entrenador principal", 'error')
      return
    }
    try {
      const base = environment.apiBaseUrl
      const coachId = typeof coach.id === 'number' ? coach.id : Number(coach.id)
      const response = await fetch(`${base}/api/me/coaches/${coachId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${this.getAuthToken()}` },
      })
      if (!response.ok) throw new Error('Failed to delete coach')
      await this.fetchTeamDetails(this.teamToken!)
      this.showToastNotification('Entrenador eliminat correctament', 'success')
    } catch (error) {
      console.error('Error deleting coach:', error)
      this.showToastNotification('Error eliminant entrenador', 'error')
    }
  }

  // Intolerances methods (allergies: POST /api/me/allergies, DELETE /api/me/allergies/{id})
  async addIntolerance() {
    if (!this.team) return
    if (!this.newIntoleranceText.trim()) return
    const firstPlayer = this.team.jugadors[0]
    if (!firstPlayer) {
      this.showToastNotification("Afegiu almenys un jugador abans d'afegir intoleràncies", 'error')
      return
    }
    try {
      const base = environment.apiBaseUrl
      const playerId = typeof firstPlayer.id === 'number' ? firstPlayer.id : Number(firstPlayer.id)
      const response = await fetch(`${base}/api/me/allergies`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.getAuthToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          player_id: playerId,
          description: this.newIntoleranceText.trim(),
        }),
      })
      if (!response.ok) throw new Error('Failed to add allergy')
      if (this.teamToken) await this.fetchTeamDetails(this.teamToken)
      this.newIntoleranceText = ''
      this.showToastNotification('Intolerància afegida correctament', 'success')
    } catch (error) {
      console.error('Error adding allergy:', error)
      this.showToastNotification('Error afegint intolerància', 'error')
    }
  }

  async decrementIntolerance(index: number) {
    if (!this.team?.intolerancies || index < 0 || index >= this.team.intolerancies.length) return
    const name = this.team.intolerancies[index].name
    const allergy = this.meAllergies.find(a => (a.description || '').trim() === name)
    if (!allergy) {
      this.showToastNotification("No s'ha trobat la intolerància", 'error')
      return
    }
    try {
      const base = environment.apiBaseUrl
      const response = await fetch(`${base}/api/me/allergies/${allergy.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${this.getAuthToken()}` },
      })
      if (!response.ok) throw new Error('Failed to delete allergy')
      if (this.teamToken) await this.fetchTeamDetails(this.teamToken)
      this.showToastNotification('Intolerància actualitzada correctament', 'success')
    } catch (error) {
      console.error('Error deleting allergy:', error)
      this.showToastNotification('Error actualitzant intolerància', 'error')
    }
  }

  async deleteIntolerance(index: number) {
    if (!this.team?.intolerancies || index < 0 || index >= this.team.intolerancies.length) return
    const name = this.team.intolerancies[index].name
    const toDelete = this.meAllergies.filter(a => (a.description || '').trim() === name)
    try {
      const base = environment.apiBaseUrl
      for (const allergy of toDelete) {
        const response = await fetch(`${base}/api/me/allergies/${allergy.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${this.getAuthToken()}` },
        })
        if (!response.ok) throw new Error('Failed to delete allergy')
      }
      if (this.teamToken) await this.fetchTeamDetails(this.teamToken)
      this.showToastNotification('Intolerància eliminada correctament', 'success')
    } catch (error) {
      console.error('Error deleting allergies:', error)
      this.showToastNotification('Error eliminant intolerància', 'error')
    }
  }

  // Observations methods
  async saveObservations() {
    if (!this.team) return
    try {
      const base = environment.apiBaseUrl
      const response = await fetch(`${base}/api/me/team`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${this.getAuthToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ observations: this.observationsText.trim() }),
      })
      if (!response.ok) throw new Error('Failed to update team observations')
      await this.fetchTeamDetails(this.teamToken!)
      this.showToastNotification('Observacions desades correctament', 'success')
    } catch (error) {
      console.error('Error updating observations:', error)
      this.showToastNotification('Error desant observacions', 'error')
    }
  }

  validateForm() {
    if (this.selectedOption === 'player-add' || this.selectedOption === 'player-edit') {
      this.isFormValid = !!this.newPlayer.nom && !!this.newPlayer.cognoms
    } else if (this.selectedOption === 'coach-add' || this.selectedOption === 'coach-edit') {
      this.isFormValid = !!this.newCoach.nom && !!this.newCoach.cognoms
    } else if (this.selectedOption === 'intolerancies') {
      this.isFormValid = !!this.newIntoleranceText.trim()
    } else if (this.selectedOption === 'observations') {
      this.isFormValid = true
    } else {
      this.isFormValid = false
    }
  }

  cancelEdit() {
    this.navigateBack()
  }

  navigateBack() {
    this.router.navigate(['/equip'], {
      queryParams: { token: this.teamToken },
    })
  }

  showToastNotification(message: string, type: 'success' | 'error') {
    this.toastMessage = message
    this.toastType = type
    this.showToast = true

    setTimeout(() => {
      this.hideToast()
    }, 3000)
  }

  hideToast() {
    this.showToast = false
  }
}
