import { Component } from "@angular/core"
import { CommonModule } from "@angular/common"
import { RouterModule } from "@angular/router"
import { NavMenuComponent } from "../nav-menu/nav-menu.component";
import { FooterComponent } from "../../utils/footer/footer.component";

interface TeamMember {
  name: string
  position: string
  image: string
}

interface ValueItem {
  title: string
  description: string
  icon: string
}

@Component({
  selector: "app-qui-som",
  standalone: true,
  imports: [CommonModule, RouterModule, NavMenuComponent, FooterComponent],
  templateUrl: "./qui-som.component.html",
  styleUrls: ["./qui-som.component.scss"],
})
export class QuiSomComponent {
  teamMembers: TeamMember[] = [
    {
      name: "InfoJobs",
      position: "Empresa de treball",
      image: "assets/images/infojobs.jpg",
    },
    {
      name: "Emirates",
      position: "Empresa de millonaris",
      image: "assets/images/emirates.png",
    },
    {
      name: "Nike",
      position: "Empresa de esport",
      image: "assets/images/nike.png",
    },
    {
      name: "Addidas",
      position: "Empresa de esport",
      image: "assets/images/adidas.png",
    },
    {
      name: "Pepsi",
      position: "Empresa de begudes",
      image: "assets/images/pepsi.jpg",
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

