import { CalendarDays, ChartNoAxesColumn, ChevronRight, ClipboardList, Dumbbell, FileText, Lock, MapPin, Plus, Users, Utensils } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { Avatar } from '../../components/Avatar.jsx';
import { TrendChart } from '../../components/charts.jsx';
import { Hero } from '../../components/Hero.jsx';
import { MessageList } from '../../components/MessageList.jsx';
import { StatCard } from '../../components/StatCard.jsx';
import { ArrowLink, Card, CardHeader, Delta, EmptyState, ErrorState, PageLoader, ProgressRing } from '../../components/ui.jsx';
import { t } from '../../i18n/index.js';
import { addDaysKey, capitalize, dayKeyOf, fmtDate, fmtDayKey, fmtNumber, fmtTime, todayKey } from '../../lib/format.js';
import { useApi } from '../../lib/useApi.js';

export default function NutritionistDashboard() {
  const { data, error, loading, reload } = useApi('/dashboard/nutritionist');
  if (loading && !data) return <PageLoader />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const { stats, today } = data;

  return (
    <div className="space-y-5">
      <Hero
        firstName={data.user.firstName}
        title={t('Oggi fai la differenza.')}
        subtitle={t('Clienti più consapevoli, più sani e più forti grazie al tuo supporto.')}
        cta={{ label: t('Visualizza agenda'), to: '/app/agenda' }}
        image="/images/dash-nutritionist.webp"
        aside={
          <div>
            <p className="eyebrow">{t('Panoramica di oggi')}</p>
            <p className="mt-1 font-display text-xl font-semibold">{capitalize(fmtDate(new Date(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))}</p>
            <ul className="mt-4 space-y-3">
              <OverviewRow icon={CalendarDays} value={today.checkups} label={t('Check-up oggi')} />
              <OverviewRow icon={Users} value={today.unreadMessages} label={t('Nuovi messaggi')} />
              <OverviewRow icon={ClipboardList} value={today.plansToReview} label={t('Piani da aggiornare')} />
            </ul>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} label={t('Clienti totali')} value={stats.clients.total} to="/app/clienti">
          <Delta value={stats.clients.newThisMonth} digits={0} goodWhen="up" /> {t('nuovi questo mese')}
        </StatCard>
        <StatCard icon={CalendarDays} label={t('Prossimi check-up')} value={stats.upcomingCheckups} to="/app/agenda">
          {t('nei prossimi 7 giorni')}
        </StatCard>
        <StatCard icon={Utensils} label={t('Piani alimentari attivi')} value={stats.activePlans.total} to="/app/piani-alimentari">
          <Delta value={stats.activePlans.newThisMonth} digits={0} goodWhen="up" /> {t('creati questo mese')}
        </StatCard>
        <StatCard icon={FileText} label={t('Aggiornamenti in sospeso')} value={stats.plansToReview} to="/app/piani-alimentari">
          {t('piani da revisionare')}
        </StatCard>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <RecentClients clients={data.recentClients} />
        <Appointments appointments={data.appointments} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
        <ClientsTrend trend={data.trend} />
        <TrainerData data={data.trainerData} />
        <MessageList messages={data.messages} className="lg:col-span-2 xl:col-span-1" />
      </div>
    </div>
  );
}

function OverviewRow({ icon: Icon, value, label }) {
  return (
    <li className="flex items-center gap-3">
      <span className="grid h-10 w-10 place-items-center rounded-full bg-surface/80 text-brand-700">
        <Icon className="h-5 w-5" />
      </span>
      <span className="w-7 font-display text-2xl font-semibold">{value}</span>
      <span className="text-sm text-ink-700">{label}</span>
    </li>
  );
}

const STATUS = {
  on_track: { label: 'In linea', dot: 'bg-brand-500', pill: 'bg-brand-50 text-brand-800' },
  needs_attention: { label: 'Da seguire', dot: 'bg-amber-400', pill: 'bg-amber-50 text-amber-700' },
};

function RecentClients({ clients }) {
  return (
    <Card className="p-5">
      <CardHeader icon={Users} title={t('I tuoi clienti')} action={<ArrowLink to="/app/clienti">{t('Vedi tutti')}</ArrowLink>} />
      {clients.length === 0 ? (
        <EmptyState title={t('Nessun cliente')} text={t('Aggiungi il tuo primo cliente dalla sezione Clienti.')}>
          <Link to="/app/clienti" className="btn-primary mt-2">
            {t('Aggiungi cliente')}
          </Link>
        </EmptyState>
      ) : (
        <div className="relative mt-4 overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="text-left text-[11px] tracking-wider text-ink-500 uppercase">
                <th className="pb-2 font-medium">{t('Cliente')}</th>
                <th className="pb-2 font-medium">{t('Piano')}</th>
                <th className="pb-2 font-medium">{t('Ultimo check')}</th>
                <th className="pb-2 font-medium">{t('Stato')}</th>
                <th className="pb-2">
                  <span className="sr-only">{t('Apri')}</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {clients.map((c) => {
                const s = STATUS[c.status];
                return (
                  <tr key={c.linkId}>
                    <td className="py-2.5">
                      <span className="flex items-center gap-3">
                        <Avatar user={c.client} />
                        <span className="font-medium">{c.client.fullName}</span>
                      </span>
                    </td>
                    <td className="py-2.5 text-ink-700">{c.program ? t(c.program) : '—'}</td>
                    <td className="py-2.5 text-ink-700">{c.lastCheck ? fmtDate(c.lastCheck, { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</td>
                    <td className="py-2.5">
                      <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium ${s.pill}`}>
                        <span className={`h-2 w-2 rounded-full ${s.dot}`} /> {t(s.label)}
                      </span>
                    </td>
                    <td className="py-2.5 text-right">
                      <Link
                        to={`/app/progressi?cliente=${c.client.id}`}
                        className="inline-block p-1 text-ink-400 hover:text-ink-700"
                        aria-label={t('Progressi di {name}', { name: c.client.fullName })}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

/** Appuntamenti di oggi e prossimi (al posto del vecchio riquadro del piano alimentare). */
function Appointments({ appointments }) {
  const today = todayKey();
  const now = Date.now();
  const tomorrow = addDaysKey(today, 1);
  // Etichetta corta su una sola riga: Oggi, Domani o la data (es. 19 ott)
  const dayLabel = (day) => (day === today ? t('Oggi') : day === tomorrow ? t('Domani') : fmtDayKey(day, { day: 'numeric', month: 'short' }).replace('.', ''));

  return (
    <Card className="flex flex-col p-5">
      <CardHeader
        icon={CalendarDays}
        title={t('Appuntamenti')}
        subtitle={t('Oggi e prossimi giorni')}
        action={<ArrowLink to="/app/agenda">{t('Apri agenda')}</ArrowLink>}
      />
      {appointments.length === 0 ? (
        <EmptyState title={t('Nessun appuntamento in programma')} text={t('Fissa il prossimo controllo con un tuo cliente.')} />
      ) : (
        <ul className="mt-4 space-y-2">
          {appointments.map((a) => {
            const day = dayKeyOf(a.date);
            const start = new Date(a.date).getTime();
            const end = new Date(a.end).getTime();
            const live = start <= now && now < end;
            const past = end <= now;
            const minutes = Math.round((start - now) / 60000);
            return (
              <li key={a.id}>
                <Link
                  to={`/app/agenda?giorno=${day}`}
                  className={`flex items-center gap-3 rounded-xl border p-3 transition hover:border-brand-300 ${live ? 'border-brand-400 bg-brand-50' : 'border-line'} ${past ? 'opacity-55' : ''}`}
                >
                  <span
                    className={`flex h-14 w-[76px] shrink-0 flex-col items-center justify-center gap-1 rounded-xl text-center ${live ? 'bg-primary text-white' : 'bg-brand-50 text-brand-800'}`}
                  >
                    <span className="text-[10px] leading-none font-semibold tracking-wider whitespace-nowrap uppercase">{dayLabel(day)}</span>
                    <span className="font-display text-[17px] leading-none font-semibold tabular-nums">{fmtTime(a.date)}</span>
                  </span>
                  <Avatar user={a.client} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{a.client?.fullName}</span>
                    <span className="block truncate text-xs text-ink-500">
                      {t(a.type)} · {fmtTime(a.date)}–{fmtTime(a.end)}
                      {a.location && (
                        <>
                          {' '}
                          · <MapPin className="inline h-3 w-3" /> {a.location}
                        </>
                      )}
                    </span>
                  </span>
                  {live ? (
                    <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-white">{t('In corso')}</span>
                  ) : day === today && !past && minutes < 180 ? (
                    <span className="shrink-0 text-xs font-medium text-brand-800">{t('tra {n} min', { n: minutes })}</span>
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0 text-ink-400" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      <Link to="/app/agenda?nuovo=1" className="btn-outline mt-4 self-start">
        <Plus className="h-4 w-4" /> {t('Nuovo appuntamento')}
      </Link>
    </Card>
  );
}

const METRICS = [
  { key: 'weightKg', label: 'Peso medio', single: 'Peso', unit: 'kg' },
  { key: 'bodyFatPct', label: 'Massa grassa', single: 'Massa grassa', unit: '%' },
  { key: 'muscleMassKg', label: 'Massa muscolare', single: 'Massa muscolare', unit: 'kg' },
];

/**
 * Media reale dei clienti attuali: ogni settimana si prende, per ciascun cliente, la sua misura più recente
 * (prima della sua prima misura si usa quella, così l'arrivo di un nuovo cliente non crea salti finti).
 * L'ultimo punto è esattamente la media delle misure attuali dei clienti.
 */
function averageTrend(points, metric, { weeks = 13, today = todayKey() } = {}) {
  const byClient = new Map();
  for (const p of points) {
    if (p[metric] == null) continue;
    byClient.set(p.clientId, [...(byClient.get(p.clientId) ?? []), p]);
  }
  const lists = [...byClient.values()].map((list) => list.sort((a, b) => a.day.localeCompare(b.day)));
  if (!lists.length) return [];
  const result = [];
  for (let i = weeks; i >= 0; i -= 1) {
    const day = addDaysKey(today, -i * 7);
    const values = lists.map((list) => (list.findLast((p) => p.day <= day) ?? list[0])[metric]);
    result.push({ day, value: Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 10) / 10, count: values.length });
  }
  return result;
}

function ClientsTrend({ trend }) {
  const [metric, setMetric] = useState('weightKg');
  const [clientId, setClientId] = useState('all');
  const current = METRICS.find((m) => m.key === metric);

  const data = useMemo(() => {
    if (clientId === 'all') return averageTrend(trend.points, metric);
    const from = addDaysKey(todayKey(), -91);
    return trend.points.filter((p) => p.clientId === clientId && p[metric] != null && p.day >= from).map((p) => ({ day: p.day, value: p[metric] }));
  }, [trend.points, metric, clientId]);

  const last = data.at(-1);
  const first = data[0];

  return (
    <Card className="p-5">
      <CardHeader icon={ChartNoAxesColumn} title={t('Andamento clienti')} subtitle={t('Ultimi 3 mesi')} />
      <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label={t('Misura')}>
        {METRICS.map((m) => (
          <button
            key={m.key}
            type="button"
            role="tab"
            aria-selected={metric === m.key}
            onClick={() => setMetric(m.key)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              metric === m.key ? 'bg-primary text-white' : 'bg-muted text-ink-700 hover:bg-track'
            }`}
          >
            {t(clientId === 'all' ? m.label : m.single)}
          </button>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          {last ? (
            <>
              <p className="font-display text-2xl font-semibold">
                {fmtNumber(last.value)} {current.unit}
                {first && first !== last && (
                  <Delta value={Math.round((last.value - first.value) * 10) / 10} suffix={` ${current.unit}`} goodWhen="any" className="ml-2 align-middle text-xs" />
                )}
              </p>
              <p className="text-xs text-ink-500">
                {clientId === 'all'
                  ? t('media attuale di {n} clienti · variazione negli ultimi 3 mesi', { n: last.count })
                  : t('ultima misura, {date}', { date: fmtDayKey(last.day) })}
              </p>
            </>
          ) : (
            <p className="text-sm text-ink-500">{t('Nessuna misura disponibile.')}</p>
          )}
        </div>
        <label>
          <span className="sr-only">{t('Cliente')}</span>
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="rounded-lg border border-line bg-surface px-3 py-1.5 text-xs text-ink-700 outline-none focus:border-brand-400"
          >
            <option value="all">{t('Tutti i clienti')}</option>
            {trend.clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.fullName}
              </option>
            ))}
          </select>
        </label>
      </div>
      <TrendChart data={data} unit={current.unit} height={200} />
    </Card>
  );
}

function TrainerData({ data }) {
  const [clientId, setClientId] = useState(data.clients[0]?.client.id ?? '');
  const selected = data.clients.find((c) => c.client.id === clientId);
  const pct = selected?.planned ? Math.round((selected.completed / selected.planned) * 100) : 0;

  return (
    <Card className="p-5">
      <CardHeader icon={Dumbbell} title={t('Dati dal Personal Trainer')} action={<ArrowLink to="/app/attivita-fisica">{t('Dettagli')}</ArrowLink>} />
      {data.clients.length === 0 ? (
        <EmptyState
          icon={Lock}
          title={t('Nessun dato condiviso')}
          text={t('I dati di allenamento compaiono qui quando i tuoi clienti autorizzano la condivisione con il loro team.')}
        />
      ) : (
        <>
          <label className="mt-4 block">
            <span className="sr-only">{t('Cliente')}</span>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-brand-400"
            >
              {data.clients.map((c) => (
                <option key={c.client.id} value={c.client.id}>
                  {c.client.fullName}
                </option>
              ))}
            </select>
          </label>
          {selected && !selected.hasPlan ? (
            <p className="mt-4 text-sm text-ink-500">{t('{name} non ha ancora una scheda di allenamento attiva.', { name: selected.client.firstName })}</p>
          ) : (
            selected && (
              <>
                <p className="mt-4 text-sm font-semibold">
                  {t('Giorni ON/OFF')} <span className="font-normal text-ink-500">({t('ultime 2 settimane')})</span>
                </p>
                <ol className="mt-2 grid grid-cols-7 gap-y-3">
                  {selected.days.map((d) => (
                    <li key={d.day} className="flex flex-col items-center gap-1 text-[10px] text-ink-500">
                      <span>{fmtDayKey(d.day, { day: 'numeric' })}</span>
                      <span className="capitalize">{fmtDayKey(d.day, { weekday: 'short' }).replace('.', '')}</span>
                      <span
                        className={`h-4 w-4 rounded-full ${d.on ? 'bg-brand-500' : 'bg-track'}`}
                        title={d.on ? t('Allenamento svolto') : t('Nessun allenamento')}
                      />
                    </li>
                  ))}
                </ol>
                <p className="mt-4 text-sm font-semibold">{t('Adesione ultimi allenamenti')}</p>
                <div className="mt-2 flex items-center gap-4">
                  <ProgressRing value={pct} size={88} stroke={9} />
                  <p className="text-sm">
                    <span className="font-display text-xl font-semibold">{t('{done} di {planned}', { done: selected.completed, planned: selected.planned })}</span>
                    <span className="block text-ink-500">{t('allenamenti completati')}</span>
                  </p>
                </div>
              </>
            )
          )}
        </>
      )}
      {data.lockedCount > 0 && (
        <p className="mt-4 flex items-start gap-2 rounded-xl bg-soft p-3 text-xs text-ink-500">
          <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {data.lockedCount === 1
            ? t('1 cliente non ha ancora autorizzato la condivisione dei dati con il team.')
            : t('{n} clienti non hanno ancora autorizzato la condivisione dei dati con il team.', { n: data.lockedCount })}
        </p>
      )}
    </Card>
  );
}
