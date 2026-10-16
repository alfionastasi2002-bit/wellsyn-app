import { CalendarDays, ClipboardList } from 'lucide-react';
import { useState } from 'react';
import { AppointmentList } from '../../components/agenda.jsx';
import { Avatar } from '../../components/Avatar.jsx';
import { PageHeader, Tabs } from '../../components/forms.jsx';
import { METRICS } from '../../components/progress.jsx';
import { Card, CardHeader, EmptyState, ErrorState, PageLoader } from '../../components/ui.jsx';
import { displayName, fmtDayKey, fmtNumber, todayKey } from '../../lib/format.js';
import { CHECK_SOURCE } from '../../lib/labels.js';
import { useApi } from '../../lib/useApi.js';

export default function ChecksPage() {
  const appointments = useApi('/appointments');
  const checks = useApi('/me/checkins');
  const [tab, setTab] = useState('upcoming');

  if ((appointments.loading && !appointments.data) || (checks.loading && !checks.data)) return <PageLoader />;
  if (appointments.error || checks.error) {
    return <ErrorState error={appointments.error ?? checks.error} onRetry={() => { appointments.reload(); checks.reload(); }} />;
  }

  const today = todayKey();
  const now = Date.now();
  const all = appointments.data.appointments;
  const upcoming = all.filter((a) => a.status === 'scheduled' && new Date(a.date).getTime() >= now - 60 * 60000);
  const past = all.filter((a) => !upcoming.includes(a)).reverse();
  const professionalChecks = checks.data.checkins.filter((c) => c.source !== 'self').reverse();

  return (
    <div className="space-y-5">
      <PageHeader title="Controlli" subtitle="I tuoi appuntamenti con i professionisti e l'esito dei controlli." />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <Card className="p-5">
          <CardHeader icon={CalendarDays} title="Appuntamenti" />
          <Tabs
            className="mt-4 w-fit"
            value={tab}
            onChange={setTab}
            tabs={[
              { value: 'upcoming', label: 'In programma', count: upcoming.filter((a) => a.day >= today).length },
              { value: 'past', label: 'Passati' },
            ]}
          />
          <div className="mt-4">
            <AppointmentList
              appointments={tab === 'upcoming' ? upcoming : past}
              person="professional"
              emptyText={tab === 'upcoming' ? 'Nessun appuntamento in programma' : 'Nessun appuntamento passato'}
            />
          </div>
        </Card>

        <Card className="p-5">
          <CardHeader icon={ClipboardList} title="Esito dei controlli" subtitle="Misure e note registrate dai tuoi professionisti" />
          {professionalChecks.length === 0 ? (
            <EmptyState title="Nessun controllo registrato" />
          ) : (
            <ul className="mt-4 space-y-3">
              {professionalChecks.slice(0, 12).map((c) => (
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
                  {c.notes && <p className="mt-2 rounded-lg bg-[#f4f8f7] p-2.5 text-sm text-ink-700 italic">“{c.notes}”</p>}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
