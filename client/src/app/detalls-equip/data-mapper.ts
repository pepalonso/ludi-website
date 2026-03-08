import { Vibrant } from 'node-vibrant/browser'
import { Team, Jugador, Entrenador, TallaSamarreta, Sexe } from '../interfaces/ludi.interface'

export type ClubListItem = { club_name: string; logo_url: string }

/**
 * Maps raw API response to properly typed Team object and extracts the primary color from the logo.
 * Pass clubs from ClubService.loadClubs() so logo URL can be resolved.
 */
export async function mapTeamResponse(
  response: any,
  clubs: ClubListItem[] = []
): Promise<Team> {
  const rawIntolerancies: string[] = response.intolerancies || []
  const intolerancies = groupIntolerancies(rawIntolerancies)
  const team: Team = {
    nomEquip: response.nomEquip,
    email: response.email,
    telefon: response.telefon,
    categoria: response.categoria,
    sexe: mapSexe(response.sexe),
    club: response.club,
    observacions: response.observacions ?? undefined,
    intolerancies: intolerancies,
    jugadors: response.jugadors.map(mapJugador),
    entrenadors: response.entrenadors.map(mapEntrenador),
    logoUrl: getUrlImage(response.club, clubs),
    primaryColor: undefined,
    secondaryColor: undefined,
    darkColor: undefined,
  }

  if (team.logoUrl) {
    try {
      const palette = await Vibrant.from(team.logoUrl).getPalette()
      team.primaryColor = palette.LightVibrant?.hex || ''
      team.secondaryColor = palette.LightMuted?.hex || ''
      team.darkColor = palette.DarkVibrant?.hex || ''
    } catch (error) {
      console.error('Error extracting primary color:', error)
    }
  }

  return team
}

function mapSexe(sexeValue: string): Sexe {
  switch (sexeValue) {
    case 'Masculí':
      return Sexe.MASC
    case 'Femení':
      return Sexe.FEM
    default:
      console.warn(`Unknown sexe value: ${sexeValue}, defaulting to Masc`)
      return Sexe.MASC
  }
}

function groupIntolerancies(intolerancies: string[]): { name: string; count: number }[] {
  const counts: { [key: string]: number } = {}
  intolerancies.forEach(item => {
    counts[item] = (counts[item] || 0) + 1
  })
  return Object.keys(counts).map(name => ({ name, count: counts[name] }))
}

export function getUrlImage(clubName: string, clubs: ClubListItem[] = []): string {
  const originalUrl = clubs.find((c: ClubListItem) => c.club_name === clubName)?.logo_url || ''

  if (
    originalUrl.startsWith('https://d3ah0nqesr6vwc.cloudfront.net') ||
    originalUrl.startsWith('https:/d3ah0nqesr6vwc.cloudfront.net')
  ) {
    const mappedUrl = originalUrl.replace(
      /https:\/{1,2}d3ah0nqesr6vwc\.cloudfront\.net/,
      '/cloudfront'
    )
    return mappedUrl
  }

  return originalUrl
}

function mapJugador(jugadorData: any): Jugador {
  return {
    id: jugadorData.id != null ? String(jugadorData.id) : undefined,
    nom: jugadorData.nom,
    cognoms: jugadorData.cognoms,
    tallaSamarreta: mapTallaSamarreta(jugadorData.tallaSamarreta),
  }
}

function mapEntrenador(entrenadorData: any): Entrenador {
  return {
    id: entrenadorData.id != null ? String(entrenadorData.id) : undefined,
    nom: entrenadorData.nom,
    cognoms: entrenadorData.cognoms,
    tallaSamarreta: mapTallaSamarreta(entrenadorData.tallaSamarreta),
    esPrincipal: entrenadorData.esPrincipal === true ? 1 : 0,
  }
}

function mapTallaSamarreta(tallaValue: string): TallaSamarreta {
  switch (tallaValue) {
    case '8':
      return TallaSamarreta.vuit
    case '10':
      return TallaSamarreta.deu
    case '12':
      return TallaSamarreta.dotze
    case '14':
      return TallaSamarreta.catorze
    case 'S':
      return TallaSamarreta.S
    case 'M':
      return TallaSamarreta.M
    case 'L':
      return TallaSamarreta.L
    case 'XL':
      return TallaSamarreta.XL
    case '2XL':
      return TallaSamarreta.XXL
    case '3XL':
      return TallaSamarreta.XXXL
    case '4XL':
      return TallaSamarreta.XXXXL
    default:
      console.warn(`Unknown talla value: ${tallaValue}, defaulting to M`)
      return TallaSamarreta.M
  }
}

