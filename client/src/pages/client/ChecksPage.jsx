import { CalendarDays, ChevronRight, ClipboardList } from 'lucide-react';
import { Link } from 'react-router';
import { Avatar } from '../../components/Avatar.jsx';
import { PageHeader } from '../../components/forms.jsx';
import { METRICS } from '../../components/progress.jsx';
import { Card, CardHeader, EmptyState, ErrorState, IconBadge, PageLoader } from '../../components/ui.jsx';
import { t } from '../../i18n/index.js';
import { addDaysKey, capitalize, displayName, fmtDayKey, fmtNumber, fmtTime, todayKey } from '../../lib/format.js';
import { CHECK_SOURCE } from '../../lib/labels.js';
import { useApi } from '../../lib/useApi.js';

/** Esito dei controlli fatti dai professionisti (gli appuntamenti sono nella sezione Agenda). */
export default function ChecksPage() {
  const today = todayKey();
  const checks = useApi('/me/checkins');
  const appointments = useApi(`/appointments?from=${today}&to=${addDaysKey(today, 120)}`);

  if (checks.loading && !checks.data) return <PageLoader />;
  if (checks.error) return <ErrorState error={checks.error} onRetry={checks.reload} />;

  const professionalChecks = checks.data.checkins.filter((c) => c.source !== 'self').reverse();
  const next = (appointments.data?.appointments ?? []).find((a) => a.status === 'scheduled' && new Date(a.end).getTime() > Date.now());

  return (
    <div className="space-y-5">
      <PageHeader title={t('Controlli')} subtitle={t('L’esito dei controlli fatti con i tuoi professionisti: misure e note.')} />

      <Link to="/app/agenda" className="card flex items-center gap-4 p-4 transition hover:border-brand-300">
        <IconBadge icon={CalendarDays} />
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-medium text-ink-500">{t('Prossimo appuntamento')}</span>
          {next ? (
            <span className="block truncate font-semibold">
              {capitalize(fmtDayKey(next.day, { weekday: 'long', day: 'numeric', month: 'long' }))}, {fmtTime(next.date)} · {next.professional ? displayName(next.professional) : ''}
            </span>
          ) : (
            <span className="block font-semibold">{t('Nessun appuntamento in programma')}</span>
          )}
        </span>
        <span className="hidden text-sm font-medium text-brand-800 sm:inline">{t('Apri agenda')}</span>
        <ChevronRight className="h-5 w-5 shrink-0 text-ink-400" />
      </Link>

      <Card className="p-5">
        <CardHeader icon={ClipboardList} title={t('Esito dei controlli')} subtitle={t('Misure e note registrate dai tuoi professionisti')} />
        {professionalChecks.length === 0 ? (
          <EmptyState title={t('Nessun controllo registrato')} text={t('Dopo il primo controllo troverai qui misure e note dei tuoi professionisti.')} />
        ) : (
          <ul className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
            {professionalChecks.slice(0, 20).map((c) => (
              <li key={c.id} className="rounded-xl border border-line p-4">
                <div className="flex items-center gap-3">
                  {c.author && <Avatar user={c.author} size="sm" />}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{c.author ? displayName(c.author) : CHECK_SOURCE[c.source]}</p>
                    <p className="text-xs text-ink-500">{fmtDayKey(c.day, { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-3">
                  {METRICS.filter((m) => c[m.key] != null).map((m) => (
                    <div key={m.key}>
                      <dt className="text-xs text-ink-500">{m.label}</dt>
                      <dd className="font-medium">
                        {fmtNumber(c[m.key])} {m.unit}
                      </dd>
                    </div>
                  ))}
                </dl>
                {c.notes && <p className="mt-2 rounded-lg bg-soft p-2.5 text-sm text-ink-700 italic">“{c.notes}”</p>}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
