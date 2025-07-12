import { Component, type OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule, ActivatedRoute, Router } from '@angular/router'
import { GalleryService } from '../../shared/service/gallery.service'
import type { GalleryYear } from '../../shared/models/gallery.model'
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
  selectedImage: any | null = null
  year = ''
  fotos: any

  displayedImages: string[] = []
  allImages: any
  itemsPerPage = 52
  currentIndex = 0
  page = 1
  limit = 52
  isLoading = false
  hasMoreImages = true

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

    this.isLoading = true

    this.galleryService.carregarImatgesS3(this.year, this.page, this.limit).subscribe({
      next: data => {
        this.allImages = data
        this.displayedImages = this.allImages.urls.slice(0, this.itemsPerPage)
        this.currentIndex = this.itemsPerPage
        this.isLoading = false
      },
      error: () => (this.isLoading = false),
    })
  }

  loadMoreImages(): void {
    if (this.carregantMesImatges || !this.hasMoreImages) return

    this.page += 1

    this.carregantMesImatges = true

    this.galleryService.carregarImatgesS3(this.year, this.page, this.limit).subscribe({
      next: data => {
        if (data.length < this.limit) {
          this.hasMoreImages = false
        }
        this.carregantMesImatges = false
        this.displayedImages = this.displayedImages.concat(data.urls)
      },
      error: () => {
        this.carregantMesImatges = false
        this.hasMoreImages = false
      },
    })
  }

  openLightbox(image: any): void {
    this.selectedImage = image
    document.body.style.overflow = 'hidden'
  }

  closeLightbox(): void {
    this.selectedImage = null
    document.body.style.overflow = 'auto'
  }

  nextImage(): void {
    if (!this.selectedImage || !this.displayedImages.length) return

    const currentIndex = this.displayedImages.findIndex((url: string) => url === this.selectedImage)
    const nextIndex = (currentIndex + 1) % this.displayedImages.length
    this.selectedImage = this.displayedImages[nextIndex]
    if (nextIndex + 5 == this.displayedImages.length) {
      this.loadMoreImages()
    }
  }

  prevImage(): void {
    if (!this.selectedImage || !this.displayedImages.length) return

    const currentIndex = this.displayedImages.findIndex((url: string) => url === this.selectedImage)
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
