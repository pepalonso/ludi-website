export interface Jugador {
  nom: string;
  cognoms: string;
  tallaSamarreta: TallaSamarreta;
}

export interface Entrenador {
  nom: string;
  cognoms: string;
  tallaSamarreta: TallaSamarreta;
  esPrincipal: number;
}

export interface Team {
  nomEquip: string;
  email: string;
  telefon: string;
  categoria: string;
  sexe: Sexe;
  club: string;
  intolerancies?: { name: string; count: number }[];
  jugadors: Jugador[];
  entrenadors: Entrenador[];
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  darkColor?: string;
}


export enum TallaSamarreta {
  XS = 'XS',
  S = 'S',
  M = 'M',
  L = 'L',
  XL = 'XL',
  XXL = '2XL',
  XXXL = '3XL',
  XXXXL = '4XL',
}

export enum Sexe {
  MASC = 'Masculí',
  FEM = 'Femení',
}
