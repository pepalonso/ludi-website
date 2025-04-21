import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Entrenador, Jugador, TallaSamarreta, Team } from '../interfaces/ludi.interface';
import { mapTeamResponse } from '../detalls-equip/data-mapper';
import { environment } from '../../environments/environment.prod';
import { interval, Subscription } from 'rxjs';
import { takeWhile } from 'rxjs/operators';

type EditOption =
  | 'player-add'
  | 'player-edit'
  | 'player-delete'
  | 'coach-add'
  | 'coach-edit'
  | 'coach-delete'
  | 'intolerancies'
  | 'observations'
  | 'none';

@Component({
  selector: 'app-edit-registration',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './editar-equip.component.html',
  styleUrls: ['./editar-equip.component.scss'],
})
export class EditRegistrationComponent implements OnInit, OnDestroy {
  public teamToken?: string;
  public team?: Team;
  public error: boolean = false;
  public isLoading: boolean = true;
  public isDesktop: boolean = false;

  // Session token properties
  public sessionToken: string | null = null;
  public tokenExpiryTime: number = 0;
  public timeRemaining: number = 0;
  public timerSubscription?: Subscription;
  public showTimer: boolean = true;
  public isTimerCritical: boolean = false;

  public selectedOption: EditOption = 'none';
  public selectedPlayerId: number = -1;
  public selectedCoachId: number = -1;

  public newPlayer: Jugador = {
    nom: '',
    cognoms: '',
    tallaSamarreta: TallaSamarreta.M,
  };
  public newCoach: Entrenador = {
    nom: '',
    cognoms: '',
    tallaSamarreta: TallaSamarreta.M,
    esPrincipal: 0,
  };

  public newIntoleranceText: string = '';
  public observationsText: string = '';

  public tallaSamarretaOptions = Object.values(TallaSamarreta);
  public isFormValid = false;

  // Toast notification properties
  public showToast: boolean = false;
  public toastMessage: string = '';
  public toastType: 'success' | 'error' = 'success';

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      this.teamToken = params['token'] || null;
      if (this.teamToken) {
        this.fetchTeamDetails(this.teamToken);
        this.initializeSessionToken();
      } else {
        this.error = true;
        this.isLoading = false;
        this.showToastNotification("No s'ha trobat el token de l'equip", 'error');
      }
    });
  }

  ngOnDestroy() {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
  }

  private initializeSessionToken() {
    // Get session token from sessionStorage
    this.sessionToken = sessionStorage.getItem('session_token');
    const expiryString = sessionStorage.getItem('token_expiry');
    
    if (this.sessionToken && expiryString) {
      this.tokenExpiryTime = parseInt(expiryString, 10);
      this.startExpiryTimer();
    } else {
      // If no session token is found, we'll continue using teamToken
      this.showToastNotification("No s'ha trobat un token de sessió vàlid", 'error');
    }
  }

  private startExpiryTimer() {
    // Calculate initial time remaining
    this.updateTimeRemaining();
    
    // Start a timer that updates every second
    this.timerSubscription = interval(1000)
      .pipe(takeWhile(() => this.timeRemaining > 0))
      .subscribe(() => {
        this.updateTimeRemaining();
        
        // Check if time is critical (less than 5 minutes)
        this.isTimerCritical = this.timeRemaining < 5 * 60 * 1000;
        
        // Handle expiration
        if (this.timeRemaining <= 0) {
          this.handleTokenExpiration();
        }
      });
  }

  private updateTimeRemaining() {
    const now = new Date().getTime();
    this.timeRemaining = Math.max(0, this.tokenExpiryTime - now);
  }

  private handleTokenExpiration() {
    sessionStorage.removeItem('session_token');
    sessionStorage.removeItem('token_expiry');
    
    this.showToastNotification("La sessió ha expirat. Redirigint...", 'error');
    
    setTimeout(() => {
      this.router.navigate(['/equip'], { 
        queryParams: { token: this.teamToken } 
      });
    }, 2000);
  }

  // Format the remaining time as mm:ss
  public formatTimeRemaining(): string {
    const totalSeconds = Math.floor(this.timeRemaining / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  private async fetchTeamDetails(token: string): Promise<void> {
    this.isLoading = true;
    const url = environment.production
      ? `https://${environment.apiUrl}/inscripcio`
      : `http://${environment.apiUrl}/inscripcio`;
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        console.error('Error fetching team details:', response.statusText);
        this.error = true;
        this.isLoading = false;
        this.showToastNotification("Error carregant les dades de l'equip", 'error');
        return;
      }

      const responseData = await response.json();
      this.team = await mapTeamResponse(responseData);
      this.observationsText = this.team.observacions || '';
      this.isLoading = false;
    } catch (error) {
      this.error = true;
      this.isLoading = false;
      console.error('Error fetching team details:', error);
      this.showToastNotification("Error carregant les dades de l'equip", 'error');
    }
  }

  // Helper method to get the appropriate token for requests
  private getAuthToken(): string {
    // Use session token for data-modifying operations if available
    return this.sessionToken || this.teamToken || '';
  }

  onOptionChange() {
    // Reset form state when changing options
    this.selectedPlayerId = -1;
    this.selectedCoachId = -1;
    this.resetNewPlayerForm();
    this.resetNewCoachForm();
    this.newIntoleranceText = '';
    this.validateForm();
  }

  // Player methods
  resetNewPlayerForm() {
    this.newPlayer = { nom: '', cognoms: '', tallaSamarreta: TallaSamarreta.M };
  }

  selectPlayerToEdit(index: number) {
    this.selectedPlayerId = index;
    if (this.team && index >= 0 && index < this.team.jugadors.length) {
      const player = this.team.jugadors[index];
      this.newPlayer = { ...player };
    }
    this.validateForm();
  }

  async addPlayer() {
    if (!this.team) return;
    if (this.newPlayer.nom && this.newPlayer.cognoms) {
      try {
        const url = environment.production
          ? `https://${environment.apiUrl}/jugador`
          : `http://${environment.apiUrl}/jugador`;
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.getAuthToken()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jugador: {
              nom: this.newPlayer.nom,
              cognoms: this.newPlayer.cognoms,
              tallaSamarreta: this.newPlayer.tallaSamarreta
            }
          })
        });

        if (!response.ok) {
          throw new Error('Failed to add player');
        }

        // Refresh team data
        if (!this.teamToken) {
          console.error('Error: teamToken is null or undefined.');
          this.showToastNotification('Error: No es pot actualitzar l\'equip', 'error');
          return;
        }
        await this.fetchTeamDetails(this.teamToken);
        this.resetNewPlayerForm();
        this.showToastNotification('Jugador afegit correctament', 'success');
      } catch (error) {
        console.error('Error adding player:', error);
        this.showToastNotification('Error afegint jugador', 'error');
      }
    }
  }

  async updatePlayer() {
    if (!this.team) return;
    if (this.selectedPlayerId >= 0 && this.newPlayer.nom && this.newPlayer.cognoms) {
      try {
        const url = environment.production
          ? `https://${environment.apiUrl}/jugador`
          : `http://${environment.apiUrl}/jugador`;
        
        // Get the player ID 
        const playerId = this.team.jugadors[this.selectedPlayerId].id || this.selectedPlayerId;
        
        const response = await fetch(url, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${this.getAuthToken()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jugador_old: {
              id: playerId
            },
            jugador_new: {
              nom: this.newPlayer.nom,
              cognoms: this.newPlayer.cognoms,
              tallaSamarreta: this.newPlayer.tallaSamarreta
            }
          })
        });

        if (!response.ok) {
          throw new Error('Failed to update player');
        }

        // Refresh team data
        await this.fetchTeamDetails(this.teamToken!);
        this.resetNewPlayerForm();
        this.selectedPlayerId = -1;
        this.showToastNotification('Jugador actualitzat correctament', 'success');
      } catch (error) {
        console.error('Error updating player:', error);
        this.showToastNotification('Error actualitzant jugador', 'error');
      }
    }
  }

  async deletePlayer(index: number) {
    if (!this.team) return;
    try {
      const url = environment.production
        ? `https://${environment.apiUrl}/jugador`
        : `http://${environment.apiUrl}/jugador`;
      
      // Get the player ID (assuming it's available in your data model)
      const playerId = this.team.jugadors[index].id || index;
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${this.getAuthToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jugador: {
            id: playerId
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to delete player');
      }

      // Refresh team data
      await this.fetchTeamDetails(this.teamToken!);
      this.showToastNotification('Jugador eliminat correctament', 'success');
    } catch (error) {
      console.error('Error deleting player:', error);
      this.showToastNotification('Error eliminant jugador', 'error');
    }
  }

  // Coach methods
  resetNewCoachForm() {
    this.newCoach = {
      nom: '',
      cognoms: '',
      tallaSamarreta: TallaSamarreta.M,
      esPrincipal: 0,
    };
  }

  selectCoachToEdit(index: number) {
    this.selectedCoachId = index;
    if (this.team && index >= 0 && index < this.team.entrenadors.length) {
      const coach = this.team.entrenadors[index];
      this.newCoach = { ...coach };
    }
    this.validateForm();
  }

  async addCoach() {
    if (!this.team) return;
    if (this.newCoach.nom && this.newCoach.cognoms) {
      if (this.newCoach.esPrincipal === 1 && this.team.entrenadors.some(e => e.esPrincipal === 1)) {
        this.showToastNotification('Ja existeix un entrenador principal', 'error');
        return;
      }

      try {
        const url = environment.production
          ? `https://${environment.apiUrl}/entrenador`
          : `http://${environment.apiUrl}/entrenador`;
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.getAuthToken()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            entrenador: {
              nom: this.newCoach.nom,
              cognoms: this.newCoach.cognoms,
              tallaSamarreta: this.newCoach.tallaSamarreta,
              esPrincipal: this.newCoach.esPrincipal === 1
            }
          })
        });

        if (!response.ok) {
          throw new Error('Failed to add coach');
        }

        // Refresh team data
        await this.fetchTeamDetails(this.teamToken!);
        this.resetNewCoachForm();
        this.showToastNotification('Entrenador afegit correctament', 'success');
      } catch (error) {
        console.error('Error adding coach:', error);
        this.showToastNotification('Error afegint entrenador', 'error');
      }
    }
  }

  async updateCoach() {
    if (!this.team) return;
    if (this.selectedCoachId >= 0 && this.newCoach.nom && this.newCoach.cognoms) {
      // Check if we're making a new principal coach when another one already exists
      const isPrincipalChange = this.newCoach.esPrincipal === 1 && 
                               this.team.entrenadors[this.selectedCoachId].esPrincipal !== 1;
      
      if (isPrincipalChange && this.team.entrenadors.some((e, i) => e.esPrincipal === 1 && i !== this.selectedCoachId)) {
        this.showToastNotification('Ja existeix un entrenador principal', 'error');
        return;
      }

      try {
        const url = environment.production
          ? `https://${environment.apiUrl}/entrenador`
          : `http://${environment.apiUrl}/entrenador`;
        
        // Get the coach ID (assuming it's available in your data model)
        const coachId = this.team.entrenadors[this.selectedCoachId].id || this.selectedCoachId;
        
        const response = await fetch(url, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${this.getAuthToken()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            entrenador_old: {
              id: coachId
            },
            entrenador_new: {
              nom: this.newCoach.nom,
              cognoms: this.newCoach.cognoms,
              tallaSamarreta: this.newCoach.tallaSamarreta,
              esPrincipal: this.newCoach.esPrincipal === 1
            }
          })
        });

        if (!response.ok) {
          throw new Error('Failed to update coach');
        }

        // Refresh team data
        await this.fetchTeamDetails(this.teamToken!);
        this.resetNewCoachForm();
        this.selectedCoachId = -1;
        this.showToastNotification('Entrenador actualitzat correctament', 'success');
      } catch (error) {
        console.error('Error updating coach:', error);
        this.showToastNotification('Error actualitzant entrenador', 'error');
      }
    }
  }

  async deleteCoach(index: number) {
    if (!this.team) return;
    const coach = this.team.entrenadors[index];
    
    if (coach.esPrincipal === 1) {
      this.showToastNotification("No es pot eliminar l'entrenador principal", 'error');
      return;
    }

    try {
      const url = environment.production
        ? `https://${environment.apiUrl}/entrenador`
        : `http://${environment.apiUrl}/entrenador`;
      
      const coachId = coach.id || index;
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${this.getAuthToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entrenador: {
            id: coachId
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to delete coach');
      }

      // Refresh team data
      await this.fetchTeamDetails(this.teamToken!);
      this.showToastNotification('Entrenador eliminat correctament', 'success');
    } catch (error) {
      console.error('Error deleting coach:', error);
      this.showToastNotification('Error eliminant entrenador', 'error');
    }
  }

  // Intolerances methods
  async addIntolerance() {
    if (!this.team) return;
    if (!this.newIntoleranceText.trim()) return;

    try {
      // For intolerances, we need to update the entire list
      const currentIntolerances = this.team.intolerancies || [];
      const normalizedIntolerance = this.newIntoleranceText.trim().toLowerCase();
      
      // Check if intolerance already exists
      const existingIndex = currentIntolerances.findIndex(i => 
        i.name.toLowerCase() === normalizedIntolerance);
      
      let updatedIntolerances;
      
      if (existingIndex >= 0) {
        // Increment count if it exists
        updatedIntolerances = [...currentIntolerances];
        updatedIntolerances[existingIndex] = {
          ...updatedIntolerances[existingIndex],
          count: updatedIntolerances[existingIndex].count + 1
        };
      } else {
        // Add new intolerance
        updatedIntolerances = [
          ...currentIntolerances,
          {
            name: this.newIntoleranceText.trim(),
            count: 1
          }
        ];
      }
      
      // Convert to the format expected by your API
      const intoleranciesForApi = updatedIntolerances.reduce((acc, item) => {
        // Add the intolerance name to the array multiple times based on count
        for (let i = 0; i < item.count; i++) {
          acc.push(item.name);
        }
        return acc;
      }, [] as string[]);
      
      const url = environment.production
        ? `https://${environment.apiUrl}/intolerancies`
        : `http://${environment.apiUrl}/intolerancies`;
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${this.getAuthToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          intolerancies: intoleranciesForApi
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update intolerances');
      }

      // Refresh team data
      await this.fetchTeamDetails(this.teamToken!);
      this.newIntoleranceText = '';
      this.showToastNotification('Intolerància afegida correctament', 'success');
    } catch (error) {
      console.error('Error updating intolerances:', error);
      this.showToastNotification('Error afegint intolerància', 'error');
    }
  }

  async decrementIntolerance(index: number) {
    if (!this.team || !this.team.intolerancies) return;
    
    try {
      const currentIntolerances = [...this.team.intolerancies];
      let updatedIntolerances;
      
      if (currentIntolerances[index].count > 1) {
        // Decrement count
        updatedIntolerances = [...currentIntolerances];
        updatedIntolerances[index] = {
          ...updatedIntolerances[index],
          count: updatedIntolerances[index].count - 1
        };
      } else {
        // Remove if count is 1
        updatedIntolerances = currentIntolerances.filter((_, i) => i !== index);
      }
      
      // Convert to the format expected by your API
      const intoleranciesForApi = updatedIntolerances.reduce((acc, item) => {
        // Add the intolerance name to the array multiple times based on count
        for (let i = 0; i < item.count; i++) {
          acc.push(item.name);
        }
        return acc;
      }, [] as string[]);
      
      const url = environment.production
        ? `https://${environment.apiUrl}/intolerancies`
        : `http://${environment.apiUrl}/intolerancies`;
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${this.getAuthToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          intolerancies: intoleranciesForApi
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update intolerances');
      }

      // Refresh team data
      await this.fetchTeamDetails(this.teamToken!);
      this.showToastNotification('Intolerància actualitzada correctament', 'success');
    } catch (error) {
      console.error('Error updating intolerances:', error);
      this.showToastNotification('Error actualitzant intolerància', 'error');
    }
  }

  async deleteIntolerance(index: number) {
    if (!this.team || !this.team.intolerancies) return;
    
    try {
      const currentIntolerances = [...this.team.intolerancies];
      const updatedIntolerances = currentIntolerances.filter((_, i) => i !== index);
      
      // Convert to the format expected by your API
      const intoleranciesForApi = updatedIntolerances.reduce((acc, item) => {
        // Add the intolerance name to the array multiple times based on count
        for (let i = 0; i < item.count; i++) {
          acc.push(item.name);
        }
        return acc;
      }, [] as string[]);
      
      const url = environment.production
        ? `https://${environment.apiUrl}/intolerancies`
        : `http://${environment.apiUrl}/intolerancies`;
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${this.getAuthToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          intolerancies: intoleranciesForApi
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update intolerances');
      }

      // Refresh team data
      await this.fetchTeamDetails(this.teamToken!);
      this.showToastNotification('Intolerància eliminada correctament', 'success');
    } catch (error) {
      console.error('Error updating intolerances:', error);
      this.showToastNotification('Error eliminant intolerància', 'error');
    }
  }

  // Observations methods
  async saveObservations() {
    if (!this.team) return;
    
    try {
      const url = environment.production
        ? `https://${environment.apiUrl}/equip`
        : `http://${environment.apiUrl}/equip`;
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${this.getAuthToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          equip: {
            nom: this.team.nomEquip,
            email: this.team.email,
            categoria: this.team.categoria,
            telefon: this.team.telefon,
            sexe: this.team.sexe,
            observacions: this.observationsText.trim()
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update team observations');
      }

      // Refresh team data
      await this.fetchTeamDetails(this.teamToken!);
      this.showToastNotification('Observacions desades correctament', 'success');
    } catch (error) {
      console.error('Error updating observations:', error);
      this.showToastNotification('Error desant observacions', 'error');
    }
  }

  validateForm() {
    if (
      this.selectedOption === 'player-add' ||
      this.selectedOption === 'player-edit'
    ) {
      this.isFormValid = !!this.newPlayer.nom && !!this.newPlayer.cognoms;
    } else if (
      this.selectedOption === 'coach-add' ||
      this.selectedOption === 'coach-edit'
    ) {
      this.isFormValid = !!this.newCoach.nom && !!this.newCoach.cognoms;
    } else if (this.selectedOption === 'intolerancies') {
      this.isFormValid = !!this.newIntoleranceText.trim();
    } else if (this.selectedOption === 'observations') {
      this.isFormValid = true;
    } else {
      this.isFormValid = false;
    }
  }

  cancelEdit() {
    this.navigateBack();
  }

  navigateBack() {
    this.router.navigate(['/equip'], { 
      queryParams: { token: this.teamToken } 
    });
  }

  showToastNotification(message: string, type: 'success' | 'error') {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    
    setTimeout(() => {
      this.hideToast();
    }, 3000);
  }

  hideToast() {
    this.showToast = false;
  }
}