import { Component, inject, OnInit, type OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
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
  styleUrls: ['./editar-equip-auth.component.scss'],
})
export class EditarEquipAuthComponent implements OnInit, OnDestroy {
  private teamToken: string | null = null;
  private fb = inject(FormBuilder);

  public url = environment.production
    ? `https://${environment.apiUrl}`
    : `http://${environment.apiUrl}`;

  public headers = {
    Authorization: `Bearer ${this.teamToken}`,
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
      this.teamToken = params['token'] || null;
    });
    this.headers = {
      Authorization: `Bearer ${this.teamToken}`,
      'Content-Type': 'application/json',
    };
  }

  ngOnInit(): void {
    this.checkExistingSession();
  }

  private checkExistingSession(): void {
    const sessionToken = sessionStorage.getItem('session_token');
    const tokenExpiryStr = sessionStorage.getItem('token_expiry');
    
    if (sessionToken && tokenExpiryStr) {
      const tokenExpiry = parseInt(tokenExpiryStr, 10);
      const now = new Date().getTime();
      
      if (tokenExpiry > now) {
        this.router.navigate(['/editar-inscripcio'], {
          queryParams: { token: this.teamToken }
        });
      } else {
        sessionStorage.removeItem('session_token');
        sessionStorage.removeItem('token_expiry');
      }
    }
  }

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
    this.isLoading = true;
    if (this.pinForm.invalid) return;

    const pin = Object.values(this.pinForm.value).join('');

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
        //Guardar el token en la sessio per 20 minuts
        console.log('Token:', data.token);
        const expiry = new Date().getTime() + 20 * 60 * 1000;
        sessionStorage.setItem('session_token', data.token);
        sessionStorage.setItem('token_expiry', expiry.toString());
        this.pinForm.reset();
        this.showPinInput = false;
        this.stopResendCountdown();
        this.router.navigate(['/editar-inscripcio'], {
          queryParams: { token: this.teamToken },
        });
      })
      .catch((error) => {
        console.error('Error sending code:', error);
      })
      .finally(() => {
        this.isLoading = false;
      });
  }

  toggleAdminLogin(): void {
    const isAuthed = this.authService.isAuthenticated();
    if (isAuthed) {
      this.router.navigate(['/editar-inscripcio'], {
        queryParams: { token: this.teamToken },
      });
    }
    this.showAdminLogin = !this.showAdminLogin;
    this.showPinInput = false;
  }

  async onAdminSubmit(): Promise<void> {
    this.isLoading = true;
    if (this.loginForm.invalid) return;

    const { email, password } = this.loginForm.value;

    try {
      await setPersistence(this.auth, browserLocalPersistence);
      await signInWithEmailAndPassword(this.auth, email ?? '', password ?? '');
      this.router.navigate(['/editar-inscripcio'], {
        queryParams: { token: this.teamToken },
      });
      
    } catch (error: any) {
      this.errorMessage = error.message || 'Identificació incorrecta';
    }
    this.isLoading = false;
  }

  ngOnDestroy(): void {
    this.stopResendCountdown();
  }
}