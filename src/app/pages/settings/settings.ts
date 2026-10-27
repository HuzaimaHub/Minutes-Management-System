import { Component, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrandService } from '../../core/brand.service';

@Component({
  selector: 'app-settings',
  imports: [FormsModule],
  template: `
    <div class="page-head">
      <div>
        <h1>Settings</h1>
        <p class="page-sub">Manage the brand shown on every page and printout.</p>
      </div>
    </div>

    @if (message()) { <div class="alert alert-ok">{{ message() }}</div> }
    @if (error()) { <div class="alert alert-err">{{ error() }}</div> }

    <div class="panel">
      <h2>Organization</h2>
      <div class="form-grid">
        <label class="field">Organization name *
          <input [(ngModel)]="orgNameInput" name="orgName" maxlength="80" />
        </label>
        <label class="field">Short name *
          <input [(ngModel)]="orgShortInput" name="orgShort" maxlength="12" />
        </label>
        <label class="field wide">Swahili name (optional)
          <input [(ngModel)]="orgSwInput" name="orgSw" maxlength="80" />
        </label>
      </div>
      <div class="form-actions">
        <button class="btn btn-primary" (click)="saveOrg()" [disabled]="busy()">Save organization</button>
        <button class="btn btn-danger" (click)="resetOrg()" [disabled]="busy()">Use default</button>
      </div>
    </div>

    <div class="panel">
      <h2>System name</h2>
      <label class="field">Name shown on the login page, sidebar, footers and the browser tab
        <input [(ngModel)]="nameInput" name="systemName" maxlength="80" />
      </label>
      <div class="form-actions">
        <button class="btn btn-primary" (click)="saveName()" [disabled]="busy()">Save name</button>
        <button class="btn btn-danger" (click)="resetName()" [disabled]="busy()">Use default name</button>
      </div>
    </div>

    <div class="panel">
      <h2>Logo</h2>

      <div class="logos">
        <div>
          <div class="cap">Current logo</div>
          <div class="box"><img [src]="brand.logoSrc()" alt="Current logo" /></div>
        </div>
        @if (previewUrl()) {
          <div>
            <div class="cap">New logo (not saved yet)</div>
            <div class="box"><img [src]="previewUrl()!" alt="New logo preview" /></div>
          </div>
        }
      </div>

      <label class="field">Choose a new logo (PNG, JPG or WEBP, up to 2 MB)
        <input type="file" accept="image/png,image/jpeg,image/webp" (change)="onFile($event)" />
      </label>

      <div class="form-actions">
        <button class="btn btn-primary" (click)="upload()" [disabled]="!file || busy()">
          {{ busy() ? 'Saving...' : 'Save logo' }}
        </button>
        <button class="btn btn-danger" (click)="resetLogo()" [disabled]="busy()">Use default logo</button>
      </div>
      <p class="hint">The logo appears on the login page, the sidebar, the public pages and printed reports.</p>
    </div>
  `,
  styles: `
    .logos { display: flex; gap: 28px; flex-wrap: wrap; margin-bottom: 18px; }
    .cap { font-size: 13px; font-weight: 600; color: var(--muted); margin-bottom: 6px; }
    .box { width: 180px; height: 180px; border: 1px dashed #cfd6e0; border-radius: 12px; background: #fff;
      display: flex; align-items: center; justify-content: center; padding: 12px; }
    .box img { max-width: 100%; max-height: 100%; object-fit: contain; }
    .hint { margin: 14px 0 0; font-size: 13px; color: var(--muted); }
  `,
})
export class Settings {
  brand = inject(BrandService);

  nameInput = '';
  orgNameInput = '';
  orgSwInput = '';
  orgShortInput = '';
  file: File | null = null;
  previewUrl = signal<string | null>(null);
  busy = signal(false);
  message = signal('');
  error = signal('');

  private input: HTMLInputElement | null = null;

  constructor() {
    effect(() => {
      this.nameInput = this.brand.systemName();
    });
    effect(() => {
      this.orgNameInput = this.brand.orgName();
      this.orgSwInput = this.brand.orgNameSw();
      this.orgShortInput = this.brand.orgShort();
    });
  }

  // ---------- Organization ----------

  saveOrg() {
    this.clearMessages();
    const name = this.orgNameInput.trim();
    const sw = this.orgSwInput.trim();
    const short = this.orgShortInput.trim();
    if (name.length < 3 || name.length > 80) {
      this.error.set('The organization name must be between 3 and 80 characters.');
      return;
    }
    if (short.length < 2 || short.length > 12) {
      this.error.set('The short name must be between 2 and 12 characters.');
      return;
    }
    this.busy.set(true);
    this.brand.saveOrg(name, sw, short).subscribe({
      next: () => {
        this.busy.set(false);
        this.message.set('Organization details updated.');
      },
      error: (err) => this.fail(err, 'Could not save the organization details'),
    });
  }

  resetOrg() {
    if (!confirm('Go back to the default organization details?')) return;
    this.clearMessages();
    this.busy.set(true);
    this.brand.resetOrg().subscribe({
      next: () => {
        this.busy.set(false);
        this.message.set('Default organization details restored.');
      },
      error: (err) => this.fail(err, 'Could not restore the organization details'),
    });
  }

  // ---------- System name ----------

  saveName() {
    this.clearMessages();
    const name = this.nameInput.trim();
    if (name.length < 3 || name.length > 80) {
      this.error.set('The system name must be between 3 and 80 characters.');
      return;
    }
    this.busy.set(true);
    this.brand.saveSystemName(name).subscribe({
      next: () => {
        this.busy.set(false);
        this.message.set('System name updated.');
      },
      error: (err) => this.fail(err, 'Could not save the system name'),
    });
  }

  resetName() {
    if (!confirm('Go back to the default system name?')) return;
    this.clearMessages();
    this.busy.set(true);
    this.brand.resetSystemName().subscribe({
      next: () => {
        this.busy.set(false);
        this.message.set('Default system name restored.');
      },
      error: (err) => this.fail(err, 'Could not restore the system name'),
    });
  }

  // ---------- Logo ----------

  onFile(event: Event) {
    this.clearMessages();
    this.input = event.target as HTMLInputElement;
    const f = this.input.files?.[0] ?? null;
    this.clearPreview();
    this.file = null;
    if (!f) return;

    if (!['image/png', 'image/jpeg', 'image/webp'].includes(f.type)) {
      this.error.set('Only PNG, JPG or WEBP images are allowed.');
      this.input.value = '';
      return;
    }
    if (f.size > 2 * 1024 * 1024) {
      this.error.set('The image must be 2 MB or smaller.');
      this.input.value = '';
      return;
    }
    this.file = f;
    this.previewUrl.set(URL.createObjectURL(f));
  }

  upload() {
    if (!this.file) return;
    this.clearMessages();
    this.busy.set(true);
    this.brand.upload(this.file).subscribe({
      next: () => {
        this.busy.set(false);
        this.file = null;
        this.clearPreview();
        if (this.input) this.input.value = '';
        this.message.set('Logo updated. It now appears on every page and printout.');
      },
      error: (err) => this.fail(err, 'Could not save the logo'),
    });
  }

  resetLogo() {
    if (!confirm('Go back to the default logo?')) return;
    this.clearMessages();
    this.busy.set(true);
    this.brand.reset().subscribe({
      next: () => {
        this.busy.set(false);
        this.message.set('Default logo restored.');
      },
      error: (err) => this.fail(err, 'Could not restore the logo'),
    });
  }

  // ---------- Helpers ----------

  private clearMessages() {
    this.message.set('');
    this.error.set('');
  }

  private fail(err: { status: number; error?: { message?: string } }, text: string) {
    this.busy.set(false);
    this.error.set(err.error?.message ?? `${text} (status ${err.status}).`);
  }

  private clearPreview() {
    const url = this.previewUrl();
    if (url) URL.revokeObjectURL(url);
    this.previewUrl.set(null);
  }
}