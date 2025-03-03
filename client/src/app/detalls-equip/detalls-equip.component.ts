import { Component, OnInit } from '@angular/core';
import { Sexe, TallaSamarreta, Team } from '../interfaces/ludi.interface';
import { ActivatedRoute } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { environment } from '../../environments/environment';
import { mapTeamResponse } from './data-mapper';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TeamMobileComponent } from './mobile/detalls-equip-monile.component';
import { TeamDesktopComponent } from './desktop/detalls-equip-desktop.component';
import { testResponse } from '../data/test';


@Component({
  selector: 'app-detalls-equip',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    TeamMobileComponent,
    TeamDesktopComponent,
  ],
  templateUrl: './detalls-equip.component.html',
  styleUrl: './detalls-equip.component.css',
})
export class DetallsEquipComponent implements OnInit {
  private token?: string;
  public team?: Team;
  public error: boolean = false;
  public isDesktop: boolean = false;

  public Sexe = Sexe;
  public TallaSamarreta = TallaSamarreta;

  constructor(
    private route: ActivatedRoute,
    private breakpointObserver: BreakpointObserver
  ) {}

  ngOnInit() {
    this.breakpointObserver
      .observe([Breakpoints.Handset])
      .subscribe((result) => {
        this.isDesktop = !result.matches;
      });

    this.route.queryParams.subscribe((params) => {
      this.token = params['token'] || null;
      if (this.token) {
        this.fetchTeamDetails(this.token);
      }
    });
  }

  private async fetchTeamDetails(token: string): Promise<void> {
    const url = `https://${environment.apiUrl}/inscripcio`;
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        console.error('Error fetching team details:', response.statusText);
        this.error = true;
        return;
      }

      const responseData = await response.json();
      this.team = mapTeamResponse(responseData);
    } catch (error) {
      this.error = true;
      console.error('Error fetching team details:', error);
    }
  }
}
