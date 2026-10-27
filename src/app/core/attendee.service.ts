import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from './api.config';
import { Attendee } from './models';

@Injectable({ providedIn: 'root' })
export class AttendeeService {
  private http = inject(HttpClient);
  private url = `${API_URL}/attendees`;

  byMeeting(meetingId: number) {
    return this.http.get<Attendee[]>(this.url, { params: { meetingId } });
  }
  create(attendee: Attendee) {
    return this.http.post<Attendee>(this.url, attendee);
  }
  update(id: number, attendee: Attendee) {
    return this.http.put<Attendee>(`${this.url}/${id}`, attendee);
  }
  delete(id: number) {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}