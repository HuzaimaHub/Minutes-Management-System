import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from './api.config';
import { Meeting } from './models';

@Injectable({ providedIn: 'root' })
export class MeetingService {
  private http = inject(HttpClient);
  private url = `${API_URL}/meetings`;

  getAll() {
    return this.http.get<Meeting[]>(this.url);
  }

  getById(id: number) {
    return this.http.get<Meeting>(`${this.url}/${id}`);
  }

  search(title: string) {
    return this.http.get<Meeting[]>(`${this.url}/search`, { params: { title } });
  }

  create(meeting: Meeting) {
    return this.http.post<Meeting>(this.url, meeting);
  }

  update(id: number, meeting: Meeting) {
    return this.http.put<Meeting>(`${this.url}/${id}`, meeting);
  }

  delete(id: number) {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}