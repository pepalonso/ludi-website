import { Component } from "@angular/core"
import { CommonModule } from "@angular/common"
import { RouterModule } from "@angular/router"

interface TeamMember {
  name: string
  position: string
  image: string
  description: string
}

interface ValueItem {
  title: string
  description: string
  icon: string
}

@Component({
  selector: "app-qui-som",
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: "./qui-som.component.html",
  styleUrls: ["./qui-som.component.scss"],
})
export class QuiSomComponent {
  teamMembers: TeamMember[] = [
    {
      name: "Aram Mateos",
      position: "Director Esportiu",
      image: "assets/images/carrusel-2.JPG",
      description:
        "Amb més de 15 anys d'experiència en el món del bàsquet, lidera el nostre equip amb passió i dedicació.",
    },
    {
      name: "Pep Alonso",
      position: "Coordinadora",
      image: "assets/images/pep.jpg",
      description: "Responsable de coordinar totes les activitats i assegurar que tot funcioni perfectament.",
    },
    {
      name: "Pau Gracia",
      position: "Entrenador Principal",
      image: "assets/images/pau.jpg",
      description: "Entrenador amb experiència internacional que porta el millor del bàsquet als nostres jugadors.",
    },
    {
      name: "Mariona Martin",
      position: "Preparadora Física",
      image: "assets/images/martin.jpg",
      description: "Especialista en preparació física per a esportistes de totes les edats.",
    },
    {
      name: "Gerard Valldosera",
      position: "Preparadora Física",
      image: "assets/images/valldu.jpg",
      description: "Especialista en preparació física per a esportistes de totes les edats.",
    },
  ]

  values: ValueItem[] = [
    {
      title: "Treball en Equip",
      description: "Fomentem la col·laboració i el suport mutu entre tots els jugadors.",
      icon: "users",
    },
    {
      title: "Respecte",
      description: "Promovem el respecte cap als companys, rivals, àrbitres i entrenadors.",
      icon: "heart",
    },
    {
      title: "Esforç",
      description: "Valorem la dedicació i la constància en l'entrenament i la competició.",
      icon: "award",
    },
    {
      title: "Diversió",
      description: "Creiem que gaudir del bàsquet és fonamental per al desenvolupament dels jugadors.",
      icon: "smile",
    },
  ]

  milestones = [
    { year: "2010", event: "Fundació del club" },
    { year: "2013", event: "Primera edició del torneig LUDIBÀSQUET" },
    { year: "2015", event: "Ampliació de les instal·lacions" },
    { year: "2018", event: "Celebració del primer campus internacional" },
    { year: "2020", event: "Desè aniversari amb més de 500 jugadors" },
    { year: "2023", event: "Reconeixement com a millor club formatiu de la regió" },
  ]
}

