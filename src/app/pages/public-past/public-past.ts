import { DatePipe } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { API_URL } from '../../core/api.config';

interface PastMeeting {
  meetingId: number;
  title: string;
  purpose?: string;
  meetingDate: string;
  startTime: string;
  endTime?: string;
  location?: string;
  agenda?: { agendaOrder: number; topic: string; description?: string }[];
}

interface PastPage {
  items: PastMeeting[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
}

@Component({
  selector: 'app-public-past',
  imports: [DatePipe, FormsModule],
  template: `
    <section class="hero">
      <h1>Past Meetings</h1>
      <p>Search the record of previous ZSSF meetings by name or date.</p>
    </section>

    <div class="wrap">
      <form class="filters" (ngSubmit)="search()">
        <label class="f f-q">Meeting name
          <input name="q" [(ngModel)]="q" placeholder="Search by meeting name..." />
        </label>
        <label class="f">From date
          <input type="date" name="from" [(ngModel)]="from" />
        </label>
        <label class="f">To date
          <input type="date" name="to" [(ngModel)]="to" />
        </label>
        <div class="f-actions">
          <button type="submit" class="btn btn-primary">Search</button>
          <button type="button" class="btn" (click)="clear()">Clear</button>
        </div>
      </form>

      @if (error()) { <div class="alert alert-err">{{ error() }}</div> }

      @if (!loading() && !error()) {
        <p class="count">
          @if (total() === 0) {
            No meetings found.
          } @else {
            Showing {{ first() }}-{{ last() }} of {{ total() }} meetings
          }
        </p>
      }
      @if (loading()) { <div class="empty">Loading...</div> }

      <div class="rows">
        @for (m of meetings(); track m.meetingId) {
          <article class="card">
            <div class="date">
              <span class="day">{{ m.meetingDate | date: 'd' }}</span>
              <span class="month">{{ m.meetingDate | date: 'MMM' }}</span>
              <span class="year">{{ m.meetingDate | date: 'yyyy' }}</span>
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
          </article>
        }
      </div>

      @if (totalPages() > 1) {
        <nav class="pager">
          <button type="button" class="btn" (click)="go(-1)" [disabled]="pageIndex() === 0">Previous</button>
          <span>Page {{ pageIndex() + 1 }} of {{ totalPages() }}</span>
          <button type="button" class="btn" (click)="go(1)" [disabled]="pageIndex() + 1 >= totalPages()">Next</button>
        </nav>
      }

      @if (!loading() && !error() && total() === 0) {
        <div class="empty">{{ applied() ? 'No meetings match your search.' : 'No past meetings to show yet.' }}</div>
      }

      <p class="note">Minutes and attendee lists are internal records and are not published here.</p>
    </div>
  `,
  styles: `
    .hero { background: linear-gradient(135deg, var(--navy-dark), var(--navy)); color: #fff; text-align: center; padding: 44px 20px; }
    .hero h1 { margin: 0 0 8px; font-size: 30px; }
    .hero p { margin: 0; opacity: .9; }
    .wrap { max-width: 900px; margin: 0 auto; padding: 28px 20px 12px; }

    .filters { display: flex; flex-wrap: wrap; gap: 12px; align-items: flex-end; background: #fff; border: 1px solid var(--border); border-radius: 14px; padding: 16px 18px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(16,24,40,.06); }
    .f { display: flex; flex-direction: column; gap: 5px; font-size: 13px; font-weight: 600; color: #374151; }
    .f-q { flex: 1; min-width: 220px; }
    .f input { padding: 10px; border: 1px solid #cfd6e0; border-radius: 8px; font-size: 14px; font-weight: 400; }
    .f input:focus { outline: 2px solid rgba(31,58,95,.25); border-color: var(--navy); }
    .f-actions { display: flex; gap: 8px; }
    .count { margin: 0 0 12px; font-size: 14px; color: var(--muted); }

    .rows { display: flex; flex-direction: column; gap: 14px; }
    .card { display: flex; align-items: flex-start; gap: 18px; background: #fff; border: 1px solid var(--border); border-radius: 14px; padding: 16px 20px; box-shadow: 0 1px 3px rgba(16,24,40,.06); }
    .date { width: 64px; flex-shrink: 0; text-align: center; background: #e8eef7; color: var(--navy-dark); border-radius: 12px; padding: 8px 0; }
    .day { display: block; font-size: 22px; font-weight: 700; line-height: 1.1; }
    .month { display: block; font-size: 12px; text-transform: uppercase; letter-spacing: .08em; }
    .year { display: block; font-size: 11px; opacity: .75; }

    .details { flex: 1; min-width: 0; margin: 0; }
    .row { display: grid; grid-template-columns: 84px 1fr; gap: 12px; padding: 4px 0; }
    dt { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: var(--muted); padding-top: 3px; }
    dd { margin: 0; color: #374151; line-height: 1.5; }
    .title { font-size: 17px; font-weight: 700; color: var(--navy); }
    .agenda { margin: 0; padding-left: 18px; line-height: 1.7; }
    .adesc { color: var(--muted); font-size: 13px; }

    .pager { display: flex; justify-content: center; align-items: center; gap: 16px; margin: 22px 0 6px; font-size: 14px; color: #374151; }
    .note { margin: 24px 0 0; font-size: 13px; color: var(--muted); text-align: center; }
    @media (max-width: 600px) { .card { flex-wrap: wrap; } .row { grid-template-columns: 1fr; gap: 0; } }
  `,
})
export class PublicPast implements OnInit {
  private http = inject(HttpClient);

  readonly size = 3;
  q = '';
  from = '';
  to = '';

  pageIndex = signal(0);
  result = signal<PastPage | null>(null);
  loading = signal(true);
  error = signal('');
  applied = signal(false);

  meetings = computed(() => this.result()?.items ?? []);
  total = computed(() => this.result()?.total ?? 0);
  totalPages = computed(() => this.result()?.totalPages ?? 0);
  first = computed(() => (this.total() === 0 ? 0 : this.pageIndex() * this.size + 1));
  last = computed(() => Math.min((this.pageIndex() + 1) * this.size, this.total()));

  ngOnInit() {
    this.load();
  }

  search() {
    if (this.from && this.to && this.from > this.to) {
      this.error.set("The 'From' date must be earlier than or equal to the 'To' date.");
      return;
    }
    this.pageIndex.set(0);
    this.load();
  }

  clear() {
    this.q = '';
    this.from = '';
    this.to = '';
    this.pageIndex.set(0);
    this.load();
  }

  go(step: number) {
    const next = this.pageIndex() + step;
    if (next < 0 || next >= this.totalPages()) return;
    this.pageIndex.set(next);
    this.load();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  load() {
    this.loading.set(true);
    this.error.set('');
    this.applied.set(!!(this.q.trim() || this.from || this.to));

    let params = new HttpParams().set('page', this.pageIndex()).set('size', this.size);
    if (this.q.trim()) params = params.set('q', this.q.trim());
    if (this.from) params = params.set('from', this.from);
    if (this.to) params = params.set('to', this.to);

    this.http.get<PastPage>(`${API_URL}/public/past-meetings`, { params }).subscribe({
      next: (data) => {
        this.result.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load meetings right now. Please try again later.');
        this.loading.set(false);
      },
    });
  }
}