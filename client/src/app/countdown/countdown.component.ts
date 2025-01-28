import { Component, OnInit, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-countdown',
  templateUrl: './countdown.component.html',
  styleUrls: ['./countdown.component.css'],
})
export class LudiCountdown implements OnInit, OnDestroy {
  public targetDate: Date = new Date('2025-06-07T00:00:00');
  intervalId: any;

  days: number = 0;
  hours: number = 0;
  minutes: number = 0;
  seconds: number = 0;

  ngOnInit() {
    this.startCountdown();
  }

  ngOnDestroy() {
    clearInterval(this.intervalId);
  }

  startCountdown() {
    this.updateCountdown();
    this.intervalId = setInterval(() => {
      this.updateCountdown();
    }, 1000);
  }

  updateCountdown() {
    const now = new Date().getTime();
    const timeLeft = this.targetDate.getTime() - now;

    if (timeLeft > 0) {
      this.days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
      this.hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      this.minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      this.seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
    } else {
      clearInterval(this.intervalId);
    }
  }
}
