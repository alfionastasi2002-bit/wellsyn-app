import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { CareLink, CheckIn, User } from '../models/index.js';
import { HttpError } from '../utils/httpError.js';
import { publicUser } from '../utils/serialize.js';
import { parse } from '../utils/validate.js';

// Gestione dei clienti da parte di nutrizionisti e personal trainer.
const router = Router();
router.use(requireAuth, requireRole('nutritionist', 'trainer'));

const addClientSchema = z.object({
  firstName: z.string({ error: 'Inserisci il nome.' }).trim().min(1, 'Inserisci il nome.').max(60),
  lastName: z.string({ error: 'Inserisci il cognome.' }).trim().min(1, 'Inserisci il cognome.').max(60),
  email: z
    .string({ error: "Inserisci l'email." })
    .trim()
    .toLowerCase()
    .pipe(z.email('Inserisci un indirizzo email valido.')),
  program: z.string().trim().max(60).optional(),
});

router.get('/', async (req, res) => {
  const me = req.user;
  const links = await CareLink.find({ professional: me._id, status: { $in: ['active', 'pending'] } })
    .sort({ createdAt: -1 })
    .populate('client')
    .lean();

  // Ultimo controllo visibile a questo professionista: i suoi e le pesate del cliente.
  const lastChecks = await CheckIn.aggregate([
    {
      $match: {
        client: { $in: links.map((l) => l.client._id) },
        $or: [{ professional: me._id }, { source: 'self' }],
      },
    },
    { $sort: { date: -1 } },
    { $group: { _id: '$client', date: { $first: '$date' }, weightKg: { $first: '$weightKg' } } },
  ]);
  const lastByClient = new Map(lastChecks.map((c) => [String(c._id), c]));

  res.json({
    clients: links.map((l) => ({
      linkId: String(l._id),
      status: l.status,
      sharedAccess: l.sharedAccess,
      program: l.program ?? null,
      since: l.createdAt,
      client: { ...publicUser(l.client), email: l.client.email },
      lastCheck: lastByClient.get(String(l.client._id)) ?? null,
    })),
  });
});

router.post('/', async (req, res) => {
  const me = req.user;
  const data = parse(addClientSchema, req.body);
  const existing = await User.findOne({ email: data.email });

  // Cliente già registrato: gli inviamo una richiesta che dovrà accettare.
  if (existing) {
    if (existing.role !== 'client') throw new HttpError(409, 'Questa email appartiene a un account professionista.');
    const link = await CareLink.findOne({ client: existing._id, professional: me._id });
    if (link && link.status !== 'revoked') throw new HttpError(409, 'Questo cliente è già nella tua lista.');
    if (link) {
      Object.assign(link, { status: 'pending', sharedAccess: false, program: data.program ?? link.program });
      await link.save();
    } else {
      await CareLink.create({
        client: existing._id,
        professional: me._id,
        professionalRole: me.role,
        status: 'pending',
        program: data.program,
      });
    }
    return res.status(201).json({
      status: 'pending',
      message: `Richiesta inviata a ${existing.firstName}: la vedrà nella sezione Professionisti e potrà accettarla.`,
    });
  }

  // Cliente nuovo: creiamo l'account con una password temporanea da comunicargli.
  const tempPassword = crypto.randomBytes(9).toString('base64url');
  const client = await User.create({
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    role: 'client',
    passwordHash: await bcrypt.hash(tempPassword, 12),
  });
  await CareLink.create({
    client: client._id,
    professional: me._id,
    professionalRole: me.role,
    status: 'active',
    program: data.program,
  });
  res.status(201).json({
    status: 'active',
    tempPassword,
    message: `Account creato per ${client.firstName}. Comunicagli email e password temporanea.`,
  });
});

router.delete('/:linkId', async (req, res) => {
  const link = await CareLink.findOne({ _id: req.params.linkId, professional: req.user._id });
  if (!link) throw new HttpError(404, 'Cliente non trovato.');
  Object.assign(link, { status: 'revoked', sharedAccess: false });
  await link.save();
  res.status(204).end();
});

export default router;
