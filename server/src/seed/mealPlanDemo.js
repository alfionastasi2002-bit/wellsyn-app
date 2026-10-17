// Piani alimentari dei dati demo: settimane composte con le ricette della libreria (alimenti, quantità e orari).
import { buildTemplateDays, DEFAULT_TIMES, FOOD_BY_ID, PLAN_TEMPLATES, RECIPES, recipeItems } from '../../../shared/foods.js';
import { normalizeMeal } from '../utils/mealPlans.js';

const TEMPLATE_BY_GOAL = {
  Dimagrimento: 'ipocalorico',
  Definizione: 'mediterraneo',
  'Massa muscolare': 'sportivo',
  Ricomposizione: 'mediterraneo',
  'Educazione alimentare': 'mediterraneo',
  Forza: 'sportivo',
  'Benessere generale': 'vegetariano',
  Mantenimento: 'mediterraneo',
};

const round5 = (n) => Math.round(n / 5) * 5;

/** Fabbisogni giornalieri con una ripartizione classica: 25% proteine, 45% carboidrati, 30% grassi. */
export const macroTargets = (kcal) => ({
  kcalTarget: kcal,
  proteinTarget: round5((kcal * 0.25) / 4),
  carbsTarget: round5((kcal * 0.45) / 4),
  fatTarget: round5((kcal * 0.3) / 9),
});

const withLabel = (meal) => normalizeMeal({ ...meal, label: meal.type === 'spuntino' ? 'Spuntino mattutino' : undefined });

/** Campi di un piano demo (giorni, fabbisogni, introduzione e note) per un obiettivo e un obiettivo calorico. */
export function demoPlanFields({ goal, kcal, offset = 0, notes = ['Bere almeno 2 litri di acqua al giorno.', 'Verdura a volontà a pranzo e a cena.'] }) {
  const template = PLAN_TEMPLATES.find((tp) => tp.id === (TEMPLATE_BY_GOAL[goal] ?? 'mediterraneo'));
  return {
    ...macroTargets(kcal),
    waterLiters: 2,
    intro:
      '<p>Questo piano è costruito sulle tue abitudini e sul tuo obiettivo. Le quantità sono a crudo e al netto degli scarti, salvo dove indicato.</p>' +
      '<p>Le <strong>alternative</strong> accanto a ogni alimento ti permettono di variare senza cambiare l’equilibrio del pasto.</p>',
    notes,
    days: buildTemplateDays(template, { kcal, offset }).map((d) => ({ dayIndex: d.dayIndex, meals: d.meals.map(withLabel) })),
  };
}

const recipe = (id) => RECIPES.find((r) => r.id === id);
const meal = (type, recipeId) => withLabel({ type, start: DEFAULT_TIMES[type][0], end: DEFAULT_TIMES[type][1], items: recipeItems(recipe(recipeId)) });

/** Il piano di Giulia, uguale al mockup dell'editor: il giorno 1 è quello mostrato nell'immagine. */
export function giuliaPlanFields() {
  const base = demoPlanFields({ goal: 'Mantenimento', kcal: 1850 });
  const lunch = meal('pranzo', 'riso-pollo');
  lunch.items[1].name = `${FOOD_BY_ID.pollo.it} alla griglia`; // come nel mockup
  base.days[0] = {
    dayIndex: 1,
    meals: [meal('colazione', 'avena-latte-banana'), meal('spuntino', 'yogurt-mandorle'), normalizeMeal(lunch), meal('merenda', 'kefir-frutti'), meal('cena', 'salmone-quinoa')],
  };
  return {
    ...base,
    proteinTarget: 120,
    carbsTarget: 200,
    fatTarget: 65,
    intro:
      '<p>Questo piano alimentare è stato elaborato tenendo conto delle tue esigenze, dei tuoi gusti personali e del tuo stile di vita. ' +
      'L’obiettivo è mantenere un corretto equilibrio nutrizionale, favorire il benessere generale e supportare la tua energia quotidiana.</p>' +
      '<p>Segui le indicazioni con flessibilità e ascolta sempre il tuo senso di sazietà.</p>',
    notes: ['Preferisce cucina mediterranea', 'Non gradisce il pesce azzurro', 'Ama la frutta secca', 'Si allena 3 volte a settimana'],
  };
}
