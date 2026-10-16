import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { Appointment } from '../models/index.js';
import { requireClientOf } from '../services/access.js';
import { addDays, dayKey, zonedDate } from '../utils/dates.js';
import { HttpError } from '../utils/httpError.js';
import { dayKeySchema, objectId, optionalNumber, optionalText, timeSchema } from '../utils/schemas.js';
import { publicUser } from '../utils/serialize.js';
import { parse } from '../utils/validate.js';

// Agenda: controlli (nutrizionista) e sessioni (personal trainer). Il cliente vede i propri appuntamenti.
const router = Router();
router.use(requireAuth);

const serialize = (a) => ({
  id: String(a._id),
  date: a.date,
  day: dayKey(a.date),
  durationMin: a.durationMin,
  kind: a.kind,
  type: a.type,
  location: a.location ?? null,
  notes: a.notes ?? null,
  status: a.status,
  client: a.client?.firstName ? publicUser(a.client) : undefined,
  professional: a.professional?.firstName ? publicUser(a.professional) : undefined,
});

const rangeSchema = z.object({ from: dayKeySchema.optional(), to: dayKeySchema.optional() });

router.get('/', async (req, res) => {
  const today = dayKey();
  const { from = addDays(today, -30), to = addDays(today, 90) } = parse(rangeSchema, req.query);
  const owner = req.user.role === 'client' ? { client: req.user._id } : { professional: req.user._id };
  const appointments = await Appointment.find({
    ...owner,
    date: { $gte: zonedDate(from), $lt: zonedDate(addDays(to, 1)) },
  })
    .sort({ date: 1 })
    .populate(req.user.role === 'client' ? 'professional' : 'client')
    .lean();
  res.json({ appointments: appointments.map(serialize) });
});

const createSchema = z.object({
  clientId: objectId('Seleziona un cliente.'),
  day: dayKeySchema,
  time: timeSchema,
  durationMin: optionalNumber(10, 480, 'Durata').transform((v) => v ?? 60),
  type: z.string({ error: 'Indica il tipo di appuntamento.' }).trim().min(1, 'Indica il tipo di appuntamento.').max(80),
  location: optionalText(120),
  notes: optionalText(500),
});

router.post('/', requireRole('nutritionist', 'trainer'), async (req, res) => {
  const data = parse(createSchema, req.body);
  await requireClientOf(req.user, data.clientId);
  const appointment = await Appointment.create({
    client: data.clientId,
    professional: req.user._id,
    date: zonedDate(data.day, ...data.time.split(':').map(Number)),
    durationMin: data.durationMin,
    kind: req.user.role === 'trainer' ? 'session' : 'check',
    type: data.type,
    location: data.location,
    notes: data.notes,
  });
  await appointment.populate('client');
  res.status(201).json({ appointment: serialize(appointment.toObject()) });
});

const patchSchema = z.object({ status: z.enum(['scheduled', 'done', 'cancelled']) });

router.patch('/:id', requireRole('nutritionist', 'trainer'), async (req, res) => {
  const { status } = parse(patchSchema, req.body);
  const appointment = await Appointment.findOne({ _id: req.params.id, professional: req.user._id });
  if (!appointment) throw new HttpError(404, 'Appuntamento non trovato.');
  appointment.status = status;
  await appointment.save();
  await appointment.populate('client');
  res.json({ appointment: serialize(appointment.toObject()) });
});

export default router;
