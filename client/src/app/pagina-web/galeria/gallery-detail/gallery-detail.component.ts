import { Component, type OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule, ActivatedRoute, Router } from '@angular/router'
import { GalleryService } from '../../shared/service/gallery.service'
import type { GalleryYear, GalleryImage, GalleryCursor } from '../../shared/models/gallery.model'
import { NavMenuComponent } from '../../nav-menu/nav-menu.component'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'

@Component({
  selector: 'app-gallery-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, NavMenuComponent, MatProgressSpinnerModule],
  templateUrl: './gallery-detail.component.html',
  styleUrls: ['./gallery-detail.component.scss'],
})
export class GalleryDetailComponent implements OnInit {
  gallery: GalleryYear | undefined
  selectedImage: GalleryImage | null = null
  year = ''

  displayedImages: GalleryImage[] = []
  cursor: GalleryCursor | null = null
  itemsPerPage = 52
  isLoading = false
  hasMoreImages = true
  loadError: string | null = null

  carregantMesImatges = false

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private galleryService: GalleryService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.year = params['year']
      this.loadGallery()
    })
  }

  loadGallery(): void {
    this.gallery = this.galleryService.getGalleryByYear(this.year)
    if (!this.gallery) {
      this.router.navigate(['/galeria'])
      return
    }

    if (!this.galleryService.isGalleryConfigured(this.year)) {
      this.loadError = 'La galeria no està configurada. Contacta amb l’organització.'
      return
    }

    this.displayedImages = []
    this.cursor = null
    this.hasMoreImages = true
    this.loadError = null
    this.isLoading = true

    this.galleryService.loadGalleryImages(this.year, null, this.itemsPerPage).subscribe({
      next: data => {
        this.displayedImages = data.assets
        this.cursor = data.nextCursor
        this.hasMoreImages = data.hasMore
        this.isLoading = false
      },
      error: () => {
        this.loadError = 'No s’han pogut carregar les imatges. Torna-ho a provar més tard.'
        this.isLoading = false
      },
    })
  }

  loadMoreImages(): void {
    if (this.carregantMesImatges || !this.hasMoreImages || this.isLoading) return

    this.carregantMesImatges = true

    this.galleryService.loadGalleryImages(this.year, this.cursor, this.itemsPerPage).subscribe({
      next: data => {
        this.displayedImages = this.displayedImages.concat(data.assets)
        this.cursor = data.nextCursor
        this.hasMoreImages = data.hasMore
        this.carregantMesImatges = false
      },
      error: () => {
        this.carregantMesImatges = false
        this.hasMoreImages = false
      },
    })
  }

  openLightbox(image: GalleryImage): void {
    this.selectedImage = image
    document.body.style.overflow = 'hidden'
  }

  closeLightbox(): void {
    this.selectedImage = null
    document.body.style.overflow = 'auto'
  }

  nextImage(): void {
    if (!this.selectedImage || !this.displayedImages.length) return

    const currentIndex = this.displayedImages.findIndex(
      image => image.id === this.selectedImage?.id
    )
    const nextIndex = (currentIndex + 1) % this.displayedImages.length
    this.selectedImage = this.displayedImages[nextIndex]
    if (nextIndex + 5 === this.displayedImages.length) {
      this.loadMoreImages()
    }
  }

  prevImage(): void {
    if (!this.selectedImage || !this.displayedImages.length) return

    const currentIndex = this.displayedImages.findIndex(
      image => image.id === this.selectedImage?.id
    )
    const prevIndex = (currentIndex - 1 + this.displayedImages.length) % this.displayedImages.length
    this.selectedImage = this.displayedImages[prevIndex]
  }

  onScroll(): void {
    const scrollTop =
      window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0
    const windowHeight = window.innerHeight
    const fullHeight = document.documentElement.scrollHeight

    if (scrollTop + windowHeight >= fullHeight - 2000) {
      this.loadMoreImages()
    }
  }
}

