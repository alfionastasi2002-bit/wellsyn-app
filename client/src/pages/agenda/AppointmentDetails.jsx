import { CalendarDays, CircleCheck, Clock, MapPin, MessageSquareText, Pencil, RotateCcw, StickyNote, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { Avatar } from '../../components/Avatar.jsx';
import { ConfirmButton, Modal, StatusPill } from '../../components/forms.jsx';
import { t, translateMessage } from '../../i18n/index.js';
import { api } from '../../lib/api.js';
import { capitalize, displayName, fmtDayKey, fmtDuration, fmtTime, ROLE_LABELS } from '../../lib/format.js';
import { messagesPath } from '../../navigation.js';
import { FormError } from '../auth/fields.jsx';
import { STATUS_META } from './agendaUtils.js';

const STATUS_PILL = {
  scheduled: 'bg-brand-50 text-brand-800',
  done: 'bg-muted text-ink-700',
  cancelled: 'bg-amber-50 text-amber-700',
};

/** Scheda di un appuntamento con le azioni possibili (per il professionista). */
export function AppointmentDetails({ appointment: a, viewerRole, onClose, onChanged, onRemoved, onEdit }) {
  const [error, setError] = useState('');
  if (!a) return null;
  const isPro = viewerRole !== 'client';
  const person = isPro ? a.client : a.professional;

  async function setStatus(status) {
    setError('');
    try {
      const { appointment } = await api(`/appointments/${a.id}`, { method: 'PATCH', body: { status } });
      onChanged(appointment);
    } catch (err) {
      setError(translateMessage(err.message));
    }
  }
  async function remove() {
    setError('');
    try {
      await api(`/appointments/${a.id}`, { method: 'DELETE' });
      onRemoved(a);
    } catch (err) {
      setError(translateMessage(err.message));
    }
  }

  const row = 'flex items-start gap-3 text-sm';
  return (
    <Modal
      open
      onClose={onClose}
      title={t(a.type)}
      footer={
        isPro && (
          <div className="flex w-full flex-wrap items-center gap-2">
            {a.status === 'scheduled' ? (
              <>
                <button type="button" className="btn-outline" onClick={() => onEdit(a)}>
                  <Pencil className="h-4 w-4" /> {t('Modifica')}
                </button>
                <button type="button" className="btn-soft" onClick={() => setStatus('done')}>
                  <CircleCheck className="h-4 w-4" /> {t('Segna come svolto')}
                </button>
                <span className="sm:ml-auto">
                  <ConfirmButton confirmLabel={t('Annulla appuntamento')} onConfirm={() => setStatus('cancelled')}>
                    <X className="h-4 w-4" /> {t('Annulla appuntamento')}
                  </ConfirmButton>
                </span>
              </>
            ) : (
              <>
                <button type="button" className="btn-soft" onClick={() => setStatus('scheduled')}>
                  <RotateCcw className="h-4 w-4" /> {t('Rimetti in programma')}
                </button>
                <span className="sm:ml-auto">
                  <ConfirmButton confirmLabel={t('Elimina definitivamente')} onConfirm={remove}>
                    <Trash2 className="h-4 w-4" /> {t('Elimina')}
                  </ConfirmButton>
                </span>
              </>
            )}
          </div>
        )
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          {person && <Avatar user={person} size="lg" />}
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{person ? displayName(person) : '—'}</p>
            <p className="text-xs text-ink-500">{person ? (isPro ? t('Cliente') : ROLE_LABELS[person.role]) : ''}</p>
          </div>
          <StatusPill className={STATUS_PILL[a.status]}>{STATUS_META[a.status].label}</StatusPill>
        </div>
        <div className="space-y-2.5 rounded-2xl bg-soft p-4">
          <p className={row}>
            <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" />
            {capitalize(fmtDayKey(a.day, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))}
          </p>
          <p className={row}>
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" />
            {fmtTime(a.date)} – {fmtTime(a.end)} <span className="text-ink-500">({fmtDuration(a.durationMin)})</span>
          </p>
          {a.location && (
            <p className={row}>
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" /> {a.location}
            </p>
          )}
          {a.notes && (
            <p className={row}>
              <StickyNote className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" /> <span className="italic">{a.notes}</span>
            </p>
          )}
        </div>
        {person && (
          <Link to={`${messagesPath(viewerRole)}?con=${person.id}`} className="link-arrow">
            <MessageSquareText className="h-4 w-4" /> {isPro ? t('Scrivi al cliente') : t('Scrivi al professionista')}
          </Link>
        )}
        <FormError>{error}</FormError>
      </div>
    </Modal>
  );
}
