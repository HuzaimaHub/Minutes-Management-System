import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { BrandService } from '../../core/brand.service';

@Component({
  selector: 'app-forgot-password',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="page">
      <form class="card" (ngSubmit)="submit()">
        <div class="logo">
          @if (!logoMissing()) {
            <img [src]="brand.logoSrc()" alt="Logo" (error)="logoMissing.set(true)" />
          } @else {
            <span>{{ brand.orgShort() }}</span>
          }
        </div>
        <h1>Forgot your password?</h1>

        @if (sent()) {
          <div class="ok">
            If an account exists for that email address, a password reset link has been sent.
            Check your inbox and your spam folder. The link expires in 30 minutes.
          </div>
        } @else {
          <p class="hint">
            Enter the email address of your administrator account and we will send you a link to
            choose a new password.
          </p>
          @if (error()) { <div class="error">{{ error() }}</div> }

          <label for="email">Email</label>
          <input id="email" type="email" name="email" [(ngModel)]="email"
                 placeholder="Enter your email" autocomplete="username" />

          <button type="submit" class="submit" [disabled]="loading()">
            {{ loading() ? 'Sending...' : 'Send reset link' }}
          </button>
        }

        <a class="back" routerLink="/login">← Back to sign in</a>
      </form>
      <p class="foot">© {{ year }} {{ brand.orgLabel() }} · {{ brand.systemName() }}</p>
    </div>
  `,
  styles: `
    :host { --teal: #3fb8af; --teal-dark: #2f9e95; --g1: #134e2e; display: block; }
    .page { min-height: 100vh; background: #f3f2ec; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px 12px; }
    .card { width: 100%; max-width: 420px; background: #fff; border: 1px solid #eef0ee; border-radius: 22px; padding: 30px 28px;
      box-shadow: 0 18px 44px rgba(0,0,0,.12); display: flex; flex-direction: column; gap: 8px; }
    .logo { width: 76px; height: 76px; margin: 0 auto 4px; display: flex; align-items: center; justify-content: center; font-weight: 800; color: var(--g1); }
    .logo img { width: 100%; height: 100%; object-fit: contain; }
    h1 { margin: 0; text-align: center; font-size: 22px; color: #111827; }
    .hint { margin: 0 0 8px; text-align: center; font-size: 13px; color: #6b7280; line-height: 1.5; }
    label { font-size: 13px; font-weight: 700; color: #1f2937; margin-top: 6px; }
    input { width: 100%; padding: 13px 14px; background: #f3f5f7; border: 1px solid transparent; border-radius: 12px; font-size: 14px; }
    input:focus { outline: none; border-color: var(--teal); background: #fff; box-shadow: 0 0 0 3px rgba(63,184,175,.2); }
    .submit { margin-top: 14px; padding: 13px; border: 0; border-radius: 999px; background: var(--teal); color: #fff; font-size: 15px; font-weight: 700; cursor: pointer; }
    .submit:hover { background: var(--teal-dark); }
    .submit:disabled { opacity: .6; cursor: not-allowed; }
    .back { margin-top: 12px; text-align: center; font-size: 13px; font-weight: 700; color: var(--teal-dark); text-decoration: none; }
    .back:hover { text-decoration: underline; }
    .ok { background: #e6f4ea; color: #1e6b34; padding: 12px; border-radius: 10px; font-size: 13px; line-height: 1.5; }
    .error { background: #fde8e8; color: #b42318; padding: 10px; border-radius: 10px; font-size: 13px; }
    .foot { margin-top: 18px; font-size: 12px; color: #5b6b61; text-align: center; }
  `,
})
export class ForgotPassword {
  private auth = inject(AuthService);
  brand = inject(BrandService);

  email = '';
  year = new Date().getFullYear();
  loading = signal(false);
  sent = signal(false);
  error = signal('');
  logoMissing = signal(false);

  submit() {
    this.error.set('');
    const mail = this.email.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail)) {
      this.error.set('Enter a valid email address.');
      return;
    }
    this.loading.set(true);
    this.auth.forgotPassword(mail).subscribe({
      next: () => {
        this.loading.set(false);
        this.sent.set(true);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Cannot reach the server. Please try again later.');
      },
    });
  }
}