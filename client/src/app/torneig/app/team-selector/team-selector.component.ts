import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { TournamentService } from '../../services/tournament.service';
import { TeamHierarchyItem } from '../../models/team.model';

@Component({
  selector: 'app-team-selector',
  templateUrl: './team-selector.component.html',
  styleUrls: ['./team-selector.component.css'],
  standalone: true,
  imports: [CommonModule],
})
export class TeamSelectorComponent implements OnInit {
  teamHierarchy$: Observable<TeamHierarchyItem[]>;
  expandedGroups: Set<number> = new Set();
  expandedSubgroups: Set<string> = new Set();
  selectedTeamId: number | null = null;

  constructor(private tournamentService: TournamentService) {
    this.teamHierarchy$ = this.tournamentService.getTeamHierarchy();
  }

  ngOnInit(): void {}

  toggleGroup(groupId: number): void {
    if (this.expandedGroups.has(groupId)) {
      this.expandedGroups.delete(groupId);
    } else {
      this.expandedGroups.add(groupId);
    }
  }

  toggleSubgroup(groupId: number, subgroupId: number): void {
    const key = `${groupId}-${subgroupId}`;
    if (this.expandedSubgroups.has(key)) {
      this.expandedSubgroups.delete(key);
    } else {
      this.expandedSubgroups.add(key);
    }
  }

  isGroupExpanded(groupId: number): boolean {
    return this.expandedGroups.has(groupId);
  }

  isSubgroupExpanded(groupId: number, subgroupId: number): boolean {
    return this.expandedSubgroups.has(`${groupId}-${subgroupId}`);
  }

  selectTeam(teamId: number): void {
    this.selectedTeamId = teamId;
    this.tournamentService.setSelectedTeam(teamId);
  }

  clearSelection(): void {
    this.selectedTeamId = null;
    this.tournamentService.setSelectedTeam(null);
  }
}
