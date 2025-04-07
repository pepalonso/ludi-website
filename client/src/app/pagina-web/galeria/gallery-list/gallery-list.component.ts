import { Component, type OnInit } from "@angular/core"
import { CommonModule } from "@angular/common"
import { RouterModule } from "@angular/router"
import { GalleryService } from "../../shared/service/gallery.service"
import type { GalleryYear } from "../../shared/models/gallery.model"
import { NavMenuComponent } from "../../nav-menu/nav-menu.component";

@Component({
  selector: "app-gallery-list",
  standalone: true,
  imports: [CommonModule, RouterModule, NavMenuComponent],
  templateUrl: "./gallery-list.component.html",
  styleUrls: ["./gallery-list.component.scss"],
})
export class GalleryListComponent implements OnInit {
  galleries: GalleryYear[] = []

  constructor(private galleryService: GalleryService) {}

  ngOnInit(): void {
    this.galleries = this.galleryService.getAllGalleries();
  }
}

