import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { ForgotPassword } from './pages/forgot-password/forgot-password';
import { ResetPassword } from './pages/reset-password/reset-password';
import { PublicLayout } from './pages/public-layout/public-layout';
import { PublicHome } from './pages/public-home/public-home';
import { PublicPast } from './pages/public-past/public-past';
import { PublicAbout } from './pages/public-about/public-about';
import { PublicContact } from './pages/public-contact/public-contact';
import { Dashboard } from './pages/dashboard/dashboard';
import { Meetings } from './pages/meetings/meetings';
import { Agendas } from './pages/agendas/agendas';
import { Attendees } from './pages/attendees/attendees';
import { Minutes } from './pages/minutes/minutes';
import { Report } from './pages/report/report';
import { Profile } from './pages/profile/profile';
import { Settings } from './pages/settings/settings';
import { MainLayout } from './layout/layout';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: 'public',
    component: PublicLayout,
    children: [
      { path: '', component: PublicHome, pathMatch: 'full' },
      { path: 'past-meetings', component: PublicPast, title: 'Past Meetings' },
      { path: 'about', component: PublicAbout, title: 'About Us' },
      { path: 'contact', component: PublicContact, title: 'Contact Us' },
    ],
  },
  { path: 'login', component: Login, title: 'Admin Login' },
  { path: 'forgot-password', component: ForgotPassword, title: 'Forgot Password' },
  { path: 'reset-password', component: ResetPassword, title: 'Reset Password' },

  // The bare address and the old public addresses lead to the public site
  { path: '', redirectTo: 'public', pathMatch: 'full' },
  { path: 'past-meetings', redirectTo: 'public/past-meetings' },
  { path: 'about', redirectTo: 'public/about' },
  { path: 'contact', redirectTo: 'public/contact' },

  {
    path: '',
    component: MainLayout,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: Dashboard, title: 'Dashboard' },
      { path: 'meetings', component: Meetings, title: 'Meetings' },
      { path: 'agendas', component: Agendas, title: 'Agendas' },
      { path: 'attendees', component: Attendees, title: 'Attendees' },
      { path: 'minutes', component: Minutes, title: 'Minutes' },
      { path: 'report', component: Report, title: 'Minutes Report' },
      { path: 'profile', component: Profile, title: 'My Profile' },
      { path: 'settings', component: Settings, title: 'System Settings' },
    ],
  },
  { path: '**', redirectTo: 'public' },
];