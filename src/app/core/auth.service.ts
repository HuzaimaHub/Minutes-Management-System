import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { API_URL } from './api.config';
import { LoginResponse } from './models';

const TOKEN_KEY = 'mm_token';
const USER_KEY = 'mm_user';

interface CurrentUser {
  fullName: string;
  email: string;
  role: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  user = signal<CurrentUser | null>(this.loadUser());

  login(email: string, password: string) {
    return this.http
      .post<LoginResponse>(`${API_URL}/auth/login`, { email, password })
      .pipe(tap((res) => this.applySession(res)));
  }

  // Stores a new token and user (after login, or after the profile changes)
  applySession(res: LoginResponse) {
    const u: CurrentUser = { fullName: res.fullName, email: res.email, role: res.role };
    localStorage.setItem(TOKEN_KEY, res.token);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    this.user.set(u);
  }

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.user.set(null);
    this.router.navigate(['/login']);
  }

  get token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.token;
  }

  forgotPassword(email: string) {
    return this.http.post<{ message: string }>(`${API_URL}/auth/forgot-password`, { email });
  }

  checkResetToken(token: string) {
    return this.http.get<{ message: string }>(`${API_URL}/auth/reset-password/check`, {
      params: { token },
    });
  }

  resetPassword(token: string, newPassword: string) {
    return this.http.post<{ message: string }>(`${API_URL}/auth/reset-password`, {
      token,
      newPassword,
    });
  }

  private loadUser(): CurrentUser | null {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as CurrentUser) : null;
  }
}