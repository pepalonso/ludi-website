export interface GalleryImage {
  id: string
  thumbnailUrl: string
  originalUrl: string
}

export interface GalleryYear {
  year: string
  title: string
  description?: string
  coverImage?: string
  images: GalleryImage[]
}

export interface GalleryCursor {
  bucketIndex: number
  assetIndexInBucket: number
}

export interface GalleryPageResult {
  assets: GalleryImage[]
  nextCursor: GalleryCursor | null
  hasMore: boolean
}

export interface ResolvedAlbum {
  albumId: string
  thumbnailAssetId?: string
}

