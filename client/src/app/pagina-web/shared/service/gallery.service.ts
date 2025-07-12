import { Injectable } from '@angular/core'
import type { GalleryYear } from '../models/gallery.model'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'
import { environment } from '../../../../environments/environment.prod'

@Injectable({
  providedIn: 'root',
})
export class GalleryService {
  private galleries: GalleryYear[] = [
    {
      year: '2025',
      title: 'Temporada 2025',
      description: "Recull d'imatges del Ludibasquet 2025",
      coverImage: '/assets/images/gallery/Portada2025.JPG',
      images: [],
    },
  ]

  constructor(private http: HttpClient) {}

  getAllGalleries(): GalleryYear[] {
    return this.galleries
  }

  getGalleryByYear(year: string): GalleryYear | undefined {
    return this.galleries.find(gallery => gallery.year === year)
  }

  carregarImatgesS3(year: string, pagina: number, tamany: number): Observable<any> {
    const url = `https://${environment.apiUrl}/galeria-web?year=${year}&page=${pagina}&pageSize=${tamany}`
    return this.http.get<any>(url)
  }
}
