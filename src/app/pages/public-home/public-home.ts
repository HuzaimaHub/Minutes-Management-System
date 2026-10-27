import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { API_URL } from '../../core/api.config';
import { BrandService } from '../../core/brand.service';

interface PublicMeeting {
  meetingId: number;
  title: string;
  purpose?: string;
  meetingDate: string;
  startTime: string;
  endTime?: string;
  location?: string;
  agenda?: { agendaOrder: number; topic: string; description?: string }[];
}

@Component({
  selector: 'app-public-home',
  imports: [DatePipe],
  template: `
    <section class="hero">
      <h1>Meeting Notices</h1>
      <p>Find out when and where upcoming {{ brand.orgShort() }} meetings will take place.</p>
    </section>

    <div class="wrap">
      <h2>Upcoming meetings</h2>

      @if (error()) { <div class="alert alert-err">{{ error() }}</div> }
      @if (loading()) { <div class="empty">Loading...</div> }

      <div class="cards">
        @for (m of meetings(); track m.meetingId) {
          <article class="card">
            <div class="date">
              <span class="day">{{ m.meetingDate | date: 'd' }}</span>
              <span class="month">{{ m.meetingDate | date: 'MMM' }}</span>
            </div>

            <dl class="details">
              <div class="row"><dt>Title</dt><dd class="title">{{ m.title }}</dd></div>
              <div class="row"><dt>Date</dt><dd>{{ m.meetingDate | date: 'fullDate' }}</dd></div>
              <div class="row">
                <dt>Time</dt>
                <dd>{{ m.startTime.slice(0, 5) }}{{ m.endTime ? ' - ' + m.endTime.slice(0, 5) : '' }}</dd>
              </div>
              @if (m.location) {
                <div class="row"><dt>Venue</dt><dd>{{ m.location }}</dd></div>
              }
              @if (m.purpose) {
                <div class="row"><dt>Purpose</dt><dd>{{ m.purpose }}</dd></div>
              }
              @if (m.agenda && m.agenda.length) {
                <div class="row">
                  <dt>Agenda</dt>
                  <dd>
                    <ol class="agenda">
                      @for (a of m.agenda; track a.agendaOrder) {
                        <li>
                          {{ a.topic }}
                          @if (a.description) { <span class="adesc"> - {{ a.description }}</span> }
                        </li>
                      }
                    </ol>
                  </dd>
                </div>
              }
            </dl>

            <span class="when {{ whenClass(m.meetingDate) }}">{{ whenLabel(m.meetingDate) }}</span>
          </article>
        }
      </div>

      @if (!loading() && !error() && meetings().length === 0) {
        <div class="empty">There are no upcoming meetings at the moment.</div>
      }

      <p class="note">
        Meeting minutes and attendee lists are internal records available to authorized {{ brand.orgShort() }} staff only.
      </p>
    </div>
  `,
  styles: `
    .hero { background: linear-gradient(135deg, var(--navy-dark), var(--navy)); color: #fff; text-align: center; padding: 44px 20px; }
    .hero h1 { margin: 0 0 8px; font-size: 30px; }
    .hero p { margin: 0; opacity: .9; }
    .wrap { max-width: 900px; margin: 0 auto; padding: 28px 20px 12px; }
    .wrap h2 { color: var(--navy); margin: 0 0 16px; }
    .cards { display: flex; flex-direction: column; gap: 14px; }
    .card { display: flex; align-items: flex-start; gap: 18px; background: #fff; border: 1px solid var(--border); border-radius: 14px; padding: 16px 20px; box-shadow: 0 1px 3px rgba(16,24,40,.06); }
    .date { width: 64px; flex-shrink: 0; text-align: center; background: var(--navy); color: #fff; border-radius: 12px; padding: 8px 0; }
    .day { display: block; font-size: 24px; font-weight: 700; line-height: 1.1; }
    .month { font-size: 12px; text-transform: uppercase; letter-spacing: .08em; }

    .details { flex: 1; min-width: 0; margin: 0; }
    .row { display: grid; grid-template-columns: 84px 1fr; gap: 12px; padding: 4px 0; }
    dt { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: var(--muted); padding-top: 3px; }
    dd { margin: 0; color: #374151; line-height: 1.5; }
    .title { font-size: 17px; font-weight: 700; color: var(--navy); }
    .agenda { margin: 0; padding-left: 18px; line-height: 1.7; }
    .adesc { color: var(--muted); font-size: 13px; }

    .when { padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 700; white-space: nowrap; }
    .when.today { background: #fff4e5; color: #b45309; }
    .when.soon { background: #e6f4ea; color: #1e6b34; }
    .when.later { background: #eef2f7; color: #374151; }
    .note { margin: 24px 0 0; font-size: 13px; color: var(--muted); text-align: center; }
    @media (max-width: 600px) { .card { flex-wrap: wrap; } .row { grid-template-columns: 1fr; gap: 0; } }
  `,
})
export class PublicHome implements OnInit {
  private http = inject(HttpClient);
  brand = inject(BrandService);

  meetings = signal<PublicMeeting[]>([]);
  loading = signal(true);
  error = signal('');

  ngOnInit() {
    this.http.get<PublicMeeting[]>(`${API_URL}/public/meetings`).subscribe({
      next: (data) => {
        this.meetings.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load meetings right now. Please try again later.');
        this.loading.set(false);
      },
    });
  }

  private daysUntil(date: string): number {
    const target = new Date(date + 'T00:00:00');
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return Math.round((target.getTime() - start.getTime()) / 86400000);
  }

  whenLabel(date: string): string {
    const n = this.daysUntil(date);
    return n === 0 ? 'Today' : n === 1 ? 'Tomorrow' : `In ${n} days`;
  }

  whenClass(date: string): string {
    const n = this.daysUntil(date);
    return n === 0 ? 'today' : n <= 7 ? 'soon' : 'later';
  }
}