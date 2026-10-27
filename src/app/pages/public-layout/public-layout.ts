import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { BrandService } from '../../core/brand.service';
import { ZSSF } from '../../core/zssf-info';
import { Icon } from '../../shared/icon';

@Component({
  selector: 'app-public-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icon],
  template: `
    <header class="bar">
      <a class="brand" routerLink="/public">
        <div class="logo">
          @if (!logoMissing()) {
            <img [src]="brand.logoSrc()" alt="System logo" (error)="logoMissing.set(true)" />
          } @else {
            <span>{{ brand.orgShort() }}</span>
          }
        </div>
        <div>
          <div class="org">{{ brand.orgName() }}</div>
          @if (brand.orgNameSw()) {
            <div class="sub">{{ brand.orgNameSw() }}</div>
          }
        </div>
      </a>

      <nav class="nav">
        <a routerLink="/public" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Home</a>
        <a routerLink="/public/past-meetings" routerLinkActive="active">Past meetings</a>
        <a routerLink="/public/about" routerLinkActive="active">About</a>
        <a routerLink="/public/contact" routerLinkActive="active">Contact us</a>
      </nav>

      @if (auth.isLoggedIn()) {
        <a class="login" routerLink="/dashboard">Dashboard</a>
      } @else {
        <a class="login" routerLink="/login">Admin login</a>
      }
    </header>

    <main class="page"><router-outlet /></main>

    <footer class="site-footer">
      <div class="foot-grid">
        <div>
          <div class="foot-brand">
            <div class="foot-logo">
              @if (!logoMissing()) {
                <img [src]="brand.logoSrc()" alt="System logo" (error)="logoMissing.set(true)" />
              } @else {
                <span>{{ brand.orgShort() }}</span>
              }
            </div>
            <div>
              <div class="foot-name">{{ brand.orgName() }}</div>
              @if (brand.orgNameSw()) {
                <div class="foot-sw">{{ brand.orgNameSw() }}</div>
              }
            </div>
          </div>
          <p class="foot-text">
            Established under the Zanzibar Social Security Fund Acts, to replace members' income in the
            event of old age, sickness, maternity, invalidity and death.
          </p>
        </div>

        <div>
          <h4>Quick links</h4>
          <ul class="foot-list">
            <li><a routerLink="/public">Home</a></li>
            <li><a routerLink="/public/past-meetings">Past meetings</a></li>
            <li><a routerLink="/public/about">About us</a></li>
            <li><a routerLink="/public/contact">Contact us</a></li>
            <li><a routerLink="/login">Admin login</a></li>
          </ul>
        </div>

        <div>
          <h4>Contact</h4>
          <ul class="foot-list">
            @if (zssf.address) { <li><app-icon name="map-pin" [size]="15" /> {{ zssf.address }}</li> }
            @if (zssf.phone) { <li><app-icon name="phone" [size]="15" /> {{ zssf.phone }}</li> }
            @if (zssf.email) { <li><app-icon name="mail" [size]="15" /> {{ zssf.email }}</li> }
            <li>
              <app-icon name="globe" [size]="15" />
              <a [href]="zssf.website" target="_blank" rel="noopener">{{ zssf.websiteLabel }}</a>
            </li>
          </ul>
        </div>
      </div>

      <div class="foot-bar">
        <span>© {{ year }} {{ brand.orgLabel() }} · {{ brand.systemName() }}</span>
        <span>Zanzibar, Tanzania</span>
      </div>
    </footer>
  `,
  styles: `
    :host { display: block; min-height: 100vh; }
    .bar { position: sticky; top: 0; z-index: 10; display: flex; align-items: center; justify-content: space-between;
      gap: 10px 24px; flex-wrap: wrap; padding: 10px 28px; background: #fff; border-bottom: 1px solid var(--border); }
    .brand { display: flex; align-items: center; gap: 12px; text-decoration: none; }
    .logo { width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; font-weight: 800; color: var(--navy-dark); }
    .logo img { width: 100%; height: 100%; object-fit: contain; }
    .org { font-weight: 700; color: var(--navy-dark); }
    .sub { font-size: 12px; color: var(--muted); }
    .nav { display: flex; gap: 6px; flex-wrap: wrap; }
    .nav a { padding: 8px 14px; border-radius: 999px; color: #374151; text-decoration: none; font-size: 14px; font-weight: 600; }
    .nav a:hover { background: #eef3f0; }
    .nav a.active { background: var(--navy); color: #fff; }
    .login { padding: 9px 18px; border-radius: 999px; background: var(--navy); color: #fff; text-decoration: none; font-size: 14px; font-weight: 600; }
    .login:hover { background: var(--navy-dark); }
    .page { display: block; min-height: 55vh; }

    .site-footer { margin-top: 40px; background: linear-gradient(180deg, var(--navy-dark), #0d3a21); color: #d6e8dd; }
    .foot-grid { max-width: 1100px; margin: 0 auto; padding: 36px 24px 24px; display: grid; grid-template-columns: 1.4fr 1fr 1fr; gap: 32px; }
    .foot-brand { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
    .foot-logo { width: 54px; height: 54px; background: #fff; border-radius: 14px; padding: 6px; display: flex; align-items: center; justify-content: center; font-weight: 800; color: var(--navy-dark); flex-shrink: 0; }
    .foot-logo img { width: 100%; height: 100%; object-fit: contain; }
    .foot-name { color: #fff; font-weight: 700; }
    .foot-sw { font-size: 12px; opacity: .8; }
    .site-footer h4 { margin: 0 0 8px; color: #fff; font-size: 14px; text-transform: uppercase; letter-spacing: .06em; }
    .foot-text { margin: 0; font-size: 13px; line-height: 1.6; }
    .foot-list { list-style: none; margin: 0; padding: 0; font-size: 13px; line-height: 2; }
    .foot-list li { display: flex; align-items: center; gap: 8px; }
    .foot-list a { color: #a9e8cf; text-decoration: none; }
    .foot-list a:hover { text-decoration: underline; }
    .foot-bar { max-width: 1100px; margin: 0 auto; padding: 16px 24px 22px; border-top: 1px solid rgba(255,255,255,.18);
      display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px; font-size: 12px; opacity: .85; }
    @media (max-width: 800px) { .foot-grid { grid-template-columns: 1fr; } }
  `,
})
export class PublicLayout {
  auth = inject(AuthService);
  brand = inject(BrandService);
  zssf = ZSSF;
  year = new Date().getFullYear();
  logoMissing = signal(false);
}