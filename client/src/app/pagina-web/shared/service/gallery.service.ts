import { Injectable } from "@angular/core"
import type { GalleryYear } from "../models/gallery.model"

@Injectable({
  providedIn: "root",
})
export class GalleryService {
  private galleries: GalleryYear[] = [
    {
      year: "2023",
      title: "Temporada 2023",
      description: "Imatges dels esdeveniments i competicions de la temporada 2023",
      coverImage: "/assets/images/gallery/2023/cover.jpg",
      images: [
        {
          id: "2023-1",
          url: "/assets/images/gallery/2023/image-1.jpg",
          title: "Torneig de Primavera",
          description: "Finals del torneig de primavera amb els equips guanyadors",
        },
        {
          id: "2023-2",
          url: "/assets/images/gallery/2023/image-2.jpg",
          title: "Campus d'Estiu",
          description: "Activitats del campus d'estiu amb els més petits",
        },
        {
          id: "2023-3",
          url: "/assets/images/gallery/2023/image-3.jpg",
          title: "Partit de Lliga",
          description: "Equip sènior durant un partit de lliga",
        },
        {
          id: "2023-4",
          url: "/assets/images/gallery/2023/image-4.jpg",
          title: "Entrenament Especial",
          description: "Sessió d'entrenament amb un jugador professional convidat",
        },
        {
          id: "2023-5",
          url: "/assets/images/gallery/2023/image-5.jpg",
          title: "Celebració Final de Temporada",
          description: "Festa de final de temporada amb tots els equips",
        },
        {
          id: "2023-6",
          url: "/assets/images/gallery/2023/image-6.jpg",
          title: "Torneig LUDIBÀSQUET 24h",
          description: "Imatges del torneig anual de 24 hores",
        },
      ],
    },
    {
      year: "2022",
      title: "Temporada 2022",
      description: "Recull fotogràfic dels millors moments de la temporada 2022",
      coverImage: "/assets/images/gallery/2022/cover.jpg",
      images: [
        {
          id: "2022-1",
          url: "/assets/images/gallery/2022/image-1.jpg",
          title: "Inici de Temporada",
          description: "Presentació de tots els equips a l'inici de temporada",
        },
        {
          id: "2022-2",
          url: "/assets/images/gallery/2022/image-2.jpg",
          title: "Torneig de Nadal",
          description: "Participants del torneig de Nadal",
        },
        {
          id: "2022-3",
          url: "/assets/images/gallery/2022/image-3.jpg",
          title: "Clínic d'Entrenadors",
          description: "Sessió formativa per a entrenadors del club",
        },
        {
          id: "2022-4",
          url: "/assets/images/gallery/2022/image-4.jpg",
          title: "Partit Benèfic",
          description: "Partit benèfic organitzat pel club",
        },
        {
          id: "2022-5",
          url: "/assets/images/gallery/2022/image-5.jpg",
          title: "Campus de Setmana Santa",
          description: "Activitats del campus de Setmana Santa",
        },
      ],
    },
    {
      year: "2021",
      title: "Temporada 2021",
      description: "Galeria d'imatges de la temporada 2021",
      coverImage: "/assets/images/gallery/2021/cover.jpg",
      images: [
        {
          id: "2021-1",
          url: "/assets/images/gallery/2021/image-1.jpg",
          title: "Torneig Internacional",
          description: "Participants del torneig internacional",
        },
        {
          id: "2021-2",
          url: "/assets/images/gallery/2021/image-2.jpg",
          title: "Entrenament Especial",
          description: "Entrenament amb tècniques avançades",
        },
        {
          id: "2021-3",
          url: "/assets/images/gallery/2021/image-3.jpg",
          title: "Final de Lliga",
          description: "L'equip juvenil a la final de lliga",
        },
        {
          id: "2021-4",
          url: "/assets/images/gallery/2021/image-4.jpg",
          title: "Activitats d'Estiu",
          description: "Activitats lúdiques durant el campus d'estiu",
        },
      ],
    },
    {
      year: "2020",
      title: "Temporada 2020",
      description: "Imatges de la temporada 2020",
      coverImage: "/assets/images/gallery/2020/cover.jpg",
      images: [
        {
          id: "2020-1",
          url: "/assets/images/gallery/2020/image-1.jpg",
          title: "Desè Aniversari",
          description: "Celebració del desè aniversari del club",
        },
        {
          id: "2020-2",
          url: "/assets/images/gallery/2020/image-2.jpg",
          title: "Entrenaments Virtuals",
          description: "Sessions d'entrenament virtuals durant el confinament",
        },
        {
          id: "2020-3",
          url: "/assets/images/gallery/2020/image-3.jpg",
          title: "Tornada als Entrenaments",
          description: "Primer entrenament després del confinament",
        },
        {
          id: "2020-4",
          url: "/assets/images/gallery/2020/image-4.jpg",
          title: "Partit Amistós",
          description: "Primer partit amistós de la temporada",
        },
      ],
    },
  ]

  constructor() {}

  getAllGalleries(): GalleryYear[] {
    return this.galleries
  }

  getGalleryByYear(year: string): GalleryYear | undefined {
    return this.galleries.find((gallery) => gallery.year === year)
  }
}

