import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Match,
  Team,
  TournamentService,
} from '../../services/tournament.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-match-card',
  templateUrl: './match-card.component.html',
  styleUrls: ['./match-card.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class MatchCardComponent {
  @Input() match!: Match;

  team1$?: Observable<Team | undefined>;
  team2$?: Observable<Team | undefined>;

  constructor(private tournamentService: TournamentService) {}

  ngOnInit(): void {
    if (this.match) {
      this.team1$ = this.tournamentService.getTeamById(this.match.team1);
      this.team2$ = this.tournamentService.getTeamById(this.match.team2);
    }
  }

  get isEliminationMatch(): boolean {
    return this.match.phase === 'elimination';
  }
  get matchTime(): string {
    return this.match.time || '';
  }

  get matchCourt(): string {
    return this.match.court || '';
  }

  get matchRound(): string {
    return this.match.round || '';
  }
}
