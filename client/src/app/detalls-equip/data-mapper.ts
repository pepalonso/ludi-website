import { CLUBS_DATA } from '../data/club-data';
import { Team, Jugador, Entrenador, TallaSamarreta, Sexe } from '../interfaces/ludi.interface';

/**
 * Maps raw API response to properly typed Team object
 */
export function mapTeamResponse(response: any): Team {
  return {
    nomEquip: response.nomEquip,
    email: response.email,
    telefon: response.telefon,
    categoria: response.categoria,
    sexe: mapSexe(response.sexe),
    club: response.club,
    intolerancies: response.intolerancies || [],
    jugadors: response.jugadors.map(mapJugador),
    entrenadors: response.entrenadors.map(mapEntrenador),
    logoUrl: getUrlImage(response.club),
  };
}

function mapSexe(sexeValue: string): Sexe {
  switch (sexeValue) {
    case 'Masc':
      return Sexe.MASC;
    case 'Fem':
      return Sexe.FEM;
    case 'Mixte':
      return Sexe.MIXTE;
    default:
      console.warn(`Unknown sexe value: ${sexeValue}, defaulting to Mixte`);
      return Sexe.MIXTE;
  }
}

function getUrlImage(clubName: string): string {
  return CLUBS_DATA.find((club) => club.club_name === clubName)?.logo_url || '';
  }

function mapJugador(jugadorData: any): Jugador {
  return {
    nom: jugadorData.nom,
    cognoms: jugadorData.cognoms,
    tallaSamarreta: mapTallaSamarreta(jugadorData.tallaSamarreta)
  };
}

function mapEntrenador(entrenadorData: any): Entrenador {
  return {
    nom: entrenadorData.nom,
    cognoms: entrenadorData.cognoms,
    tallaSamarreta: mapTallaSamarreta(entrenadorData.tallaSamarreta),
    esPrincipal: entrenadorData.esPrincipal
  };
}

function mapTallaSamarreta(tallaValue: string): TallaSamarreta {
  switch (tallaValue) {
    case 'XS':
      return TallaSamarreta.XS;
    case 'S':
      return TallaSamarreta.S;
    case 'M':
      return TallaSamarreta.M;
    case 'L':
      return TallaSamarreta.L;
    case 'XL':
      return TallaSamarreta.XL;
    case '2XL':
      return TallaSamarreta.XXL;
    case '3XL':
      return TallaSamarreta.XXXL;
    case '4XL':
      return TallaSamarreta.XXXXL;
    default:
      console.warn(`Unknown talla value: ${tallaValue}, defaulting to M`);
      return TallaSamarreta.M;
  }
}
