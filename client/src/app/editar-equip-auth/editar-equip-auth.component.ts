import { Component, inject, OnInit, type OnDestroy } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { ActivatedRoute, Router } from '@angular/router'
import { type Subscription, interval } from 'rxjs'
import { AuthService } from '../serveis/auth.service'
import { environment } from '../../environments/environment.prod'

@Component({
  selector: 'app-editar-equip-auth',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './editar-equip-auth.component.html',
  styleUrls: ['./editar-equip-auth.component.scss'],
})
export class EditarEquipAuthComponent implements OnInit, OnDestroy {
  private teamToken: string | null = null
  private fb = inject(FormBuilder)

  public url = environment.apiBaseUrl

  public headers = {
    Authorization: `Bearer ${this.teamToken}`,
    'Content-Type': 'application/json',
  }

  showPinInput = false
  showAdminLogin = false
  selectedMethod: 'email' | 'whatsapp' | null = null
  isLoading = false

  resendCountdown = 0
  private countdownSubscription?: Subscription

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.route.queryParams.subscribe(params => {
      this.teamToken = params['token'] || null
    })
    this.headers = {
      Authorization: `Bearer ${this.teamToken}`,
      'Content-Type': 'application/json',
    }
  }

  ngOnInit(): void {
    this.checkExistingSession()
  }

  private checkExistingSession(): void {
    const sessionToken = sessionStorage.getItem('session_token')
    const tokenExpiryStr = sessionStorage.getItem('token_expiry')

    if (sessionToken && tokenExpiryStr) {
      const tokenExpiry = parseInt(tokenExpiryStr, 10)
      const now = new Date().getTime()

      if (tokenExpiry > now) {
        this.router.navigate(['/editar-inscripcio'], {
          queryParams: { token: this.teamToken },
        })
      } else {
        sessionStorage.removeItem('session_token')
        sessionStorage.removeItem('token_expiry')
      }
    }
  }

  pinForm = this.fb.group({
    digit1: ['', [Validators.required, Validators.pattern('[0-9]')]],
    digit2: ['', [Validators.required, Validators.pattern('[0-9]')]],
    digit3: ['', [Validators.required, Validators.pattern('[0-9]')]],
    digit4: ['', [Validators.required, Validators.pattern('[0-9]')]],
  })

  // Admin login form
  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  })
  errorMessage = ''

  selectMethod(method: 'email' | 'whatsapp'): void {
    this.selectedMethod = method
  }

  sendCode(): void {
    if (!this.selectedMethod) return
    this.isLoading = true
    fetch(this.url + '/auth/generate', {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ method: this.selectedMethod }),
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        return response.json()
      })
      .then(data => {
        this.showPinInput = true
        this.startResendCountdown()
      })
      .catch(error => {
        console.error('Error sending code:', error)
      })
      .finally(() => {
        this.isLoading = false
      })
  }

  startResendCountdown(): void {
    this.stopResendCountdown()

    this.resendCountdown = 30

    this.countdownSubscription = interval(1000).subscribe(() => {
      this.resendCountdown--
      if (this.resendCountdown <= 0) {
        this.stopResendCountdown()
      }
    })
  }

  stopResendCountdown(): void {
    if (this.countdownSubscription) {
      this.countdownSubscription.unsubscribe()
      this.countdownSubscription = undefined
    }
  }

  resendCode(): void {
    if (this.resendCountdown > 0 || !this.selectedMethod) return

    this.isLoading = true
    fetch(this.url + '/auth/generate', {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ method: this.selectedMethod }),
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        return response.json()
      })
      .then(data => {
        this.showPinInput = true
        this.startResendCountdown()
      })
      .catch(error => {
        console.error('Error sending code:', error)
      })
      .finally(() => {
        this.isLoading = false
      })
  }

  onDigitInput(event: Event, nextInput?: HTMLInputElement): void {
    const input = event.target as HTMLInputElement

    if (input.value && nextInput) {
      nextInput.focus()
    }
  }

  onBackspace(event: KeyboardEvent, prevInput?: HTMLInputElement): void {
    if (event.key === 'Backspace' && prevInput && !(event.target as HTMLInputElement).value) {
      prevInput.focus()
    }
  }

  verifyPin(): void {
    this.isLoading = true
    if (this.pinForm.invalid) return

    const pin = Object.values(this.pinForm.value).join('')

    fetch(this.url + '/auth/validator', {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ pin }),
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        return response.json()
      })
      .then(data => {
        //Guardar el token en la sessio per 20 minuts
        const expiry = new Date().getTime() + 20 * 60 * 1000
        sessionStorage.setItem('session_token', data.session_token)
        sessionStorage.setItem('token_expiry', expiry.toString())
        this.pinForm.reset()
        this.showPinInput = false
        this.stopResendCountdown()
        this.router.navigate(['/editar-inscripcio'], {
          queryParams: { token: this.teamToken },
        })
      })
      .catch(error => {
        console.error('Error sending code:', error)
      })
      .finally(() => {
        this.isLoading = false
      })
  }

  async toggleAdminLogin(): Promise<void> {
    if (this.authService.isAdminAuthenticated()) {
      const adminToken = this.authService.getAdminToken()
      try {
        const res = await fetch(this.url + '/auth/generate-admin-session-token', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${adminToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ team_token: this.teamToken }),
        })
        if (!res.ok) throw new Error('Failed to get session')
        const data = await res.json()
        const expiry = new Date().getTime() + 20 * 60 * 1000
        sessionStorage.setItem('session_token', data.session_token)
        sessionStorage.setItem('token_expiry', expiry.toString())
        this.router.navigate(['/editar-inscripcio'], {
          queryParams: { token: this.teamToken },
        })
        return
      } catch {
        this.errorMessage = 'No s\'ha pogut obtenir la sessió. Inicia sessió de nou.'
      }
    }
    this.showAdminLogin = !this.showAdminLogin
    this.showPinInput = false
  }

  async onAdminSubmit(): Promise<void> {
    this.isLoading = true
    this.errorMessage = ''
    if (this.loginForm.invalid) {
      this.isLoading = false
      return
    }

    const { email, password } = this.loginForm.value
    try {
      const loginRes = await fetch(this.url + '/auth/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const loginData = await loginRes.json().catch(() => ({}))
      if (!loginRes.ok) {
        this.errorMessage = loginData?.error ?? 'Identificació incorrecta'
        this.isLoading = false
        return
      }
      this.authService.setAdminToken(loginData.admin_token, loginData.expires_at)

      const sessionRes = await fetch(this.url + '/auth/generate-admin-session-token', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${loginData.admin_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ team_token: this.teamToken }),
      })
      if (!sessionRes.ok) {
        this.errorMessage = 'No s\'ha pogut obtenir la sessió d\'equip'
        this.isLoading = false
        return
      }
      const sessionData = await sessionRes.json()
      const expiry = new Date().getTime() + 20 * 60 * 1000
      sessionStorage.setItem('session_token', sessionData.session_token)
      sessionStorage.setItem('token_expiry', expiry.toString())
      this.router.navigate(['/editar-inscripcio'], {
        queryParams: { token: this.teamToken },
      })
    } catch {
      this.errorMessage = 'Error de connexió'
    }
    this.isLoading = false
  }

  ngOnDestroy(): void {
    this.stopResendCountdown()
  }
}

