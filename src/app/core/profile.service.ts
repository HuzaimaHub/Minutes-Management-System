import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_URL } from './api.config';
import { LoginResponse } from './models';

export interface AdminProfile {
  adminId: number;
  fullName: string;
  email: string;
  role: string;
  gender?: string;
  createdAt?: string;
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private http = inject(HttpClient);
  private url = `${API_URL}/profile`;

  get() {
    return this.http.get<AdminProfile>(this.url);
  }

  update(fullName: string, email: string, currentPassword: string) {
    return this.http.put<LoginResponse>(this.url, { fullName, email, currentPassword });
  }

  changePassword(currentPassword: string, newPassword: string) {
    return this.http.put<void>(`${this.url}/password`, { currentPassword, newPassword });
  }
}