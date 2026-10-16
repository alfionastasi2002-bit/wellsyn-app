import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { CareLink } from '../models/index.js';
import { HttpError } from '../utils/httpError.js';
import { publicUser } from '../utils/serialize.js';
import { parse } from '../utils/validate.js';

// Il cliente gestisce i propri professionisti e le autorizzazioni di condivisione.
const router = Router();
router.use(requireAuth, requireRole('client'));

const serialize = (l) => ({
  linkId: String(l._id),
  status: l.status,
  role: l.professionalRole,
  sharedAccess: l.sharedAccess,
  program: l.program ?? null,
  since: l.createdAt,
  professional: publicUser(l.professional),
});

router.get('/', async (req, res) => {
  const links = await CareLink.find({ client: req.user._id, status: { $in: ['active', 'pending'] } })
    .sort({ status: 1, createdAt: -1 })
    .populate('professional')
    .lean();
  res.json({ team: links.map(serialize) });
});

const updateSchema = z.object({
  action: z.enum(['accept', 'decline', 'revoke']).optional(),
  sharedAccess: z.boolean().optional(),
});

router.patch('/:linkId', async (req, res) => {
  const { action, sharedAccess } = parse(updateSchema, req.body);
  const link = await CareLink.findOne({ _id: req.params.linkId, client: req.user._id });
  if (!link || link.status === 'revoked') throw new HttpError(404, 'Collegamento non trovato.');

  if (action === 'accept') {
    if (link.status !== 'pending') throw new HttpError(400, 'Questa richiesta è già stata gestita.');
    link.status = 'active';
  }
  if (action === 'decline' || action === 'revoke') {
    link.status = 'revoked';
    link.sharedAccess = false;
  }
  if (sharedAccess !== undefined && link.status === 'active') {
    link.sharedAccess = sharedAccess;
  }

  await link.save();
  await link.populate('professional');
  res.json({ link: serialize(link) });
});

export default router;
