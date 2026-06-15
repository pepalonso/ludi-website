import { Injectable } from '@angular/core'
import { from, Observable } from 'rxjs'
import { environment } from '../../../../environments/environment'
import type { GalleryCursor, GalleryPageResult, GalleryYear } from '../models/gallery.model'
import { ImmichGalleryService } from './immich-gallery.service'

@Injectable({
  providedIn: 'root',
})
export class GalleryService {
  private galleries: GalleryYear[] = [
    {
      year: '2026',
      title: 'Temporada 2026',
      description: "Recull d'imatges del Ludibàsquet 2026",
      images: [],
    },
  ]

  constructor(private immichGallery: ImmichGalleryService) {}

  getAllGalleries(): GalleryYear[] {
    return this.galleries
  }

  getGalleryByYear(year: string): GalleryYear | undefined {
    return this.galleries.find(gallery => gallery.year === year)
  }

  getShareKey(year: string): string | undefined {
    const galleries = environment.immichGalleries as Record<string, { shareKey: string }>
    return galleries[year]?.shareKey || undefined
  }

  isGalleryConfigured(year: string): boolean {
    return this.immichGallery.isConfigured() && Boolean(this.getShareKey(year))
  }

  loadGalleryImages(
    year: string,
    cursor: GalleryCursor | null,
    pageSize: number
  ): Observable<GalleryPageResult> {
    const shareKey = this.getShareKey(year)
    if (!shareKey) {
      throw new Error(`No hi ha configuració Immich per a l’any ${year}`)
    }
    return from(this.immichGallery.loadAssetsPage(shareKey, cursor, pageSize))
  }

  loadCoverImage(year: string): Observable<string | null> {
    const shareKey = this.getShareKey(year)
    if (!shareKey) {
      return from(Promise.resolve(null))
    }
    return from(this.immichGallery.getCoverImageUrl(shareKey))
  }
}

