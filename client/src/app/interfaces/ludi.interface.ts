export interface Jugador {
  nom: string;
  cognoms: string;
  tallaSamarreta: TallaSamarreta;
}

export interface Entrenador {
  nom: string;
  cognoms: string;
  tallaSamarreta: TallaSamarreta;
  esPrincipal: boolean;
}

export interface Team {
  nomEquip: string;
  email: string;
  telefon: string;
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
  MASC = 'Masc',
  FEM = 'Fem',
  MIXTE = 'Mixte',
}
