import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { BrandService } from '../core/brand.service'; // Imeongezwa hapa

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="shell">
      <aside class="sidebar">
        <div class="brand">
          <div class="logo-box">
            @if (!logoMissing()) {
              <img [src]="brand.logoSrc()" alt="ZSSF logo" (error)="logoMissing.set(true)" />
            } @else {
            <span class="logo-fallback">{{ brand.orgShort() }}</span>
            }
          </div>
         <div class="brand-name">{{ brand.orgShort() }}</div>
          <div class="brand-sub">Meeting Minutes System</div>
        </div>

        <nav>
          <a routerLink="/dashboard" routerLinkActive="active">Dashboard</a>
          <a routerLink="/meetings" routerLinkActive="active">Meetings</a>
          <a routerLink="/agendas" routerLinkActive="active">Agendas</a>
          <a routerLink="/attendees" routerLinkActive="active">Attendees</a>
          <a routerLink="/minutes" routerLinkActive="active">Minutes</a>
          <a routerLink="/report" routerLinkActive="active">Minutes Report</a>
          <a routerLink="/settings" routerLinkActive="active">Settings</a>
        </nav>

        <a class="public-link" href="/" target="_blank" rel="noopener">View public page ↗</a>
      </aside>

      <div class="main">
        <header class="topbar">
          <span class="who">{{ auth.user()?.fullName }} ({{ auth.user()?.role }})</span>
          <button class="logout" (click)="auth.logout()">Logout</button>
        </header>
        <section class="content">
          <router-outlet />
        </section>
        <footer class="app-footer no-print">
          © {{ year }} {{ brand.orgLabel() }} · {{ brand.systemName() }} 
        </footer>
      </div>
    </div>
  `,
  styles: `
    .shell { display: flex; min-height: 100vh; }
    .sidebar { width: 240px; flex-shrink: 0; background: linear-gradient(180deg, #134e2e, #1f6b45); color: #fff; display: flex; flex-direction: column; }
    .brand { padding: 24px 16px 18px; display: flex; flex-direction: column; align-items: center; text-align: center; border-bottom: 1px solid rgba(255,255,255,.18); }
    .logo-box { width: 84px; height: 84px; background: #fff; border-radius: 18px; padding: 8px; display: flex; align-items: center; justify-content: center; box-shadow: 0 6px 16px rgba(0,0,0,.25); }
    .logo-box img { width: 100%; height: 100%; object-fit: contain; }
    .logo-fallback { font-weight: 800; color: #134e2e; letter-spacing: .05em; }
    .brand-name { margin-top: 12px; font-size: 20px; font-weight: 800; letter-spacing: .12em; }
    .brand-sub { margin-top: 2px; font-size: 12px; color: #cfe5d8; letter-spacing: .06em; }
    nav { display: flex; flex-direction: column; padding: 12px 0; }
    nav a { color: #d6e8dd; text-decoration: none; padding: 12px 24px; border-left: 3px solid transparent; }
    nav a:hover { background: rgba(255,255,255,.08); }
    nav a.active { background: rgba(255,255,255,.15); color: #fff; font-weight: 600; border-left-color: #7be0c3; }
    .public-link { margin-top: auto; padding: 16px 24px; color: #cfe5d8; font-size: 13px; text-decoration: none; border-top: 1px solid rgba(255,255,255,.18); }
    .public-link:hover { color: #fff; }
    .main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
    .topbar { display: flex; justify-content: flex-end; align-items: center; gap: 16px; padding: 12px 24px; background: #fff; border-bottom: 1px solid var(--border); }
    .who { color: var(--muted); font-size: 14px; }
    .logout { padding: 8px 14px; border: 1px solid #f0b9b4; border-radius: 8px; background: #fff; color: var(--danger); cursor: pointer; }
    .logout:hover { background: #fdecea; }
    .content { flex: 1; padding: 24px; }
    .app-footer { padding: 16px 24px 22px; text-align: center; font-size: 12px; color: #6b7280; background: #fff; border-top: 1px solid #e3e8ef; }
  `,
})
export class MainLayout {
  auth = inject(AuthService);
  brand = inject(BrandService); // Imeongezwa hapa ili kuondoa error ya TS2339
  year = new Date().getFullYear();
  logoMissing = signal(false);
}