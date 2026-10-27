import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AgendaService } from '../../core/agenda.service';
import { AttendeeService } from '../../core/attendee.service';
import { BrandService } from '../../core/brand.service';
import { MeetingService } from '../../core/meeting.service';
import { MinuteService } from '../../core/minute.service';
import { Agenda, Attendee, Meeting, Minute } from '../../core/models';
import { ZSSF } from '../../core/zssf-info';
import { MeetingPicker } from '../../shared/meeting-picker';

type Mode = 'minutes' | 'agenda' | 'attendees';

@Component({
  selector: 'app-report',
  imports: [MeetingPicker, NgTemplateOutlet],
  template: `
    <div class="no-print">
      <div class="page-head">
        <div>
          <h1>Print Reports</h1>
          <p class="page-sub">Print one document at a time: the full minutes, the agenda only, or the attendees only.</p>
        </div>
        @if (meeting()) {
          <button class="btn btn-primary" (click)="print()">Print</button>
        }
      </div>

      <app-meeting-picker [initialId]="initialMeeting" (changed)="onMeeting($event)" />

      <div class="tabs">
        @for (t of tabs; track t.value) {
          <button type="button" class="tab" [class.active]="mode() === t.value" (click)="mode.set(t.value)">
            {{ t.label }}
          </button>
        }
      </div>

      @if (error()) { <div class="alert alert-err">{{ error() }}</div> }
      @if (loading()) { <div class="empty">Loading...</div> }
    </div>

    <ng-template #attendeesTpl>
      <h3>Attendees</h3>
      <table class="grid">
        <thead>
          <tr><th style="width: 40px">No.</th><th>Full name</th><th>Institution</th><th>Position</th><th>Remarks</th></tr>
        </thead>
        <tbody>
          @for (a of attendees(); track a.attendeeId; let i = $index) {
            <tr>
              <td>{{ i + 1 }}</td>
              <td>{{ a.fullName }}</td>
              <td>{{ a.institution }}</td>
              <td>{{ a.position }}</td>
              <td>{{ a.comments }}</td>
            </tr>
          } @empty {
            <tr><td colspan="5">No attendees recorded.</td></tr>
          }
        </tbody>
      </table>
    </ng-template>

    @if (meeting(); as m) {
      <article class="sheet">
        <table class="frame">
          <thead><tr><td><div class="space"></div></td></tr></thead>
          <tbody>
            <tr>
              <td>
                <header class="letterhead">
                  <div class="lh-logo">
                    @if (!logoMissing()) {
                      <img [src]="brand.logoSrc()" alt="ZSSF logo" (error)="logoMissing.set(true)" />
                    } @else {
                      <span>ZSSF</span>
                    }
                  </div>
                  <div class="lh-text">
                    <div class="lh-name">{{ zssf.name }}</div>
                    <div class="lh-sw">{{ zssf.nameSw }}</div>
                    <div class="lh-sys">Meeting Minutes Management System</div>
                  </div>
                </header>

                <div class="doc-title">{{ docTitle() }}</div>
                <h2 class="meeting-title">{{ m.title }}</h2>

                <table class="info">
                  <tr><th>Date</th><td>{{ m.meetingDate }}</td></tr>
                  <tr>
                    <th>Time</th>
                    <td>{{ m.startTime.slice(0, 5) }}{{ m.endTime ? ' - ' + m.endTime.slice(0, 5) : '' }}</td>
                  </tr>
                  <tr><th>Venue</th><td>{{ m.location }}</td></tr>
                  <tr><th>Purpose</th><td>{{ m.purpose }}</td></tr>
                </table>

                @switch (mode()) {
                  @case ('agenda') {
                    <h3>Agenda</h3>
                    @for (row of rows(); track row.agenda.agendaId) {
                      <div class="agenda-block">
                        <h4>{{ row.agenda.agendaOrder }}. {{ row.agenda.topic }}</h4>
                        @if (row.agenda.description) {
                          <p class="desc">{{ row.agenda.description }}</p>
                        }
                      </div>
                    } @empty {
                      <p class="muted">No agenda items.</p>
                    }
                  }

                  @case ('attendees') {
                    <ng-container [ngTemplateOutlet]="attendeesTpl" />
                  }

                  @default {
                    <ng-container [ngTemplateOutlet]="attendeesTpl" />

                    <h3>Agenda, Discussion and Decisions</h3>
                    @for (row of rows(); track row.agenda.agendaId) {
                      <div class="agenda-block">
                        <h4>{{ row.agenda.agendaOrder }}. {{ row.agenda.topic }}</h4>
                        @if (row.agenda.description) {
                          <p class="desc">{{ row.agenda.description }}</p>
                        }
                        @for (mn of row.minutes; track mn.minuteId) {
                          <div class="label">Discussion</div>
                          <p class="text">{{ mn.discussion || '-' }}</p>
                          <div class="label">Decision</div>
                          <p class="text">{{ mn.decision || '-' }}</p>
                        } @empty {
                          <p class="text muted">No minutes recorded for this item.</p>
                        }
                      </div>
                    } @empty {
                      <p class="muted">No agenda items.</p>
                    }

                    <div class="signatures">
                      <div><div class="line"></div>Chairperson</div>
                      <div><div class="line"></div>Secretary</div>
                    </div>
                    <p class="recorded">Recorded by: {{ recorders().join(', ') || '-' }}</p>
                  }
                }

                <footer class="doc-foot">
                  <span>{{ zssf.name }} (ZSSF) · Meeting Minutes Management System</span>
                  <span>Printed on {{ printedOn }}</span>
                </footer>
              </td>
            </tr>
          </tbody>
          <tfoot><tr><td><div class="space"></div></td></tr></tfoot>
        </table>
      </article>
    }
  `,
  styles: `
    .tabs { display: flex; gap: 8px; margin-bottom: 18px; flex-wrap: wrap; }
    .tab { padding: 8px 16px; border: 1px solid var(--border); border-radius: 999px; background: #fff; cursor: pointer; font-size: 14px; font-weight: 600; color: #374151; }
    .tab.active { background: var(--navy); border-color: var(--navy); color: #fff; }

    .sheet { background: #fff; max-width: 820px; margin: 0 auto; padding: 24px 44px; border: 1px solid var(--border); border-radius: 12px; box-shadow: 0 1px 3px rgba(16,24,40,.06); }
    .frame { width: 100%; border-collapse: collapse; }
    .frame > thead > tr > td, .frame > tbody > tr > td, .frame > tfoot > tr > td { padding: 0; border: 0; }
    .space { height: 0; }

    .letterhead { display: flex; align-items: center; gap: 16px; padding-bottom: 14px; margin-bottom: 18px; border-bottom: 3px solid var(--navy); }
    .lh-logo { width: 76px; height: 76px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-weight: 800; color: var(--navy); }
    .lh-logo img { width: 100%; height: 100%; object-fit: contain; }
    .lh-name { font-size: 20px; font-weight: 800; color: var(--navy); line-height: 1.2; }
    .lh-sw { font-size: 13px; color: #374151; margin-top: 2px; }
    .lh-sys { font-size: 12px; color: var(--muted); margin-top: 2px; letter-spacing: .04em; }

    .doc-title { text-align: center; letter-spacing: .15em; font-size: 13px; color: var(--muted); }
    .meeting-title { text-align: center; margin: 6px 0 22px; font-size: 24px; color: var(--navy); }
    h3 { margin: 26px 0 10px; font-size: 16px; color: var(--navy); border-bottom: 2px solid var(--navy); padding-bottom: 4px; }
    h4 { margin: 0 0 4px; font-size: 15px; }
    .info { width: 100%; border-collapse: collapse; }
    .info th { text-align: left; width: 110px; padding: 6px 0; color: var(--muted); font-weight: 600; vertical-align: top; }
    .info td { padding: 6px 0; }
    .grid { width: 100%; border-collapse: collapse; font-size: 14px; }
    .grid th, .grid td { border: 1px solid #b8c0cc; padding: 7px 9px; text-align: left; }
    .grid th { background: #eef2f7; }
    .agenda-block { margin-bottom: 18px; break-inside: avoid; }
    .desc { margin: 0 0 8px; color: var(--muted); font-size: 14px; }
    .label { font-size: 12px; text-transform: uppercase; letter-spacing: .04em; color: var(--muted); margin-top: 8px; }
    .text { margin: 2px 0 0; white-space: pre-wrap; }
    .muted { color: var(--muted); }
    .signatures { display: flex; justify-content: space-between; gap: 40px; margin-top: 56px; break-inside: avoid; }
    .signatures > div { flex: 1; text-align: center; font-size: 14px; }
    .line { border-top: 1px solid #333; margin-bottom: 6px; }
    .recorded { margin: 18px 0 0; font-size: 12px; color: var(--muted); text-align: center; }
    .doc-foot { margin-top: 30px; padding-top: 10px; border-top: 1px solid #b8c0cc; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 6px; font-size: 11px; color: var(--muted); }

    @media print {
      .sheet { border: 0; border-radius: 0; box-shadow: none; padding: 0 16mm; max-width: none; margin: 0;
        -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .space { height: 14mm; }
    }
  `,
})
export class Report {
  private meetingService = inject(MeetingService);
  private agendaService = inject(AgendaService);
  private attendeeService = inject(AttendeeService);
  private minuteService = inject(MinuteService);
  private query = inject(ActivatedRoute).snapshot.queryParamMap;

  brand = inject(BrandService);
  zssf = ZSSF;
  logoMissing = signal(false);

  tabs: { value: Mode; label: string }[] = [
    { value: 'minutes', label: 'Full minutes' },
    { value: 'agenda', label: 'Agenda only' },
    { value: 'attendees', label: 'Attendees only' },
  ];

  initialMeeting: number | null = this.query.get('meeting') ? Number(this.query.get('meeting')) : null;
  private autoPrint = this.query.get('print') === '1';

  mode = signal<Mode>(this.initialMode());
  meeting = signal<Meeting | null>(null);
  agendas = signal<Agenda[]>([]);
  attendees = signal<Attendee[]>([]);
  minutes = signal<Minute[]>([]);
  loading = signal(false);
  error = signal('');
  printedOn = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  docTitle = computed(() =>
    this.mode() === 'minutes'
      ? 'MEETING MINUTES'
      : this.mode() === 'agenda'
        ? 'MEETING AGENDA'
        : 'LIST OF ATTENDEES'
  );

  rows = computed(() =>
    this.agendas().map((agenda) => ({
      agenda,
      minutes: this.minutes().filter((m) => m.agenda.agendaId === agenda.agendaId),
    }))
  );

  recorders = computed(() => [
    ...new Set(
      this.minutes()
        .map((m) => m.recordedBy?.fullName)
        .filter((n): n is string => !!n)
    ),
  ]);

  private initialMode(): Mode {
    const value = this.query.get('mode');
    return value === 'agenda' || value === 'attendees' ? value : 'minutes';
  }

  onMeeting(id: number | null) {
    this.error.set('');
    if (id === null) {
      this.meeting.set(null);
      return;
    }
    this.loading.set(true);
    forkJoin({
      meeting: this.meetingService.getById(id),
      agendas: this.agendaService.byMeeting(id),
      attendees: this.attendeeService.byMeeting(id),
      minutes: this.minuteService.byMeeting(id),
    }).subscribe({
      next: (r) => {
        this.meeting.set(r.meeting);
        this.agendas.set(r.agendas);
        this.attendees.set(r.attendees);
        this.minutes.set(r.minutes);
        this.loading.set(false);
        if (this.autoPrint) {
          this.autoPrint = false;
          setTimeout(() => window.print(), 700);
        }
      },
      error: () => {
        this.error.set('Could not load the meeting details.');
        this.loading.set(false);
      },
    });
  }

  print() {
    window.print();
  }
}