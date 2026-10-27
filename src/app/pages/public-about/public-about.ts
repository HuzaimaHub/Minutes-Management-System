import { Component } from '@angular/core';
import { ZSSF } from '../../core/zssf-info';

@Component({
  selector: 'app-public-about',
  template: `
    <section class="hero">
      <h1>About Us</h1>
      <p>{{ zssf.name }} · {{ zssf.nameSw }}</p>
    </section>

    <div class="wrap">
      <section class="block">
        <h2>About ZSSF</h2>
        <p>
          The Zanzibar Social Security Fund was established under Act No. 2 of 1998, which was amended by
          Act No. 9 of 2002 and re-enacted by Act No. 2 of 2005. Before the Fund was created, Zanzibar had
          no formal social security scheme.
        </p>
      </section>

      <div class="trio">
        <section class="block">
          <h2>Vision</h2>
          <p>To be a leading and model social security provider in the region.</p>
        </section>
        <section class="block">
          <h2>Mission</h2>
          <p>To be a dynamic provider of social security benefits through competent and motivated staff.</p>
        </section>
        <section class="block">
          <h2>Goal</h2>
          <p>To replace a member's income in the event of old age, sickness, maternity, invalidity and death.</p>
        </section>
      </div>

      <section class="block">
        <h2>About this system</h2>
        <p>
          The ZSSF Meeting Minutes Management System helps the Fund plan its meetings, prepare agendas,
          record who attended and keep accurate minutes of the discussions and decisions. Notices of
          upcoming meetings are published on this website. Minutes and other internal records are available
          to authorized ZSSF staff only.
        </p>
        <p>
          To learn more about the Fund and its services, visit
          <a [href]="zssf.website" target="_blank" rel="noopener">{{ zssf.websiteLabel }}</a>.
        </p>
      </section>
    </div>
  `,
  styles: `
    .hero { background: linear-gradient(135deg, var(--navy-dark), var(--navy)); color: #fff; text-align: center; padding: 44px 20px; }
    .hero h1 { margin: 0 0 8px; font-size: 30px; }
    .hero p { margin: 0; opacity: .9; }
    .wrap { max-width: 900px; margin: 0 auto; padding: 28px 20px 12px; display: flex; flex-direction: column; gap: 18px; }
    .block { background: #fff; border: 1px solid var(--border); border-radius: 14px; padding: 20px 24px; box-shadow: 0 1px 3px rgba(16,24,40,.06); }
    .block h2 { margin: 0 0 8px; font-size: 18px; color: var(--navy); }
    .block p { margin: 0 0 10px; line-height: 1.7; color: #374151; }
    .block p:last-child { margin-bottom: 0; }
    .block a { color: var(--navy); font-weight: 600; }
    .trio { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
    @media (max-width: 800px) { .trio { grid-template-columns: 1fr; } }
  `,
})
export class PublicAbout {
  zssf = ZSSF;
}