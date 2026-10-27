import { Component, OnInit, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MeetingService } from '../core/meeting.service';
import { Meeting } from '../core/models';

@Component({
  selector: 'app-meeting-picker',
  imports: [FormsModule],
  template: `
    <div class="toolbar">
      <label for="meetingSelect">Meeting</label>
      <select id="meetingSelect" [ngModel]="selectedId()" (ngModelChange)="choose($event)">
        @for (m of meetings(); track m.meetingId) {
          <option [ngValue]="m.meetingId">{{ m.meetingDate }} · {{ m.title }}</option>
        }
      </select>
    </div>
    @if (loaded() && meetings().length === 0) {
      <div class="alert alert-err">No meetings yet. Create a meeting on the Meetings page first.</div>
    }
  `,
})
export class MeetingPicker implements OnInit {
  private service = inject(MeetingService);

  initialId = input<number | null>(null);
  meetings = signal<Meeting[]>([]);
  selectedId = signal<number | null>(null);
  loaded = signal(false);
  changed = output<number | null>();

  ngOnInit() {
    this.service.getAll().subscribe({
      next: (data) => {
        this.meetings.set(data);
        this.loaded.set(true);
        const wanted = this.initialId();
        const exists = wanted !== null && data.some((m) => m.meetingId === wanted);
        this.choose(exists ? wanted : data.length ? data[0].meetingId! : null);
      },
      error: () => this.loaded.set(true),
    });
  }

  choose(id: number | null) {
    this.selectedId.set(id);
    this.changed.emit(id);
  }
}