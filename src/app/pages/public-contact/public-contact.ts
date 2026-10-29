import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BrandService } from '../../core/brand.service';
import { ZSSF } from '../../core/zssf-info';
import { Icon } from '../../shared/icon';

@Component({
  selector: 'app-public-contact',
  imports: [RouterLink, Icon],
  template: `
    <section class="hero">
      <h1>Contact Us</h1>
      <p>Get in touch with {{ brand.orgName() }} about meeting notices and general enquiries.</p>
    </section>

    <div class="wrap">
      <div class="cards">
        @if (zssf.address) {
          <article class="info">
            <div class="ico"><app-icon name="map-pin" [size]="24" /></div>
            <h3>Visit us</h3>
            <p>{{ zssf.address }}</p>
          </article>
        }
        @if (zssf.phone) {
          <article class="info">
            <div class="ico"><app-icon name="phone" [size]="24" /></div>
            <h3>Call us</h3>
            <p><a [href]="'tel:' + phoneDigits">{{ zssf.phone }}</a></p>
          </article>
        }
        @if (zssf.email) {
          <article class="info">
            <div class="ico"><app-icon name="mail" [size]="24" /></div>
            <h3>Email us</h3>
            <p><a [href]="'mailto:' + zssf.email">{{ zssf.email }}</a></p>
          </article>
        }
        <article class="info">
          <div class="ico"><app-icon name="globe" [size]="24" /></div>
          <h3>Website</h3>
          <p><a [href]="zssf.website" target="_blank" rel="noopener">{{ zssf.websiteLabel }}</a></p>
        </article>
      </div>

      @if (!zssf.phone && !zssf.email) {
        <div class="notice">
          Telephone and email details will be published here soon. In the meantime, please visit our office
          or our website using the details above.
        </div>
      }

      <section class="panel-help">
        <h2>Before you contact us</h2>
        <ul>
          <li>
            Dates, times and venues of upcoming meetings are on the
            <a routerLink="/public">Home page</a>. Earlier meetings are on the
            <a routerLink="/public/past-meetings">Past meetings</a> page.
          </li>
          <li>
            When you write to us about a meeting, please mention its <strong>title</strong> and
            <strong>date</strong> so that we can help you faster.
          </li>
          <li>
            Minutes and attendee lists are internal records available to authorized {{ brand.orgShort() }}
            staff only. To request access, contact the office using the details above.
          </li>
        </ul>

        <div class="actions">
          @if (zssf.email) {
            <a class="btn-main" [href]="'mailto:' + zssf.email">Send an email</a>
            <button type="button" class="btn-alt" (click)="copyEmail()">
              {{ copied() ? 'Copied!' : 'Copy email address' }}
            </button>
          }
          <a class="btn-alt" [href]="zssf.website" target="_blank" rel="noopener">Visit website</a>
        </div>
        @if (zssf.email) {
          <p class="tip">
            If the email button does nothing, your computer has no email program set up. Use
            <strong>Copy email address</strong> and paste it into your webmail (Gmail, Outlook and others).
          </p>
        }
      </section>
    </div>
  `,
  styles: `
    .hero { background: linear-gradient(135deg, var(--navy-dark), var(--navy)); color: #fff; text-align: center; padding: 44px 20px; }
    .hero h1 { margin: 0 0 8px; font-size: 30px; }
    .hero p { margin: 0 auto; max-width: 560px; opacity: .9; }
    .wrap { max-width: 900px; margin: 0 auto; padding: 28px 20px 12px; }

    .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 16px; }
    .info { background: #fff; border: 1px solid var(--border); border-top: 4px solid var(--navy); border-radius: 14px;
      padding: 22px 18px; text-align: center; box-shadow: 0 1px 3px rgba(16,24,40,.06); }
    .ico { width: 52px; height: 52px; margin: 0 auto 12px; border-radius: 50%; background: #e6f4ea; color: var(--navy-dark);
      display: flex; align-items: center; justify-content: center; }
    .info h3 { margin: 0 0 6px; font-size: 13px; text-transform: uppercase; letter-spacing: .08em; color: var(--muted); }
    .info p { margin: 0; color: #1f2937; font-weight: 600; line-height: 1.5; overflow-wrap: anywhere; }
    .info a { color: var(--navy); text-decoration: none; }
    .info a:hover { text-decoration: underline; }

    .notice { margin-top: 18px; background: #fff8e6; border: 1px solid #f3dca0; color: #7a5b00;
      border-radius: 10px; padding: 12px 16px; font-size: 14px; }

    .panel-help { margin-top: 24px; background: #fff; border: 1px solid var(--border); border-radius: 14px; padding: 24px;
      box-shadow: 0 1px 3px rgba(16,24,40,.06); }
    .panel-help h2 { margin: 0 0 12px; color: var(--navy); font-size: 18px; }
    .panel-help ul { margin: 0; padding-left: 20px; line-height: 1.8; color: #374151; }
    .panel-help a { color: var(--navy); font-weight: 600; }
    .actions { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 20px; }
    .btn-main, .btn-alt { padding: 10px 20px; border-radius: 999px; font-size: 14px; font-weight: 600; text-decoration: none; }
    .btn-main { background: var(--navy); color: #fff !important; }
    .btn-main:hover { background: var(--navy-dark); }
    .btn-alt { border: 1px solid var(--navy); color: var(--navy) !important; background: transparent; cursor: pointer; font-family: inherit; }
    .btn-alt:hover { background: #eef3f0; }
    .tip { margin: 14px 0 0; font-size: 13px; color: var(--muted); line-height: 1.6; }
  `,
})
export class PublicContact {
  brand = inject(BrandService);
  zssf = ZSSF;
  copied = signal(false);

  // phone number without spaces, for tel: links
  phoneDigits = (ZSSF.phone ?? '').replace(/[^+\d]/g, '');

  async copyEmail() {
    try {
      await navigator.clipboard.writeText(this.zssf.email);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    } catch {
      window.prompt('Copy the email address:', this.zssf.email);
    }
  }
}