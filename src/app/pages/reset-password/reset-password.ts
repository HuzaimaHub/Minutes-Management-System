import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { BrandService } from '../../core/brand.service';
import { checkPassword, passwordOk } from '../../shared/password-rules';

@Component({
  selector: 'app-reset-password',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="page">
      <div class="card">
        <div class="logo">
          @if (!logoMissing()) {
            <img [src]="brand.logoSrc()" alt="Logo" (error)="logoMissing.set(true)" />
          } @else {
            <span>{{ brand.orgShort() }}</span>
          }
        </div>

        @switch (state()) {
          @case ('checking') {
            <h1>Checking your link...</h1>
          }
          @case ('invalid') {
            <h1>Link not valid</h1>
            <div class="error">This reset link is invalid or has expired.</div>
            <a class="submit" routerLink="/forgot-password">Request a new link</a>
          }
          @case ('done') {
            <h1>Password changed</h1>
            <div class="ok">{{ doneMessage() }}</div>
            <a class="submit" routerLink="/login">Go to sign in</a>
          }
          @default {
            <h1>Choose a new password</h1>
            <form class="form" (ngSubmit)="submit()">
              @if (error()) { <div class="error">{{ error() }}</div> }

              <label for="pw">New password</label>
              <input id="pw" [type]="show() ? 'text' : 'password'" name="pw" [(ngModel)]="password"
                     autocomplete="new-password" />

              <label for="pw2">Confirm new password</label>
              <input id="pw2" [type]="show() ? 'text' : 'password'" name="pw2" [(ngModel)]="confirm"
                     autocomplete="new-password" />

              <ul class="rules">
                <li [class.ok]="rules.length">8 to 72 characters</li>
                <li [class.ok]="rules.letter">At least one letter</li>
                <li [class.ok]="rules.number">At least one number</li>
                <li [class.ok]="matches">Both passwords match</li>
              </ul>

              <label class="show">
                <input type="checkbox" [checked]="show()" (change)="show.set(!show())" />
                Show passwords
              </label>

              <button type="submit" class="submit" [disabled]="loading()">
                {{ loading() ? 'Saving...' : 'Change password' }}
              </button>
            </form>
          }
        }

        <a class="back" routerLink="/login">← Back to sign in</a>
      </div>
      <p class="foot">© {{ year }} {{ brand.orgLabel() }} · {{ brand.systemName() }}</p>
    </div>
  `,
  styles: `
    :host { --teal: #3fb8af; --teal-dark: #2f9e95; --g1: #134e2e; display: block; }
    .page { min-height: 100vh; background: #f3f2ec; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px 12px; }
    .card { width: 100%; max-width: 420px; background: #fff; border: 1px solid #eef0ee; border-radius: 22px; padding: 30px 28px;
      box-shadow: 0 18px 44px rgba(0,0,0,.12); display: flex; flex-direction: column; gap: 8px; }
    .form { display: flex; flex-direction: column; gap: 8px; }
    .logo { width: 76px; height: 76px; margin: 0 auto 4px; display: flex; align-items: center; justify-content: center; font-weight: 800; color: var(--g1); }
    .logo img { width: 100%; height: 100%; object-fit: contain; }
    h1 { margin: 0 0 4px; text-align: center; font-size: 22px; color: #111827; }
    label { font-size: 13px; font-weight: 700; color: #1f2937; margin-top: 6px; }
    input[type=password], input[type=text] { width: 100%; padding: 13px 14px; background: #f3f5f7; border: 1px solid transparent; border-radius: 12px; font-size: 14px; }
    input[type=password]:focus, input[type=text]:focus { outline: none; border-color: var(--teal); background: #fff; box-shadow: 0 0 0 3px rgba(63,184,175,.2); }
    .rules { list-style: none; margin: 8px 0 4px; padding: 0; font-size: 13px; color: #6b7280; line-height: 1.9; }
    .rules li::before { content: '○  '; }
    .rules li.ok { color: #1e6b34; }
    .rules li.ok::before { content: '✓  '; }
    .show { display: inline-flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 400; color: #374151; cursor: pointer; }
    .submit { margin-top: 14px; padding: 13px; border: 0; border-radius: 999px; background: var(--teal); color: #fff; font-size: 15px; font-weight: 700; cursor: pointer; text-align: center; text-decoration: none; }
    .submit:hover { background: var(--teal-dark); }
    .submit:disabled { opacity: .6; cursor: not-allowed; }
    .back { margin-top: 12px; text-align: center; font-size: 13px; font-weight: 700; color: var(--teal-dark); text-decoration: none; }
    .back:hover { text-decoration: underline; }
    .ok { background: #e6f4ea; color: #1e6b34; padding: 12px; border-radius: 10px; font-size: 13px; line-height: 1.5; }
    .error { background: #fde8e8; color: #b42318; padding: 10px; border-radius: 10px; font-size: 13px; }
    .foot { margin-top: 18px; font-size: 12px; color: #5b6b61; text-align: center; }
  `,
})
export class ResetPassword implements OnInit {
  private route = inject(ActivatedRoute);
  private auth = inject(AuthService);
  brand = inject(BrandService);

  token = '';
  password = '';
  confirm = '';
  year = new Date().getFullYear();

  state = signal<'checking' | 'ready' | 'invalid' | 'done'>('checking');
  loading = signal(false);
  error = signal('');
  doneMessage = signal('');
  show = signal(false);
  logoMissing = signal(false);

  get rules() {
    return checkPassword(this.password);
  }

  get matches(): boolean {
    return this.password.length > 0 && this.password === this.confirm;
  }

  ngOnInit() {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
    if (!this.token) {
      this.state.set('invalid');
      return;
    }
    this.auth.checkResetToken(this.token).subscribe({
      next: () => this.state.set('ready'),
      error: () => this.state.set('invalid'),
    });
  }

  submit() {
    this.error.set('');
    if (!passwordOk(this.password)) {
      this.error.set('The password does not meet the rules below.');
      return;
    }
    if (this.password !== this.confirm) {
      this.error.set('The passwords do not match.');
      return;
    }
    this.loading.set(true);
    this.auth.resetPassword(this.token, this.password).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.doneMessage.set(res.message);
        this.state.set('done');
      },
      error: (err: { status: number; error?: { message?: string } }) => {
        this.loading.set(false);
        this.error.set(err.error?.message ?? `Could not change the password (status ${err.status}).`);
      },
    });
  }
}