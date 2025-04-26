export interface Group {
  id: number;
  category: string;
  gender: string;
  team_count: number;
  schema_key: string;
  subgroups: Subgroup[];
}

export interface Subgroup {
  id: number;
  name: string;
  teams: number[];
}
