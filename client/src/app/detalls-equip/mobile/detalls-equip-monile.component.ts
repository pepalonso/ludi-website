import { Component, Input } from '@angular/core';
import { Sexe, TallaSamarreta, Team } from '../../interfaces/ludi.interface';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-team-mobile',
  templateUrl: './detalls-equip-mobile.component.html',
  styleUrls: ['./detalls-equip-mobile.component.css'],
  imports: [CommonModule],
  standalone: true,
})
export class TeamMobileComponent {
  public TallaSamarreta = TallaSamarreta;
  public Sexe = Sexe;
  @Input() team!: Team;

}
