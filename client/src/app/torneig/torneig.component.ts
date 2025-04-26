import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Match {
  id: number;
  group_id: number;
  subgroup_id?: number;
  phase: string;
  team_a_id?: number;
  team_b_id?: number;
  possible_a_teams?: number[];
  possible_b_teams?: number[];
  match_index?: number;
  slot_id: number;
  date: string;
  court_name: string;
  court_location: string;
}

interface ScheduleData {
  schedule: Match[];
}

@Component({
  selector: 'app-tournament-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './torneig.component.html',
  styleUrl: './torneig.component.css'
})
export class TournamentScheduleComponent implements OnInit {
  scheduleData: ScheduleData = { schedule: [] };
  filteredMatches: Match[] = [];
  
  groups: number[] = [];
  subgroups: number[] = [];
  phases: string[] = [];
  teams: number[] = [];
  
  selectedGroup: number | null = null;
  selectedSubgroup: number | null = null;
  selectedPhase: string | null = null;
  selectedTeamId: number | null = null;
  
  ngOnInit() {
    // In a real application, you would fetch this from an API or service
    // For this example, we'll use the provided JSON directly
    this.loadScheduleData();
  }
  
  loadScheduleData() {
    // This would typically be a HTTP request to fetch the JSON
    // For this example, we're using the provided JSON directly
    fetch('assets/match_schedule.json')
      .then(response => response.json())
      .then((data: ScheduleData) => {
        this.scheduleData = data;
        this.extractFilterOptions();
        this.applyFilters();
      })
      .catch(error => console.error('Error loading schedule data:', error));
  }
  
  extractFilterOptions() {
    // Groups
    this.groups = [...new Set(this.scheduleData.schedule.map(match => match.group_id))].sort((a, b) => a - b);
  
    // Subgroups
    this.subgroups = [...new Set(
      this.scheduleData.schedule
        .filter(match => match.subgroup_id !== undefined)
        .map(match => match.subgroup_id as number)
    )].sort((a, b) => a - b);
  
    // Phases
    this.phases = [...new Set(this.scheduleData.schedule.map(match => match.phase))].sort();
  
    // Teams
    const allTeams = this.scheduleData.schedule.flatMap(match => [
      match.team_a_id,
      match.team_b_id,
      ...(match.possible_a_teams || []),
      ...(match.possible_b_teams || [])
    ]);
    this.teams = [...new Set(allTeams.filter(id => id !== undefined))].sort((a, b) => (a! - b!)) as number[];
  }
  
  
  applyFilters() {
    this.filteredMatches = this.scheduleData.schedule.filter(match => {
      // Group filter
      if (this.selectedGroup !== null && match.group_id !== this.selectedGroup) {
        return false;
      }
  
      // Subgroup filter
      if (this.selectedSubgroup !== null) {
        if (match.subgroup_id === undefined) {
          return false; // If subgroup is selected but match has no subgroup, exclude it
        }
        if (match.subgroup_id !== this.selectedSubgroup) {
          return false;
        }
      }
  
      // Phase filter
      if (this.selectedPhase !== null && match.phase !== this.selectedPhase) {
        return false;
      }

      // Apply team filter 

    if (this.selectedTeamId !== null) {
        const inDirectTeams = match.team_a_id === this.selectedTeamId || match.team_b_id === this.selectedTeamId;
        const inPossibleTeams = (match.possible_a_teams?.includes(this.selectedTeamId) || match.possible_b_teams?.includes(this.selectedTeamId));
        
        if (!inDirectTeams && !inPossibleTeams) {
          return false;
        }
    }
  
      return true;
    });

   
  
    // Sort by date
    this.filteredMatches.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }
  
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  onGroupChange(value: number | null) {
    this.selectedGroup = value;
    this.applyFilters();
  }
  
  onSubgroupChange(value: number | null) {
    this.selectedSubgroup = value;
    this.applyFilters();
  }
  
  onPhaseChange(value: string | null) {
    this.selectedPhase = value;
    this.applyFilters();
  }

  onTeamChange(value: number | null) {
    this.selectedTeamId = value;
    this.applyFilters();
  }
  
}