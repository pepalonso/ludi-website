import { Component, type OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule } from '@angular/router'
import { GalleryService } from '../../shared/service/gallery.service'
import type { GalleryYear } from '../../shared/models/gallery.model'
import { NavMenuComponent } from '../../nav-menu/nav-menu.component'
import { FooterComponent } from '../../../utils/footer/footer.component'

@Component({
  selector: 'app-gallery-list',
  standalone: true,
  imports: [CommonModule, RouterModule, NavMenuComponent, FooterComponent],
  templateUrl: './gallery-list.component.html',
  styleUrls: ['./gallery-list.component.scss'],
})
export class GalleryListComponent implements OnInit {
  galleries: GalleryYear[] = []
  coverImages: Record<string, string> = {}

  constructor(private galleryService: GalleryService) {}

  ngOnInit(): void {
    this.galleries = this.galleryService.getAllGalleries()
    for (const gallery of this.galleries) {
      this.loadCover(gallery.year)
    }
  }

  coverFor(gallery: GalleryYear): string | undefined {
    return this.coverImages[gallery.year] || gallery.coverImage
  }

  private loadCover(year: string): void {
    if (!this.galleryService.isGalleryConfigured(year)) return

    this.galleryService.loadCoverImage(year).subscribe({
      next: url => {
        if (url) this.coverImages[year] = url
      },
    })
  }
}

