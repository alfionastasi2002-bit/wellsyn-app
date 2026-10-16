import { ChevronRight, Clock, MapPin } from 'lucide-react';
import { t } from '../i18n/index.js';
import { capitalize, displayName, fmtDayKey, fmtDuration, fmtTime, ROLE_LABELS, todayKey } from '../lib/format.js';
import { Avatar } from './Avatar.jsx';
import { StatusPill } from './forms.jsx';
import { EmptyState } from './ui.jsx';

const STATUS = {
  done: { label: 'Svolto', className: 'bg-brand-50 text-brand-800' },
  cancelled: { label: 'Annullato', className: 'bg-muted text-ink-500 line-through' },
};

function dayTitle(key) {
  const today = todayKey();
  const label = capitalize(fmtDayKey(key, { weekday: 'long', day: 'numeric', month: 'long' }));
  if (key === today) return `${t('Oggi')} · ${label}`;
  const tomorrow = new Date(`${today}T12:00:00Z`);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  if (key === tomorrow.toISOString().slice(0, 10)) return `${t('Domani')} · ${label}`;
  return label;
}

/**
 * Elenco di appuntamenti raggruppati per giorno.
 * person: 'client' mostra il cliente (vista professionista), 'professional' mostra il professionista (vista cliente).
 * onOpen(appointment) -> apre la scheda dell'appuntamento; actions(appointment) -> pulsanti opzionali.
 */
export function AppointmentList({ appointments, person = 'client', actions, onOpen, emptyText = 'Nessun appuntamento.' }) {
  if (!appointments.length) return <EmptyState title={t(emptyText)} />;
  const groups = [];
  for (const a of appointments) {
    const last = groups.at(-1);
    if (last?.day === a.day) last.items.push(a);
    else groups.push({ day: a.day, items: [a] });
  }
  return (
    <div className="space-y-5">
      {groups.map((g) => (
        <section key={g.day}>
          <h3 className="mb-2 text-sm font-semibold text-ink-700">{dayTitle(g.day)}</h3>
          <ul className="space-y-2">
            {g.items.map((a) => {
              const who = a[person];
              const end = a.end ?? new Date(new Date(a.date).getTime() + a.durationMin * 60000);
              const status = STATUS[a.status];
              const Tag = onOpen ? 'button' : 'div';
              return (
                <li key={a.id} className={`flex flex-col gap-3 rounded-xl border border-line bg-surface p-3 sm:flex-row sm:items-center ${a.status === 'cancelled' ? 'opacity-60' : ''}`}>
                  <Tag
                    {...(onOpen && { type: 'button', onClick: () => onOpen(a) })}
                    className="flex min-w-0 flex-1 flex-col gap-3 text-left sm:flex-row sm:items-center"
                  >
                    <div className="w-24 shrink-0">
                      <p className="font-display text-lg font-semibold">{fmtTime(a.date)}</p>
                      <p className="text-xs text-ink-500">{t('fino alle {time}', { time: fmtTime(end) })}</p>
                    </div>
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      {who && <Avatar user={who} />}
                      <div className="min-w-0">
                        <p className="truncate font-semibold">
                          {who ? displayName(who) : '—'}
                          {person === 'professional' && who && <span className="ml-2 text-xs font-normal text-ink-500">{ROLE_LABELS[who.role]}</span>}
                        </p>
                        <p className="truncate text-sm text-ink-700">{t(a.type)}</p>
                        <p className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-ink-500">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" /> {fmtDuration(a.durationMin)}
                          </span>
                          {a.location && (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" /> {a.location}
                            </span>
                          )}
                        </p>
                        {a.notes && <p className="mt-1 text-xs text-ink-500 italic">{a.notes}</p>}
                      </div>
                    </div>
                    {onOpen && <ChevronRight className="hidden h-4 w-4 shrink-0 text-ink-400 sm:block" />}
                  </Tag>
                  {(status || actions) && (
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      {status && <StatusPill className={status.className}>{t(status.label)}</StatusPill>}
                      {actions?.(a)}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
