import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FooterComponent } from "../utils/footer/footer.component";

@Component({
  selector: 'app-informacio-inscripcio',
  standalone: true,
  imports: [RouterLink, FooterComponent],
  templateUrl: './informacio-inscripcio.component.html',
  styleUrl: './informacio-inscripcio.component.css'
})
export class InformacioInscripcioComponent {

}
