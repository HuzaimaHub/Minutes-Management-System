import { NgTemplateOutlet } from '@angular/common';
import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { BrandService } from '../../core/brand.service';
import { Icon, IconName } from '../../shared/icon';

@Component({
  selector: 'app-login',
  imports: [FormsModule, NgTemplateOutlet, RouterLink, Icon],
  template: `
    <ng-template #logo>
      @if (!logoMissing()) {
        <img class="logo" [src]="brand.logoSrc()" alt="Logo" (error)="logoMissing.set(true)" />
      } @else {
        <span class="logo-text">{{ brand.orgShort() }}</span>
      }
    </ng-template>

    <div class="page">
      <div class="rings" aria-hidden="true">
        <span></span><span></span><span></span><span></span>
        <div class="badge"><ng-container [ngTemplateOutlet]="logo" /></div>
      </div>

      <main class="shell">
        <section class="left">
          <div class="org">
            <div class="org-logo"><ng-container [ngTemplateOutlet]="logo" /></div>
            <div>
              <div class="org-name">{{ brand.orgName() }}</div>
              @if (brand.orgNameSw()) {
                <div class="org-sub">{{ brand.orgNameSw() }}</div>
              }
            </div>
          </div>

          <h2>Welcome to {{ brand.systemName() }}</h2>
          <p class="lead">
            Sign in to manage meetings, agendas, attendees and minutes from one workspace.
          </p>

          @for (s of currentSlide(); track s.tag) {
            <div class="slide">
              <div class="slide-icon"><app-icon [name]="s.icon" [size]="24" /></div>
              <h3>{{ s.title }}</h3>
              <p>{{ s.text }}</p>
              <span class="tag">{{ s.tag }}</span>
            </div>
          }
          <div class="dots">
            @for (s of slides; track s.tag; let i = $index) {
              <button type="button" class="dot" [class.active]="i === current()"
                      (click)="current.set(i)" [attr.aria-label]="'Show ' + s.title"></button>
            }
          </div>

          <div class="tiles">
            <div class="tile"><span><app-icon name="lock" [size]="20" /></span>Secure access</div>
            <div class="tile"><span><app-icon name="user" [size]="20" /></span>Admin only</div>
            <div class="tile"><span><app-icon name="printer" [size]="20" /></span>Print ready</div>
          </div>
        </section>

        <section class="right">
          <div class="sun" aria-hidden="true"></div>
          <form class="signin" (ngSubmit)="submit()">
            <div class="signin-logo"><ng-container [ngTemplateOutlet]="logo" /></div>
            <h1>Sign in</h1>
            <p class="hint">Use your administrator credentials.</p>

            @if (error()) {
              <div class="error">{{ error() }}</div>
            }

            <label for="email">Email</label>
            <input id="email" type="email" name="email" [(ngModel)]="email"
                   placeholder="Enter your email" autocomplete="username" />

            <label for="password">Password</label>
            <div class="pass">
              <input id="password" [type]="showPassword() ? 'text' : 'password'" name="password"
                     [(ngModel)]="password" placeholder="Enter password"
                     autocomplete="current-password" />
              <button type="button" class="toggle" (click)="showPassword.set(!showPassword())">
                {{ showPassword() ? 'HIDE' : 'SHOW' }}
              </button>
            </div>

            <div class="forgot-row">
              <a routerLink="/forgot-password">Forgot password?</a>
            </div>

            <button type="submit" class="submit" [disabled]="loading()">
              {{ loading() ? 'Signing in...' : 'Sign in' }}
            </button>
          </form>
        </section>
      </main>

      <footer class="foot">
        © {{ year }} {{ brand.orgLabel() }} · {{ brand.systemName() }}
      </footer>

      <div class="help-wrap">
        @if (helpOpen()) {
          <div class="help-box">
            <strong>Having trouble signing in?</strong>
            <ul>
              <li>Check your email and password. Use SHOW to see what you typed.</li>
              <li>If you see 'Cannot reach the server', the system is not running yet. Wait a moment and try again.</li>
              <li>Forgot your password? Click <b>Forgot password?</b> to get a reset link by email.</li>
              <li>Still stuck? The ICT officer in charge of this system can help you.</li>
            </ul>
            @if (helpContact.phone) { <p class="help-contact">📞 {{ helpContact.phone }}</p> }
            @if (helpContact.email) { <p class="help-contact">✉️ {{ helpContact.email }}</p> }
          </div>
        }
        <button type="button" class="help" (click)="helpOpen.set(!helpOpen())">
          <span class="help-logo"><ng-container [ngTemplateOutlet]="logo" /></span>
          <span><b>Need help?</b><small>Sign-in tips</small></span>
        </button>
      </div>
    </div>
  `,
  styles: `
    :host { --g1: #134e2e; --g2: #1f6b45; --teal: #3fb8af; --teal-dark: #2f9e95; display: block; }
    .page { position: relative; min-height: 100vh; overflow: hidden; background: #f3f2ec;
      display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px 12px; }

    .logo { width: 100%; height: 100%; object-fit: contain; }
    .logo-text { font-weight: 800; color: var(--g1); letter-spacing: .04em; }

    /* ripples (bottom-left) */
    .rings { position: absolute; left: -110px; bottom: -110px; width: 440px; height: 440px; z-index: 0; pointer-events: none; }
    .rings span { position: absolute; inset: 0; border-radius: 50%; border: 2px solid rgba(31,107,69,.3);
      opacity: 0; animation: ripple 7s ease-out infinite; }
    .rings span:nth-child(2) { animation-delay: 1.75s; }
    .rings span:nth-child(3) { animation-delay: 3.5s; }
    .rings span:nth-child(4) { animation-delay: 5.25s; }
    @keyframes ripple { 0% { transform: scale(.22); opacity: .85; } 100% { transform: scale(1); opacity: 0; } }
    .badge { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 92px; height: 92px;
      border-radius: 50%; background: #fff; padding: 14px; display: flex; align-items: center; justify-content: center;
      box-shadow: 0 0 0 6px rgba(31,107,69,.15), 0 8px 20px rgba(0,0,0,.2); }

    /* main card */
    .shell { position: relative; z-index: 1; width: min(1100px, 100%); min-height: 580px; display: grid;
      grid-template-columns: 5fr 7fr; border-radius: 28px; overflow: hidden; box-shadow: 0 25px 60px rgba(0,0,0,.18); }

    .left { background: linear-gradient(155deg, var(--g1), var(--g2)); color: #fff; padding: 28px; display: flex; flex-direction: column; gap: 14px; }
    .org { display: flex; align-items: center; gap: 12px; }
    .org-logo { width: 58px; height: 58px; padding: 5px; background: #fff; border-radius: 14px; display: flex; align-items: center; justify-content: center; }
    .org-name { font-weight: 700; font-size: 17px; }
    .org-sub { font-size: 12px; opacity: .85; }
    .left h2 { margin: 10px 0 0; font-size: 26px; line-height: 1.2; }
    .lead { margin: 0; font-size: 14px; opacity: .9; line-height: 1.5; }

    .slide { background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.25); border-radius: 18px;
      padding: 18px; backdrop-filter: blur(6px); animation: fadeIn .5s ease; }
    .slide-icon { width: 44px; height: 44px; border-radius: 12px; background: rgba(255,255,255,.18);
      display: flex; align-items: center; justify-content: center; font-size: 22px; margin-bottom: 10px; }
    .slide h3 { margin: 0 0 6px; font-size: 20px; }
    .slide p { margin: 0 0 12px; font-size: 13px; opacity: .9; line-height: 1.5; }
    .tag { display: inline-block; font-size: 11px; font-weight: 700; letter-spacing: .06em; background: rgba(255,255,255,.2); padding: 5px 10px; border-radius: 8px; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }

    .dots { display: flex; gap: 6px; }
    .dot { height: 4px; width: 22px; border: 0; padding: 0; border-radius: 4px; background: rgba(255,255,255,.35); cursor: pointer; transition: all .3s; }
    .dot.active { width: 38px; background: #fff; }

    .tiles { margin-top: auto; display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
    .tile { background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.2); border-radius: 14px; padding: 14px 12px; font-size: 13px; font-weight: 700; }
    .tile span { display: block; font-size: 18px; margin-bottom: 8px; }

    /* right side */
    .right { position: relative; background: #fff; display: flex; align-items: center; justify-content: center; padding: 32px; overflow: hidden; }
    .sun { position: absolute; top: -170px; right: -170px; width: 440px; height: 440px; border-radius: 50%;
      background: repeating-conic-gradient(from 0deg, rgba(222,196,140,.55) 0deg 9deg, transparent 9deg 18deg);
      -webkit-mask-image: radial-gradient(circle, #000 25%, transparent 72%);
      mask-image: radial-gradient(circle, #000 25%, transparent 72%);
      animation: spin 70s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .signin { position: relative; z-index: 1; width: 100%; max-width: 380px; background: rgba(255,255,255,.92);
      border: 1px solid #eef0ee; border-radius: 22px; padding: 28px; box-shadow: 0 10px 30px rgba(0,0,0,.06);
      display: flex; flex-direction: column; gap: 6px; }
    .signin-logo { width: 84px; height: 84px; margin: 0 auto 4px; display: flex; align-items: center; justify-content: center; }
    .signin h1 { margin: 0; text-align: center; font-size: 24px; color: #111827; }
    .hint { margin: 0 0 14px; text-align: center; font-size: 13px; color: #6b7280; }
    label { font-size: 13px; font-weight: 700; color: #1f2937; margin-top: 8px; }
    input { width: 100%; padding: 13px 14px; background: #f3f5f7; border: 1px solid transparent; border-radius: 12px; font-size: 14px; }
    input:focus { outline: none; border-color: var(--teal); background: #fff; box-shadow: 0 0 0 3px rgba(63,184,175,.2); }
    .pass { position: relative; }
    .pass input { padding-right: 72px; }
    .toggle { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); border: 0; background: transparent;
      color: var(--teal-dark); font-size: 12px; font-weight: 800; letter-spacing: .04em; cursor: pointer; padding: 6px 8px; }
    .forgot-row { text-align: right; margin-top: 2px; }
    .forgot-row a { color: var(--teal-dark); font-size: 13px; font-weight: 700; text-decoration: none; }
    .forgot-row a:hover { text-decoration: underline; }
    .submit { margin-top: 14px; padding: 13px; border: 0; border-radius: 999px; background: var(--teal); color: #fff;
      font-size: 15px; font-weight: 700; cursor: pointer; transition: background .15s; }
    .submit:hover { background: var(--teal-dark); }
    .submit:disabled { opacity: .6; cursor: not-allowed; }
    .error { background: #fde8e8; color: #b42318; padding: 10px; border-radius: 10px; font-size: 13px; }

    .foot { position: relative; z-index: 1; margin-top: 22px; font-size: 12px; color: #5b6b61; text-align: center; }

    /* help button (bottom-right) */
    .help-wrap { position: fixed; right: 22px; bottom: 22px; z-index: 5; display: flex; flex-direction: column; align-items: flex-end; gap: 10px; }
    .help { display: flex; align-items: center; gap: 10px; background: var(--g1); color: #fff; border: 0; cursor: pointer;
      padding: 8px 16px 8px 8px; border-radius: 18px; box-shadow: 0 8px 20px rgba(0,0,0,.25); text-align: left; }
    .help-logo { width: 40px; height: 40px; padding: 4px; background: #fff; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
    .help b { display: block; font-size: 14px; }
    .help small { font-size: 11px; opacity: .85; }
    .help-box { max-width: 290px; background: #fff; border-radius: 14px; padding: 14px; font-size: 13px; color: #374151; box-shadow: 0 8px 24px rgba(0,0,0,.2); }
    .help-box ul { margin: 8px 0 0; padding-left: 18px; line-height: 1.6; }
    .help-contact { margin: 8px 0 0; font-weight: 600; }
    @media (max-width: 900px) {
      .shell { grid-template-columns: 1fr; }
      .left { display: none; }
    }
    @media (prefers-reduced-motion: reduce) {
      .rings span, .sun, .slide { animation: none; }
    }
  `,
})
export class Login implements OnDestroy {
  private auth = inject(AuthService);
  private router = inject(Router);
  brand = inject(BrandService);

  email = '';
  password = '';
  year = new Date().getFullYear();
  loading = signal(false);
  error = signal('');
  showPassword = signal(false);
  logoMissing = signal(false);
  helpOpen = signal(false);
  helpContact = { phone: '', email: '' };

  slides: { icon: IconName; title: string; text: string; tag: string }[] = [
    { icon: 'calendar', title: 'Meeting management', text: 'Schedule meetings and keep a clear record of dates, venues and purposes.', tag: 'MEETINGS' },
    { icon: 'users', title: 'Agendas and attendees', text: 'Prepare agenda items and record who attended, with their institution and position.', tag: 'AGENDAS' },
    { icon: 'printer', title: 'Printable minutes', text: 'Record discussions and decisions for each agenda item and print the full minutes.', tag: 'MINUTES' },
  ];
  current = signal(0);
  currentSlide = computed(() => [this.slides[this.current()]]);
  private timer = setInterval(
    () => this.current.update((i) => (i + 1) % this.slides.length),
    5000
  );

  ngOnDestroy() {
    clearInterval(this.timer);
  }

  submit() {
    this.error.set('');
    if (!this.email || !this.password) {
      this.error.set('Enter your email and password.');
      return;
    }
    this.loading.set(true);
    this.auth.login(this.email, this.password).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(
          err.status === 401
            ? 'Invalid email or password.'
            : 'Cannot reach the server. Is the backend running?'
        );
      },
    });
  }
}