import {
  Apple,
  Bell,
  CalendarDays,
  ChartNoAxesColumn,
  Dumbbell,
  House,
  MessageSquareText,
  Settings,
  UserRound,
  Users,
  Utensils,
} from 'lucide-react';

// Voci del menu laterale per ciascun ruolo.
// "page" è la pagina da mostrare (vedi App.jsx); "badge" collega un contatore del menu.
const settings = { path: 'impostazioni', label: 'Impostazioni', icon: Settings, page: 'settings' };

export const NAVIGATION = {
  client: [
    { path: '', label: 'Dashboard', icon: House, page: 'dashboard' },
    { path: 'alimentazione', label: 'La mia alimentazione', icon: Utensils, page: 'clientNutrition' },
    { path: 'allenamenti', label: 'I miei allenamenti', icon: Dumbbell, page: 'clientWorkouts' },
    { path: 'progressi', label: 'Progressi', icon: ChartNoAxesColumn, page: 'clientProgress' },
    { path: 'controlli', label: 'Controlli', icon: CalendarDays, page: 'clientChecks' },
    { path: 'professionisti', label: 'Professionisti', icon: UserRound, page: 'team', badge: 'pendingRequests' },
    { path: 'notifiche', label: 'Notifiche', icon: Bell, page: 'messages', badge: 'unreadMessages' },
    settings,
  ],
  nutritionist: [
    { path: '', label: 'Dashboard', icon: House, page: 'dashboard' },
    { path: 'clienti', label: 'Clienti', icon: Users, page: 'clients' },
    { path: 'piani-alimentari', label: 'Piani alimentari', icon: Utensils, page: 'mealPlans' },
    { path: 'controlli', label: 'Controlli', icon: CalendarDays, page: 'agenda' },
    { path: 'progressi', label: 'Progressi', icon: ChartNoAxesColumn, page: 'proProgress' },
    { path: 'attivita-fisica', label: 'Attività fisica', icon: Dumbbell, page: 'sharedActivity' },
    { path: 'messaggi', label: 'Messaggi', icon: MessageSquareText, page: 'messages', badge: 'unreadMessages' },
    settings,
  ],
  trainer: [
    { path: '', label: 'Dashboard', icon: House, page: 'dashboard' },
    { path: 'clienti', label: 'Clienti', icon: Users, page: 'clients' },
    { path: 'schede', label: 'Schede allenamento', icon: Dumbbell, page: 'workoutPlans' },
    { path: 'sessioni', label: 'Sessioni', icon: CalendarDays, page: 'agenda' },
    { path: 'progressi', label: 'Progressi', icon: ChartNoAxesColumn, page: 'proProgress' },
    { path: 'check-nutrizionali', label: 'Check nutrizionali', icon: Apple, page: 'sharedNutrition' },
    { path: 'messaggi', label: 'Messaggi', icon: MessageSquareText, page: 'messages', badge: 'unreadMessages' },
    settings,
  ],
};

/** Percorso della pagina messaggi per ruolo (per il cliente si chiama "Notifiche"). */
export const messagesPath = (role) => (role === 'client' ? '/app/notifiche' : '/app/messaggi');
