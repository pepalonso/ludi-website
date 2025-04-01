import { Component, Input } from '@angular/core';
import { Sexe, TallaSamarreta, Team } from '../../interfaces/ludi.interface';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-previsualitzacio-mobile',
  templateUrl: './detalls-equip-mobile.component.html',
  styleUrls: ['./detalls-equip-mobile.component.css'],
  imports: [CommonModule],
  standalone: true,
})
export class PrevisualitzacioMobileComponent {
  public TallaSamarreta = TallaSamarreta;
  public Sexe = Sexe;
  @Input() team!: Team;

}
