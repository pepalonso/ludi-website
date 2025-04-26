export interface Competition {
  name: string;
  start_date: string;
  end_date: string;
  two_way_matches: boolean;
  two_way_elimination_matches: boolean;
}

export interface Court {
  name: string;
  location: string;
  available_times: AvailableTime[];
}

export interface AvailableTime {
  date: string;
  start_time: string;
  duration_in_slots: number;
}

export interface MatchSlots {
  slots_duration_in_minutes: number;
  courts: Court[];
}

export interface CompetitionSchema {
  [key: string]: {
    subgroups: {
      id: number;
      name: string;
      team_number: number;
    }[];
    quarterfinals?: {
      matches: SchemaMatch[];
    };
    semifinals?: {
      matches: SchemaMatch[];
    };
    final: {
      matches: SchemaMatch[];
    };
  };
}

export interface SchemaMatch {
  team_a: {
    subgroup?: number | null;
    position?: number;
    quarterfinals_match?: number;
    semifinals_match?: number;
  };
  team_b: {
    subgroup?: number | null;
    position?: number;
    quarterfinals_match?: number;
    semifinals_match?: number;
  };
}

export interface Scheduler {
  minRestSlots: number;
  allowedCourtsForMini: string[];
  preMiniDeadline: string;
  nightGameStart: string;
  nightGameEnd: string;
  courtVarietyWeight: number;
  nightGameWeight: number;
  timeSpreadWeight: number;
  maxSolveTimeSeconds: number;
}

export interface CompetitionData {
  competition: Competition;
  match_slots: MatchSlots;
  competition_schema: CompetitionSchema;
  scheduler: Scheduler;
}
