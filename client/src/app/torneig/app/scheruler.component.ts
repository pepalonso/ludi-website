import { Component } from '@angular/core';
import { FiltersComponent } from './filters/filters.component';
import { TeamSelectorComponent } from './team-selector/team-selector.component';
import { TournamentGridComponent } from './tournament-grid/tournament-grid.component';
import { HeaderComponent } from './header/header.component';

@Component({
  selector: 'app-scheruler',
  templateUrl: './scheruler.component.html',
  styleUrls: ['./scheruler.component.scss'],
  standalone: true,
  imports: [
    HeaderComponent,
    TeamSelectorComponent,
    FiltersComponent,
    TournamentGridComponent,
  ],
})
export class ScherulerComponent {
  title = 'Tournament Scheduler';
}
