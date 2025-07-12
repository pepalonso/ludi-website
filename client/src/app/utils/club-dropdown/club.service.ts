import { Injectable } from '@angular/core'
import { CLUBS_DATA } from '../../data/club-data'

interface Club {
  club_name: string
  logo_url: string
}

@Injectable({
  providedIn: 'root',
})
export class ClubService {
  private clubs = CLUBS_DATA as Club[]

  getClubs(): Club[] {
    return this.clubs
  }
}
