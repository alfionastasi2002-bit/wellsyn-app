import {
  Apple,
  Bell,
  CalendarDays,
  ChartNoAxesColumn,
  ClipboardList,
  Dumbbell,
  House,
  MessageSquareText,
  Settings,
  UserRound,
  Users,
  Utensils,
} from 'lucide-react';
import { localized } from './i18n/index.js';

// Voci del menu laterale per ciascun ruolo.
// "page" è la pagina da mostrare (vedi App.jsx); "badge" collega un contatore del menu.
// "tab" = nome breve per la barra in basso dei telefoni: lì compaiono solo le voci che ce l'hanno (al massimo 4).
const item = (path, label, icon, page, badge, tab) => Object.assign(localized(tab ? { label, tab } : { label }), { path, icon, page, badge });
const settings = item('impostazioni', 'Profilo e impostazioni', Settings, 'settings');
const agenda = item('agenda', 'Agenda', CalendarDays, 'agenda');
const agendaTab = item('agenda', 'Agenda', CalendarDays, 'agenda', null, 'Agenda');

export const NAVIGATION = {
  client: [
    item('', 'Dashboard', House, 'dashboard', null, 'Home'),
    item('alimentazione', 'La mia alimentazione', Utensils, 'clientNutrition', null, 'Dieta'),
    item('allenamenti', 'I miei allenamenti', Dumbbell, 'clientWorkouts', null, 'Allenamenti'),
    item('progressi', 'Progressi', ChartNoAxesColumn, 'clientProgress', null, 'Progressi'),
    agenda,
    item('controlli', 'Controlli', ClipboardList, 'clientChecks'),
    item('professionisti', 'Professionisti', UserRound, 'team', 'pendingRequests'),
    item('notifiche', 'Notifiche', Bell, 'messages', 'unreadMessages'),
    settings,
  ],
  nutritionist: [
    item('', 'Dashboard', House, 'dashboard', null, 'Home'),
    item('clienti', 'Clienti', Users, 'clients', null, 'Clienti'),
    item('piani-alimentari', 'Piani alimentari', Utensils, 'mealPlans', null, 'Piani'),
    agendaTab,
    item('controlli', 'Controlli', ClipboardList, 'checkins'),
    item('progressi', 'Progressi', ChartNoAxesColumn, 'proProgress'),
    item('attivita-fisica', 'Attività fisica', Dumbbell, 'sharedActivity'),
    item('messaggi', 'Messaggi', MessageSquareText, 'messages', 'unreadMessages'),
    settings,
  ],
  trainer: [
    item('', 'Dashboard', House, 'dashboard', null, 'Home'),
    item('clienti', 'Clienti', Users, 'clients', null, 'Clienti'),
    item('schede', 'Schede allenamento', Dumbbell, 'workoutPlans', null, 'Schede'),
    agendaTab,
    item('progressi', 'Progressi', ChartNoAxesColumn, 'proProgress'),
    item('check-nutrizionali', 'Check nutrizionali', Apple, 'sharedNutrition'),
    item('messaggi', 'Messaggi', MessageSquareText, 'messages', 'unreadMessages'),
    settings,
  ],
};

/** Percorso della pagina messaggi per ruolo (per il cliente si chiama "Notifiche"). */
export const messagesPath = (role) => (role === 'client' ? '/app/notifiche' : '/app/messaggi');
