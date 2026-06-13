import { Categories, Sexe } from '../interfaces/ludi.interface'

/** DB category + gender → Xporty partits URL (from temp/links categories CSV). */
const partitsLinks: Record<string, string> = {
  // Pre-mini: single bracket for both genders in the tournament
  [`${Categories.PREMINI}|${Sexe.MASC}`]:
    'https://www.xporty.com/tournaments/9276275-24e-ludibasquet/participants?e_id=9276362',
  [`${Categories.PREMINI}|${Sexe.FEM}`]:
    'https://www.xporty.com/tournaments/9276275-24e-ludibasquet/participants?e_id=9276362',
  [`${Categories.MINI}|${Sexe.FEM}`]:
    'https://www.xporty.com/tournaments/9276275-24e-ludibasquet/participants?e_id=9276363',
  [`${Categories.MINI}|${Sexe.MASC}`]:
    'https://www.xporty.com/tournaments/9276275-24e-ludibasquet/participants?e_id=9276364',
  [`${Categories.PREINFANTIL}|${Sexe.MASC}`]:
    'https://www.xporty.com/tournaments/9276275-24e-ludibasquet/participants?e_id=9276369',
  [`${Categories.PREINFANTIL}|${Sexe.FEM}`]:
    'https://www.xporty.com/tournaments/9276275-24e-ludibasquet/participants?e_id=9276370',
  [`${Categories.INFANTIL}|${Sexe.FEM}`]:
    'https://www.xporty.com/tournaments/9276275-24e-ludibasquet/participants?e_id=9276372',
  [`${Categories.INFANTIL}|${Sexe.MASC}`]:
    'https://www.xporty.com/tournaments/9276275-24e-ludibasquet/participants?e_id=9276373',
  [`${Categories.CADET}|${Sexe.FEM}`]:
    'https://www.xporty.com/tournaments/9276275-24e-ludibasquet/participants?e_id=9276376',
  [`${Categories.CADET}|${Sexe.MASC}`]:
    'https://www.xporty.com/tournaments/9276275-24e-ludibasquet/participants?e_id=9276380',
  [`${Categories.JUNIOR}|${Sexe.FEM}`]:
    'https://www.xporty.com/tournaments/9276275-24e-ludibasquet/participants?e_id=9276384',
}

export function getPartitsUrl(categoria: string, sexe: string): string | undefined {
  const url = partitsLinks[`${categoria}|${sexe}`]
  return url?.trim() || undefined
}

