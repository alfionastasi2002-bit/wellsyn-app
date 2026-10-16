const TZ = 'Europe/Rome';
const LOCALE = 'it-IT';

export const ROLE_LABELS = {
  client: 'Cliente',
  nutritionist: 'Nutrizionista',
  trainer: 'Personal Trainer',
};

const number = (digits) =>
  new Intl.NumberFormat(LOCALE, { minimumFractionDigits: digits, maximumFractionDigits: digits });

export const fmtNumber = (n, digits = 1) => (n == null ? '—' : number(digits).format(n));

/** Numero con segno, es. "+0,8" oppure "-1,8". */
export const fmtSigned = (n, digits = 1) => {
  if (n == null) return '—';
  const abs = number(digits).format(Math.abs(n));
  return `${n > 0 ? '+' : n < 0 ? '-' : ''}${abs}`;
};

export const fmtDate = (date, options = { day: 'numeric', month: 'long', year: 'numeric' }) =>
  new Intl.DateTimeFormat(LOCALE, { timeZone: TZ, ...options }).format(new Date(date));

export const fmtTime = (date) =>
  new Intl.DateTimeFormat(LOCALE, { timeZone: TZ, hour: '2-digit', minute: '2-digit' }).format(new Date(date));

/** Data di calendario "YYYY-MM-DD" (senza fuso orario). */
export const fmtDayKey = (key, options = { day: 'numeric', month: 'short' }) =>
  new Intl.DateTimeFormat(LOCALE, { timeZone: 'UTC', ...options }).format(new Date(`${key}T12:00:00Z`));

export const todayKey = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(
    new Date(),
  );

const dayDiff = (fromKey, toKey) => Math.round((new Date(toKey) - new Date(fromKey)) / 86400000);

/** "Oggi", "Ieri", "3 giorni fa"... */
export function relativeDay(key) {
  if (!key) return '—';
  const diff = dayDiff(key, todayKey());
  if (diff <= 0) return 'Oggi';
  if (diff === 1) return 'Ieri';
  if (diff < 7) return `${diff} giorni fa`;
  return fmtDayKey(key);
}

export function relativeTime(date) {
  const key = todayKey();
  const d = new Date(date);
  const dKey = new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(d);
  if (dKey === key) return fmtTime(d);
  if (dayDiff(dKey, key) === 1) return 'Ieri';
  return fmtDate(d, { day: 'numeric', month: 'short' });
}

export const capitalize = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

export function greeting() {
  const hour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: 'numeric', hourCycle: 'h23' }).format(new Date()));
  if (hour < 13) return 'Buongiorno';
  if (hour < 18) return 'Buon pomeriggio';
  return 'Buonasera';
}

export const displayName = (u) => (u ? [u.title, u.firstName, u.lastName].filter(Boolean).join(' ') : '');

export const DAY_NAMES = ['', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
