import { Coffee, Cookie, Moon, Salad, Utensils } from 'lucide-react';
import { localized } from '../i18n/index.js';

// Etichette condivise tra le pagine (pasti, livelli, giorni, stati).
// "localized" le traduce nella lingua attiva ogni volta che vengono lette.

export const MEAL_META = {
  colazione: localized({ label: 'Colazione', icon: Coffee }),
  spuntino: localized({ label: 'Spuntino', icon: Cookie }),
  pranzo: localized({ label: 'Pranzo', icon: Utensils }),
  merenda: localized({ label: 'Merenda', icon: Salad }),
  cena: localized({ label: 'Cena', icon: Moon }),
};
export const MEAL_TYPES = Object.keys(MEAL_META);

export const LEVEL_LABELS = localized({
  principiante: 'Livello principiante',
  intermedio: 'Livello intermedio',
  avanzato: 'Livello avanzato',
});
export const LEVELS = Object.keys(LEVEL_LABELS);

export const WEEKDAYS = [
  localized({ value: 1, short: 'Lun', long: 'Lunedì' }),
  localized({ value: 2, short: 'Mar', long: 'Martedì' }),
  localized({ value: 3, short: 'Mer', long: 'Mercoledì' }),
  localized({ value: 4, short: 'Gio', long: 'Giovedì' }),
  localized({ value: 5, short: 'Ven', long: 'Venerdì' }),
  localized({ value: 6, short: 'Sab', long: 'Sabato' }),
  localized({ value: 7, short: 'Dom', long: 'Domenica' }),
];

export const PLAN_STATUS = {
  active: Object.assign(localized({ label: 'Attivo' }), { pill: 'bg-brand-50 text-brand-800' }),
  draft: Object.assign(localized({ label: 'Bozza' }), { pill: 'bg-muted text-ink-700' }),
  archived: Object.assign(localized({ label: 'Archiviato' }), { pill: 'bg-muted text-ink-500' }),
};

export const CHECK_SOURCE = localized({
  nutritionist: 'Nutrizionista',
  trainer: 'Personal Trainer',
  self: 'Pesata personale',
});

/** Giorno della settimana (1 = lunedì) di una data "YYYY-MM-DD". */
export const weekdayOfKey = (key) => {
  const d = new Date(`${key}T12:00:00Z`).getUTCDay();
  return d === 0 ? 7 : d;
};
