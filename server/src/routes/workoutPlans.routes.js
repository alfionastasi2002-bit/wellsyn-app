import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { WorkoutPlan } from '../models/index.js';
import { requireClientOf } from '../services/access.js';
import { dayKey, daysBetween, zonedDate } from '../utils/dates.js';
import { HttpError } from '../utils/httpError.js';
import { dayKeySchema, objectId, optionalNumber, optionalText } from '../utils/schemas.js';
import { publicUser } from '../utils/serialize.js';
import { parse } from '../utils/validate.js';

// Schede di allenamento: le crea e modifica il personal trainer.
const router = Router();
router.use(requireAuth, requireRole('trainer'));

const exerciseSchema = z.object({
  name: z.string({ error: 'Ogni esercizio deve avere un nome.' }).trim().min(1, 'Ogni esercizio deve avere un nome.').max(100),
  sets: optionalNumber(1, 50, 'Serie'),
  reps: optionalText(30),
  restSec: optionalNumber(0, 900, 'Recupero'),
  notes: optionalText(200),
});

const sessionSchema = z.object({
  name: z.string({ error: 'Ogni sessione deve avere un nome.' }).trim().min(1, 'Ogni sessione deve avere un nome.').max(80),
  focus: optionalText(60),
  description: optionalText(500),
  durationMin: optionalNumber(5, 300, 'Durata'),
  dayOfWeek: z.number().int().min(1).max(7).optional().nullable().transform((v) => v ?? undefined),
  exercises: z.array(exerciseSchema).max(30, 'Massimo 30 esercizi per sessione.'),
});

const planFields = {
  title: z.string({ error: 'Dai un titolo alla scheda.' }).trim().min(1, 'Dai un titolo alla scheda.').max(100),
  level: z.enum(['principiante', 'intermedio', 'avanzato']).default('intermedio'),
  weeks: z.number().int().min(1, 'Almeno 1 settimana.').max(52).default(4),
  startDate: dayKeySchema.optional().nullable(),
  status: z.enum(['draft', 'active', 'archived']).default('active'),
  sessions: z
    .array(sessionSchema)
    .max(7, 'Massimo 7 sessioni a settimana.')
    .refine((list) => {
      const days = list.map((s) => s.dayOfWeek).filter(Boolean);
      return new Set(days).size === days.length;
    }, 'Due sessioni non possono essere nello stesso giorno.'),
};

const createSchema = z.object({ clientId: objectId('Seleziona un cliente.'), ...planFields });
const updateSchema = z.object(planFields);
const patchSchema = z.object({
  status: z.enum(['draft', 'active', 'archived']).optional(),
  needsReview: z.boolean().optional(),
});

export function currentWeekOf(plan, today = dayKey()) {
  const start = plan.startDate ? dayKey(plan.startDate) : today;
  return Math.min(Math.max(Math.floor(daysBetween(start, today) / 7) + 1, 1), plan.weeks ?? 1);
}

const summary = (p) => ({
  id: String(p._id),
  title: p.title,
  level: p.level,
  weeks: p.weeks,
  currentWeek: currentWeekOf(p),
  status: p.status,
  needsReview: p.needsReview,
  client: publicUser(p.client),
  sessionsCount: p.sessions?.length ?? 0,
  updatedAt: p.updatedAt,
  createdAt: p.createdAt,
});

const full = (p) => ({
  ...summary(p),
  startDate: p.startDate ? dayKey(p.startDate) : null,
  sessions: (p.sessions ?? []).map((s) => ({ ...s, id: String(s._id), _id: undefined })),
});

function toDoc(data) {
  const { startDate, ...rest } = data;
  return {
    ...rest,
    startDate: startDate ? zonedDate(startDate, 9) : new Date(),
    sessions: [...data.sessions].sort((a, b) => (a.dayOfWeek ?? 8) - (b.dayOfWeek ?? 8)),
  };
}

async function archiveOtherActive(trainerId, clientId, keepId) {
  await WorkoutPlan.updateMany(
    { trainer: trainerId, client: clientId, status: 'active', _id: { $ne: keepId } },
    { $set: { status: 'archived' } },
  );
}

async function ownPlan(req) {
  const plan = await WorkoutPlan.findOne({ _id: req.params.id, trainer: req.user._id });
  if (!plan) throw new HttpError(404, 'Scheda non trovata.');
  return plan;
}

router.get('/', async (req, res) => {
  const plans = await WorkoutPlan.find({ trainer: req.user._id }).sort({ updatedAt: -1 }).populate('client').lean();
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
  const plan = await WorkoutPlan.create({ ...toDoc(data), client: clientId, trainer: req.user._id });
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
