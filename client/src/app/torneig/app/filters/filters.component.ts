import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { TournamentService } from '../../services/tournament.service';

@Component({
  selector: 'app-filters',
  templateUrl: './filters.component.html',
  styleUrls: ['./filters.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class FiltersComponent implements OnInit {
  courts$: Observable<string[]>;
  selectedCourt: string | null = null;

  constructor(private tournamentService: TournamentService) {
    this.courts$ = this.tournamentService.getCourts();
  }

  ngOnInit(): void {}

  selectCourt(court: string | null): void {
    this.selectedCourt = court;
    this.tournamentService.setCourtFilter(court);
  }
}
