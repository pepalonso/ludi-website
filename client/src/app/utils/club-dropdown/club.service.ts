import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable, of, tap } from 'rxjs'
import { environment } from '../../../environments/environment'

export interface Club {
  club_name: string
  logo_url: string
}

@Injectable({
  providedIn: 'root',
})
export class ClubService {
  private clubs: Club[] = []
  private load$: Observable<Club[]> | null = null

  constructor(private http: HttpClient) {}

  /** Load clubs from API (proxied from basquetcatala: name + logo_url) and cache. */
  loadClubs(): Observable<Club[]> {
    if (this.clubs.length > 0) {
      return of(this.clubs)
    }
    if (!this.load$) {
      const url = `${environment.apiBaseUrl}/api/clubs/list`
      this.load$ = this.http.get<Club[]>(url).pipe(
        tap((list) => {
          this.clubs = list || []
          this.load$ = null
        })
      )
    }
    return this.load$
  }

  /** Cached list (empty until loadClubs() has been used). */
  getClubs(): Club[] {
    return this.clubs
  }
}
