import mongoose from 'mongoose';
import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { Message, User } from '../models/index.js';
import { messageContacts } from '../services/access.js';
import { HttpError } from '../utils/httpError.js';
import { objectId } from '../utils/schemas.js';
import { publicUser } from '../utils/serialize.js';
import { parse } from '../utils/validate.js';

// Messaggi tra cliente e professionisti (e tra colleghi che seguono lo stesso cliente).
const router = Router();
router.use(requireAuth);

const serialize = (m, meId) => ({
  id: String(m._id),
  text: m.text,
  createdAt: m.createdAt,
  mine: String(m.from) === String(meId),
  readAt: m.readAt ?? null,
});

// Elenco contatti con ultimo messaggio e numero di non letti
router.get('/contacts', async (req, res) => {
  const me = req.user._id;
  const relations = await messageContacts(req.user);
  const ids = [...relations.keys()].map((id) => new mongoose.Types.ObjectId(id));

  const [users, lastMessages, unreadCounts] = await Promise.all([
    User.find({ _id: { $in: ids } }).lean(),
    Message.aggregate([
      { $match: { $or: [{ from: me, to: { $in: ids } }, { to: me, from: { $in: ids } }] } },
      { $sort: { createdAt: -1 } },
      { $group: { _id: { $cond: [{ $eq: ['$from', me] }, '$to', '$from'] }, last: { $first: '$$ROOT' } } },
    ]),
    Message.aggregate([
      { $match: { to: me, readAt: null, from: { $in: ids } } },
      { $group: { _id: '$from', count: { $sum: 1 } } },
    ]),
  ]);

  const lastBy = new Map(lastMessages.map((m) => [String(m._id), m.last]));
  const unreadBy = new Map(unreadCounts.map((u) => [String(u._id), u.count]));

  const contacts = users
    .map((u) => {
      const last = lastBy.get(String(u._id));
      return {
        user: publicUser(u),
        relation: relations.get(String(u._id)),
        lastMessage: last ? serialize(last, me) : null,
        unread: unreadBy.get(String(u._id)) ?? 0,
      };
    })
    .sort(
      (a, b) =>
        new Date(b.lastMessage?.createdAt ?? 0) - new Date(a.lastMessage?.createdAt ?? 0) ||
        a.user.fullName.localeCompare(b.user.fullName),
    );

  res.json({ contacts });
});

async function requireContact(user, otherId) {
  if (!mongoose.isValidObjectId(otherId)) throw new HttpError(400, 'Contatto non valido.');
  const relations = await messageContacts(user);
  if (!relations.has(String(otherId))) throw new HttpError(403, 'Non puoi scrivere a questa persona.');
  return relations.get(String(otherId));
}

// Conversazione con una persona (segna come letti i suoi messaggi)
router.get('/:userId', async (req, res) => {
  const me = req.user._id;
  const other = req.params.userId;
  const relation = await requireContact(req.user, other);
  const [user, messages] = await Promise.all([
    User.findById(other).lean(),
    Message.find({ $or: [{ from: me, to: other }, { from: other, to: me }] })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean(),
  ]);
  await Message.updateMany({ from: other, to: me, readAt: null }, { $set: { readAt: new Date() } });
  res.json({ contact: { user: publicUser(user), relation }, messages: messages.reverse().map((m) => serialize(m, me)) });
});

const sendSchema = z.object({
  to: objectId('Destinatario non valido.'),
  text: z.string({ error: 'Scrivi un messaggio.' }).trim().min(1, 'Scrivi un messaggio.').max(2000, 'Messaggio troppo lungo.'),
});

router.post('/', async (req, res) => {
  const { to, text } = parse(sendSchema, req.body);
  await requireContact(req.user, to);
  const message = await Message.create({ from: req.user._id, to, text });
  res.status(201).json({ message: serialize(message.toObject(), req.user._id) });
});

export default router;
