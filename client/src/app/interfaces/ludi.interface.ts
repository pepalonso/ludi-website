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
  intolerancies?: string[];
  jugadors: Jugador[];
  entrenadors: Entrenador[];
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
  MIXTE = 'Mixte',
}
