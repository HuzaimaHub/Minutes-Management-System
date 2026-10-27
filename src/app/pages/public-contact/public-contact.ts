import { Component } from '@angular/core';
import { ZSSF } from '../../core/zssf-info';
import { Icon } from '../../shared/icon';

@Component({
  selector: 'app-public-contact',
  imports: [Icon],
  template: `
    <section class="hero">
      <h1>Contact Us</h1>
      <p>Get in touch with the Zanzibar Social Security Fund.</p>
    </section>

    <div class="wrap">
      <section class="block">
        <h2>{{ zssf.name }}</h2>
        <ul class="list">
          @if (zssf.address) {
            <li>
              <app-icon name="map-pin" [size]="20" />
              <div><b>Address</b><span>{{ zssf.address }}</span></div>
            </li>
          }
          @if (zssf.phone) {
            <li>
              <app-icon name="phone" [size]="20" />
              <div><b>Phone</b><a [href]="phoneLink">{{ zssf.phone }}</a></div>
            </li>
          }
          @if (zssf.email) {
            <li>
              <app-icon name="mail" [size]="20" />
              <div><b>Email</b><a [href]="'mailto:' + zssf.email">{{ zssf.email }}</a></div>
            </li>
          }
          <li>
            <app-icon name="globe" [size]="20" />
            <div>
              <b>Website</b>
              <a [href]="zssf.website" target="_blank" rel="noopener">{{ zssf.websiteLabel }}</a>
            </div>
          </li>
        </ul>
      </section>

      <p class="note">
        For questions about a meeting notice, please use the contact details above.
      </p>
    </div>
  `,
  styles: `
    .hero { background: linear-gradient(135deg, var(--navy-dark), var(--navy)); color: #fff; text-align: center; padding: 44px 20px; }
    .hero h1 { margin: 0 0 8px; font-size: 30px; }
    .hero p { margin: 0; opacity: .9; }
    .wrap { max-width: 700px; margin: 0 auto; padding: 28px 20px 12px; }
    .block { background: #fff; border: 1px solid var(--border); border-radius: 14px; padding: 22px 26px; box-shadow: 0 1px 3px rgba(16,24,40,.06); }
    .block h2 { margin: 0 0 14px; font-size: 18px; color: var(--navy); }
    .list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 16px; }
    .list li { display: flex; align-items: flex-start; gap: 14px; color: var(--navy); }
    .list div { display: flex; flex-direction: column; gap: 2px; }
    .list b { color: #1f2937; font-size: 13px; text-transform: uppercase; letter-spacing: .05em; }
    .list span { color: #374151; }
    .list a { font-weight: 600; color: var(--navy); }
    .note { margin: 20px 0 0; text-align: center; font-size: 13px; color: var(--muted); }
  `,
})
export class PublicContact {
  zssf = ZSSF;
  phoneLink = 'tel:' + ZSSF.phone.replace(/[^+\d]/g, '');
}