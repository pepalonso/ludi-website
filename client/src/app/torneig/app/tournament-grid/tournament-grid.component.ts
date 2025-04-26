import { Component, OnInit } from '@angular/core';
import { TournamentService } from '../../services/tournament.service';
import { Observable } from 'rxjs';
import { MatchSlot } from '../../models/match.model';
import { map } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { MatchCardComponent } from '../match-card/match-card.component';

@Component({
  selector: 'app-tournament-grid',
  templateUrl: './tournament-grid.component.html',
  styleUrls: ['./component-grid.component.scss'],
  standalone: true,
  imports: [CommonModule, MatchCardComponent],
})
export class TournamentGridComponent implements OnInit {
  matchSlots$: Observable<MatchSlot[]>;
  uniqueDates$: Observable<string[]>;
  uniqueCourts$: Observable<string[]>;

  constructor(private tournamentService: TournamentService) {
    this.matchSlots$ = this.tournamentService.getFilteredMatchSlots();

    this.uniqueDates$ = this.matchSlots$.pipe(
      map((slots) => {
        const dates = new Set<string>();
        slots.forEach((slot) => dates.add(slot.date));
        return Array.from(dates).sort();
      })
    );

    this.uniqueCourts$ = this.matchSlots$.pipe(
      map((slots) => {
        const courts = new Set<string>();
        slots.forEach((slot) => courts.add(slot.court));
        return Array.from(courts).sort();
      })
    );
  }

  ngOnInit(): void {}

  getSlotsByDateAndCourt(date: string, court: string): Observable<MatchSlot[]> {
    return this.matchSlots$.pipe(
      map((slots) =>
        slots.filter((slot) => slot.date === date && slot.court === court)
      )
    );
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('ca-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
}
