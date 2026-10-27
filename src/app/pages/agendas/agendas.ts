import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AgendaService } from '../../core/agenda.service';
import { Agenda } from '../../core/models';
import { MeetingPicker } from '../../shared/meeting-picker';

interface AgendaForm {
  topic: string;
  description: string;
  agendaOrder: number;
}

@Component({
  selector: 'app-agendas',
    imports: [FormsModule, MeetingPicker, RouterLink],
  template: `
    <div class="page-head">
      <div>
        <h1>Agendas</h1>
        <p class="page-sub">Topics to be discussed in each meeting.</p>
      </div>
            @if (meetingId() !== null) {
        <div style="display: flex; gap: 8px">
          <a class="btn" style="text-decoration: none"
             routerLink="/report" [queryParams]="{ meeting: meetingId(), mode: 'agenda', print: 1 }">Print</a>
          <button class="btn btn-primary" (click)="openNew()">+ Add agenda</button>
        </div>
      }
    </div>

    <app-meeting-picker (changed)="onMeeting($event)" />

    @if (message()) { <div class="alert alert-ok">{{ message() }}</div> }
    @if (error()) { <div class="alert alert-err">{{ error() }}</div> }

    @if (showForm()) {
      <div class="panel">
        <h2>{{ editingId === null ? 'Add agenda' : 'Edit agenda' }}</h2>
        <div class="form-grid">
          <label class="field">Topic *
            <input [(ngModel)]="form.topic" name="topic" />
          </label>
          <label class="field">Order *
            <input type="number" min="1" [(ngModel)]="form.agendaOrder" name="order" />
          </label>
          <label class="field wide">Description
            <textarea rows="3" [(ngModel)]="form.description" name="description"></textarea>
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
      <div class="table-wrap">
        @if (loading()) {
          <div class="empty">Loading...</div>
        } @else {
          <table>
            <thead>
              <tr>
                <th style="width: 80px">Order</th>
                <th>Topic</th>
                <th>Description</th>
                <th style="width: 160px">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (a of items(); track a.agendaId) {
                <tr>
                  <td><span class="badge">{{ a.agendaOrder }}</span></td>
                  <td>{{ a.topic }}</td>
                  <td class="cell-multiline">{{ a.description }}</td>
                  <td>
                    <div class="cell-actions">
                      <button class="btn btn-sm" (click)="openEdit(a)">Edit</button>
                      <button class="btn btn-sm btn-danger" (click)="remove(a)">Delete</button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="4" class="empty">No agendas for this meeting yet.</td></tr>
              }
            </tbody>
          </table>
        }
      </div>
    }
  `,
})
export class Agendas {
  private service = inject(AgendaService);

  meetingId = signal<number | null>(null);
  items = signal<Agenda[]>([]);
  loading = signal(false);
  saving = signal(false);
  showForm = signal(false);
  message = signal('');
  error = signal('');

  editingId: number | null = null;
  form: AgendaForm = { topic: '', description: '', agendaOrder: 1 };

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
        this.error.set('Could not load agendas.');
        this.loading.set(false);
      },
    });
  }

  openNew() {
    const next = Math.max(0, ...this.items().map((a) => a.agendaOrder)) + 1;
    this.editingId = null;
    this.form = { topic: '', description: '', agendaOrder: next };
    this.message.set('');
    this.error.set('');
    this.showForm.set(true);
  }

  openEdit(a: Agenda) {
    this.editingId = a.agendaId ?? null;
    this.form = {
      topic: a.topic,
      description: a.description ?? '',
      agendaOrder: a.agendaOrder,
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
    if (!this.form.topic.trim() || !this.form.agendaOrder || this.form.agendaOrder < 1) {
      this.error.set('Topic and a valid order number are required.');
      return;
    }
    const body: Agenda = {
      meeting: { meetingId },
      topic: this.form.topic.trim(),
      description: this.form.description.trim(),
      agendaOrder: this.form.agendaOrder,
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
        this.message.set(this.editingId === null ? 'Agenda added.' : 'Agenda updated.');
        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(`Could not save the agenda (status ${err.status}).`);
      },
    });
  }

  remove(a: Agenda) {
    if (!confirm(`Delete agenda "${a.topic}"? Its minutes will also be deleted.`)) return;
    this.service.delete(a.agendaId!).subscribe({
      next: () => {
        this.message.set('Agenda deleted.');
        this.load();
      },
      error: (err) => this.error.set(`Could not delete the agenda (status ${err.status}).`),
    });
  }
}