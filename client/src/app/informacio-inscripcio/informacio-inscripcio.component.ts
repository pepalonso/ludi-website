import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FooterComponent } from "../utils/footer/footer.component";
import { NavMenuComponent } from "../pagina-web/nav-menu/nav-menu.component";
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-informacio-inscripcio',
  standalone: true,
  imports: [RouterLink, FooterComponent, NavMenuComponent],
  templateUrl: './informacio-inscripcio.component.html',
  styleUrl: './informacio-inscripcio.component.scss'
})
export class InformacioInscripcioComponent {
  /** Price per player (€), from env. Used in template. */
  pricePerPlayer = environment.pricePerPlayer;
  /** Price per player PREMINI (€), from env. */
  pricePerPlayerPremini = environment.pricePerPlayerPremini;
}
