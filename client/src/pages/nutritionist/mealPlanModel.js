// Stato dell'editor dei piani alimentari: come si costruisce, si calcola e si prepara per il salvataggio.
import { numberToText, toNumber } from '../../components/forms.jsx';
import { t } from '../../i18n/index.js';
import { DEFAULT_TIMES, FOOD_BY_ID, findFoodByName, nameOf, nutritionOf } from '../../lib/foods.js';
import { MEAL_META } from '../../lib/labels.js';

let seq = 0;
export const newKey = () => `k${++seq}`;

export const MAX_DAYS = 14;
export const DEFAULT_MEALS = ['colazione', 'spuntino', 'pranzo', 'merenda', 'cena'];

// Costruzione

export const emptyItem = () => ({ key: newKey(), name: '', food: null, quantity: '', unit: 'g', alternative: '', kcal: null, protein: null, carbs: null, fat: null, custom: false });

export const itemFrom = (i) => ({
  key: newKey(),
  name: i.name ?? '',
  food: i.food && FOOD_BY_ID[i.food] ? i.food : null,
  quantity: numberToText(i.quantity),
  unit: i.unit ?? 'g',
  alternative: i.alternative ?? '',
  kcal: i.kcal ?? null,
  protein: i.protein ?? null,
  carbs: i.carbs ?? null,
  fat: i.fat ?? null,
  custom: !i.food,
});

/** Alimento della libreria con la quantità proposta (o quella indicata) e i suoi valori. */
export function itemFromFood(food, { quantity = food.qty, unit = food.unit, alternative = '' } = {}) {
  return { ...emptyItem(), name: nameOf(food), food: food.id, quantity: numberToText(quantity), unit, alternative, ...nutritionOf(food, quantity, unit) };
}

export const emptyMeal = (type) => ({
  key: newKey(),
  type,
  label: '',
  start: DEFAULT_TIMES[type]?.[0] ?? '',
  end: DEFAULT_TIMES[type]?.[1] ?? '',
  items: [],
  note: '',
  showNote: false,
  collapsed: false,
  editing: false,
});

export function mealFrom(m) {
  // Piani creati prima degli alimenti: il piatto diventa un alimento "a porzione" con le sue calorie
  const legacy = !m.items?.length && m.name
    ? [{ ...emptyItem(), name: m.name, quantity: '1', unit: 'porzione', kcal: m.kcal ?? null, protein: m.protein ?? null, carbs: m.carbs ?? null, fat: m.fat ?? null, custom: true }]
    : [];
  const note = m.note ?? m.description ?? '';
  return {
    key: newKey(),
    type: m.type,
    label: m.label ?? '',
    start: m.start ?? '',
    end: m.end ?? '',
    items: m.items?.length ? m.items.map(itemFrom) : legacy,
    note,
    showNote: Boolean(note),
    collapsed: false,
    editing: false,
  };
}

export const emptyDay = (types = DEFAULT_MEALS) => ({ key: newKey(), meals: types.map(emptyMeal) });

export const cloneMeal = (m) => ({ ...m, key: newKey(), editing: false, items: m.items.map((i) => ({ ...i, key: newKey() })) });
export const cloneDay = (d) => ({ key: newKey(), meals: d.meals.map(cloneMeal) });

export function newForm({ clientId = '' } = {}) {
  return {
    clientId,
    title: '',
    goal: '',
    intro: '',
    kcalTarget: '',
    proteinTarget: '',
    carbsTarget: '',
    fatTarget: '',
    waterLiters: '',
    notes: [],
    status: 'draft',
    startDate: '',
    days: Array.from({ length: 7 }, () => emptyDay()),
  };
}

/** Modulo a partire da un piano salvato; copy: per "Duplica" (stesso menù, nuovo cliente). */
export function formFromPlan(plan, { copy = false } = {}) {
  const intro = plan.intro || (plan.guidelines ? textToHtml(plan.guidelines) : '');
  return {
    clientId: copy ? '' : (plan.client?.id ?? ''),
    title: copy ? `${plan.title} (${t('copia')})` : plan.title,
    goal: plan.goal ?? '',
    intro,
    kcalTarget: numberToText(plan.kcalTarget),
    proteinTarget: numberToText(plan.proteinTarget),
    carbsTarget: numberToText(plan.carbsTarget),
    fatTarget: numberToText(plan.fatTarget),
    waterLiters: numberToText(plan.waterLiters),
    notes: copy ? [] : (plan.notes ?? []),
    status: copy ? 'draft' : plan.status,
    startDate: copy ? '' : (plan.startDate ?? ''),
    days: plan.days.length ? [...plan.days].sort((a, b) => a.dayIndex - b.dayIndex).map((d) => ({ key: newKey(), meals: d.meals.map(mealFrom) })) : [emptyDay()],
  };
}

function textToHtml(text) {
  const escape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return text
    .split(/\n{2,}/)
    .map((p) => `<p>${escape(p.trim()).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

/** Giorni di un modello (dalla libreria) trasformati in giorni del modulo. */
export const daysFromTemplate = (templateDays) => templateDays.map((d) => ({ key: newKey(), meals: d.meals.map((m) => ({ ...emptyMeal(m.type), start: m.start, end: m.end, items: m.items.map(itemFrom).map((i) => ({ ...i, custom: false })) })) }));

// Calcoli

const r1 = (n) => Math.round(n * 10) / 10;

export function totalsOf(items) {
  const sum = (key) => items.reduce((s, i) => s + (i[key] ?? 0), 0);
  return { kcal: Math.round(sum('kcal')), protein: r1(sum('protein')), carbs: r1(sum('carbs')), fat: r1(sum('fat')) };
}
export const mealTotals = (meal) => totalsOf(meal.items);
export const dayTotals = (day) => totalsOf(day.meals.flatMap((m) => m.items));
export const dayHasFood = (day) => day.meals.some((m) => m.items.some((i) => i.name.trim()));

/**
 * Aggiorna un alimento dopo un cambio di quantità o unità: con un alimento della libreria i valori si ricalcolano,
 * con un alimento scritto a mano (valori inseriti a mano) si scalano in proporzione alla quantità.
 */
export function withQuantity(item, patch) {
  const next = { ...item, ...patch };
  const qty = toNumber(next.quantity);
  const food = next.food ? FOOD_BY_ID[next.food] : null;
  if (food && !next.custom) {
    return { ...next, ...(qty == null || Number.isNaN(qty) ? { kcal: null, protein: null, carbs: null, fat: null } : nutritionOf(food, qty, next.unit)) };
  }
  const oldQty = toNumber(item.quantity);
  if (next.unit === item.unit && oldQty > 0 && qty > 0 && item.kcal != null) {
    const k = qty / oldQty;
    return { ...next, kcal: Math.round(item.kcal * k), protein: item.protein == null ? null : r1(item.protein * k), carbs: item.carbs == null ? null : r1(item.carbs * k), fat: item.fat == null ? null : r1(item.fat * k) };
  }
  return next;
}

/** Nome scritto a mano: se corrisponde a un alimento della libreria lo collega (e ne calcola i valori). */
export function withName(item, name) {
  const food = findFoodByName(name);
  if (food && !item.food) {
    const qty = toNumber(item.quantity);
    const quantity = qty > 0 ? qty : food.qty;
    const unit = qty > 0 ? item.unit : food.unit;
    return { ...item, name, food: food.id, custom: false, quantity: numberToText(quantity), unit, ...nutritionOf(food, quantity, unit) };
  }
  if (item.food && (!food || food.id !== item.food)) {
    // Il nome non è più quello dell'alimento collegato: i valori restano, ma diventano "a mano"
    return { ...item, name, food: null, custom: true };
  }
  return { ...item, name };
}

// I nomi personalizzati restano come scritti (quelli più comuni, es. "Spuntino mattutino", si traducono)
export const mealTitle = (meal) => (meal.label.trim() && t(meal.label.trim())) || MEAL_META[meal.type]?.label || meal.type;

// Salvataggio

/**
 * Corpo della richiesta per il server. Restituisce { body } oppure { error, dayIndex } se qualcosa non va.
 * I pasti senza alimenti vengono tralasciati.
 */
export function toPayload(form, status) {
  const numberField = (value, label) => {
    const n = toNumber(value);
    if (Number.isNaN(n)) throw Object.assign(new Error(t('{label}: inserisci un numero.', { label })), { dayIndex: null });
    return n;
  };
  try {
    const days = form.days.map((d, di) => {
      const meals = [];
      for (const m of d.meals) {
        const items = [];
        for (const i of m.items) {
          if (!i.name.trim()) continue;
          const quantity = toNumber(i.quantity);
          if (Number.isNaN(quantity)) throw Object.assign(new Error(t('Quantità non valida per "{name}": usa solo numeri.', { name: i.name.trim() })), { dayIndex: di });
          items.push({
            name: i.name.trim(),
            food: i.food ?? undefined,
            quantity,
            unit: i.unit,
            alternative: i.alternative.trim(),
            kcal: i.kcal,
            protein: i.protein,
            carbs: i.carbs,
            fat: i.fat,
          });
        }
        if (!items.length) continue;
        if (m.start && m.end && m.end <= m.start) {
          throw Object.assign(new Error(t('{meal}: l’orario di fine deve venire dopo l’inizio.', { meal: mealTitle(m) })), { dayIndex: di });
        }
        meals.push({ type: m.type, label: m.label.trim(), start: m.start || null, end: m.end || null, items, note: m.note.trim() });
      }
      return { dayIndex: di + 1, meals };
    });
    if (status === 'active' && !days.some((d) => d.meals.length)) {
      throw Object.assign(new Error(t('Aggiungi almeno un alimento prima di pubblicare il piano.')), { dayIndex: 0 });
    }
    return {
      body: {
        title: form.title.trim() || t('Piano alimentare personalizzato'),
        goal: form.goal,
        intro: form.intro,
        kcalTarget: numberField(form.kcalTarget, t('Calorie')),
        proteinTarget: numberField(form.proteinTarget, t('Proteine')),
        carbsTarget: numberField(form.carbsTarget, t('Carboidrati')),
        fatTarget: numberField(form.fatTarget, t('Grassi')),
        waterLiters: numberField(form.waterLiters, t('Idratazione')),
        notes: form.notes.map((n) => n.trim()).filter(Boolean),
        status,
        startDate: form.startDate || null,
        days,
      },
    };
  } catch (err) {
    return { error: err.message, dayIndex: err.dayIndex };
  }
}
