import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Team } from '../interfaces/ludi.interface';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

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

    constructor(private route: ActivatedRoute) {}

    ngOnInit() {
      this.route.queryParams.subscribe((params) => {
        this.token = params['token'] || null;
        console.log('Received token:', this.token);
        if (this.token) {
          this.fetchTeamDetails(this.token);
        }
      });
    }

    async fetchTeamDetails(token: string): Promise<void> {
      const url = 'http://127.0.0.1:3000/inscripcio';
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

        this.team = await response.json();
        console.log('Team data:', this.team);
      } catch (error) {
        this.error = true;
        console.error('Error fetching team details:', error);
      }
    }
  }
