import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { FOOD_UNITS, MAX_PLAN_DAYS, MEAL_TYPES, MealPlan } from '../models/index.js';
import { requireClientOf } from '../services/access.js';
import { HttpError } from '../utils/httpError.js';
import { dayKeySchema, objectId, optionalNumber, optionalText, timeSchema } from '../utils/schemas.js';
import { publicUser } from '../utils/serialize.js';
import { dayKey, zonedDate } from '../utils/dates.js';
import { normalizeMeal, sanitizeIntro } from '../utils/mealPlans.js';
import { parse } from '../utils/validate.js';

// Piani alimentari: li crea e modifica la nutrizionista.
const router = Router();
router.use(requireAuth, requireRole('nutritionist'));

// Valori per 100 g (o 100 ml) di un alimento della banca dati o di un prodotto confezionato
const foodInfoSchema = z
  .object({
    kcal: z.number().min(0).max(1000),
    protein: z.number().min(0).max(100),
    carbs: z.number().min(0).max(100),
    fat: z.number().min(0).max(100),
    portion: optionalNumber(0, 5000, 'Porzione'),
    emoji: optionalText(16),
  })
  .optional()
  .nullable()
  .transform((v) => v ?? undefined);

const itemSchema = z.object({
  name: z.string({ error: 'Ogni alimento deve avere un nome.' }).trim().min(1, 'Ogni alimento deve avere un nome.').max(140, 'Nome dell’alimento troppo lungo.'),
  food: optionalText(40),
  foodInfo: foodInfoSchema,
  quantity: optionalNumber(0, 5000, 'Quantità'),
  unit: z.enum(FOOD_UNITS, { error: 'Unità di misura non valida.' }).optional().nullable().transform((v) => v ?? undefined),
  alternative: optionalText(120),
  kcal: optionalNumber(0, 5000, 'Calorie'),
  protein: optionalNumber(0, 500, 'Proteine'),
  carbs: optionalNumber(0, 800, 'Carboidrati'),
  fat: optionalNumber(0, 400, 'Grassi'),
});

const mealSchema = z
  .object({
    type: z.enum(MEAL_TYPES, { error: 'Tipo di pasto non valido.' }),
    label: optionalText(40),
    start: timeSchema.optional().nullable().transform((v) => v ?? undefined),
    end: timeSchema.optional().nullable().transform((v) => v ?? undefined),
    items: z.array(itemSchema).max(25, 'Massimo 25 alimenti per pasto.').default([]),
    note: optionalText(300),
    // Piani creati prima degli alimenti: il pasto è un piatto descritto a parole
    name: optionalText(120),
    description: optionalText(400),
    kcal: optionalNumber(0, 5000, 'Calorie'),
    protein: optionalNumber(0, 500, 'Proteine'),
    carbs: optionalNumber(0, 800, 'Carboidrati'),
    fat: optionalNumber(0, 400, 'Grassi'),
  })
  .refine((m) => m.items.length || m.name, { message: 'Ogni pasto deve avere almeno un alimento.' })
  .refine((m) => !m.start || !m.end || m.end > m.start, { message: 'L’orario di fine del pasto deve venire dopo l’inizio.' });

const daySchema = z.object({
  dayIndex: z.number().int().min(1).max(MAX_PLAN_DAYS),
  meals: z.array(mealSchema).max(10, 'Massimo 10 pasti al giorno.'),
});

const planFields = {
  title: z.string({ error: 'Dai un titolo al piano.' }).trim().min(1, 'Dai un titolo al piano.').max(100),
  goal: optionalText(60),
  // L'introduzione (testo formattato, anche con immagini) viene ripulita prima del salvataggio
  intro: z.string().max(1_200_000, 'Introduzione troppo lunga: usa meno immagini o immagini più piccole.').optional().nullable(),
  guidelines: optionalText(3000),
  kcalTarget: optionalNumber(500, 6000, 'Obiettivo calorico'),
  proteinTarget: optionalNumber(0, 500, 'Proteine'),
  carbsTarget: optionalNumber(0, 900, 'Carboidrati'),
  fatTarget: optionalNumber(0, 400, 'Grassi'),
  waterLiters: optionalNumber(0.5, 6, 'Idratazione'),
  notes: z.array(z.string().trim().min(1).max(160, 'Ogni nota può avere al massimo 160 caratteri.')).max(20, 'Massimo 20 note.').default([]),
  status: z.enum(['draft', 'active', 'archived']).default('active'),
  startDate: dayKeySchema.optional().nullable(),
  days: z
    .array(daySchema)
    .max(MAX_PLAN_DAYS, `Al massimo ${MAX_PLAN_DAYS} giorni.`)
    .refine((days) => new Set(days.map((d) => d.dayIndex)).size === days.length, 'Giorni del piano ripetuti.'),
};

const createSchema = z.object({ clientId: objectId('Seleziona un cliente.'), ...planFields });
const updateSchema = z.object(planFields);
const patchSchema = z.object({
  status: z.enum(['draft', 'active', 'archived']).optional(),
  needsReview: z.boolean().optional(),
});

const summary = (p) => ({
  id: String(p._id),
  title: p.title,
  goal: p.goal ?? null,
  kcalTarget: p.kcalTarget ?? null,
  status: p.status,
  needsReview: p.needsReview,
  client: publicUser(p.client),
  mealsCount: (p.days ?? []).reduce((n, d) => n + d.meals.length, 0),
  daysCount: (p.days ?? []).filter((d) => d.meals.length).length,
  totalDays: (p.days ?? []).length,
  updatedAt: p.updatedAt,
  createdAt: p.createdAt,
});

const full = (p) => ({
  ...summary(p),
  intro: p.intro ?? '',
  guidelines: p.guidelines ?? '',
  proteinTarget: p.proteinTarget ?? null,
  carbsTarget: p.carbsTarget ?? null,
  fatTarget: p.fatTarget ?? null,
  waterLiters: p.waterLiters ?? null,
  notes: p.notes ?? [],
  startDate: p.startDate ? dayKey(p.startDate) : null,
  days: p.days ?? [],
});

function toDoc(data) {
  const { startDate, intro, ...rest } = data;
  // I giorni vengono rinumerati 1…n nell'ordine ricevuto (si possono aggiungere e togliere)
  const days = [...data.days].sort((a, b) => a.dayIndex - b.dayIndex).map((d, i) => ({ dayIndex: i + 1, meals: d.meals.map(normalizeMeal) }));
  const cleanIntro = sanitizeIntro(intro);
  return {
    ...rest,
    intro: cleanIntro || undefined,
    // Con l'introduzione formattata le vecchie linee guida non servono più
    guidelines: cleanIntro ? undefined : rest.guidelines,
    startDate: startDate ? zonedDate(startDate, 9) : undefined,
    days,
  };
}

/** Un solo piano attivo per cliente: gli altri piani attivi della stessa nutrizionista vengono archiviati. */
async function archiveOtherActive(nutritionistId, clientId, keepId) {
  await MealPlan.updateMany(
    { nutritionist: nutritionistId, client: clientId, status: 'active', _id: { $ne: keepId } },
    { $set: { status: 'archived' } },
  );
}

async function ownPlan(req) {
  const plan = await MealPlan.findOne({ _id: req.params.id, nutritionist: req.user._id });
  if (!plan) throw new HttpError(404, 'Piano non trovato.');
  return plan;
}

router.get('/', async (req, res) => {
  const plans = await MealPlan.find({ nutritionist: req.user._id }).sort({ updatedAt: -1 }).populate('client').lean();
  res.json({ plans: plans.map(summary) });
});

router.get('/:id', async (req, res) => {
  const plan = await ownPlan(req);
  await plan.populate('client');
  res.json({ plan: full(plan.toObject()) });
});

router.post('/', async (req, res) => {
  const { clientId, ...data } = parse(createSchema, req.body);
  await requireClientOf(req.user, clientId);
  const plan = await MealPlan.create({ ...toDoc(data), client: clientId, nutritionist: req.user._id });
  if (plan.status === 'active') await archiveOtherActive(req.user._id, clientId, plan._id);
  await plan.populate('client');
  res.status(201).json({ plan: full(plan.toObject()) });
});

router.put('/:id', async (req, res) => {
  const data = parse(updateSchema, req.body);
  const plan = await ownPlan(req);
  plan.set({ ...toDoc(data), needsReview: false });
  await plan.save();
  if (plan.status === 'active') await archiveOtherActive(req.user._id, plan.client, plan._id);
  await plan.populate('client');
  res.json({ plan: full(plan.toObject()) });
});

router.patch('/:id', async (req, res) => {
  const data = parse(patchSchema, req.body);
  const plan = await ownPlan(req);
  plan.set(data);
  await plan.save();
  if (plan.status === 'active') await archiveOtherActive(req.user._id, plan.client, plan._id);
  await plan.populate('client');
  res.json({ plan: summary(plan.toObject()) });
});

router.delete('/:id', async (req, res) => {
  const plan = await ownPlan(req);
  await plan.deleteOne();
  res.status(204).end();
});

export default router;
