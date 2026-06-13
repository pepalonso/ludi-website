import { Component, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { ActivatedRoute, Router } from '@angular/router'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { environment } from '../../environments/environment'
import { take } from 'rxjs'
import { getPartitsUrl } from './sopar-partits-links'

interface SoparTeamInfo {
  nomEquip: string
  club: string
  categoria: string
  sexe: string
  tornSopar?: number
  idDormitori?: string
  jugadors: unknown[]
  entrenadors: unknown[]
}

@Component({
  selector: 'app-sopar-info',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  templateUrl: './sopar-info.component.html',
  styleUrl: './sopar-info.component.css',
})
export class SoparInfoComponent implements OnInit {
  public teamInfo?: SoparTeamInfo
  public error = false

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.route.queryParams.pipe(take(1)).subscribe(params => {
      const token = params['token']
      if (token) {
        this.fetchTeamInfo(token)
      } else {
        this.error = true
      }
    })
  }

  get playersCount(): number {
    return this.teamInfo?.jugadors?.length ?? 0
  }

  get coachesCount(): number {
    return this.teamInfo?.entrenadors?.length ?? 0
  }

  get totalMembers(): number {
    return this.playersCount + this.coachesCount
  }

  get tornSoparDisplay(): string {
    const torn = this.teamInfo?.tornSopar
    if (torn == null) return '-'
    switch (torn) {
      case 1:
        return '20:00'
      case 2:
        return '20:45'
      case 3:
        return '21:30'
      default:
        return '-'
    }
  }

  get dormitoriDisplay(): string {
    const dormitori = this.teamInfo?.idDormitori?.trim()
    return dormitori ? dormitori : '-'
  }

  get partitsUrl(): string | undefined {
    if (!this.teamInfo) return undefined
    return getPartitsUrl(this.teamInfo.categoria, this.teamInfo.sexe)
  }

  private async fetchTeamInfo(token: string): Promise<void> {
    const url = `${environment.apiBaseUrl}/api/me/team`
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    }

    try {
      const response = await fetch(url, { method: 'GET', headers })

      if (!response.ok) {
        this.error = true
        return
      }

      this.teamInfo = await response.json()
    } catch (err) {
      console.error('Error fetching dinner info:', err)
      this.error = true
    }
  }
}

