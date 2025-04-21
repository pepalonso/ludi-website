import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { firebaseApp } from '../app.config';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Categories, Sexe } from '../interfaces/ludi.interface';
import { environment } from '../../environments/environment.prod';
import { Router } from '@angular/router';
import { AuthService } from '../serveis/auth.service';

interface Club {
  id: number;
  nom: string;
  equipCount?: number;
}

interface Equip {
  id: number;
  nom: string;
  email: string;
  categoria: string;
  telefon: string;
  sexe: string;
  club_id: number;
  data_incripcio: string;
  club_nom?: string;
  jugadors?: number;
  entrenadors?: number;
  token?: string;
}

interface Jugador {
  id: number;
  nom: string;
  cognoms: string;
  talla_samarreta: string;
  id_equip: number;
  equip_nom?: string;
}

interface Entrenador {
  id: number;
  nom: string;
  cognoms: string;
  talla_samarreta: string;
  es_principal: boolean;
  id_equip: number;
  equip_nom?: string;
}

interface Statistics {
  totalClubs: number;
  totalEquips: number;
  totalJugadors: number;
  totalEntrenadors: number;
  equipsByCategoria: { [key: string]: number };
  equipsBySexe: { [key: string]: number };
  inscripcionsPorDia: { [key: string]: number };
  clubsWithMostTeams: Club[];
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
  private auth = getAuth(firebaseApp);
  private token: string = '';
  public loading: boolean = true;
  private host = environment.production
          ? `https://${environment.apiUrl}`
          : `http://${environment.apiUrl}`;


  // Data
  clubs: Club[] = [];
  public equips: Equip[] = [];
  public jugadors: Jugador[] = [];
  public entrenadors: Entrenador[] = [];
  public statistics: Statistics | null = null;

  // Charts
  public categoriaChartData: any;
  public sexeChartData: any;
  public inscripcionesChartData: any;
  public chartOptions: any;

  // Filters
  public filterForm: FormGroup;
  public categories: string[] = [];
  public sexes: string[] = [];

  // Active tab
  public activeTab: 'dashboard' | 'teams' | 'players' | 'coaches' = 'dashboard';

  constructor(
    private fb: FormBuilder,
    private messageService: MessageService,
    private router: Router,
    private authService: AuthService,
  ) {
    this.filterForm = this.fb.group({
      club: [''],
      categoria: [''],
      sexe: [''],
    });
  }

  ngOnInit(): void {
    this.setupAuthentication();
    this.setupChartOptions();
  }

  setupAuthentication(): void {
    onAuthStateChanged(this.auth, async (user) => {
      if (user) {
        this.token = await user.getIdToken();
        this.loadData();
      } else {
        window.location.href = '/administrador-login';
      }
    });

    this.authService.getToken()
      .then((token: string) => {
        this.token = token;
        this.loadData();
      })
      .catch(error => {
        console.error('Authentication error:', error);
        this.router.navigate(['/administrador-login']);
      });
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
    };
  }

  async loadData(filters?: { club?: string; categoria?: string; sexe?: string }): Promise<void> {
    this.loading = true;

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
      ]);

      this.prepareFilters();
      this.prepareCharts();
      this.loading = false;
    } catch (error) {
      console.error('Error loading data:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load data. Please try again.',
      });
      this.loading = false;
    }
  }


  async loadClubs(): Promise<void> {
    const enpoint = `${this.host}/clubs`;

    const response = await fetch(enpoint, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    this.clubs = data

  }

  async loadEquips(filters?: { club?: string; categoria?: string; sexe?: string }): Promise<void> {
    let endpoint = `${this.host}/equips`;

    const queryParams: string[] = [];
    if (filters) {
      if (filters.club) queryParams.push(`club_id=${filters.club}`);
      if (filters.categoria) queryParams.push(`categoria=${filters.categoria}`);
      if (filters.sexe) queryParams.push(`sexe=${filters.sexe}`);
    }

    if (queryParams.length > 0) {
      endpoint += `?${queryParams.join('&')}`;
    }

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    this.equips = data;

    // Add club name to each team
    this.equips.forEach((equip) => {
      const club = this.clubs.find((c) => c.id === equip.club_id);
      equip.club_nom = club ? club.nom : 'Unknown';
    });
  }


  async loadJugadors(): Promise<void> {

    const enpoint = `${this.host}/jugadors`;

    const response = await fetch(enpoint, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    this.jugadors = data


    // Add team name to each player
    this.jugadors.forEach((jugador) => {
      const equip = this.equips.find((e) => e.id === jugador.id_equip);
      const club = this.clubs.find((c) => c.id === equip?.club_id);
      jugador.equip_nom = equip?.nom ?? club?.nom
    });
  }

  async loadEntrenadors(): Promise<void> {
    const enpoint = `${this.host}/entrenadors`;

    const response = await fetch(enpoint, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    this.entrenadors = data


    // Add team name to each coach
    this.entrenadors.forEach((entrenador) => {
      const equip = this.equips.find((e) => e.id === entrenador.id_equip);
      const club = this.clubs.find((c) => c.id === equip?.club_id);
      entrenador.equip_nom = equip?.nom ?? club?.nom
    });
  }

  async loadStatistics(): Promise<void> {
    const enpoint = `${this.host}/estadistiques`;

    const response = await fetch(enpoint, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    this.statistics = data

  }

  prepareFilters(): void {
    this.categories = Object.values(Categories)
    this.sexes = Object.values(Sexe)
  }

  prepareCharts(): void {
    if (!this.statistics) return;

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
    };

    // Sexe chart
    this.sexeChartData = {
      labels: Object.keys(this.statistics.equipsBySexe),
      datasets: [
        {
          label: 'Teams by Gender',
          data: Object.values(this.statistics.equipsBySexe),
          backgroundColor: [
            'rgba(0, 0, 0, 0.6)',
            'rgba(211, 103, 1, 0.6 )',
          ],
        },
      ],
    };

    // Daily registrations chart
    const labels = Object.keys(this.statistics.inscripcionsPorDia).sort();
    const data = labels.map(
      (date) => this.statistics?.inscripcionsPorDia[date] || 0
    );

    this.inscripcionesChartData = {
      labels: labels,
      datasets: [
        {
          label: 'Inscripcions per dia',
          data: data,
          fill: false,
          borderColor: '#D36701',
          tension: 0.4,
        },
      ],
    };
  }

  applyFilters(): void {
    const filters = this.filterForm.value;
    this.loadData(filters);
  }


  resetFilters(): void {
    this.filterForm.reset();
    this.loadData();
  }

  setActiveTab(tab: 'dashboard' | 'teams' | 'players' | 'coaches'): void {
    this.activeTab = tab;
  }

  exportToCSV(dataType: string): void {
    let data: any[] = [];
    let headers: string[] = [];

    switch (dataType) {
      case 'teams':
        data = this.equips;
        headers = [
          'ID',
          'Name',
          'Category',
          'Gender',
          'Club',
          'Email',
          'Phone',
          'Registration Date',
        ];
        break;
      case 'players':
        data = this.jugadors;
        headers = ['ID', 'Name', 'Surname', 'Team', 'Jersey Size'];
        break;
      case 'coaches':
        data = this.entrenadors;
        headers = [
          'ID',
          'Name',
          'Surname',
          'Team',
          'Main Coach',
          'Jersey Size',
        ];
        break;
    }

    // Generate CSV
    const csvContent = this.generateCSV(headers, data);

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `${dataType}_${new Date().toISOString().split('T')[0]}.csv`
    );
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  generateCSV(headers: string[], data: any[]): string {
    let result = headers.join(',') + '\n';

    data.forEach((item) => {
      const values = headers.map((header) => {
        // Map header to corresponding property
        let value = '';
        switch (header) {
          case 'ID':
            value = item.id;
            break;
          case 'Name':
            value = item.nom;
            break;
          case 'Surname':
            value = item.cognoms || '';
            break;
          case 'Team':
            value = item.equip_nom || '';
            break;
          case 'Category':
            value = item.categoria || '';
            break;
          case 'Gender':
            value = item.sexe || '';
            break;
          case 'Club':
            value = item.club_nom || '';
            break;
          case 'Email':
            value = item.email || '';
            break;
          case 'Phone':
            value = item.telefon || '';
            break;
          case 'Registration Date':
            value = item.data_incripcio || '';
            break;
          case 'Jersey Size':
            value = item.talla_samarreta || '';
            break;
          case 'Main Coach':
            value = item.es_principal ? 'Yes' : 'No';
            break;
          default:
            value = '';
        }

        // Escape quotes and wrap in quotes if contains comma
        if (
          typeof value === 'string' &&
          (value.includes(',') || value.includes('"'))
        ) {
          value = `"${value.replace(/"/g, '""')}"`;
        }

        return value;
      });

      result += values.join(',') + '\n';
    });

    return result;
  }

  public navigateToTeamLink(token?: string): void {
    this.router.navigate(['/equip'], { queryParams: { token } });
  }
}
