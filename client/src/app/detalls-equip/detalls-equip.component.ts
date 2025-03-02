import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Team, Sexe, TallaSamarreta } from '../interfaces/ludi.interface';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { mapTeamResponse } from './data-mapper';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-detalls-equip',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  templateUrl: './detalls-equip.component.html',
  styleUrls: ['./detalls-equip.component.css'],
})
export class DetallsEquipComponent implements OnInit {
  token?: string;
  team?: Team;
  error: boolean = false;
  
  Sexe = Sexe;
  TallaSamarreta = TallaSamarreta;

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      this.token = params['token'] || null;
      if (this.token) {
        this.fetchTeamDetails(this.token);
      }
    });
  }

  async fetchTeamDetails(token: string): Promise<void> {
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