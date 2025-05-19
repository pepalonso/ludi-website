import { Component, type OnInit } from "@angular/core"
import { CommonModule } from "@angular/common"
import { RouterModule, ActivatedRoute, Router } from "@angular/router"
import { GalleryService } from "../../shared/service/gallery.service"
import type { GalleryYear, GalleryImage } from "../../shared/models/gallery.model"
import { NavMenuComponent } from "../../nav-menu/nav-menu.component";

@Component({
  selector: "app-gallery-detail",
  standalone: true,
  imports: [CommonModule, RouterModule, NavMenuComponent],
  templateUrl: "./gallery-detail.component.html",
  styleUrls: ["./gallery-detail.component.scss"],
})
export class GalleryDetailComponent implements OnInit {
  gallery: GalleryYear | undefined
  selectedImage: GalleryImage | null = null
  year = ""
  fotos: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private galleryService: GalleryService,
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.year = params["year"]
      this.loadGallery();
    })
  }

  loadGallery(): void {
    this.gallery = this.galleryService.getGalleryByYear(this.year)
    if (!this.gallery) {
      this.router.navigate(["/galeria"])
    }

    this.galleryService.carregarImatgesS3(this.year).subscribe(data => {
      this.fotos = data;
    })
  }

  openLightbox(image: GalleryImage): void {
    this.selectedImage = image
    document.body.style.overflow = "hidden"
  }

  closeLightbox(): void {
    this.selectedImage = null
    document.body.style.overflow = "auto"
  }

  nextImage(): void {
    if (!this.selectedImage || !this.gallery) return

    const currentIndex = this.gallery.images.findIndex((img) => img.id === this.selectedImage?.id)
    if (currentIndex < this.gallery.images.length - 1) {
      this.selectedImage = this.gallery.images[currentIndex + 1]
    } else {
      this.selectedImage = this.gallery.images[0]
    }
  }

  prevImage(): void {
    if (!this.selectedImage || !this.gallery) return

    const currentIndex = this.gallery.images.findIndex((img) => img.id === this.selectedImage?.id)
    if (currentIndex > 0) {
      this.selectedImage = this.gallery.images[currentIndex - 1]
    } else {
      this.selectedImage = this.gallery.images[this.gallery.images.length - 1]
    }
  }
}

