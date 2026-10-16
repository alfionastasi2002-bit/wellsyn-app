import { EN, EN_MESSAGES } from './en.js';

// Traduzioni: i testi dell'app sono scritti in italiano e fanno da "chiave".
// In inglese si cerca la traduzione nel dizionario EN; se manca resta l'italiano.

export const LANGUAGES = [
  { value: 'it', label: 'Italiano', short: 'IT' },
  { value: 'en', label: 'English', short: 'EN' },
];

let language = 'it';

export function setLanguage(next) {
  language = next === 'en' ? 'en' : 'it';
  if (typeof document !== 'undefined') document.documentElement.lang = language;
}

export const getLanguage = () => language;

/** Formato di date e numeri della lingua attiva. */
export const locale = () => (language === 'en' ? 'en-GB' : 'it-IT');

const fill = (text, vars) =>
  vars ? text.replace(/\{(\w+)\}/g, (match, key) => (key in vars ? String(vars[key]) : match)) : text;

// In sviluppo raccogliamo i testi senza traduzione (window.__missingEN) per completare il dizionario.
const missing = import.meta.env.DEV && typeof window !== 'undefined' ? (window.__missingEN = new Set()) : null;

/** Traduce un testo. vars sostituisce i segnaposto, es. t('{n} giorni fa', { n: 3 }). */
export function t(text, vars) {
  if (typeof text !== 'string') return text;
  if (language !== 'en') return fill(text, vars);
  const translated = EN[text];
  if (translated === undefined) missing?.add(text);
  return fill(translated ?? text, vars);
}

/**
 * Oggetto con testi tradotti "al volo": ogni campo di testo diventa un getter che usa t().
 * Utile per costanti (menu, etichette) definite una volta sola: leggono sempre la lingua attiva.
 */
export function localized(fields) {
  const descriptors = {};
  for (const [key, value] of Object.entries(fields)) {
    descriptors[key] = typeof value === 'string' ? { get: () => t(value), enumerable: true } : { value, enumerable: true };
  }
  return Object.defineProperties({}, descriptors);
}

// Messaggi del server con parti variabili (nomi, orari): si confrontano con i modelli di EN_MESSAGES.
let patterns = null;
function messagePatterns() {
  if (patterns) return patterns;
  const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  patterns = Object.keys(EN_MESSAGES)
    .map((key) => {
      const names = [...key.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);
      const source = escape(key).replace(/\\\{\w+\\\}/g, '(.+?)');
      return { key, names, regex: new RegExp(`^${source}$`) };
    });
  return patterns;
}

/** Traduce un messaggio che arriva dal server (testo fisso o con parti variabili). */
let englishValues = null;
export function translateMessage(message) {
  if (language !== 'en' || typeof message !== 'string') return message;
  if (EN[message] !== undefined) return EN[message];
  englishValues ??= new Set(Object.values(EN));
  if (englishValues.has(message)) return message; // già tradotto
  for (const { key, names, regex } of messagePatterns()) {
    const match = message.match(regex);
    if (match) return fill(EN_MESSAGES[key], Object.fromEntries(names.map((name, i) => [name, t(match[i + 1])])));
  }
  missing?.add(message);
  return message;
}
