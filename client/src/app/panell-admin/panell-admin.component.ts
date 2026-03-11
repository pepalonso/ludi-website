import { Component, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms'
import { ChartModule } from 'primeng/chart'
import { TableModule } from 'primeng/table'
import { ButtonModule } from 'primeng/button'
import { DropdownModule } from 'primeng/dropdown'
import { CardModule } from 'primeng/card'
import { ToastModule } from 'primeng/toast'
import { MessageService } from 'primeng/api'
import { Categories, Sexe } from '../interfaces/ludi.interface'
import { environment } from '../../environments/environment.prod'
import { Router } from '@angular/router'
import { AuthService } from '../serveis/auth.service'

interface Club {
  id: number
  nom: string
  equipCount?: number
}

interface Equip {
  id: number
  nom: string
  email: string
  categoria: string
  telefon: string
  sexe: string
  club_id: number
  data_incripcio: string
  club_nom?: string
  jugadors?: number
  entrenadors?: number
  token?: string
}

interface Jugador {
  id: number
  nom: string
  cognoms: string
  talla_samarreta: string
  id_equip: number
  equip_nom?: string
}

interface Entrenador {
  id: number
  nom: string
  cognoms: string
  talla_samarreta: string
  es_principal: boolean
  id_equip: number
  equip_nom?: string
}

interface Statistics {
  totalClubs: number
  totalEquips: number
  totalJugadors: number
  totalEntrenadors: number
  equipsByCategoria: { [key: string]: number }
  equipsBySexe: { [key: string]: number }
  inscripcionsPorDia: { [key: string]: number }
  clubsWithMostTeams: Club[]
}

@Component({
  selector: 'app-panell-admin',
  templateUrl: './panell-admin.component.html',
  styleUrls: ['./panell-admin.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ChartModule,
    TableModule,
    ButtonModule,
    DropdownModule,
    CardModule,
    ToastModule,
  ],
  providers: [MessageService],
})
export class PanellAdminComponent implements OnInit {
  private token: string = ''
  public loading: boolean = true
  private host = environment.apiBaseUrl

  // Data
  clubs: Club[] = []
  public equips: Equip[] = []
  public jugadors: Jugador[] = []
  public entrenadors: Entrenador[] = []
  public statistics: Statistics | null = null

  // Charts
  public categoriaChartData: any
  public sexeChartData: any
  public inscripcionesChartData: any
  public chartOptions: any

  // Filters
  public filterForm: FormGroup
  public categories: string[] = []
  public sexes: string[] = []

  // Active tab
  public activeTab: 'dashboard' | 'teams' | 'players' | 'coaches' = 'dashboard'

  constructor(
    private fb: FormBuilder,
    private messageService: MessageService,
    private router: Router,
    private authService: AuthService
  ) {
    this.filterForm = this.fb.group({
      club: [''],
      categoria: [''],
      sexe: [''],
    })
  }

  ngOnInit(): void {
    this.setupAuthentication()
    this.setupChartOptions()
  }

  setupAuthentication(): void {
    if (!this.authService.isAdminAuthenticated()) {
      this.router.navigate(['/administrador-login'])
      return
    }
    this.token = this.authService.getAdminToken()
    this.loadData()
  }

  setupChartOptions(): void {
    this.chartOptions = {
      plugins: {
        legend: {
          labels: {
            color: '#ffffff',
          },
        },
      },
      scales: {
        x: {
          ticks: {
            color: '#cccccc',
          },
          grid: {
            color: 'rgba(255,255,255,0.1)',
          },
        },
        y: {
          ticks: {
            color: '#cccccc',
          },
          grid: {
            color: 'rgba(255,255,255,0.1)',
          },
        },
      },
    }
  }

  async loadData(filters?: { club?: string; categoria?: string; sexe?: string }): Promise<void> {
    this.loading = true

    try {
      await Promise.all([
        this.loadClubs(),
        this.loadJugadors(),
        this.loadEntrenadors(),
        this.loadStatistics(),
        setTimeout(() => {
          this.loadEquips(filters)
        }, 200), // Await for clubs to load before loading equips
        ,
      ])

      this.prepareFilters()
      if (this.statistics) {
        this.statistics.totalClubs = this.clubs.length
        this.statistics.totalJugadors = this.jugadors.length
        this.statistics.totalEntrenadors = this.entrenadors.length
      }
      this.prepareCharts()
      this.loading = false
    } catch (error) {
      console.error('Error loading data:', error)
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load data. Please try again.',
      })
      this.loading = false
    }
  }

  async loadClubs(): Promise<void> {
    const response = await fetch(`${this.host}/api/clubs`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
    })
    const data = await response.json()
    this.clubs = Array.isArray(data) ? data.map((c: { id: number; name: string }) => ({ id: c.id, nom: c.name })) : []
  }

  async loadEquips(filters?: { club?: string; categoria?: string; sexe?: string }): Promise<void> {
    const queryParams: string[] = []
    if (filters) {
      if (filters.club) queryParams.push(`club_id=${filters.club}`)
      if (filters.categoria) queryParams.push(`category=${filters.categoria}`)
      if (filters.sexe) queryParams.push(`gender=${filters.sexe}`)
    }
    queryParams.push('page_size=5000')
    const qs = `?${queryParams.join('&')}`
    const response = await fetch(`${this.host}/api/teams${qs}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
    })
    const data = await response.json()
    const teams = data?.teams ?? []
    this.equips = teams.map((t: Record<string, unknown>) => {
      const clubId = t['club_id'] as number
      return {
        id: t['id'],
        nom: t['name'],
        email: t['email'],
        categoria: t['category'],
        telefon: t['phone'],
        sexe: t['gender'],
        club_id: clubId,
        data_incripcio: t['registration_date'],
        club_nom: this.clubs.find(c => c.id === clubId)?.nom ?? 'Unknown',
        token: (t['registration_token'] as string) ?? undefined,
      }
    })
  }

  async loadJugadors(): Promise<void> {
    const response = await fetch(`${this.host}/api/players?page_size=5000`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
    })
    const data = await response.json()
    const list = data?.players ?? data ?? []
    this.jugadors = list.map((p: { id: number; first_name: string; last_name: string; shirt_size: string; team_id: number }) => ({
      id: p.id,
      nom: p.first_name,
      cognoms: p.last_name,
      talla_samarreta: p.shirt_size,
      id_equip: p.team_id,
      equip_nom: this.equips.find(e => e.id === p.team_id)?.nom,
    }))
  }

  async loadEntrenadors(): Promise<void> {
    const response = await fetch(`${this.host}/api/coaches?page_size=5000`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
    })
    const data = await response.json()
    const list = data?.coaches ?? data ?? []
    this.entrenadors = list.map((c: { id: number; first_name: string; last_name: string; shirt_size: string; team_id: number; is_head_coach: boolean }) => ({
      id: c.id,
      nom: c.first_name,
      cognoms: c.last_name,
      talla_samarreta: c.shirt_size,
      es_principal: c.is_head_coach,
      id_equip: c.team_id,
      equip_nom: this.equips.find(e => e.id === c.team_id)?.nom,
    }))
  }

  async loadStatistics(): Promise<void> {
    const response = await fetch(`${this.host}/api/teams/stats`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
    })
    const data = await response.json()
    if (!data) {
      this.statistics = null
      return
    }
    this.statistics = {
      totalClubs: 0,
      totalEquips: data.total_teams ?? 0,
      totalJugadors: 0,
      totalEntrenadors: 0,
      equipsByCategoria: data.by_category ?? {},
      equipsBySexe: data.by_gender ?? {},
      inscripcionsPorDia: {},
      clubsWithMostTeams: [],
    }
  }

  prepareFilters(): void {
    this.categories = Object.values(Categories)
    this.sexes = Object.values(Sexe)
  }

  prepareCharts(): void {
    if (!this.statistics) return

    this.categoriaChartData = {
      labels: Object.keys(this.statistics.equipsByCategoria),
      datasets: [
        {
          label: 'Teams by Category',
          data: Object.values(this.statistics.equipsByCategoria),
          backgroundColor: [
            'rgba(255, 159, 64, 0.7)',
            'rgba(255, 205, 86, 0.7)',
            'rgba(75, 192, 192, 0.7)',
            'rgba(54, 162, 235, 0.7)',
            'rgba(153, 102, 255, 0.7)',
            'rgba(255, 99, 132, 0.7)',
          ],
        },
      ],
    }

    // Sexe chart
    this.sexeChartData = {
      labels: Object.keys(this.statistics.equipsBySexe),
      datasets: [
        {
          label: 'Teams by Gender',
          data: Object.values(this.statistics.equipsBySexe),
          backgroundColor: ['rgba(0, 0, 0, 0.6)', 'rgba(211, 103, 1, 0.6 )'],
        },
      ],
    }

    // Daily registrations chart
    const labels = Object.keys(this.statistics.inscripcionsPorDia).sort()
    const data = labels.map(date => this.statistics?.inscripcionsPorDia[date] || 0)

    this.inscripcionesChartData = {
      labels: labels,
      datasets: [
        {
          label: 'Inscripcions per dia',
          data: data,
          fill: true,
          borderColor: '#D36701',
          tension: 0.4,
        },
      ],
    }
  }

  applyFilters(): void {
    const filters = this.filterForm.value
    this.loadData(filters)
  }

  resetFilters(): void {
    this.filterForm.reset()
    this.loadData()
  }

  setActiveTab(tab: 'dashboard' | 'teams' | 'players' | 'coaches'): void {
    this.activeTab = tab
  }

  exportToCSV(dataType: string): void {
    let data: any[] = []
    let headers: string[] = []

    switch (dataType) {
      case 'teams':
        data = this.equips
        headers = [
          'ID',
          'Nom',
          'Categoria',
          'Sexe',
          'Club',
          'Email',
          'Telefon',
          'nº de jugadors',
          "nº d'entrenadors",
          'nº de dietes',
          'Intoleràncies',
          'Observacions',
          "Data d'inscripció",
        ]
        break
      case 'players':
        data = this.jugadors
        headers = ['ID', 'Nom', 'Cognoms', 'Equip', 'Talla de samarreta']
        break
      case 'coaches':
        data = this.entrenadors
        headers = ['ID', 'Nom', 'Cognoms', 'Equip', 'Entrenador principal', 'Talla de samarreta']
        break
    }

    // Generate CSV
    const csvContent = this.generateCSV(headers, data)

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${dataType}_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  generateCSV(headers: string[], data: any[]): string {
    let result = headers.join(',') + '\n'

    data.forEach(item => {
      const values = headers.map(header => {
        // Map header to corresponding property
        let value = ''
        switch (header) {
          case 'ID':
            value = item.id
            break
          case 'Nom':
            value = item.nom
            break
          case 'Cognoms':
            value = item.cognoms
            break
          case 'Equip':
            value = item.equip_nom
            break
          case 'Categoria':
            value = item.categoria
            break
          case 'Sexe':
            value = item.sexe
            break
          case 'Club':
            value = item.club_nom
            break
          case 'Email':
            value = item.email
            break
          case 'Telefon':
            value = item.telefon
            break
          case 'Observacions':
            value = item.observacions || ''
            break
          case "Data d'inscripció":
            value = item.data_incripcio
            break
          case 'nº de jugadors':
            value = item.jugadors.toString() || ''
            break
          case "nº d'entrenadors":
            value = item.entrenadors.toString() || ''
            break
          case 'nº de dietes':
            value = (item.jugadors + item.entrenadors).toString() || ''
            break
          case 'Intoleràncies':
            value = item.intolerancies.join(' | ')
            break
          case 'Talla de samarreta':
            value = item.talla_samarreta || ''
            break
          case 'Entrenador principal':
            value = item.es_principal ? 'Si' : 'No'
            break
          default:
            value = ''
        }

        // Escape quotes and wrap in quotes if contains comma
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          value = `"${value.replace(/"/g, '""')}"`
        }

        return value
      })

      result += values.join(',') + '\n'
    })

    return result
  }

  public navigateToTeamLink(token?: string): void {
    this.router.navigate(['/equip'], { queryParams: token ? { token } : {} })
  }
}

