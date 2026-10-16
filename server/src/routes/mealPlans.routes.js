import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { MEAL_TYPES, MealPlan } from '../models/index.js';
import { requireClientOf } from '../services/access.js';
import { HttpError } from '../utils/httpError.js';
import { dayKeySchema, objectId, optionalNumber, optionalText } from '../utils/schemas.js';
import { publicUser } from '../utils/serialize.js';
import { dayKey, zonedDate } from '../utils/dates.js';
import { parse } from '../utils/validate.js';

// Piani alimentari: li crea e modifica la nutrizionista.
const router = Router();
router.use(requireAuth, requireRole('nutritionist'));

const mealSchema = z.object({
  type: z.enum(MEAL_TYPES, { error: 'Tipo di pasto non valido.' }),
  name: z.string({ error: 'Ogni pasto deve avere un nome.' }).trim().min(1, 'Ogni pasto deve avere un nome.').max(120),
  description: optionalText(400),
  kcal: optionalNumber(0, 5000, 'Calorie'),
});

const daySchema = z.object({
  dayIndex: z.number().int().min(1).max(7),
  meals: z.array(mealSchema).max(10, 'Massimo 10 pasti al giorno.'),
});

const planFields = {
  title: z.string({ error: 'Dai un titolo al piano.' }).trim().min(1, 'Dai un titolo al piano.').max(100),
  goal: optionalText(60),
  kcalTarget: optionalNumber(500, 6000, 'Obiettivo calorico'),
  guidelines: optionalText(3000),
  status: z.enum(['draft', 'active', 'archived']).default('active'),
  startDate: dayKeySchema.optional().nullable(),
  days: z.array(daySchema).max(7),
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
  updatedAt: p.updatedAt,
  createdAt: p.createdAt,
});

const full = (p) => ({
  ...summary(p),
  guidelines: p.guidelines ?? '',
  startDate: p.startDate ? dayKey(p.startDate) : null,
  days: p.days ?? [],
});

function toDoc(data) {
  const { startDate, ...rest } = data;
  return {
    ...rest,
    startDate: startDate ? zonedDate(startDate, 9) : undefined,
    days: [...data.days].sort((a, b) => a.dayIndex - b.dayIndex),
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
