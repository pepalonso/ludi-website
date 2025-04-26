import { Team, Group, Subgroup } from '../services/tournament.service';

export interface TeamHierarchySubgroup {
  id: number;
  name: string;
  teams: Team[];
}

export interface TeamHierarchyItem {
  id: number;
  name: string;
  subgroups: TeamHierarchySubgroup[];
}

export interface TeamHierarchy {
  categories: {
    [category: string]: {
      genders: {
        [gender: string]: {
          groups: Group[];
          teams: Team[];
        };
      };
    };
  };
}
