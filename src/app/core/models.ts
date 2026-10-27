export interface LoginResponse {
  token: string;
  fullName: string;
  email: string;
  role: string;
}

export interface Admin {
  adminId: number;
  fullName: string;
  email: string;
  role: string;
  gender?: string;
}

export interface Meeting {
  meetingId?: number;
  title: string;
  purpose?: string;
  meetingDate: string;
  startTime: string;
  endTime?: string;
  location?: string;
  createdBy?: { adminId: number; fullName?: string };
  showAgendaPublic?: boolean;
}

export interface Agenda {
  agendaId?: number;
  meeting: { meetingId: number; title?: string };
  topic: string;
  description?: string;
  agendaOrder: number;
}

export interface Attendee {
  attendeeId?: number;
  meeting: { meetingId: number; title?: string };
  fullName: string;
  comments?: string;
  institution?: string;
  position?: string;
}

export interface Minute {
  minuteId?: number;
  meeting: { meetingId: number; title?: string };
  agenda: { agendaId: number; topic?: string };
  discussion?: string;
  decision?: string;
  recordedBy?: { adminId: number; fullName?: string };
}