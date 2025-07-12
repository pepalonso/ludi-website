import { CommonModule } from '@angular/common'
import { Component, HostListener } from '@angular/core'
import { RouterModule } from '@angular/router'

@Component({
  selector: 'app-nav-menu',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './nav-menu.component.html',
  styleUrl: './nav-menu.component.css',
})
export class NavMenuComponent {
  isScrolled = false

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled = window.scrollY > 20
  }
}
