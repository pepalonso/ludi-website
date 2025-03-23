import { Component, Input } from '@angular/core';
import { Sexe, TallaSamarreta, Team } from '../../interfaces/ludi.interface';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-team-desktop',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './detalls-equip-desktop.component.html',
  styleUrl: './detalls-equip-desktop.component.css',
})
export class TeamDesktopComponent {
  public TallaSamarreta = TallaSamarreta;
  public Sexe = Sexe;
  @Input() team!: Team;

}
