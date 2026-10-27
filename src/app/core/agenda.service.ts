import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from './api.config';
import { Agenda } from './models';

@Injectable({ providedIn: 'root' })
export class AgendaService {
  private http = inject(HttpClient);
  private url = `${API_URL}/agendas`;

  byMeeting(meetingId: number) {
    return this.http.get<Agenda[]>(this.url, { params: { meetingId } });
  }
  create(agenda: Agenda) {
    return this.http.post<Agenda>(this.url, agenda);
  }
  update(id: number, agenda: Agenda) {
    return this.http.put<Agenda>(`${this.url}/${id}`, agenda);
  }
  delete(id: number) {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}