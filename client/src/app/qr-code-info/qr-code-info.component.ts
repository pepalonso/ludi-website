import { Component, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { ActivatedRoute, Router } from '@angular/router'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { environment } from '../../environments/environment.prod'
import { TallaSamarreta } from '../interfaces/ludi.interface'

interface QRTeamDetails {
  team_id: number
  team_name: string
  club_name: string
  total_members: number
  players_count: number
  coaches_count: number
  shirt_sizes: { [key: string]: number }
  allergies: { [key: string]: number }
  observations: string
}

@Component({
  selector: 'app-qr-code-info',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  templateUrl: './qr-code-info.component.html',
  styleUrl: './qr-code-info.component.css',
})
export class QrCodeInfoComponent implements OnInit {
  public token?: string
  public teamDetails?: QRTeamDetails
  public error: boolean = false
  public orderedShirtSizes: { key: string; value: number }[] = []

  constructor(private router: Router, private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] || null
      if (this.token) {
        this.fetchTeamDetails(this.token)
      } else {
        this.router.navigate(['/404'])
      }
    })
  }

  private getSizeOrder(size: string): number {
    const order = Object.values(TallaSamarreta)
    return order.indexOf(size as TallaSamarreta)
  }

  private sortShirtSizes(sizes: { [key: string]: number }): { key: string; value: number }[] {
    return Object.entries(sizes)
      .map(([key, value]) => ({ key, value }))
      .sort((a, b) => this.getSizeOrder(a.key) - this.getSizeOrder(b.key))
  }

  private async fetchTeamDetails(token: string): Promise<void> {
    const url = environment.production
      ? `https://${environment.apiUrl}/detalls-qr`
      : `http://${environment.apiUrl}/detalls-qr`

    try {
      const response = await fetch(`${url}?token=${token}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        this.router.navigate(['/404'])
        return
      }

      this.teamDetails = await response.json()
      if (this.teamDetails) {
        this.orderedShirtSizes = this.sortShirtSizes(this.teamDetails.shirt_sizes)
      }
    } catch (error) {
      console.error('Error fetching team details:', error)
      this.router.navigate(['/404'])
    }
  }
}
