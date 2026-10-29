import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AttendeeService } from '../../core/attendee.service';
import { Attendee } from '../../core/models';
import { MeetingPicker } from '../../shared/meeting-picker';

interface AttendeeForm {
  fullName: string;
  institution: string;
  position: string;
  comments: string;
}

const EMPTY: AttendeeForm = { fullName: '', institution: '', position: '', comments: '' };

@Component({
  selector: 'app-attendees',
  imports: [FormsModule, MeetingPicker, RouterLink],
  template: `
    <div class="page-head">
      <div>
        <h1>Attendees</h1>
        <p class="page-sub">People who attended each meeting.</p>
      </div>
      @if (meetingId() !== null) {
        <div style="display: flex; gap: 8px">
          <a class="btn" style="text-decoration: none"
             routerLink="/report"
             [queryParams]="{ meeting: meetingId(), mode: 'attendees', print: 1 }">Print</a>
          <button class="btn btn-primary" (click)="openNew()">+ Add attendee</button>
        </div>
      }
    </div>

    <app-meeting-picker (changed)="onMeeting($event)" />

    @if (message()) { <div class="alert alert-ok">{{ message() }}</div> }
    @if (error()) { <div class="alert alert-err">{{ error() }}</div> }

    @if (showForm()) {
      <div class="panel">
        <h2>{{ editingId === null ? 'Add attendee' : 'Edit attendee' }}</h2>
        <div class="form-grid">
          <label class="field">Full name *
            <input [(ngModel)]="form.fullName" name="fullName" />
          </label>
          <label class="field">Institution
            <input [(ngModel)]="form.institution" name="institution" />
          </label>
          <label class="field">Position
            <input [(ngModel)]="form.position" name="position" />
          </label>
          <label class="field wide">Comments
            <textarea rows="2" [(ngModel)]="form.comments" name="comments"></textarea>
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

    @if (meetingId() !== null) {
      @if (!loading()) {
        <p style="margin: 0 0 10px; color: var(--muted)">
          Total attendees: <strong>{{ items().length }}</strong>
        </p>
      }
      <div class="table-wrap">
        @if (loading()) {
          <div class="empty">Loading...</div>
        } @else {
          <table>
            <thead>
              <tr>
                <th style="width: 60px">No.</th>
                <th>Full name</th>
                <th>Institution</th>
                <th>Position</th>
                <th>Comments</th>
                <th style="width: 160px">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (a of items(); track a.attendeeId; let i = $index) {
                <tr>
                  <td><span class="badge">{{ i + 1 }}</span></td>
                  <td>{{ a.fullName }}</td>
                  <td>{{ a.institution }}</td>
                  <td>{{ a.position }}</td>
                  <td class="cell-multiline">{{ a.comments }}</td>
                  <td>
                    <div class="cell-actions">
                      <button class="btn btn-sm" (click)="openEdit(a)">Edit</button>
                      <button class="btn btn-sm btn-danger" (click)="remove(a)">Delete</button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="6" class="empty">No attendees for this meeting yet.</td></tr>
              }
            </tbody>
          </table>
        }
      </div>
    }
  `,
})
export class Attendees {
  private service = inject(AttendeeService);

  meetingId = signal<number | null>(null);
  items = signal<Attendee[]>([]);
  loading = signal(false);
  saving = signal(false);
  showForm = signal(false);
  message = signal('');
  error = signal('');

  editingId: number | null = null;
  form: AttendeeForm = { ...EMPTY };

  onMeeting(id: number | null) {
    this.meetingId.set(id);
    this.showForm.set(false);
    this.message.set('');
    this.error.set('');
    this.load();
  }

  load() {
    const id = this.meetingId();
    if (id === null) {
      this.items.set([]);
      return;
    }
    this.loading.set(true);
    this.service.byMeeting(id).subscribe({
      next: (data) => {
        this.items.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load attendees.');
        this.loading.set(false);
      },
    });
  }

  openNew() {
    this.editingId = null;
    this.form = { ...EMPTY };
    this.message.set('');
    this.error.set('');
    this.showForm.set(true);
  }

  openEdit(a: Attendee) {
    this.editingId = a.attendeeId ?? null;
    this.form = {
      fullName: a.fullName,
      institution: a.institution ?? '',
      position: a.position ?? '',
      comments: a.comments ?? '',
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
    const meetingId = this.meetingId();
    if (meetingId === null) return;
    if (!this.form.fullName.trim()) {
      this.error.set('Full name is required.');
      return;
    }
    const body: Attendee = {
      meeting: { meetingId },
      fullName: this.form.fullName.trim(),
      institution: this.form.institution.trim(),
      position: this.form.position.trim(),
      comments: this.form.comments.trim(),
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
        this.message.set(this.editingId === null ? 'Attendee added.' : 'Attendee updated.');
        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(`Could not save the attendee (status ${err.status}).`);
      },
    });
  }

  remove(a: Attendee) {
    if (!confirm(`Remove "${a.fullName}" from this meeting?`)) return;
    this.service.delete(a.attendeeId!).subscribe({
      next: () => {
        this.message.set('Attendee removed.');
        this.load();
      },
      error: (err) => this.error.set(`Could not remove the attendee (status ${err.status}).`),
    });
  }
}