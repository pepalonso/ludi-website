import { Match } from '../services/tournament.service';

export interface ScheduledMatch {
  id: number;
  team1: number;
  team2: number;
  score1?: number;
  score2?: number;
  date: string;
  time: string;
  court: string;
  slot: string;
  phase: string;
  group?: number;
  subgroup?: number;
  round?: string;
}

export interface MatchSlot {
  id: string;
  date: string;
  time: string;
  court: string;
  match?: Match;
}
