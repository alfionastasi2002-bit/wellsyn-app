import xss from 'xss';
import { dayKey, daysBetween, weekdayOf } from './dates.js';

// Regole condivise dei piani alimentari: testo formattato sicuro, totali dei pasti, giorno del piano di oggi.

const DATA_IMAGE = /^data:image\/(png|jpe?g|webp|gif);base64,[a-z0-9+/=\s]+$/i;
const ALIGNED = ['style']; // solo per l'allineamento del testo (vedi css qui sotto)

// Filtro dell'introduzione: tiene solo la formattazione dell'editor (titoli, grassetto, elenchi,
// allineamento, link, immagini e tabelle) e toglie tutto il resto (script, eventi, stili, iframe…).
const introFilter = new xss.FilterXSS({
  whiteList: {
    p: ALIGNED,
    h2: ALIGNED,
    h3: ALIGNED,
    br: [],
    strong: [],
    b: [],
    em: [],
    i: [],
    u: [],
    s: [],
    ul: [],
    ol: [],
    li: [],
    a: ['href'],
    img: ['src', 'alt'],
    blockquote: [],
    hr: [],
    table: [],
    colgroup: [],
    col: [],
    thead: [],
    tbody: [],
    tr: [],
    th: ['colspan', 'rowspan'],
    td: ['colspan', 'rowspan'],
  },
  css: { whiteList: { 'text-align': /^(left|right|center|justify)$/ } },
  allowCommentTag: false,
  stripIgnoreTag: true, // tag non ammessi: via il tag, resta il testo
  stripIgnoreTagBody: ['script', 'style', 'iframe', 'object', 'embed', 'svg', 'math', 'noscript', 'template', 'textarea', 'select'],
  onTagAttr(tag, name, value) {
    // Link: solo web ed email
    if (tag === 'a' && name === 'href') return /^(https?:|mailto:)/i.test(value.trim()) ? `href="${xss.escapeAttrValue(value.trim())}"` : '';
    // Immagini: indirizzi https o foto incorporate (niente SVG o altri formati)
    if (tag === 'img' && name === 'src') {
      if (DATA_IMAGE.test(value)) return `src="${value.replace(/\s/g, '')}"`;
      return /^https:\/\//i.test(value.trim()) ? `src="${xss.escapeAttrValue(value.trim())}"` : '';
    }
    return undefined; // gli altri attributi ammessi seguono le regole standard del filtro
  },
});

/** Introduzione del piano ripulita ('' se è vuota). */
export function sanitizeIntro(html) {
  if (!html) return '';
  const clean = introFilter
    .process(html)
    // immagini rimaste senza indirizzo valido
    .replace(/<img(?![^>]*\ssrc=)[^>]*>/gi, '')
    // i link si aprono in una nuova scheda, senza dare accesso alla pagina di partenza
    .replace(/<a\s/gi, '<a target="_blank" rel="noopener noreferrer" ');
  // Un editor vuoto lascia "<p></p>": vale come nessuna introduzione
  return clean.replace(/<p>(\s|<br\s*\/?>)*<\/p>/g, '').trim() ? clean : '';
}

/** Testo semplice → paragrafi HTML (per le vecchie "linee guida"). */
export function textToHtml(text) {
  if (!text) return '';
  const escape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return text
    .split(/\n{2,}/)
    .map((p) => `<p>${escape(p.trim()).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

const round = (n, digits = 0) => Math.round(n * 10 ** digits) / 10 ** digits;

/**
 * Prepara un pasto da salvare: i totali e il riepilogo ("Fiocchi d'avena, Latte, Banana")
 * vengono calcolati dagli alimenti, così restano sempre coerenti.
 */
export function normalizeMeal(meal) {
  const items = meal.items ?? [];
  if (!items.length) {
    return { ...meal, name: meal.name || meal.label || meal.type };
  }
  const sum = (key) => (items.some((i) => i[key] != null) ? round(items.reduce((s, i) => s + (i[key] ?? 0), 0), key === 'kcal' ? 0 : 1) : undefined);
  const summary = items.map((i) => i.name).join(', ');
  return {
    ...meal,
    name: summary.length > 120 ? `${summary.slice(0, 117)}…` : summary,
    description: undefined,
    kcal: sum('kcal'),
    protein: sum('protein'),
    carbs: sum('carbs'),
    fat: sum('fat'),
  };
}

/**
 * Giorno del piano (1…n) che vale per una certa data.
 * Con 7 giorni il giorno 1 è il lunedì; con un numero diverso i giorni si ripetono a rotazione dalla data di inizio.
 */
export function planDayIndex(plan, key = dayKey()) {
  const count = plan?.days?.length ?? 0;
  if (!count) return null;
  if (count === 7) return weekdayOf(key);
  const anchor = dayKey(plan.startDate ?? plan.createdAt ?? new Date());
  const diff = daysBetween(anchor, key);
  return (((diff % count) + count) % count) + 1;
}

/** Giorno del piano (con i suoi pasti) che vale per una certa data. */
export function planDayFor(plan, key = dayKey()) {
  const index = planDayIndex(plan, key);
  return index ? (plan.days.find((d) => d.dayIndex === index) ?? null) : null;
}
