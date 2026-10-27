import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AgendaService } from '../../core/agenda.service';
import { MinuteService } from '../../core/minute.service';
import { Agenda, Minute } from '../../core/models';
import { MeetingPicker } from '../../shared/meeting-picker';

interface MinuteForm {
  agendaId: number | null;
  discussion: string;
  decision: string;
}

interface AgendaForm {
  topic: string;
  description: string;
  agendaOrder: number;
}

const EMPTY: MinuteForm = { agendaId: null, discussion: '', decision: '' };

@Component({
  selector: 'app-minutes',
  imports: [FormsModule, MeetingPicker],
  template: `
    <div class="page-head">
      <div>
        <h1>Minutes</h1>
        <p class="page-sub">Discussions and decisions recorded for each agenda item.</p>
      </div>
      @if (meetingId() !== null) {
        <div class="head-actions">
          <button class="btn" (click)="openAgenda()">+ Add agenda</button>
          @if (agendas().length > 0) {
            <button class="btn btn-primary" (click)="openNew()">+ Record minutes</button>
          }
        </div>
      }
    </div>

    <app-meeting-picker (changed)="onMeeting($event)" />

    @if (meetingId() !== null && agendas().length === 0 && !loading()) {
      <div class="hint">
        <span><strong>This meeting has no agenda items yet.</strong> Add an agenda item first, then record its minutes.</span>
        <button class="btn btn-primary btn-sm" (click)="openAgenda()">+ Add agenda</button>
      </div>
    }

    @if (message()) { <div class="alert alert-ok">{{ message() }}</div> }
    @if (error()) { <div class="alert alert-err">{{ error() }}</div> }

    @if (showAgendaForm()) {
      <div class="panel">
        <h2>Add agenda item</h2>
        <div class="form-grid">
          <label class="field">Topic *
            <input [(ngModel)]="agendaForm.topic" name="agTopic" />
          </label>
          <label class="field">Order *
            <input type="number" min="1" [(ngModel)]="agendaForm.agendaOrder" name="agOrder" />
          </label>
          <label class="field wide">Description
            <textarea rows="2" [(ngModel)]="agendaForm.description" name="agDesc"></textarea>
          </label>
        </div>
        <div class="form-actions">
          <button class="btn btn-primary" (click)="saveAgenda()" [disabled]="savingAgenda()">
            {{ savingAgenda() ? 'Saving...' : 'Save agenda' }}
          </button>
          <button class="btn" (click)="showAgendaForm.set(false)">Cancel</button>
        </div>
      </div>
    }

    @if (showForm()) {
      <div class="panel">
        <h2>{{ editingId === null ? 'Record minutes' : 'Edit minutes' }}</h2>
        <div class="form-grid">
          <label class="field wide">Agenda item *
            <select [(ngModel)]="form.agendaId" name="agenda">
              <option [ngValue]="null" disabled>Select an agenda item</option>
              @for (a of agendas(); track a.agendaId) {
                <option [ngValue]="a.agendaId">{{ a.agendaOrder }}. {{ a.topic }}</option>
              }
            </select>
          </label>
          <label class="field wide">Discussion
            <textarea rows="4" [(ngModel)]="form.discussion" name="discussion"></textarea>
          </label>
          <label class="field wide">Decision
            <textarea rows="3" [(ngModel)]="form.decision" name="decision"></textarea>
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
                <th style="width: 22%">Agenda item</th>
                <th>Discussion</th>
                <th>Decision</th>
                <th style="width: 120px">Recorded by</th>
                <th style="width: 160px">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (m of rows(); track m.minuteId) {
                <tr>
                  <td>
                    <span class="badge">{{ orderOf(m.agenda.agendaId) }}</span>
                    {{ m.agenda.topic }}
                  </td>
                  <td class="cell-multiline">{{ m.discussion }}</td>
                  <td class="cell-multiline">{{ m.decision }}</td>
                  <td>{{ m.recordedBy?.fullName }}</td>
                  <td>
                    <div class="cell-actions">
                      <button class="btn btn-sm" (click)="openEdit(m)">Edit</button>
                      <button class="btn btn-sm btn-danger" (click)="remove(m)">Delete</button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="5" class="empty">No minutes recorded for this meeting yet.</td></tr>
              }
            </tbody>
          </table>
        }
      </div>
    }
  `,
  styles: `
    .head-actions { display: flex; gap: 8px; flex-wrap: wrap; }
    .hint { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;
      background: #fff8e6; color: #7a4b00; border: 1px solid #f3d9a4; padding: 12px 14px;
      border-radius: 10px; margin-bottom: 14px; font-size: 14px; }
  `,
})
export class Minutes {
  private minuteService = inject(MinuteService);
  private agendaService = inject(AgendaService);

  meetingId = signal<number | null>(null);
  agendas = signal<Agenda[]>([]);
  items = signal<Minute[]>([]);
  loading = signal(false);
  saving = signal(false);
  showForm = signal(false);
  showAgendaForm = signal(false);
  savingAgenda = signal(false);
  message = signal('');
  error = signal('');

  editingId: number | null = null;
  form: MinuteForm = { ...EMPTY };
  agendaForm: AgendaForm = { topic: '', description: '', agendaOrder: 1 };

  rows = computed(() =>
    [...this.items()].sort(
      (a, b) => this.orderOf(a.agenda.agendaId) - this.orderOf(b.agenda.agendaId)
    )
  );

  orderOf(agendaId: number): number {
    return this.agendas().find((a) => a.agendaId === agendaId)?.agendaOrder ?? 0;
  }

  onMeeting(id: number | null) {
    this.meetingId.set(id);
    this.showForm.set(false);
    this.showAgendaForm.set(false);
    this.message.set('');
    this.error.set('');
    this.agendas.set([]);
    this.items.set([]);
    if (id === null) return;

    this.loading.set(true);
    this.agendaService.byMeeting(id).subscribe({
      next: (data) => {
        this.agendas.set(data);
        this.loadMinutes();
      },
      error: () => {
        this.error.set('Could not load agendas.');
        this.loading.set(false);
      },
    });
  }

  loadMinutes() {
    const id = this.meetingId();
    if (id === null) return;
    this.loading.set(true);
    this.minuteService.byMeeting(id).subscribe({
      next: (data) => {
        this.items.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load minutes.');
        this.loading.set(false);
      },
    });
  }

  reloadAgendas() {
    const id = this.meetingId();
    if (id === null) return;
    this.agendaService.byMeeting(id).subscribe({
      next: (data) => this.agendas.set(data),
      error: () => this.error.set('Could not load agendas.'),
    });
  }

  openAgenda() {
    const next = Math.max(0, ...this.agendas().map((a) => a.agendaOrder)) + 1;
    this.agendaForm = { topic: '', description: '', agendaOrder: next };
    this.showForm.set(false);
    this.message.set('');
    this.error.set('');
    this.showAgendaForm.set(true);
  }

  saveAgenda() {
    this.error.set('');
    const meetingId = this.meetingId();
    if (meetingId === null) return;
    if (!this.agendaForm.topic.trim() || !this.agendaForm.agendaOrder || this.agendaForm.agendaOrder < 1) {
      this.error.set('Topic and a valid order number are required.');
      return;
    }
    const body: Agenda = {
      meeting: { meetingId },
      topic: this.agendaForm.topic.trim(),
      description: this.agendaForm.description.trim(),
      agendaOrder: this.agendaForm.agendaOrder,
    };

    this.savingAgenda.set(true);
    this.agendaService.create(body).subscribe({
      next: () => {
        this.savingAgenda.set(false);
        this.showAgendaForm.set(false);
        this.message.set('Agenda added. You can now record its minutes.');
        this.reloadAgendas();
      },
      error: (err) => {
        this.savingAgenda.set(false);
        this.error.set(`Could not save the agenda (status ${err.status}).`);
      },
    });
  }

  openNew() {
    this.editingId = null;
    this.form = { ...EMPTY };
    this.showAgendaForm.set(false);
    this.message.set('');
    this.error.set('');
    this.showForm.set(true);
  }

  openEdit(m: Minute) {
    this.editingId = m.minuteId ?? null;
    this.form = {
      agendaId: m.agenda.agendaId,
      discussion: m.discussion ?? '',
      decision: m.decision ?? '',
    };
    this.showAgendaForm.set(false);
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
    if (this.form.agendaId === null) {
      this.error.set('Select the agenda item these minutes belong to.');
      return;
    }
    const body: Minute = {
      meeting: { meetingId },
      agenda: { agendaId: this.form.agendaId },
      discussion: this.form.discussion.trim(),
      decision: this.form.decision.trim(),
    };

    this.saving.set(true);
    const request =
      this.editingId === null
        ? this.minuteService.create(body)
        : this.minuteService.update(this.editingId, body);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.showForm.set(false);
        this.message.set(this.editingId === null ? 'Minutes recorded.' : 'Minutes updated.');
        this.loadMinutes();
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(`Could not save the minutes (status ${err.status}).`);
      },
    });
  }

  remove(m: Minute) {
    if (!confirm('Delete these minutes?')) return;
    this.minuteService.delete(m.minuteId!).subscribe({
      next: () => {
        this.message.set('Minutes deleted.');
        this.loadMinutes();
      },
      error: (err) => this.error.set(`Could not delete the minutes (status ${err.status}).`),
    });
  }
}