export interface TeamData {
  NOM_EQUIP: string;
  JUGADORS: JugadorData[];
  NUMERO_CONTACTE: string;
  MAIL_CONTACTE: string;
}

export interface JugadorData {
  NOM: string;
  NEIXAMENT: string;
  TALLA_SAMARRETA: string;
}

export interface ApiResponse {
  message?: string;
}
