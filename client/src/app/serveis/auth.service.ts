import { Injectable } from '@angular/core'

const ADMIN_TOKEN_KEY = 'admin_token'
const ADMIN_EXPIRY_KEY = 'admin_expires_at'

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor() {}

  setAdminToken(token: string, expiresAt: string): void {
    sessionStorage.setItem(ADMIN_TOKEN_KEY, token)
    sessionStorage.setItem(ADMIN_EXPIRY_KEY, expiresAt)
  }

  getAdminToken(): string {
    return sessionStorage.getItem(ADMIN_TOKEN_KEY) ?? ''
  }

  clearAdminToken(): void {
    sessionStorage.removeItem(ADMIN_TOKEN_KEY)
    sessionStorage.removeItem(ADMIN_EXPIRY_KEY)
  }

  isAdminAuthenticated(): boolean {
    const token = this.getAdminToken()
    const expiresAt = sessionStorage.getItem(ADMIN_EXPIRY_KEY)
    if (!token || !expiresAt) return false
    const expiry = new Date(expiresAt).getTime()
    return expiry > Date.now()
  }
}

