import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MeetingService } from '../../core/meeting.service';
import { Meeting } from '../../core/models';

type When = 'all' | 'upcoming' | 'completed';

interface MeetingForm {
  title: string;
  purpose: string;
  meetingDate: string;
  startTime: string;
  endTime: string;
  location: string;
}

const EMPTY: MeetingForm = {
  title: '', purpose: '', meetingDate: '', startTime: '', endTime: '', location: '',
};

@Component({
  selector: 'app-meetings',
  imports: [FormsModule],
  template: `
    <div class="page-head">
      <div>
        <h1>Meetings</h1>
        <p class="page-sub">Create and manage ZSSF meetings.</p>
      </div>
      <button class="btn btn-primary" (click)="openNew()">+ New meeting</button>
    </div>

    @if (message()) { <div class="alert alert-ok">{{ message() }}</div> }
    @if (error()) { <div class="alert alert-err">{{ error() }}</div> }

    @if (showForm()) {
      <div class="panel">
        <h2>{{ editingId === null ? 'New meeting' : 'Edit meeting' }}</h2>
        <div class="form-grid">
          <label class="field">Title (name of the meeting) *
            <input [(ngModel)]="form.title" name="title" placeholder="e.g. ICT Steering Committee Meeting" />
          </label>
          <label class="field">Location
            <input [(ngModel)]="form.location" name="location" />
          </label>
          <label class="field">Date *
            <input type="date" [(ngModel)]="form.meetingDate" name="date" />
          </label>
          <label class="field">Start time *
            <input type="time" [(ngModel)]="form.startTime" name="start" />
          </label>
          <label class="field">End time
            <input type="time" [(ngModel)]="form.endTime" name="end" />
          </label>
          <label class="field wide">Purpose
            <textarea rows="2" [(ngModel)]="form.purpose" name="purpose"
                      placeholder="One line explaining why the meeting is held"></textarea>
          </label>
        </div>
        <div class="form-actions">
          <button class="btn btn-primary" (click)="save()" [disabled]="saving()">
            {{ saving() ? 'Saving...' : 'Save' }}
          </button>
          <button class="btn" (click)="cancel()">Cancel</button>
        </div>
      </div>
    }

    <div class="tabs">
      @for (t of tabs; track t.value) {
        <button type="button" class="tab" [class.active]="when() === t.value" (click)="when.set(t.value)">
          {{ t.label }}
        </button>
      }
    </div>

    <div class="toolbar">
      <input class="search-input" [(ngModel)]="search" name="search"
             placeholder="Search by title..." (keyup.enter)="load()" />
      <button class="btn" (click)="load()">Search</button>
      <button class="btn" (click)="clearSearch()">Clear</button>
    </div>

    <div class="table-wrap">
      @if (loading()) {
        <div class="empty">Loading...</div>
      } @else {
        <table>
          <thead>
            <tr>
              <th>Title</th><th>Purpose</th><th>Date</th><th>Time</th><th>Location</th>
              <th style="width: 160px">Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (m of visible(); track m.meetingId) {
              <tr>
                <td>{{ m.title }}</td>
                <td class="purpose-cell">{{ m.purpose }}</td>
                <td>{{ m.meetingDate }}</td>
                <td>{{ m.startTime.slice(0, 5) }}{{ m.endTime ? ' - ' + m.endTime.slice(0, 5) : '' }}</td>
                <td>{{ m.location }}</td>
                <td>
                  <div class="cell-actions">
                    <button class="btn btn-sm" (click)="openEdit(m)">Edit</button>
                    <button class="btn btn-sm btn-danger" (click)="remove(m)">Delete</button>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="6" class="empty">No meetings found.</td></tr>
            }
          </tbody>
        </table>
      }
    </div>
  `,
  styles: `
    .search-input { flex: 1; min-width: 220px; padding: 9px 10px; border: 1px solid #cfd6e0; border-radius: 8px; font-size: 14px; }
    .purpose-cell { max-width: 280px; color: #4b5563; font-size: 14px; }
    .tabs { display: flex; gap: 8px; margin-bottom: 14px; flex-wrap: wrap; }
    .tab { padding: 8px 16px; border: 1px solid var(--border); border-radius: 999px; background: #fff; cursor: pointer; font-size: 14px; font-weight: 600; color: #374151; }
    .tab.active { background: var(--navy); border-color: var(--navy); color: #fff; }
  `,
})
export class Meetings implements OnInit {
  private service = inject(MeetingService);
  private route = inject(ActivatedRoute);

  today = new Date().toLocaleDateString('en-CA');
  tabs: { value: When; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'completed', label: 'Completed' },
  ];
  when = signal<When>(this.initialWhen());

  meetings = signal<Meeting[]>([]);
  visible = computed(() => {
    const w = this.when();
    return this.meetings().filter((m) =>
      w === 'all' ? true : w === 'upcoming' ? m.meetingDate >= this.today : m.meetingDate < this.today
    );
  });

  loading = signal(true);
  saving = signal(false);
  showForm = signal(false);
  message = signal('');
  error = signal('');

  search = '';
  editingId: number | null = null;
  form: MeetingForm = { ...EMPTY };

  private initialWhen(): When {
    const value = this.route.snapshot.queryParamMap.get('when');
    return value === 'upcoming' || value === 'completed' ? value : 'all';
  }

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    const term = this.search.trim();
    const request = term ? this.service.search(term) : this.service.getAll();
    request.subscribe({
      next: (data) => {
        this.meetings.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load meetings.');
        this.loading.set(false);
      },
    });
  }

  clearSearch() {
    this.search = '';
    this.load();
  }

  openNew() {
    this.editingId = null;
    this.form = { ...EMPTY };
    this.message.set('');
    this.error.set('');
    this.showForm.set(true);
  }

  openEdit(m: Meeting) {
    this.editingId = m.meetingId ?? null;
    this.form = {
      title: m.title,
      purpose: m.purpose ?? '',
      meetingDate: m.meetingDate,
      startTime: m.startTime.slice(0, 5),
      endTime: m.endTime ? m.endTime.slice(0, 5) : '',
      location: m.location ?? '',
    };
    this.message.set('');
    this.error.set('');
    this.showForm.set(true);
  }

  cancel() {
    this.showForm.set(false);
  }

  save() {
    this.error.set('');
    if (!this.form.title.trim() || !this.form.meetingDate || !this.form.startTime) {
      this.error.set('Title, date and start time are required.');
      return;
    }
    const body: Meeting = {
      title: this.form.title.trim(),
      purpose: this.form.purpose.trim(),
      meetingDate: this.form.meetingDate,
      startTime: this.form.startTime,
      endTime: this.form.endTime || undefined,
      location: this.form.location.trim(),
    };

    this.saving.set(true);
    const request =
      this.editingId === null
        ? this.service.create(body)
        : this.service.update(this.editingId, body);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.showForm.set(false);
        this.message.set(this.editingId === null ? 'Meeting added.' : 'Meeting updated.');
        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(`Could not save the meeting (status ${err.status}).`);
      },
    });
  }

  remove(m: Meeting) {
    if (!confirm(`Delete "${m.title}"? This also deletes its agendas, attendees and minutes.`)) {
      return;
    }
    this.service.delete(m.meetingId!).subscribe({
      next: () => {
        this.message.set('Meeting deleted.');
        this.load();
      },
      error: (err) => this.error.set(`Could not delete the meeting (status ${err.status}).`),
    });
  }
}