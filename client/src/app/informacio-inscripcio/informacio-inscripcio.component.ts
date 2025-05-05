import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FooterComponent } from "../utils/footer/footer.component";
import { NavMenuComponent } from "../pagina-web/nav-menu/nav-menu.component";

@Component({
  selector: 'app-informacio-inscripcio',
  standalone: true,
  imports: [RouterLink, FooterComponent, NavMenuComponent],
  templateUrl: './informacio-inscripcio.component.html',
  styleUrl: './informacio-inscripcio.component.css'
})
export class InformacioInscripcioComponent {

}
