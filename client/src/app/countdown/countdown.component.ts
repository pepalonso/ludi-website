import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { RegistrationStateService } from '../serveis/registration-data.service';

@Component({
  selector: 'app-countdown',
  templateUrl: './countdown.component.html',
  styleUrls: ['./countdown.component.css'],
})
export class LudiCountdown implements OnInit, OnDestroy {
  public targetDate: Date = new Date('2025-06-07T00:00:00');
  private intervalId: any;

  public days: number = 0;
  public hours: number = 0;
  public minutes: number = 0;
  public seconds: number = 0;

  public constructor(
      private router: Router,
    ) {}

  ngOnInit() {
    this.startCountdown();
  }

  ngOnDestroy() {
    clearInterval(this.intervalId);
  }

  public handleGoToInscriptions() {
    this.router.navigate(['/info-inscriptions']);
  }

  private startCountdown() {
    this.updateCountdown();
    this.intervalId = setInterval(() => {
      this.updateCountdown();
    }, 1000);
  }

  private updateCountdown() {
    const now = new Date().getTime();
    const timeLeft = this.targetDate.getTime() - now;

    if (timeLeft > 0) {
      this.days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
      this.hours = Math.floor(
        (timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      this.minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      this.seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
    } else {
      clearInterval(this.intervalId);
    }
  }
}
