import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from './api.config';
import { Minute } from './models';

@Injectable({ providedIn: 'root' })
export class MinuteService {
  private http = inject(HttpClient);
  private url = `${API_URL}/minutes`;

  byMeeting(meetingId: number) {
    return this.http.get<Minute[]>(this.url, { params: { meetingId } });
  }
  create(minute: Minute) {
    return this.http.post<Minute>(this.url, minute);
  }
  update(id: number, minute: Minute) {
    return this.http.put<Minute>(`${this.url}/${id}`, minute);
  }
  delete(id: number) {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}