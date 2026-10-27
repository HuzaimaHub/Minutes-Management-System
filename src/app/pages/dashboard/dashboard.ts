import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { API_URL } from '../../core/api.config';
import { AuthService } from '../../core/auth.service';
import { MeetingService } from '../../core/meeting.service';
import { Meeting } from '../../core/models';
import { Icon, IconName } from '../../shared/icon';

interface StatCard {
  icon: IconName;
  label: string;
  value: number;
  bg: string;
  fg: string;
  link: string;
  query?: Record<string, string>;
}

@Component({
  selector: 'app-dashboard',
  imports: [DatePipe, RouterLink, Icon],
  template: `
    <section class="hero">
      <div>
        <p class="hero-date">{{ now | date: 'fullDate' }}</p>
        <h1>{{ greeting }}, {{ firstName() }}</h1>
        @if (next(); as n) {
          <p class="hero-next">
            Next meeting: <strong>{{ n.title }}</strong> · {{ n.meetingDate }} at {{ n.startTime.slice(0, 5) }}
          </p>
        } @else if (!loading()) {
          <p class="hero-next">No upcoming meetings. Create one to get started.</p>
        }
      </div>
      <div class="hero-actions">
        <a class="hero-btn solid" routerLink="/meetings">+ New meeting</a>
        
      </div>
    </section>

    @if (error()) { <div class="alert alert-err">{{ error() }}</div> }

    <section class="stats">
      @for (s of stats(); track s.label) {
        <a class="stat" [routerLink]="s.link" [queryParams]="s.query">
          <div class="icon" [style.background]="s.bg" [style.color]="s.fg">
            <app-icon [name]="s.icon" [size]="24" />
          </div>
          <div class="stat-text">
            <span class="num">{{ s.value }}</span>
            <span class="lbl">{{ s.label }}</span>
          </div>
          <span class="go" aria-hidden="true">›</span>
        </a>
      }
    </section>

    <section class="cols">
      <div>
        <h2 class="section-title">Upcoming meetings</h2>
        <div class="table-wrap">
          @if (loading()) {
            <div class="empty">Loading...</div>
          } @else {
            <table>
              <thead>
                <tr><th>Title</th><th>Date</th><th>Time</th><th>Location</th><th>When</th></tr>
              </thead>
              <tbody>
                @for (m of nextSix(); track m.meetingId) {
                  <tr>
                    <td>{{ m.title }}</td>
                    <td>{{ m.meetingDate }}</td>
                    <td>{{ m.startTime.slice(0, 5) }}</td>
                    <td>{{ m.location }}</td>
                    <td><span class="when {{ whenClass(m.meetingDate) }}">{{ whenLabel(m.meetingDate) }}</span></td>
                  </tr>
                } @empty {
                  <tr><td colspan="5" class="empty">No upcoming meetings.</td></tr>
                }
              </tbody>
            </table>
          }
        </div>
      </div>

      <div>
        <h2 class="section-title">Recently held</h2>
        <div class="recent">
          @for (m of recent(); track m.meetingId) {
            <a class="recent-item" routerLink="/report"
               [queryParams]="{ meeting: m.meetingId, mode: 'minutes' }">
              <span class="recent-title">{{ m.title }}</span>
              <span class="recent-meta">{{ m.meetingDate }}@if (m.location) { · {{ m.location }} }</span>
            </a>
          } @empty {
            <div class="empty">No past meetings yet.</div>
          }
        </div>
      </div>
    </section>
  `,
  styles: `
    .hero { display: flex; justify-content: space-between; align-items: center; gap: 20px; flex-wrap: wrap;
      background: linear-gradient(135deg, var(--navy-dark), var(--navy)); color: #fff;
      border-radius: 16px; padding: 26px 30px; margin-bottom: 22px; box-shadow: 0 8px 22px rgba(0,0,0,.15); }
    .hero-date { margin: 0 0 4px; font-size: 13px; opacity: .8; }
    .hero h1 { margin: 0; font-size: 26px; }
    .hero-next { margin: 8px 0 0; font-size: 14px; opacity: .92; }
    .hero-actions { display: flex; gap: 10px; flex-wrap: wrap; }
    .hero-btn { padding: 10px 18px; border-radius: 999px; border: 1px solid rgba(255,255,255,.55); color: #fff;
      text-decoration: none; font-size: 14px; font-weight: 600; transition: background .15s; }
    .hero-btn:hover { background: rgba(255,255,255,.15); }
    .hero-btn.solid { background: #fff; color: var(--navy-dark); border-color: #fff; }
    .hero-btn.solid:hover { background: #eef3f0; }

    .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 26px; }
    @media (max-width: 700px) { .stats { grid-template-columns: repeat(2, 1fr); } }
    .stat { display: flex; align-items: center; gap: 14px; background: #fff; border: 1px solid var(--border);
      border-radius: 14px; padding: 16px 18px; box-shadow: 0 1px 3px rgba(16,24,40,.06);
      text-decoration: none; color: inherit; cursor: pointer;
      transition: transform .15s, box-shadow .15s, border-color .15s; }
    .stat:hover { transform: translateY(-2px); box-shadow: 0 8px 18px rgba(16,24,40,.12); border-color: var(--navy); }
    .icon { width: 46px; height: 46px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .stat-text { display: flex; flex-direction: column; }
    .num { font-size: 26px; font-weight: 700; color: var(--navy); line-height: 1.1; }
    .lbl { font-size: 13px; color: var(--muted); }
    .go { margin-left: auto; font-size: 26px; line-height: 1; color: var(--muted); }
    .stat:hover .go { color: var(--navy); }

    .cols { display: grid; grid-template-columns: 2fr 1fr; gap: 22px; align-items: start; }
    @media (max-width: 900px) { .cols { grid-template-columns: 1fr; } }
    .when { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; white-space: nowrap; }
    .when.today { background: #fff4e5; color: #b45309; }
    .when.soon { background: #e6f4ea; color: #1e6b34; }
    .when.later { background: #eef2f7; color: #374151; }

    .recent { background: #fff; border: 1px solid var(--border); border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(16,24,40,.06); }
    .recent-item { display: flex; flex-direction: column; gap: 2px; padding: 12px 16px; border-top: 1px solid var(--border);
      text-decoration: none; color: inherit; }
    .recent-item:first-child { border-top: 0; }
    .recent-item:hover { background: #f8fafc; }
    .recent-title { font-weight: 600; color: var(--navy); }
    .recent-meta { font-size: 13px; color: var(--muted); }
  `,
})
export class Dashboard implements OnInit {
  private http = inject(HttpClient);
  private meetingService = inject(MeetingService);
  private auth = inject(AuthService);

  now = new Date();
  today = this.now.toLocaleDateString('en-CA');
  greeting =
    this.now.getHours() < 12 ? 'Good morning' : this.now.getHours() < 18 ? 'Good afternoon' : 'Good evening';

  meetings = signal<Meeting[]>([]);
  agendaCount = signal(0);
  attendeeCount = signal(0);
  minuteCount = signal(0);
  loading = signal(true);
  error = signal('');

  firstName = computed(() => this.auth.user()?.fullName || 'Admin');

  upcoming = computed(() =>
    this.meetings()
      .filter((m) => m.meetingDate >= this.today)
      .sort(
        (a, b) =>
          a.meetingDate.localeCompare(b.meetingDate) || a.startTime.localeCompare(b.startTime)
      )
  );
  past = computed(() =>
    this.meetings()
      .filter((m) => m.meetingDate < this.today)
      .sort((a, b) => b.meetingDate.localeCompare(a.meetingDate))
  );
  next = computed(() => this.upcoming()[0] ?? null);
  nextSix = computed(() => this.upcoming().slice(0, 6));
  recent = computed(() => this.past().slice(0, 5));

  stats = computed<StatCard[]>(() => [
    { icon: 'calendar', label: 'Total meetings', value: this.meetings().length, bg: '#e8eef7', fg: '#1f3a5f', link: '/meetings' },
    { icon: 'clock', label: 'Upcoming', value: this.upcoming().length, bg: '#e6f4ea', fg: '#1e6b34', link: '/meetings', query: { when: 'upcoming' } },
    { icon: 'check-circle', label: 'Completed', value: this.past().length, bg: '#eaf0ff', fg: '#2757c4', link: '/meetings', query: { when: 'completed' } },
    { icon: 'file-text', label: 'Agenda items', value: this.agendaCount(), bg: '#fff4e5', fg: '#b45309', link: '/agendas' },
    { icon: 'users', label: 'Attendees', value: this.attendeeCount(), bg: '#f3e8ff', fg: '#7e22ce', link: '/attendees' },
    { icon: 'clipboard', label: 'Minutes recorded', value: this.minuteCount(), bg: '#e0f5f3', fg: '#0f766e', link: '/minutes' },
  ]);

  ngOnInit() {
    forkJoin({
      meetings: this.meetingService.getAll(),
      agendas: this.http.get<unknown[]>(`${API_URL}/agendas`),
      attendees: this.http.get<unknown[]>(`${API_URL}/attendees`),
      minutes: this.http.get<unknown[]>(`${API_URL}/minutes`),
    }).subscribe({
      next: (r) => {
        this.meetings.set(r.meetings);
        this.agendaCount.set(r.agendas.length);
        this.attendeeCount.set(r.attendees.length);
        this.minuteCount.set(r.minutes.length);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load the dashboard. Is the backend running?');
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
    if (n === 0) return 'Today';
    if (n === 1) return 'Tomorrow';
    return n > 0 ? `In ${n} days` : `${-n} days ago`;
  }

  whenClass(date: string): string {
    const n = this.daysUntil(date);
    return n === 0 ? 'today' : n > 0 && n <= 7 ? 'soon' : 'later';
  }
}