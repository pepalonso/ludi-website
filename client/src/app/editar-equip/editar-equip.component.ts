import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Entrenador, Jugador, TallaSamarreta, Team } from '../interfaces/ludi.interface';
import { Router } from '@angular/router';

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
export class EditRegistrationComponent {
  @Input() team!: Team;
  @Output() teamChange = new EventEmitter<Team>();
  @Output() close = new EventEmitter<void>();
  @Output() showToastEvent = new EventEmitter<{
    message: string;
    type: 'success' | 'error';
  }>();

  selectedOption: EditOption = 'none';
  selectedPlayerId: number = -1;
  selectedCoachId: number = -1;

  newPlayer: Jugador = {
    nom: '',
    cognoms: '',
    tallaSamarreta: TallaSamarreta.M,
  };
  newCoach: Entrenador = {
    nom: '',
    cognoms: '',
    tallaSamarreta: TallaSamarreta.M,
    esPrincipal: 0,
  };

  newIntoleranceText: string = '';
  observationsText: string = '';

  tallaSamarretaOptions = Object.values(TallaSamarreta);
  isFormValid = false;

  constructor(private router: Router) {}


  ngOnInit() {
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state && navigation.extras.state['team']) {
      this.team = navigation.extras.state['team'];
    }
    console.log('Team:', this.team);
    this.observationsText = this.team.observacions || '';

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
    if (index >= 0 && index < this.team.jugadors.length) {
      const player = this.team.jugadors[index];
      this.newPlayer = { ...player };
    }
    this.validateForm();
  }

  addPlayer() {
    if (this.newPlayer.nom && this.newPlayer.cognoms) {
      const updatedTeam = { ...this.team };
      updatedTeam.jugadors = [...this.team.jugadors, { ...this.newPlayer }];
      this.teamChange.emit(updatedTeam);
      this.resetNewPlayerForm();
      this.showToastEvent.emit({
        message: 'Jugador afegit correctament',
        type: 'success',
      });
    }
  }

  updatePlayer() {
    if (
      this.selectedPlayerId >= 0 &&
      this.newPlayer.nom &&
      this.newPlayer.cognoms
    ) {
      const updatedTeam = { ...this.team };
      updatedTeam.jugadors = [...this.team.jugadors];
      updatedTeam.jugadors[this.selectedPlayerId] = { ...this.newPlayer };
      this.teamChange.emit(updatedTeam);
      this.resetNewPlayerForm();
      this.selectedPlayerId = -1;
      this.showToastEvent.emit({
        message: 'Jugador actualitzat correctament',
        type: 'success',
      });
    }
  }

  deletePlayer(index: number) {
    const updatedTeam = { ...this.team };
    updatedTeam.jugadors = this.team.jugadors.filter((_, i) => i !== index);
    this.teamChange.emit(updatedTeam);
    this.showToastEvent.emit({
      message: 'Jugador eliminat correctament',
      type: 'success',
    });
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
    if (index >= 0 && index < this.team.entrenadors.length) {
      const coach = this.team.entrenadors[index];
      this.newCoach = { ...coach };
    }
    this.validateForm();
  }

  addCoach() {
    if (this.newCoach.nom && this.newCoach.cognoms) {
      if (
        this.newCoach.esPrincipal === 1 &&
        this.team.entrenadors.some((e) => e.esPrincipal === 1)
      ) {
        this.showToastEvent.emit({
          message: 'Ja existeix un entrenador principal',
          type: 'error',
        });
        return;
      }

      const updatedTeam = { ...this.team };
      updatedTeam.entrenadors = [
        ...this.team.entrenadors,
        { ...this.newCoach },
      ];
      this.teamChange.emit(updatedTeam);
      this.resetNewCoachForm();
      this.showToastEvent.emit({
        message: 'Entrenador afegit correctament',
        type: 'success',
      });
    }
  }

  updateCoach() {
    if (
      this.selectedCoachId >= 0 &&
      this.newCoach.nom &&
      this.newCoach.cognoms
    ) {
      const isPrincipalChange =
        this.newCoach.esPrincipal === 1 &&
        this.team.entrenadors[this.selectedCoachId].esPrincipal !== 1;
      if (
        isPrincipalChange &&
        this.team.entrenadors.some(
          (e, i) => e.esPrincipal === 1 && i !== this.selectedCoachId
        )
      ) {
        this.showToastEvent.emit({
          message: 'Ja existeix un entrenador principal',
          type: 'error',
        });
        return;
      }

      const updatedTeam = { ...this.team };
      updatedTeam.entrenadors = [...this.team.entrenadors];
      updatedTeam.entrenadors[this.selectedCoachId] = { ...this.newCoach };
      this.teamChange.emit(updatedTeam);
      this.resetNewCoachForm();
      this.selectedCoachId = -1;
      this.showToastEvent.emit({
        message: 'Entrenador actualitzat correctament',
        type: 'success',
      });
    }
  }

  deleteCoach(index: number) {
    const coach = this.team.entrenadors[index];
    if (coach.esPrincipal === 1) {
      this.showToastEvent.emit({
        message: "No es pot eliminar l'entrenador principal",
        type: 'error',
      });
      return;
    }

    const updatedTeam = { ...this.team };
    updatedTeam.entrenadors = this.team.entrenadors.filter(
      (_, i) => i !== index
    );
    this.teamChange.emit(updatedTeam);
    this.showToastEvent.emit({
      message: 'Entrenador eliminat correctament',
      type: 'success',
    });
  }

  addIntolerance() {
    if (!this.newIntoleranceText.trim()) return;

    const updatedTeam = { ...this.team };
    const normalizedIntolerance = this.newIntoleranceText.trim().toLowerCase();

    if (!updatedTeam.intolerancies) {
      updatedTeam.intolerancies = [];
    }

    const existingIndex = updatedTeam.intolerancies.findIndex(
      (i) => i.name.toLowerCase() === normalizedIntolerance
    );

    if (existingIndex >= 0) {
      updatedTeam.intolerancies[existingIndex] = {
        ...updatedTeam.intolerancies[existingIndex],
        count: updatedTeam.intolerancies[existingIndex].count + 1,
      };
    } else {
      updatedTeam.intolerancies.push({
        name: this.newIntoleranceText.trim(),
        count: 1,
      });
    }

    this.teamChange.emit(updatedTeam);
    this.newIntoleranceText = '';
    this.showToastEvent.emit({
      message: 'Intolerància afegida correctament',
      type: 'success',
    });
  }

  decrementIntolerance(index: number) {
    if (!this.team.intolerancies) return;

    const updatedTeam = { ...this.team };
    updatedTeam.intolerancies = [...this.team.intolerancies];

    if (updatedTeam.intolerancies[index].count > 1) {
      updatedTeam.intolerancies[index] = {
        ...updatedTeam.intolerancies[index],
        count: updatedTeam.intolerancies[index].count - 1,
      };
    } else {
      updatedTeam.intolerancies = updatedTeam.intolerancies.filter(
        (_, i) => i !== index
      );
    }

    this.teamChange.emit(updatedTeam);
    this.showToastEvent.emit({
      message: 'Intolerància actualitzada correctament',
      type: 'success',
    });
  }

  deleteIntolerance(index: number) {
    if (!this.team.intolerancies) return;

    const updatedTeam = { ...this.team };
    updatedTeam.intolerancies = this.team.intolerancies.filter(
      (_, i) => i !== index
    );
    this.teamChange.emit(updatedTeam);
    this.showToastEvent.emit({
      message: 'Intolerància eliminada correctament',
      type: 'success',
    });
  }

  saveObservations() {
    const updatedTeam = {
      ...this.team,
      observacions: this.observationsText.trim(),
    };
    this.teamChange.emit(updatedTeam);
    this.showToastEvent.emit({
      message: 'Observacions desades correctament',
      type: 'success',
    });
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
    this.close.emit();
  }
}
