import { Component, OnDestroy, type OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule } from '@angular/router'
import { NavMenuComponent } from '../nav-menu/nav-menu.component'
import { FooterComponent } from '../../utils/footer/footer.component'

@Component({
  selector: 'app-main-page',
  standalone: true,
  imports: [CommonModule, RouterModule, NavMenuComponent, FooterComponent],
  templateUrl: './main-page.component.html',
  styleUrls: ['./main-page.component.scss'],
})
export class MainPageComponent implements OnInit, OnDestroy {
  public targetDate: Date = new Date('2025-06-07T00:00:00')
  private intervalId: any

  public days: number = 0
  public hours: number = 0
  public minutes: number = 0
  public seconds: number = 0

  carouselImages: string[] = [
    'assets/images/carrusel-3.JPG',
    'assets/images/carrusel-5.JPG',
    'assets/images/carrusel-4.JPG',
  ]

  currentImageIndex = 0
  galleryImages: string[] = [
    'assets/images/main/img1.JPG',
    'assets/images/main/img2.JPG',
    'assets/images/main/img3.JPG',
    'assets/images/main/img4.JPG',
    'assets/images/main/img5.JPG',
  ]

  constructor() {}

  ngOnInit(): void {
    this.startCountdown()

    // Auto-rotate carousel images
    setInterval(() => {
      this.currentImageIndex = (this.currentImageIndex + 1) % this.carouselImages.length
    }, 5000)
  }

  ngOnDestroy() {
    clearInterval(this.intervalId)
  }

  prevImage(): void {
    this.currentImageIndex =
      (this.currentImageIndex - 1 + this.carouselImages.length) % this.carouselImages.length
  }

  nextImage(): void {
    this.currentImageIndex = (this.currentImageIndex + 1) % this.carouselImages.length
  }

  private startCountdown() {
    this.updateCountdown()
    this.intervalId = setInterval(() => {
      this.updateCountdown()
    }, 1000)
  }

  private updateCountdown() {
    const now = new Date().getTime()
    const timeLeft = this.targetDate.getTime() - now

    if (timeLeft > 0) {
      this.days = Math.floor(timeLeft / (1000 * 60 * 60 * 24))
      this.hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      this.minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))
      this.seconds = Math.floor((timeLeft % (1000 * 60)) / 1000)
    } else {
      clearInterval(this.intervalId)
    }
  }
}
