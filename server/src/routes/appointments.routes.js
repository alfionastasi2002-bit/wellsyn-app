import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { Appointment } from '../models/index.js';
import { requireClientOf } from '../services/access.js';
import { addDays, dayKey, TZ, zonedDate } from '../utils/dates.js';
import { HttpError } from '../utils/httpError.js';
import { dayKeySchema, objectId, optionalNumber, optionalText, timeSchema } from '../utils/schemas.js';
import { publicUser } from '../utils/serialize.js';
import { parse } from '../utils/validate.js';

// Agenda: controlli (nutrizionista) e sessioni (personal trainer). Il cliente vede i propri appuntamenti.
const router = Router();
router.use(requireAuth);

const MINUTE = 60 * 1000;
const MAX_DURATION_MIN = 480;
const endOf = (a) => new Date(a.date.getTime() + (a.durationMin ?? 60) * MINUTE);

const serialize = (a) => ({
  id: String(a._id),
  date: a.date,
  end: endOf(a),
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

const timeFormatter = new Intl.DateTimeFormat('it-IT', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
const fmtTime = (date) => timeFormatter.format(date);

/**
 * Impedisce gli appuntamenti sovrapposti:
 * - il professionista non può avere due appuntamenti nello stesso momento;
 * - il cliente non può essere atteso contemporaneamente da due professionisti.
 * Contano solo gli appuntamenti "in programma" (quelli annullati liberano l'orario).
 */
async function assertFree({ professionalId, clientId, start, end, excludeId }) {
  const base = {
    status: 'scheduled',
    // basta guardare indietro della durata massima: prima nessun appuntamento può arrivare fino a "start"
    date: { $lt: end, $gt: new Date(start.getTime() - MAX_DURATION_MIN * MINUTE) },
    ...(excludeId && { _id: { $ne: excludeId } }),
  };
  const overlaps = (a) => endOf(a) > start;
  const [mine, clientOthers] = await Promise.all([
    Appointment.find({ ...base, professional: professionalId }).sort({ date: 1 }).populate('client').lean(),
    Appointment.find({ ...base, client: clientId, professional: { $ne: professionalId } }).lean(),
  ]);
  const clash = mine.find(overlaps);
  if (clash) {
    const who = clash.client ? `${clash.client.firstName} ${clash.client.lastName}` : 'un altro cliente';
    throw new HttpError(
      409,
      `Hai già un appuntamento dalle ${fmtTime(clash.date)} alle ${fmtTime(endOf(clash))} con ${who}: scegli un altro orario.`,
    );
  }
  if (clientOthers.some(overlaps)) {
    throw new HttpError(409, 'Il cliente ha già un altro appuntamento in questo orario: scegli un altro orario.');
  }
}

/** Inizio e fine a partire da giorno + "dalle" + "alle" (oppure + durata in minuti). */
function timing({ day, time, endTime, durationMin }) {
  const [h, m] = time.split(':').map(Number);
  const start = zonedDate(day, h, m);
  let minutes = durationMin;
  if (endTime) {
    const [eh, em] = endTime.split(':').map(Number);
    minutes = eh * 60 + em - (h * 60 + m);
  }
  minutes = minutes ?? 60;
  if (minutes <= 0) throw new HttpError(400, "L'orario di fine deve essere dopo quello di inizio.");
  if (minutes < 10) throw new HttpError(400, "L'appuntamento deve durare almeno 10 minuti.");
  if (minutes > MAX_DURATION_MIN) throw new HttpError(400, "L'appuntamento può durare al massimo 8 ore.");
  return { start, end: new Date(start.getTime() + minutes * MINUTE), durationMin: minutes };
}

const rangeSchema = z.object({ from: dayKeySchema.optional(), to: dayKeySchema.optional() });

router.get('/', async (req, res) => {
  const today = dayKey();
  const { from = addDays(today, -30), to = addDays(today, 90) } = parse(rangeSchema, req.query);
  if (from > to) throw new HttpError(400, 'Intervallo di date non valido.');
  const owner = req.user.role === 'client' ? { client: req.user._id } : { professional: req.user._id };
  const appointments = await Appointment.find({
    ...owner,
    date: { $gte: zonedDate(from), $lt: zonedDate(addDays(to, 1)) },
  })
    .sort({ date: 1 })
    .limit(2000)
    .populate(req.user.role === 'client' ? 'professional' : 'client')
    .lean();
  res.json({ appointments: appointments.map(serialize) });
});

// Orari già occupati in un giorno: i miei appuntamenti e, in forma anonima, quelli del cliente con altri professionisti.
const busySchema = z.object({ day: dayKeySchema, clientId: objectId('Seleziona un cliente.').optional() });

router.get('/busy', requireRole('nutritionist', 'trainer'), async (req, res) => {
  const { day, clientId } = parse(busySchema, req.query);
  const range = { $gte: zonedDate(day), $lt: zonedDate(addDays(day, 1)) };
  const [mine, clientOthers] = await Promise.all([
    Appointment.find({ professional: req.user._id, status: 'scheduled', date: range }).sort({ date: 1 }).populate('client').lean(),
    clientId
      ? requireClientOf(req.user, clientId).then(() =>
          Appointment.find({ client: clientId, professional: { $ne: req.user._id }, status: 'scheduled', date: range }).lean(),
        )
      : [],
  ]);
  res.json({
    mine: mine.map(serialize),
    client: clientOthers.map((a) => ({ start: a.date, end: endOf(a) })),
  });
});

const editableFields = {
  day: dayKeySchema,
  time: timeSchema,
  endTime: timeSchema.optional(),
  durationMin: optionalNumber(10, MAX_DURATION_MIN, 'Durata'),
  type: z.string({ error: 'Indica il tipo di appuntamento.' }).trim().min(1, 'Indica il tipo di appuntamento.').max(80),
  location: optionalText(120),
  notes: optionalText(500),
};
const createSchema = z.object({ clientId: objectId('Seleziona un cliente.'), ...editableFields });
const updateSchema = z.object(editableFields);

router.post('/', requireRole('nutritionist', 'trainer'), async (req, res) => {
  const data = parse(createSchema, req.body);
  await requireClientOf(req.user, data.clientId);
  const { start, end, durationMin } = timing(data);
  await assertFree({ professionalId: req.user._id, clientId: data.clientId, start, end });
  const appointment = await Appointment.create({
    client: data.clientId,
    professional: req.user._id,
    date: start,
    durationMin,
    kind: req.user.role === 'trainer' ? 'session' : 'check',
    type: data.type,
    location: data.location,
    notes: data.notes,
  });
  await appointment.populate('client');
  res.status(201).json({ appointment: serialize(appointment.toObject()) });
});

async function ownAppointment(req) {
  const appointment = await Appointment.findOne({ _id: req.params.id, professional: req.user._id });
  if (!appointment) throw new HttpError(404, 'Appuntamento non trovato.');
  return appointment;
}

// Modifica (es. spostare l'orario): il cliente resta lo stesso.
router.put('/:id', requireRole('nutritionist', 'trainer'), async (req, res) => {
  const data = parse(updateSchema, req.body);
  const appointment = await ownAppointment(req);
  const { start, end, durationMin } = timing(data);
  if (appointment.status === 'scheduled') {
    await assertFree({ professionalId: req.user._id, clientId: appointment.client, start, end, excludeId: appointment._id });
  }
  appointment.set({ date: start, durationMin, type: data.type, location: data.location, notes: data.notes });
  await appointment.save();
  await appointment.populate('client');
  res.json({ appointment: serialize(appointment.toObject()) });
});

const patchSchema = z.object({ status: z.enum(['scheduled', 'done', 'cancelled']) });

router.patch('/:id', requireRole('nutritionist', 'trainer'), async (req, res) => {
  const { status } = parse(patchSchema, req.body);
  const appointment = await ownAppointment(req);
  // Ripristinando un appuntamento annullato, l'orario deve essere ancora libero.
  if (status === 'scheduled' && appointment.status !== 'scheduled') {
    await assertFree({
      professionalId: req.user._id,
      clientId: appointment.client,
      start: appointment.date,
      end: endOf(appointment),
      excludeId: appointment._id,
    });
  }
  appointment.status = status;
  await appointment.save();
  await appointment.populate('client');
  res.json({ appointment: serialize(appointment.toObject()) });
});

router.delete('/:id', requireRole('nutritionist', 'trainer'), async (req, res) => {
  const appointment = await ownAppointment(req);
  await appointment.deleteOne();
  res.status(204).end();
});

export default router;
