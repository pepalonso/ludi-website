export interface GalleryImage {
  id: string
  url: string
  title: string
  description?: string
  thumbnail?: string
}

export interface GalleryYear {
  year: string
  title: string
  description?: string
  coverImage: string
  images: GalleryImage[]
}
