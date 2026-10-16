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
const item = (path, label, icon, page, badge) => Object.assign(localized({ label }), { path, icon, page, badge });
const settings = item('impostazioni', 'Profilo e impostazioni', Settings, 'settings');
const agenda = item('agenda', 'Agenda', CalendarDays, 'agenda');

export const NAVIGATION = {
  client: [
    item('', 'Dashboard', House, 'dashboard'),
    item('alimentazione', 'La mia alimentazione', Utensils, 'clientNutrition'),
    item('allenamenti', 'I miei allenamenti', Dumbbell, 'clientWorkouts'),
    item('progressi', 'Progressi', ChartNoAxesColumn, 'clientProgress'),
    agenda,
    item('controlli', 'Controlli', ClipboardList, 'clientChecks'),
    item('professionisti', 'Professionisti', UserRound, 'team', 'pendingRequests'),
    item('notifiche', 'Notifiche', Bell, 'messages', 'unreadMessages'),
    settings,
  ],
  nutritionist: [
    item('', 'Dashboard', House, 'dashboard'),
    item('clienti', 'Clienti', Users, 'clients'),
    item('piani-alimentari', 'Piani alimentari', Utensils, 'mealPlans'),
    agenda,
    item('controlli', 'Controlli', ClipboardList, 'checkins'),
    item('progressi', 'Progressi', ChartNoAxesColumn, 'proProgress'),
    item('attivita-fisica', 'Attività fisica', Dumbbell, 'sharedActivity'),
    item('messaggi', 'Messaggi', MessageSquareText, 'messages', 'unreadMessages'),
    settings,
  ],
  trainer: [
    item('', 'Dashboard', House, 'dashboard'),
    item('clienti', 'Clienti', Users, 'clients'),
    item('schede', 'Schede allenamento', Dumbbell, 'workoutPlans'),
    agenda,
    item('progressi', 'Progressi', ChartNoAxesColumn, 'proProgress'),
    item('check-nutrizionali', 'Check nutrizionali', Apple, 'sharedNutrition'),
    item('messaggi', 'Messaggi', MessageSquareText, 'messages', 'unreadMessages'),
    settings,
  ],
};

/** Percorso della pagina messaggi per ruolo (per il cliente si chiama "Notifiche"). */
export const messagesPath = (role) => (role === 'client' ? '/app/notifiche' : '/app/messaggi');
