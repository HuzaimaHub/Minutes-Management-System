import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { tap } from 'rxjs';
import { API_URL } from './api.config';

const DEFAULT_SYSTEM_NAME = 'Meeting Minutes Management System';
const DEFAULT_ORG_NAME = 'Zanzibar Social Security Fund';
const DEFAULT_ORG_NAME_SW = 'Mfuko wa Hifadhi ya Jamii Zanzibar';
const DEFAULT_ORG_SHORT = 'ZSSF';

interface BrandInfo {
  custom: boolean;
  version: number;
  systemName: string;
  orgName: string;
  orgNameSw: string;
  orgShort: string;
}

@Injectable({ providedIn: 'root' })
export class BrandService {
  private http = inject(HttpClient);
  private title = inject(Title);

  // null means: use the default logo shipped with the app
  private version = signal<number | null>(null);
  private name = signal(DEFAULT_SYSTEM_NAME);
  private org = signal(DEFAULT_ORG_NAME);
  private orgSw = signal(DEFAULT_ORG_NAME_SW);
  private short = signal(DEFAULT_ORG_SHORT);

  systemName = this.name.asReadonly();
  orgName = this.org.asReadonly();
  orgNameSw = this.orgSw.asReadonly();
  orgShort = this.short.asReadonly();

  // "Zanzibar Social Security Fund (ZSSF)"
  orgLabel = computed(() =>
    this.short() ? `${this.org()} (${this.short()})` : this.org()
  );

  logoSrc = computed(() =>
    this.version() === null
      ? 'zssf-logo.png'
      : `${API_URL}/public/brand/logo?v=${this.version()}`
  );

  constructor() {
    this.refresh();
  }

  refresh() {
    this.http.get<BrandInfo>(`${API_URL}/public/brand`).subscribe({
      next: (b) => {
        this.version.set(b.custom ? b.version : null);
        this.name.set(b.systemName || DEFAULT_SYSTEM_NAME);
        this.org.set(b.orgName || DEFAULT_ORG_NAME);
        this.orgSw.set(b.orgNameSw ?? '');
        this.short.set(b.orgShort || DEFAULT_ORG_SHORT);
        this.title.setTitle(this.name());
      },
      error: () => this.version.set(null),
    });
  }

  upload(file: File) {
    const form = new FormData();
    form.append('file', file);
    return this.http
      .post<void>(`${API_URL}/settings/logo`, form)
      .pipe(tap(() => this.refresh()));
  }

  reset() {
    return this.http
      .delete<void>(`${API_URL}/settings/logo`)
      .pipe(tap(() => this.refresh()));
  }

  saveSystemName(name: string) {
    return this.http
      .put<void>(`${API_URL}/settings/system-name`, { name })
      .pipe(tap(() => this.refresh()));
  }

  resetSystemName() {
    return this.http
      .delete<void>(`${API_URL}/settings/system-name`)
      .pipe(tap(() => this.refresh()));
  }

  saveOrg(name: string, nameSw: string, shortName: string) {
    return this.http
      .put<void>(`${API_URL}/settings/org`, { name, nameSw, shortName })
      .pipe(tap(() => this.refresh()));
  }

  resetOrg() {
    return this.http
      .delete<void>(`${API_URL}/settings/org`)
      .pipe(tap(() => this.refresh()));
  }
}