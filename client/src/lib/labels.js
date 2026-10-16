import { Coffee, Cookie, Moon, Salad, Utensils } from 'lucide-react';

// Etichette condivise tra le pagine (pasti, livelli, giorni, stati).

export const MEAL_META = {
  colazione: { label: 'Colazione', icon: Coffee },
  spuntino: { label: 'Spuntino', icon: Cookie },
  pranzo: { label: 'Pranzo', icon: Utensils },
  merenda: { label: 'Merenda', icon: Salad },
  cena: { label: 'Cena', icon: Moon },
};
export const MEAL_TYPES = Object.keys(MEAL_META);

export const LEVEL_LABELS = {
  principiante: 'Livello principiante',
  intermedio: 'Livello intermedio',
  avanzato: 'Livello avanzato',
};
export const LEVELS = Object.keys(LEVEL_LABELS);

export const WEEKDAYS = [
  { value: 1, short: 'Lun', long: 'Lunedì' },
  { value: 2, short: 'Mar', long: 'Martedì' },
  { value: 3, short: 'Mer', long: 'Mercoledì' },
  { value: 4, short: 'Gio', long: 'Giovedì' },
  { value: 5, short: 'Ven', long: 'Venerdì' },
  { value: 6, short: 'Sab', long: 'Sabato' },
  { value: 7, short: 'Dom', long: 'Domenica' },
];

export const PLAN_STATUS = {
  active: { label: 'Attivo', pill: 'bg-brand-50 text-brand-800' },
  draft: { label: 'Bozza', pill: 'bg-[#eef2f1] text-ink-700' },
  archived: { label: 'Archiviato', pill: 'bg-[#f4f4f5] text-ink-500' },
};

export const CHECK_SOURCE = {
  nutritionist: 'Nutrizionista',
  trainer: 'Personal Trainer',
  self: 'Pesata personale',
};

/** Giorno della settimana (1 = lunedì) di una data "YYYY-MM-DD". */
export const weekdayOfKey = (key) => {
  const d = new Date(`${key}T12:00:00Z`).getUTCDay();
  return d === 0 ? 7 : d;
};
