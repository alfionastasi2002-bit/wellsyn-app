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
// "page" indica le sezioni già pronte; le altre mostrano la pagina "in arrivo".
// "badge" collega un contatore (messaggi non letti, richieste in attesa).
const settings = { path: 'impostazioni', label: 'Impostazioni', icon: Settings };

export const NAVIGATION = {
  client: [
    { path: '', label: 'Dashboard', icon: House, page: 'dashboard' },
    { path: 'alimentazione', label: 'La mia alimentazione', icon: Utensils },
    { path: 'allenamenti', label: 'I miei allenamenti', icon: Dumbbell },
    { path: 'progressi', label: 'Progressi', icon: ChartNoAxesColumn },
    { path: 'controlli', label: 'Controlli', icon: CalendarDays },
    { path: 'professionisti', label: 'Professionisti', icon: UserRound, page: 'team', badge: 'pendingRequests' },
    { path: 'notifiche', label: 'Notifiche', icon: Bell, badge: 'unreadMessages' },
    settings,
  ],
  nutritionist: [
    { path: '', label: 'Dashboard', icon: House, page: 'dashboard' },
    { path: 'clienti', label: 'Clienti', icon: Users, page: 'clients' },
    { path: 'piani-alimentari', label: 'Piani alimentari', icon: Utensils },
    { path: 'controlli', label: 'Controlli', icon: CalendarDays },
    { path: 'progressi', label: 'Progressi', icon: ChartNoAxesColumn },
    { path: 'attivita-fisica', label: 'Attività fisica', icon: Dumbbell },
    { path: 'messaggi', label: 'Messaggi', icon: MessageSquareText, badge: 'unreadMessages' },
    settings,
  ],
  trainer: [
    { path: '', label: 'Dashboard', icon: House, page: 'dashboard' },
    { path: 'clienti', label: 'Clienti', icon: Users, page: 'clients' },
    { path: 'schede', label: 'Schede allenamento', icon: Dumbbell },
    { path: 'sessioni', label: 'Sessioni', icon: CalendarDays },
    { path: 'progressi', label: 'Progressi', icon: ChartNoAxesColumn },
    { path: 'check-nutrizionali', label: 'Check nutrizionali', icon: Apple },
    { path: 'messaggi', label: 'Messaggi', icon: MessageSquareText, badge: 'unreadMessages' },
    settings,
  ],
};

// Testi del riquadro in fondo al menu laterale (come nei mockup).
export const SIDEBAR_PROMO = {
  client: {
    title: 'Il tuo benessere è la nostra priorità.',
    text: 'Siamo qui per supportarti ogni giorno, passo dopo passo.',
    cta: 'Serve aiuto?',
  },
  nutritionist: {
    title: 'Un approccio integrato al benessere.',
    text: 'Alimentazione, movimento e consapevolezza per risultati duraturi.',
    cta: 'Invita un collega',
  },
  trainer: {
    title: 'Il benessere dei tuoi clienti è un lavoro di squadra.',
    text: 'Hai domande o bisogno di supporto?',
    cta: 'Centro assistenza',
  },
};

// Cosa arriverà nelle sezioni non ancora sviluppate.
export const COMING_SOON = {
  alimentazione: 'Il tuo piano alimentare completo giorno per giorno, con ricette, grammature e lista della spesa.',
  allenamenti: 'Tutte le sessioni della tua scheda, con video degli esercizi e registrazione di serie e carichi.',
  progressi: 'Grafici dettagliati di peso, misure e composizione corporea nel tempo.',
  controlli: 'Calendario dei controlli e storico delle misurazioni.',
  notifiche: 'Messaggi e avvisi dai tuoi professionisti in un unico posto.',
  impostazioni: 'Profilo, password, foto e preferenze di notifica.',
  'piani-alimentari': 'Editor dei piani alimentari: crea menù settimanali, duplica giorni e assegna i piani ai clienti.',
  'attivita-fisica': "Dati di allenamento condivisi dai personal trainer dei tuoi clienti (con la loro autorizzazione).",
  messaggi: 'Chat con clienti e colleghi, con notifiche in tempo reale.',
  schede: 'Editor delle schede di allenamento: esercizi, serie, ripetizioni e progressioni.',
  sessioni: 'Agenda delle sessioni con i clienti e gestione degli appuntamenti.',
  'check-nutrizionali': 'Check nutrizionali condivisi dalle nutrizioniste dei tuoi clienti (con la loro autorizzazione).',
  supporto: 'Centro assistenza e contatti del team Wellsyn.',
};
