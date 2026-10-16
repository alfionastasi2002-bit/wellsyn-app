import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { CheckIn } from '../models/index.js';
import { activeClientIds, requireClientOf } from '../services/access.js';
import { dayKey, zonedDate } from '../utils/dates.js';
import { HttpError } from '../utils/httpError.js';
import { dayKeySchema, objectId, optionalNumber, optionalText } from '../utils/schemas.js';
import { publicUser } from '../utils/serialize.js';
import { parse } from '../utils/validate.js';

// Controlli e misurazioni registrati dai professionisti.
const router = Router();
router.use(requireAuth, requireRole('nutritionist', 'trainer'));

export const metricsSchema = {
  weightKg: optionalNumber(20, 400, 'Peso'),
  waistCm: optionalNumber(30, 250, 'Vita'),
  hipsCm: optionalNumber(30, 250, 'Fianchi'),
  bodyFatPct: optionalNumber(2, 70, 'Massa grassa'),
  muscleMassKg: optionalNumber(5, 150, 'Massa muscolare'),
};

export const serializeCheckIn = (c) => ({
  id: String(c._id),
  date: c.date,
  day: dayKey(c.date),
  source: c.source,
  author: c.professional?.firstName ? publicUser(c.professional) : null,
  clientId: String(c.client?._id ?? c.client),
  weightKg: c.weightKg ?? null,
  waistCm: c.waistCm ?? null,
  hipsCm: c.hipsCm ?? null,
  bodyFatPct: c.bodyFatPct ?? null,
  muscleMassKg: c.muscleMassKg ?? null,
  notes: c.notes ?? null,
});

const createSchema = z
  .object({ clientId: objectId('Seleziona un cliente.'), day: dayKeySchema.optional(), notes: optionalText(1000), ...metricsSchema })
  .refine(
    (d) => ['weightKg', 'waistCm', 'hipsCm', 'bodyFatPct', 'muscleMassKg'].some((k) => d[k] != null) || d.notes,
    'Inserisci almeno una misura o una nota.',
  );

// Ultimi controlli registrati da me
router.get('/', async (req, res) => {
  const clients = await activeClientIds(req.user._id);
  const checkins = await CheckIn.find({ professional: req.user._id, client: { $in: clients } })
    .sort({ date: -1 })
    .limit(50)
    .populate('client')
    .lean();
  res.json({
    checkins: checkins.map((c) => ({ ...serializeCheckIn(c), client: publicUser(c.client) })),
  });
});

router.post('/', async (req, res) => {
  const { clientId, day, ...data } = parse(createSchema, req.body);
  await requireClientOf(req.user, clientId);
  const checkin = await CheckIn.create({
    ...data,
    client: clientId,
    professional: req.user._id,
    source: req.user.role,
    date: day && day !== dayKey() ? zonedDate(day, 12) : new Date(),
  });
  await checkin.populate(['client', 'professional']);
  res.status(201).json({ checkin: { ...serializeCheckIn(checkin.toObject()), client: publicUser(checkin.client) } });
});

router.delete('/:id', async (req, res) => {
  const checkin = await CheckIn.findOne({ _id: req.params.id, professional: req.user._id });
  if (!checkin) throw new HttpError(404, 'Controllo non trovato.');
  await checkin.deleteOne();
  res.status(204).end();
});

export default router;
