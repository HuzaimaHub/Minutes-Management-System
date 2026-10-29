import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { AdminProfile, ProfileService } from '../../core/profile.service';
import { checkPassword, passwordOk } from '../../shared/password-rules';

type ApiError = { status: number; error?: { message?: string } };

function message(err: ApiError, fallback: string): string {
  return err.error?.message ?? `${fallback} (status ${err.status}).`;
}

@Component({
  selector: 'app-profile',
  imports: [FormsModule],
  template: `
    <div class="page-head">
      <div>
        <h1>My profile</h1>
        <p class="page-sub">Manage your account details and password.</p>
      </div>
    </div>

    <div class="panel">
      <h2>Account details</h2>
      @if (detailsMsg()) { <div class="alert alert-ok">{{ detailsMsg() }}</div> }
      @if (detailsErr()) { <div class="alert alert-err">{{ detailsErr() }}</div> }

      <div class="form-grid">
        <label class="field">Full name *
          <input [(ngModel)]="fullName" name="fullName" maxlength="100" />
        </label>
        <label class="field">Email *
          <input type="email" [(ngModel)]="email" name="email" maxlength="100" autocomplete="username" />
        </label>
        <label class="field">Role
          <input [value]="profile()?.role ?? ''" disabled />
        </label>
        <label class="field">Member since
          <input [value]="memberSince()" disabled />
        </label>
        @if (emailChanged) {
          <label class="field wide">Current password (needed to change your email) *
            <input type="password" [(ngModel)]="detailsPassword" name="detailsPassword"
                   autocomplete="current-password" />
          </label>
        }
      </div>
      <div class="form-actions">
        <button class="btn btn-primary" (click)="saveDetails()" [disabled]="savingDetails()">
          {{ savingDetails() ? 'Saving...' : 'Save details' }}
        </button>
      </div>
      <p class="hint">
        Use a real email address you can open. It is where your password reset link is sent.
      </p>
    </div>

    <div class="panel">
      <h2>Change password</h2>
      @if (pwMsg()) { <div class="alert alert-ok">{{ pwMsg() }}</div> }
      @if (pwErr()) { <div class="alert alert-err">{{ pwErr() }}</div> }

      <div class="form-grid">
        <label class="field wide">Current password *
          <input [type]="showPw() ? 'text' : 'password'" [(ngModel)]="currentPw" name="currentPw"
                 autocomplete="current-password" />
        </label>
        <label class="field">New password *
          <input [type]="showPw() ? 'text' : 'password'" [(ngModel)]="newPw" name="newPw"
                 autocomplete="new-password" />
        </label>
        <label class="field">Confirm new password *
          <input [type]="showPw() ? 'text' : 'password'" [(ngModel)]="confirmPw" name="confirmPw"
                 autocomplete="new-password" />
        </label>
      </div>

      <ul class="rules">
        <li [class.ok]="rules.length">8 to 72 characters</li>
        <li [class.ok]="rules.letter">At least one letter</li>
        <li [class.ok]="rules.number">At least one number</li>
        <li [class.ok]="matches">Both new passwords match</li>
      </ul>

      <label class="show">
        <input type="checkbox" [checked]="showPw()" (change)="showPw.set(!showPw())" />
        Show passwords
      </label>

      <div class="form-actions">
        <button class="btn btn-primary" (click)="savePassword()" [disabled]="savingPw()">
          {{ savingPw() ? 'Saving...' : 'Change password' }}
        </button>
      </div>
    </div>
  `,
  styles: `
    .hint { margin: 14px 0 0; font-size: 13px; color: var(--muted); }
    .field input:disabled { background: #f3f5f7; color: var(--muted); }
    .rules { list-style: none; margin: 14px 0 10px; padding: 0; font-size: 13px; color: var(--muted); line-height: 1.9; }
    .rules li::before { content: '○  '; }
    .rules li.ok { color: var(--ok); }
    .rules li.ok::before { content: '✓  '; }
    .show { display: inline-flex; align-items: center; gap: 8px; font-size: 13px; color: #374151; cursor: pointer; }
  `,
})
export class Profile implements OnInit {
  private auth = inject(AuthService);
  private service = inject(ProfileService);

  profile = signal<AdminProfile | null>(null);
  memberSince = computed(() => {
    const created = this.profile()?.createdAt;
    return created
      ? new Date(created).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : '';
  });

  // account details
  fullName = '';
  email = '';
  detailsPassword = '';
  savingDetails = signal(false);
  detailsMsg = signal('');
  detailsErr = signal('');

  // password change
  currentPw = '';
  newPw = '';
  confirmPw = '';
  showPw = signal(false);
  savingPw = signal(false);
  pwMsg = signal('');
  pwErr = signal('');

  get emailChanged(): boolean {
    return this.email.trim().toLowerCase() !== (this.profile()?.email ?? '').toLowerCase();
  }

  get rules() {
    return checkPassword(this.newPw);
  }

  get matches(): boolean {
    return this.newPw.length > 0 && this.newPw === this.confirmPw;
  }

  ngOnInit() {
    this.load();
  }

  load() {
    this.service.get().subscribe({
      next: (p) => {
        this.profile.set(p);
        this.fullName = p.fullName;
        this.email = p.email;
      },
      error: () => this.detailsErr.set('Could not load your profile.'),
    });
  }

  saveDetails() {
    this.detailsMsg.set('');
    this.detailsErr.set('');
    const name = this.fullName.trim();
    const mail = this.email.trim();

    if (name.length < 2) {
      this.detailsErr.set('Enter your full name.');
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail)) {
      this.detailsErr.set('Enter a valid email address.');
      return;
    }
    if (this.emailChanged && !this.detailsPassword) {
      this.detailsErr.set('Enter your current password to change your email.');
      return;
    }

    this.savingDetails.set(true);
    this.service.update(name, mail, this.detailsPassword).subscribe({
      next: (res) => {
        this.auth.applySession(res); // new token: the old one belongs to the old email
        this.savingDetails.set(false);
        this.detailsPassword = '';
        this.detailsMsg.set('Your details have been updated.');
        this.load();
      },
      error: (err: ApiError) => {
        this.savingDetails.set(false);
        this.detailsErr.set(message(err, 'Could not save your details'));
      },
    });
  }

  savePassword() {
    this.pwMsg.set('');
    this.pwErr.set('');

    if (!this.currentPw) {
      this.pwErr.set('Enter your current password.');
      return;
    }
    if (!passwordOk(this.newPw)) {
      this.pwErr.set('The new password does not meet the rules below.');
      return;
    }
    if (this.newPw !== this.confirmPw) {
      this.pwErr.set('The new passwords do not match.');
      return;
    }

    this.savingPw.set(true);
    this.service.changePassword(this.currentPw, this.newPw).subscribe({
      next: () => {
        this.savingPw.set(false);
        this.currentPw = '';
        this.newPw = '';
        this.confirmPw = '';
        this.pwMsg.set('Password changed. Use the new password the next time you sign in.');
      },
      error: (err: ApiError) => {
        this.savingPw.set(false);
        this.pwErr.set(message(err, 'Could not change the password'));
      },
    });
  }
}