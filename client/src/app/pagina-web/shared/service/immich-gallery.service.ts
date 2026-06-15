import { Injectable } from '@angular/core'
import { HttpClient, HttpParams } from '@angular/common/http'
import { firstValueFrom } from 'rxjs'
import { environment } from '../../../../environments/environment'
import type {
  GalleryCursor,
  GalleryImage,
  GalleryPageResult,
  ResolvedAlbum,
} from '../models/gallery.model'

interface TimeBucket {
  timeBucket: string
  count?: number
}

interface SharedLinkResponse {
  type?: string
  album?: {
    id?: string
    albumThumbnailAssetId?: string
  }
}

@Injectable({
  providedIn: 'root',
})
export class ImmichGalleryService {
  private readonly albumCache = new Map<string, Promise<ResolvedAlbum>>()
  private readonly bucketsCache = new Map<string, Promise<TimeBucket[]>>()
  private readonly bucketAssetsCache = new Map<string, Promise<string[]>>()

  constructor(private http: HttpClient) {}

  thumbnailUrl(assetId: string, shareKey: string): string {
    return `${environment.immichBaseUrl}/api/assets/${assetId}/thumbnail?key=${encodeURIComponent(shareKey)}`
  }

  originalUrl(assetId: string, shareKey: string): string {
    return `${environment.immichBaseUrl}/api/assets/${assetId}/original?key=${encodeURIComponent(shareKey)}`
  }

  isConfigured(): boolean {
    return Boolean(environment.immichBaseUrl)
  }

  async resolveAlbum(shareKey: string): Promise<ResolvedAlbum> {
    if (!this.isConfigured()) {
      throw new Error('Immich no està configurat')
    }
    if (!shareKey) {
      throw new Error('Falta la clau de compartició de la galeria')
    }

    const cached = this.albumCache.get(shareKey)
    if (cached) return cached

    const promise = this.fetchAlbum(shareKey)
    this.albumCache.set(shareKey, promise)
    return promise
  }

  async loadAssetsPage(
    shareKey: string,
    cursor: GalleryCursor | null,
    pageSize: number
  ): Promise<GalleryPageResult> {
    const { albumId } = await this.resolveAlbum(shareKey)
    const buckets = await this.loadBuckets(albumId, shareKey)

    let bucketIndex = cursor?.bucketIndex ?? 0
    let assetIndexInBucket = cursor?.assetIndexInBucket ?? 0
    const assets: GalleryImage[] = []

    while (assets.length < pageSize && bucketIndex < buckets.length) {
      const timeBucket = buckets[bucketIndex].timeBucket
      const assetIds = await this.loadBucketAssets(albumId, shareKey, timeBucket)

      while (assetIndexInBucket < assetIds.length && assets.length < pageSize) {
        const id = assetIds[assetIndexInBucket]
        assets.push(this.toGalleryImage(id, shareKey))
        assetIndexInBucket++
      }

      if (assetIndexInBucket >= assetIds.length) {
        bucketIndex++
        assetIndexInBucket = 0
      }
    }

    const hasMore = bucketIndex < buckets.length
    const nextCursor: GalleryCursor | null = hasMore ? { bucketIndex, assetIndexInBucket } : null

    return { assets, nextCursor, hasMore }
  }

  async getCoverImageUrl(shareKey: string): Promise<string | null> {
    const { thumbnailAssetId } = await this.resolveAlbum(shareKey)
    if (!thumbnailAssetId) return null
    return this.thumbnailUrl(thumbnailAssetId, shareKey)
  }

  private async fetchAlbum(shareKey: string): Promise<ResolvedAlbum> {
    const params = new HttpParams().set('key', shareKey)
    const data = await firstValueFrom(
      this.http.get<SharedLinkResponse>(`${environment.immichBaseUrl}/api/shared-links/me`, {
        params,
      })
    )

    const albumId = data.album?.id
    if (!albumId) {
      throw new Error('No s’ha pogut resoldre l’àlbum d’Immich')
    }

    return {
      albumId,
      thumbnailAssetId: data.album?.albumThumbnailAssetId,
    }
  }

  private loadBuckets(albumId: string, shareKey: string): Promise<TimeBucket[]> {
    const cacheKey = `${albumId}:${shareKey}`
    const cached = this.bucketsCache.get(cacheKey)
    if (cached) return cached

    const params = new HttpParams()
      .set('albumId', albumId)
      .set('key', shareKey)
      .set('order', 'desc')
      .set('size', 'DAY')

    const promise = firstValueFrom(
      this.http.get<TimeBucket[]>(`${environment.immichBaseUrl}/api/timeline/buckets`, { params })
    ).then(buckets => buckets ?? [])

    this.bucketsCache.set(cacheKey, promise)
    return promise
  }

  private loadBucketAssets(
    albumId: string,
    shareKey: string,
    timeBucket: string
  ): Promise<string[]> {
    const cacheKey = `${albumId}:${shareKey}:${timeBucket}`
    const cached = this.bucketAssetsCache.get(cacheKey)
    if (cached) return cached

    const params = new HttpParams()
      .set('albumId', albumId)
      .set('key', shareKey)
      .set('order', 'desc')
      .set('timeBucket', timeBucket)

    const promise = firstValueFrom(
      this.http.get<unknown>(`${environment.immichBaseUrl}/api/timeline/bucket`, { params })
    ).then(body => this.parseAssetIds(body))

    this.bucketAssetsCache.set(cacheKey, promise)
    return promise
  }

  private parseAssetIds(body: unknown): string[] {
    if (!body || typeof body !== 'object') return []

    const record = body as Record<string, unknown>

    if (Array.isArray(record['id'])) {
      return record['id'].filter((id): id is string => typeof id === 'string')
    }

    if (Array.isArray(record['ids'])) {
      return record['ids'].filter((id): id is string => typeof id === 'string')
    }

    if (Array.isArray(record['assets'])) {
      return record['assets']
        .map(asset => (asset as { id?: string }).id)
        .filter((id): id is string => typeof id === 'string')
    }

    if (typeof record['assetIds'] === 'string') {
      const raw = record['assetIds'].trim()
      if (!raw) return []
      if (raw.startsWith('[')) {
        try {
          const parsed = JSON.parse(raw) as unknown
          if (Array.isArray(parsed)) {
            return parsed.filter((id): id is string => typeof id === 'string')
          }
        } catch {
          return []
        }
      }
      return raw
        .split(',')
        .map(id => id.trim())
        .filter(Boolean)
    }

    return []
  }

  private toGalleryImage(assetId: string, shareKey: string): GalleryImage {
    return {
      id: assetId,
      thumbnailUrl: this.thumbnailUrl(assetId, shareKey),
      originalUrl: this.originalUrl(assetId, shareKey),
    }
  }
}

