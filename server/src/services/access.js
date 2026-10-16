import mongoose from 'mongoose';
import { CareLink } from '../models/index.js';
import { HttpError } from '../utils/httpError.js';

/** Collegamento attivo professionista → cliente, oppure errore 403. */
export async function requireClientOf(professional, clientId) {
  if (!mongoose.isValidObjectId(clientId)) throw new HttpError(400, 'Cliente non valido.');
  const link = await CareLink.findOne({ professional: professional._id, client: clientId, status: 'active' });
  if (!link) throw new HttpError(403, 'Questo cliente non è collegato a te.');
  return link;
}

/** Clienti attivi di un professionista. */
export async function activeClientIds(professionalId) {
  const links = await CareLink.find({ professional: professionalId, status: 'active' }).select('client').lean();
  return links.map((l) => l.client);
}

/**
 * Persone con cui un utente può scambiare messaggi:
 * - cliente ↔ i suoi professionisti attivi;
 * - professionista ↔ i suoi clienti attivi;
 * - professionista ↔ colleghi che seguono lo stesso cliente, se quel cliente
 *   ha autorizzato la condivisione con entrambi.
 * Restituisce una Map userId -> relazione ("client" | "professional" | "colleague").
 */
export async function messageContacts(user) {
  const contacts = new Map();

  if (user.role === 'client') {
    const links = await CareLink.find({ client: user._id, status: 'active' }).select('professional').lean();
    for (const l of links) contacts.set(String(l.professional), 'professional');
    return contacts;
  }

  const myLinks = await CareLink.find({ professional: user._id, status: 'active' }).select('client sharedAccess').lean();
  for (const l of myLinks) contacts.set(String(l.client), 'client');

  const sharedClients = myLinks.filter((l) => l.sharedAccess).map((l) => l.client);
  if (sharedClients.length) {
    const colleagues = await CareLink.find({
      client: { $in: sharedClients },
      professional: { $ne: user._id },
      status: 'active',
      sharedAccess: true,
    })
      .select('professional')
      .lean();
    for (const c of colleagues) {
      if (!contacts.has(String(c.professional))) contacts.set(String(c.professional), 'colleague');
    }
  }
  return contacts;
}
