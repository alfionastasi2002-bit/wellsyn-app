// Libreria degli alimenti (condivisa con il server) + etichette e calcoli usati dall'editor dei piani alimentari.
import { getLanguage, localized, t } from '../i18n/index.js';
import { FOOD_BY_ID, nutritionOf, recipeItems, recipesFor, searchFoods } from '../../../shared/foods.js';

export * from '../../../shared/foods.js';

/** Nome dell'alimento (o della ricetta) nella lingua attiva. */
export const nameOf = (entry) => (getLanguage() === 'en' ? entry.en : entry.it);

// Unità di misura: abbreviazioni mostrate nei menu (g e ml sono uguali in tutte le lingue)
const UNIT_TEXT = localized({ pz: 'pz', fetta: 'fetta', cucchiaio: 'cucchiaio', cucchiaino: 'cucchiaino', tazza: 'tazza', porzione: 'porzione', 'q.b.': 'q.b.' });
export const unitLabel = (unit) => (unit === 'g' || unit === 'ml' ? unit : (UNIT_TEXT[unit] ?? unit));

/** Suggerimenti per il campo "alimento": alimenti e ricette che corrispondono a ciò che si scrive. */
export function foodSuggestions(query, mealType) {
  const q = query.trim().toLowerCase();
  const recipes = recipesFor(mealType).filter((r) => !q || r.it.toLowerCase().includes(q) || r.en.toLowerCase().includes(q));
  const foods = q ? searchFoods(q, 7) : [];
  const recipeEntries = recipes.slice(0, q ? 3 : 5).map((r) => {
    const items = recipeItems(r);
    return { kind: 'recipe', key: `r-${r.id}`, recipe: r, emoji: FOOD_BY_ID[r.items[0][0]]?.emoji ?? '🍽️', kcal: items.reduce((s, i) => s + i.kcal, 0), count: items.length };
  });
  const foodEntries = foods.map((f) => ({ kind: 'food', key: `f-${f.id}`, food: f, emoji: f.emoji, kcal: nutritionOf(f, f.qty, f.unit).kcal }));
  return q ? [...foodEntries, ...recipeEntries] : recipeEntries;
}

// Obiettivi del piano

// value resta in italiano (è ciò che si salva); etichetta e descrizione si traducono
const goal = (value, text) => Object.assign(localized({ label: value, text }), { value });
export const GOALS = [
  goal('Mantenimento', 'Mantenere il peso forma e migliorare la composizione corporea.'),
  goal('Dimagrimento', 'Ridurre gradualmente il peso preservando la massa muscolare.'),
  goal('Definizione', 'Ridurre la massa grassa mantenendo forza e tono muscolare.'),
  goal('Massa muscolare', 'Aumentare la massa muscolare con un leggero surplus calorico.'),
  goal('Ricomposizione', 'Perdere grasso e guadagnare muscolo a peso quasi stabile.'),
  goal('Educazione alimentare', 'Costruire abitudini sane e regolari, senza rinunce drastiche.'),
  goal('Benessere generale', 'Più energia ogni giorno e un rapporto sereno con il cibo.'),
];
export const goalOf = (value) => GOALS.find((g) => g.value === value || g.label === value) ?? null;

// Fabbisogni

const ACTIVITY_KCAL_PER_KG = { sedentario: 27, leggero: 29, moderato: 31, attivo: 33, molto_attivo: 35 };
const GOAL_ADJUST = { Dimagrimento: -0.18, Definizione: -0.12, 'Massa muscolare': 0.1 };
const PROTEIN_PER_KG = { Dimagrimento: 1.8, Definizione: 1.8, 'Massa muscolare': 1.8, Ricomposizione: 1.8 };
const round5 = (n) => Math.round(n / 5) * 5;

/**
 * Stima indicativa dei fabbisogni giornalieri dal peso, dal livello di attività e dall'obiettivo.
 * Un punto di partenza da rivedere: la nutrizionista può sempre modificarli.
 */
export function suggestTargets({ weightKg, activityLevel, goal }) {
  if (!weightKg) return null;
  const perKg = ACTIVITY_KCAL_PER_KG[activityLevel] ?? 30;
  const kcal = Math.round((weightKg * perKg * (1 + (GOAL_ADJUST[goal] ?? 0))) / 50) * 50;
  const protein = round5(weightKg * (PROTEIN_PER_KG[goal] ?? 1.4));
  const fat = round5((kcal * 0.3) / 9);
  const carbs = Math.max(0, round5((kcal - protein * 4 - fat * 9) / 4));
  const water = Math.min(4, Math.max(1.5, Math.round(weightKg * 0.035 * 10) / 10));
  return { kcal, protein, carbs, fat, water };
}

/** Percentuale delle calorie che arriva da un macronutriente (4 kcal/g proteine e carboidrati, 9 kcal/g grassi). */
export const macroShare = (grams, kcalPerGram, totalKcal) => (grams && totalKcal ? Math.round(((grams * kcalPerGram) / totalKcal) * 100) : null);

/** Categoria del BMI. */
export function bmiOf(weightKg, heightCm) {
  if (!weightKg || !heightCm) return null;
  const value = weightKg / (heightCm / 100) ** 2;
  const label = value < 18.5 ? t('sottopeso') : value < 25 ? t('normopeso') : value < 30 ? t('sovrappeso') : t('obesità');
  return { value, label };
}

/** Età in anni da una data di nascita "YYYY-MM-DD". */
export function ageOf(birthDate) {
  if (!birthDate) return null;
  const [y, m, d] = birthDate.split('-').map(Number);
  const now = new Date();
  let age = now.getFullYear() - y;
  if (now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d)) age -= 1;
  return age;
}
