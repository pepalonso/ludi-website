export interface Jugador {
  id?: string;
  nom: string;
  cognoms: string;
  tallaSamarreta: TallaSamarreta;
}

export interface Entrenador {
  id?: string;
  nom: string;
  cognoms: string;
  tallaSamarreta: TallaSamarreta;
  esPrincipal: number;
}

export interface Team {
  nomEquip: string;
  email: string;
  telefon: string;
  categoria: Categories;
  sexe: Sexe;
  club: string;
  intolerancies?: { name: string; count: number }[];
  jugadors: Jugador[];
  entrenadors: Entrenador[];
  observacions?: string;
  fitxes?: string[];
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  darkColor?: string;
}


export enum TallaSamarreta {
  vuit = '8',
  deu = '10',
  dotze = '12',
  catorze = '14',
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

export enum Categories {
  PREMINI = 'Pre-mini',
  MINI = 'Mini',
  PREINFANTIL = 'Pre-infantil',
  INFANTIL = 'Infantil',
  CADET = 'Cadet',
  JUNIOR = 'Júnior',
}
