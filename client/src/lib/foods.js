// Libreria degli alimenti (condivisa con il server) + etichette e calcoli usati dall'editor dei piani alimentari.
// Oltre agli alimenti della libreria (con quantità ed emoji curate) ci sono:
// - la banca dati di quasi 3.000 alimenti generici (foodDatabase.js), caricata solo quando si cerca un alimento;
// - i prodotti confezionati e di marca, cercati online tramite il server (Open Food Facts).
import { getLanguage, localized, t } from '../i18n/index.js';
import { api } from './api.js';
import { FOOD_BY_ID, FOODS, nutritionOf, rankFoods, recipeItems, recipesFor, searchFoods, searchText } from '../../../shared/foods.js';

export * from '../../../shared/foods.js';

/** Nome dell'alimento (o della ricetta) nella lingua attiva. */
export const nameOf = (entry) => (getLanguage() === 'en' ? entry.en : entry.it);

// Banca dati e prodotti confezionati

let database = null; // alimenti della banca dati, quando è stata caricata
let databaseLoading = null;
const extraById = new Map(); // alimenti della banca dati e prodotti già scelti, per codice
const LIBRARY_NAMES = new Set(FOODS.map((f) => searchText(f.it)));

/** Carica la banca dati degli alimenti generici (una volta sola). */
export function loadFoodDatabase() {
  databaseLoading ??= import('./foodDatabase.js').then(({ FOOD_DATABASE }) => {
    database = FOOD_DATABASE.map(([code, it, en, emoji, kcal, protein, carbs, fat, qty, unit, priority = 0]) => {
      const food = { id: `cq-${code}`, it, en, emoji, kcal, protein, carbs, fat, qty, unit, priority, source: 'database' };
      extraById.set(food.id, food);
      return food;
    });
    return database;
  });
  return databaseLoading;
}

/** Prodotto confezionato (dal server) → alimento con i valori per 100 g o 100 ml. */
function productToFood(p) {
  const label = p.brand && !searchText(p.name).includes(searchText(p.brand)) ? `${p.name} (${p.brand})` : p.name;
  return {
    id: p.id,
    it: label,
    en: label,
    brand: p.brand,
    emoji: '🛒',
    kcal: p.kcal,
    protein: p.protein,
    carbs: p.carbs,
    fat: p.fat,
    qty: p.qty,
    unit: p.unit,
    portion: p.portion ?? undefined,
    piece: p.portion ?? undefined,
    source: 'product',
  };
}

/** Cerca prodotti confezionati e di marca (almeno 3 lettere). */
export async function searchProducts(query, signal) {
  const { products } = await api(`/foods/products?q=${encodeURIComponent(query.trim())}`, { signal });
  return products.map((p) => {
    const food = productToFood(p);
    extraById.set(food.id, food);
    return food;
  });
}

/** Valori da salvare insieme all'alimento scelto, per ricalcolarlo anche quando la banca dati non è caricata. */
export const foodInfoOf = (food) =>
  food && food.source ? { kcal: food.kcal, protein: food.protein, carbs: food.carbs, fat: food.fat, portion: food.portion ?? null, emoji: food.emoji } : null;

/** Alimento collegato a una riga del piano: dalla libreria, dalla banca dati o dai valori salvati con la riga. */
export function foodOfItem(item) {
  if (!item?.food) return null;
  const known = FOOD_BY_ID[item.food] ?? extraById.get(item.food);
  if (known) return known;
  const info = item.foodInfo;
  if (!info) return null;
  return { id: item.food, it: item.name, en: item.name, emoji: info.emoji, kcal: info.kcal, protein: info.protein, carbs: info.carbs, fat: info.fat, portion: info.portion ?? undefined, piece: info.portion ?? undefined, unit: 'g', qty: 100, source: 'saved' };
}

// Unità di misura: abbreviazioni mostrate nei menu (g e ml sono uguali in tutte le lingue)
const UNIT_TEXT = localized({ pz: 'pz', fetta: 'fetta', cucchiaio: 'cucchiaio', cucchiaino: 'cucchiaino', tazza: 'tazza', porzione: 'porzione', 'q.b.': 'q.b.' });
export const unitLabel = (unit) => (unit === 'g' || unit === 'ml' ? unit : (UNIT_TEXT[unit] ?? unit));

const foodEntry = (f) => ({ kind: 'food', key: `f-${f.id}`, food: f, emoji: f.emoji, kcal: nutritionOf(f, f.qty, f.unit).kcal });

/**
 * Suggerimenti per il campo "alimento": alimenti della libreria e della banca dati (se caricata) e ricette
 * che corrispondono a ciò che si scrive. I prodotti confezionati si aggiungono a parte (arrivano dal server).
 */
export function foodSuggestions(query, mealType) {
  const q = query.trim();
  const recipes = q ? rankFoods(recipesFor(mealType), q, 3) : recipesFor(mealType).slice(0, 5);
  const recipeEntries = recipes.map((r) => {
    const items = recipeItems(r);
    return { kind: 'recipe', key: `r-${r.id}`, recipe: r, emoji: FOOD_BY_ID[r.items[0][0]]?.emoji ?? '🍽️', kcal: items.reduce((s, i) => s + i.kcal, 0), count: items.length };
  });
  if (!q) return recipeEntries;
  const library = searchFoods(q, 5);
  // Dalla banca dati: i più pertinenti, senza ripetere gli alimenti della libreria con lo stesso nome
  const more = database ? rankFoods(database, q, 12).filter((f) => !LIBRARY_NAMES.has(searchText(f.it))).slice(0, 8) : [];
  return [...library.map(foodEntry), ...more.map(foodEntry), ...recipeEntries];
}

/** Voce di suggerimento per un prodotto confezionato. */
export const productEntry = (f) => ({ ...foodEntry(f), kind: 'product', key: `p-${f.id}` });

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
