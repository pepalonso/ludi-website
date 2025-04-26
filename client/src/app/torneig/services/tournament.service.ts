import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, map, of, forkJoin } from 'rxjs';
import { MatchSlot, ScheduledMatch } from '../models/match.model';
import { TeamHierarchy, TeamHierarchyItem } from '../models/team.model';

export interface Team {
  id: number;
  name: string;
  category: string;
  gender: string;
}

export interface Subgroup {
  id: number;
  name: string;
  teams: number[];
}

export interface Group {
  id: number;
  category: string;
  gender: string;
  team_count: number;
  schema_key: string;
  subgroups: Subgroup[];
}

export interface Match {
  id: number;
  phase: string;
  team1: number;
  team2: number;
  score1?: number;
  score2?: number;
  court?: string;
  slot?: string;
  group?: number;
  subgroup?: number;
  time?: string;
  round?: string;
}

@Injectable({
  providedIn: 'root',
})
export class TournamentService {
  private teamsSubject = new BehaviorSubject<Team[]>([]);
  private groupsSubject = new BehaviorSubject<Group[]>([]);
  private scheduledMatchesSubject = new BehaviorSubject<ScheduledMatch[]>([]);
  private selectedTeamSubject = new BehaviorSubject<number | null>(null);
  private courtFilterSubject = new BehaviorSubject<string | null>(null);

  teams$ = this.teamsSubject.asObservable();
  groups$ = this.groupsSubject.asObservable();
  scheduledMatches$ = this.scheduledMatchesSubject.asObservable();
  selectedTeam$ = this.selectedTeamSubject.asObservable();
  courtFilter$ = this.courtFilterSubject.asObservable();

  private dataLoaded = false;
  private categoryFilter: string | null = null;
  private genderFilter: string | null = null;
  private phaseFilter: string | null = null;

  constructor(private http: HttpClient) {
    this.loadData();
  }

  loadData(): void {
    if (this.dataLoaded) return;

    forkJoin({
      teams: this.http.get<{ teams: Team[] }>('./assets/data/teams.json'),
      groups: this.http.get<{ groups: Group[] }>(
        './assets/data/tournament_groups.json'
      ),
      scheduledMatches: this.http
        .get<{ matches: ScheduledMatch[] }>('./assets/data/match_schedule.json')
        .pipe(
          // Handle case where matches might not exist yet
          map((data) => data || { matches: [] })
        ),
    }).subscribe({
      next: (data) => {
        this.teamsSubject.next(data.teams.teams);
        this.groupsSubject.next(data.groups.groups);
        if (data.scheduledMatches && data.scheduledMatches.matches) {
          this.scheduledMatchesSubject.next(data.scheduledMatches.matches);
        }
        this.dataLoaded = true;
      },
      error: (err) => {
        console.error('Error loading tournament data', err);
        // Load at least teams and groups if other data fails
        this.http
          .get<{ teams: Team[] }>('./assets/data/teams.json')
          .subscribe((data) => {
            this.teamsSubject.next(data.teams);
          });
        this.http
          .get<{ groups: Group[] }>('./assets/data/tournament_groups.json')
          .subscribe((data) => {
            this.groupsSubject.next(data.groups);
          });
      },
    });
  }

  // Court filter methods
  setCourtFilter(court: string | null): void {
    this.courtFilterSubject.next(court);
  }

  getCourts(): Observable<string[]> {
    return this.scheduledMatches$.pipe(
      map((matches) => {
        const courts = new Set<string>();
        matches.forEach((match) => {
          if (match.court) {
            courts.add(match.court);
          }
        });
        return Array.from(courts).sort();
      })
    );
  }

  // Selected team methods
  setSelectedTeam(teamId: number | null): void {
    this.selectedTeamSubject.next(teamId);
  }

  getSelectedTeam(): Observable<Team | undefined> {
    return forkJoin([this.selectedTeam$, this.teams$]).pipe(
      map(([selectedTeamId, teams]) => {
        if (!selectedTeamId) return undefined;
        return teams.find((team) => team.id === selectedTeamId);
      })
    );
  }

  getSelectedTeamMatches(): Observable<ScheduledMatch[]> {
    return forkJoin([this.selectedTeam$, this.scheduledMatches$]).pipe(
      map(([selectedTeamId, matches]) => {
        if (!selectedTeamId) return [];
        return matches.filter(
          (match) =>
            match.team1 === selectedTeamId || match.team2 === selectedTeamId
        );
      })
    );
  }

  // Filter setters
  setFilters(
    category?: string | null,
    gender?: string | null,
    phase?: string | null
  ): void {
    this.categoryFilter = category || null;
    this.genderFilter = gender || null;
    this.phaseFilter = phase || null;
  }

  clearFilters(): void {
    this.categoryFilter = null;
    this.genderFilter = null;
    this.phaseFilter = null;
    this.setSelectedTeam(null);
    this.setCourtFilter(null);
  }

  // Match slots derived from scheduled matches
  getMatchSlots(): Observable<MatchSlot[]> {
    return this.scheduledMatches$.pipe(
      map((matches) => {
        // Convert scheduled matches to match slots
        return matches.map((match) => ({
          id: match.slot,
          date: match.date,
          time: match.time,
          court: match.court,
          match: {
            id: match.id,
            phase: match.phase,
            team1: match.team1,
            team2: match.team2,
            score1: match.score1,
            score2: match.score2,
            court: match.court,
            slot: match.slot,
            group: match.group,
            subgroup: match.subgroup,
            time: match.time,
            round: match.round,
          },
        }));
      })
    );
  }

  getFilteredMatchSlots(): Observable<MatchSlot[]> {
    return forkJoin([
      this.scheduledMatches$,
      this.teams$,
      this.selectedTeam$,
      this.courtFilter$,
    ]).pipe(
      map(([matches, teams, selectedTeamId, courtFilter]) => {
        let filteredMatches = matches;

        // Filter by court
        if (courtFilter) {
          filteredMatches = filteredMatches.filter(
            (match) => match.court === courtFilter
          );
        }

        // Filter by selected team
        if (selectedTeamId) {
          filteredMatches = filteredMatches.filter(
            (match) =>
              match.team1 === selectedTeamId || match.team2 === selectedTeamId
          );
        }
        // Otherwise apply category/gender filters
        else if (this.categoryFilter || this.genderFilter) {
          filteredMatches = matches.filter((match) => {
            const team1 = teams.find((t) => t.id === match.team1);
            const team2 = teams.find((t) => t.id === match.team2);

            if (!team1 || !team2) return false;

            const categoryMatch =
              !this.categoryFilter ||
              (team1.category === this.categoryFilter &&
                team2.category === this.categoryFilter);

            const genderMatch =
              !this.genderFilter ||
              (team1.gender === this.genderFilter &&
                team2.gender === this.genderFilter);

            return categoryMatch && genderMatch;
          });
        }

        if (this.phaseFilter) {
          filteredMatches = filteredMatches.filter(
            (match) => match.phase === this.phaseFilter
          );
        }

        // Convert filtered matches to match slots
        return filteredMatches.map((match) => ({
          id: match.slot,
          date: match.date,
          time: match.time,
          court: match.court,
          match: {
            id: match.id,
            phase: match.phase,
            team1: match.team1,
            team2: match.team2,
            score1: match.score1,
            score2: match.score2,
            court: match.court,
            slot: match.slot,
            group: match.group,
            subgroup: match.subgroup,
            time: match.time,
            round: match.round,
          },
        }));
      })
    );
  }

  // Team-related methods
  getTeams(): Observable<Team[]> {
    return this.teams$;
  }

  getTeamById(id: number): Observable<Team | undefined> {
    return this.teams$.pipe(
      map((teams) => teams.find((team) => team.id === id))
    );
  }

  getTeamsByCategory(category: string): Observable<Team[]> {
    return this.teams$.pipe(
      map((teams) => teams.filter((team) => team.category === category))
    );
  }

  getTeamsByGender(gender: string): Observable<Team[]> {
    return this.teams$.pipe(
      map((teams) => teams.filter((team) => team.gender === gender))
    );
  }

  getTeamsByCategoryAndGender(
    category: string,
    gender: string
  ): Observable<Team[]> {
    return this.teams$.pipe(
      map((teams) =>
        teams.filter(
          (team) => team.category === category && team.gender === gender
        )
      )
    );
  }

  // Group-related methods
  getGroups(): Observable<Group[]> {
    return this.groups$;
  }

  getGroupById(id: number): Observable<Group | undefined> {
    return this.groups$.pipe(
      map((groups) => groups.find((group) => group.id === id))
    );
  }

  getGroupsByCategory(category: string): Observable<Group[]> {
    return this.groups$.pipe(
      map((groups) => groups.filter((group) => group.category === category))
    );
  }

  getGroupsByCategoryAndGender(
    category: string,
    gender: string
  ): Observable<Group[]> {
    return this.groups$.pipe(
      map((groups) =>
        groups.filter(
          (group) => group.category === category && group.gender === gender
        )
      )
    );
  }

  getTeamsInGroup(groupId: number): Observable<Team[]> {
    return forkJoin([this.groups$, this.teams$]).pipe(
      map(([groups, teams]) => {
        const group = groups.find((g) => g.id === groupId);
        if (!group) return [];

        const teamIds = group.subgroups.flatMap((subgroup) => subgroup.teams);
        return teams.filter((team) => teamIds.includes(team.id));
      })
    );
  }

  getTeamsInSubgroup(groupId: number, subgroupId: number): Observable<Team[]> {
    return forkJoin([this.groups$, this.teams$]).pipe(
      map(([groups, teams]) => {
        const group = groups.find((g) => g.id === groupId);
        if (!group) return [];

        const subgroup = group.subgroups.find((sg) => sg.id === subgroupId);
        if (!subgroup) return [];

        return teams.filter((team) => subgroup.teams.includes(team.id));
      })
    );
  }

  // Match-related methods
  getMatches(): Observable<ScheduledMatch[]> {
    return this.scheduledMatches$;
  }

  getMatchesByTeam(teamId: number): Observable<ScheduledMatch[]> {
    return this.scheduledMatches$.pipe(
      map((matches) =>
        matches.filter(
          (match) => match.team1 === teamId || match.team2 === teamId
        )
      )
    );
  }

  getMatchesByGroup(groupId: number): Observable<ScheduledMatch[]> {
    return this.scheduledMatches$.pipe(
      map((matches) => matches.filter((match) => match.group === groupId))
    );
  }

  getMatchesBySubgroup(
    groupId: number,
    subgroupId: number
  ): Observable<ScheduledMatch[]> {
    return this.scheduledMatches$.pipe(
      map((matches) =>
        matches.filter(
          (match) => match.group === groupId && match.subgroup === subgroupId
        )
      )
    );
  }

  getMatchesByPhase(phase: string): Observable<ScheduledMatch[]> {
    return this.scheduledMatches$.pipe(
      map((matches) => matches.filter((match) => match.phase === phase))
    );
  }

  // Helper method to get team names from match
  getMatchTeams(
    match: Match | ScheduledMatch
  ): Observable<[Team | undefined, Team | undefined]> {
    return this.teams$.pipe(
      map((teams) => [
        teams.find((team) => team.id === match.team1),
        teams.find((team) => team.id === match.team2),
      ])
    );
  }

  // Get all unique categories
  getCategories(): Observable<string[]> {
    return this.teams$.pipe(
      map((teams) => [...new Set(teams.map((team) => team.category))])
    );
  }

  // Get all unique genders
  getGenders(): Observable<string[]> {
    return this.teams$.pipe(
      map((teams) => [...new Set(teams.map((team) => team.gender))])
    );
  }

  // Get team hierarchy organized by category and gender
  getTeamHierarchy(): Observable<TeamHierarchyItem[]> {
    return forkJoin([this.teams$, this.groups$]).pipe(
      map(([teams, groups]) => {
        // Create a map to store teams by group ID and subgroup ID
        const teamsBySubgroup = new Map<string, Team[]>();

        // Group teams by their group and subgroup
        groups.forEach((group) => {
          group.subgroups.forEach((subgroup) => {
            // Create a key for each subgroup
            const key = `${group.id}-${subgroup.id}`;

            // Get the teams for this subgroup
            const subgroupTeams = subgroup.teams
              .map((teamId) => teams.find((team) => team.id === teamId))
              .filter((team) => team !== undefined) as Team[];

            teamsBySubgroup.set(key, subgroupTeams);
          });
        });

        // Format groups for the component
        return groups.map((group) => {
          return {
            id: group.id,
            name: `${group.category} ${group.gender}`,
            subgroups: group.subgroups.map((subgroup) => {
              const key = `${group.id}-${subgroup.id}`;
              return {
                id: subgroup.id,
                name: subgroup.name,
                teams: teamsBySubgroup.get(key) || [],
              };
            }),
          };
        });
      })
    );
  }

  // Get a flat list of all teams organized by category and gender
  getTeamsByCategoryAndGenderList(): Observable<
    { category: string; gender: string; teams: Team[] }[]
  > {
    return this.teams$.pipe(
      map((teams) => {
        const categoryGenderMap = new Map<string, Map<string, Team[]>>();

        // Group teams by category and gender
        teams.forEach((team) => {
          if (!categoryGenderMap.has(team.category)) {
            categoryGenderMap.set(team.category, new Map<string, Team[]>());
          }

          const genderMap = categoryGenderMap.get(team.category)!;
          if (!genderMap.has(team.gender)) {
            genderMap.set(team.gender, []);
          }

          genderMap.get(team.gender)!.push(team);
        });

        // Convert to array format
        const result: { category: string; gender: string; teams: Team[] }[] =
          [];
        categoryGenderMap.forEach((genderMap, category) => {
          genderMap.forEach((teamList, gender) => {
            result.push({
              category,
              gender,
              teams: teamList.sort((a, b) => a.name.localeCompare(b.name)),
            });
          });
        });

        // Sort by category and gender
        return result.sort((a, b) => {
          if (a.category !== b.category) {
            return a.category.localeCompare(b.category);
          }
          return a.gender.localeCompare(b.gender);
        });
      })
    );
  }
}
