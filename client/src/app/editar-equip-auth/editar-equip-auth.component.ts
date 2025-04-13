import { Component, inject, OnInit, type OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { type Subscription, interval } from 'rxjs';
import {
  browserLocalPersistence,
  getAuth,
  setPersistence,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { firebaseApp } from '../app.config';
import { AuthService } from '../serveis/auth.service';
import { environment } from '../../environments/environment.prod';

@Component({
  selector: 'app-editar-equip-auth',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './editar-equip-auth.component.html',
  styleUrls: ['./editar-equip-auth.component.css'],
})
export class EditarEquipAuthComponent implements OnDestroy, OnInit {
  private token: string | null = null;
  private fb = inject(FormBuilder);

  public url = environment.production
    ? `https://${environment.apiUrl}`
    : `http://${environment.apiUrl}`;

  public headers = {
    Authorization: `Bearer ${this.token}`,
    'Content-Type': 'application/json',
  };

  showPinInput = false;
  showAdminLogin = false;
  selectedMethod: 'email' | 'whatsapp' | null = null;
  auth = getAuth(firebaseApp);
  isLoading = false;

  resendCountdown = 0;
  private countdownSubscription?: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.route.queryParams.subscribe((params) => {
      this.token = params['token'] || null;
    });
    this.headers = {
      Authorization: `Bearer ${this.token}`,
      'Content-Type': 'application/json',
    };
  }

  ngOnInit(): void {
    setTimeout(() => {
      const isAuthed = this.authService.isAuthenticated();
      if (isAuthed) {
        this.router.navigate(['/editar-inscripcio'], {
          queryParams: { token: this.token },
        });
      }
    }, 300);
  }

  // PIN form
  pinForm = this.fb.group({
    digit1: ['', [Validators.required, Validators.pattern('[0-9]')]],
    digit2: ['', [Validators.required, Validators.pattern('[0-9]')]],
    digit3: ['', [Validators.required, Validators.pattern('[0-9]')]],
    digit4: ['', [Validators.required, Validators.pattern('[0-9]')]],
  });

  // Admin login form
  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });
  errorMessage = '';

  selectMethod(method: 'email' | 'whatsapp'): void {
    this.selectedMethod = method;
  }

  sendCode(): void {
    if (!this.selectedMethod) return;
    this.isLoading = true;
    fetch(this.url + '/auth/generate', {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ method: this.selectedMethod }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        this.showPinInput = true;
        this.startResendCountdown();
      })
      .catch((error) => {
        console.error('Error sending code:', error);
      })
      .finally(() => {
        this.isLoading = false;
      });
  }

  startResendCountdown(): void {
    this.stopResendCountdown();

    this.resendCountdown = 30;

    this.countdownSubscription = interval(1000).subscribe(() => {
      this.resendCountdown--;
      if (this.resendCountdown <= 0) {
        this.stopResendCountdown();
      }
    });
  }

  stopResendCountdown(): void {
    if (this.countdownSubscription) {
      this.countdownSubscription.unsubscribe();
      this.countdownSubscription = undefined;
    }
  }

  resendCode(): void {
    if (this.resendCountdown > 0 || !this.selectedMethod) return;

    this.isLoading = true;
    fetch(this.url + '/auth/generate', {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ method: this.selectedMethod }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        this.showPinInput = true;
        this.startResendCountdown();
      })
      .catch((error) => {
        console.error('Error sending code:', error);
      })
      .finally(() => {
        this.isLoading = false;
      });
  }

  onDigitInput(event: Event, nextInput?: HTMLInputElement): void {
    const input = event.target as HTMLInputElement;

    if (input.value && nextInput) {
      nextInput.focus();
    }
  }

  onBackspace(event: KeyboardEvent, prevInput?: HTMLInputElement): void {
    if (
      event.key === 'Backspace' &&
      prevInput &&
      !(event.target as HTMLInputElement).value
    ) {
      prevInput.focus();
    }
  }

  verifyPin(): void {
    if (this.pinForm.invalid) return;

    const pin = Object.values(this.pinForm.value).join('');

    this.isLoading = true;
    fetch(this.url + '/auth/validator', {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ pin }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        this.showPinInput = true;
        this.startResendCountdown();
      })
      .catch((error) => {
        console.error('Error sending code:', error);
      })
      .finally(() => {
        this.isLoading = false;
      });
  }

  toggleAdminLogin(): void {
    this.showAdminLogin = !this.showAdminLogin;
    this.showPinInput = false;
  }

  async onAdminSubmit(): Promise<void> {
    if (this.loginForm.invalid) return;

    const { email, password } = this.loginForm.value;

    try {
      await setPersistence(this.auth, browserLocalPersistence);
      await signInWithEmailAndPassword(this.auth, email ?? '', password ?? '');
      this.router.navigate(['/editar-inscripcio']);
      this.router.navigate(['/editar-inscripcio']);
    } catch (error: any) {
      this.errorMessage = error.message || 'Identificació incorrecta';
    }
  }

  ngOnDestroy(): void {
    this.stopResendCountdown();
  }
}
