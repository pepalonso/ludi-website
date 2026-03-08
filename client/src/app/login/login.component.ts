import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../serveis/auth.service';
import { environment } from '../../environments/environment.prod';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  imports: [ReactiveFormsModule, CommonModule],
  standalone: true,
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  errorMessage: string = '';

  private apiBase = environment.apiBaseUrl;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  ngOnInit() {
    if (this.authService.isAdminAuthenticated()) {
      this.router.navigate(['/administrador']);
    }
  }

  async onSubmit() {
    if (this.loginForm.invalid) return;

    this.errorMessage = '';
    const { email, password } = this.loginForm.value;

    try {
      const res = await fetch(`${this.apiBase}/auth/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        this.errorMessage = data?.error ?? 'Identificació incorrecta';
        return;
      }
      this.authService.setAdminToken(data.admin_token, data.expires_at);
      this.router.navigate(['/administrador']);
    } catch {
      this.errorMessage = 'Error de connexió';
    }
  }
}
