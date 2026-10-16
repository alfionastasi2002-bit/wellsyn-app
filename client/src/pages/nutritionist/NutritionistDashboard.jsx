import {
  CalendarDays,
  ChartNoAxesColumn,
  ChevronRight,
  ClipboardList,
  Dumbbell,
  FileText,
  Lock,
  Users,
  Utensils,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { Avatar } from '../../components/Avatar.jsx';
import { TrendChart } from '../../components/charts.jsx';
import { Hero } from '../../components/Hero.jsx';
import { MessageList } from '../../components/MessageList.jsx';
import { StatCard } from '../../components/StatCard.jsx';
import {
  ArrowLink,
  Card,
  CardHeader,
  Delta,
  EmptyState,
  ErrorState,
  PageLoader,
  ProgressRing,
} from '../../components/ui.jsx';
import { capitalize, fmtDate, fmtDayKey, fmtNumber, fmtTime } from '../../lib/format.js';
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
        title="Oggi fai la differenza."
        subtitle="Clienti più consapevoli, più sani e più forti grazie al tuo supporto."
        cta={{ label: 'Visualizza agenda', to: '/app/controlli' }}
        image="/images/hero-nutritionist.jpg"
        imagePosition="50% 25%"
        aside={
          <div>
            <p className="eyebrow">Panoramica di oggi</p>
            <p className="mt-1 font-display text-xl font-semibold">{capitalize(fmtDate(new Date(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))}</p>
            <ul className="mt-4 space-y-3">
              <OverviewRow icon={CalendarDays} value={today.checkups} label="Check-up oggi" />
              <OverviewRow icon={Users} value={today.unreadMessages} label="Nuovi messaggi" />
              <OverviewRow icon={ClipboardList} value={today.plansToReview} label="Piani da aggiornare" />
            </ul>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} label="Clienti totali" value={stats.clients.total} to="/app/clienti">
          <Delta value={stats.clients.newThisMonth} digits={0} goodWhen="up" /> nuovi questo mese
        </StatCard>
        <StatCard icon={CalendarDays} label="Prossimi check-up" value={stats.upcomingCheckups} to="/app/controlli">
          nei prossimi 7 giorni
        </StatCard>
        <StatCard icon={Utensils} label="Piani alimentari attivi" value={stats.activePlans.total} to="/app/piani-alimentari">
          <Delta value={stats.activePlans.newThisMonth} digits={0} goodWhen="up" /> creati questo mese
        </StatCard>
        <StatCard icon={FileText} label="Aggiornamenti in sospeso" value={stats.plansToReview} to="/app/piani-alimentari">
          piani da revisionare
        </StatCard>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <RecentClients clients={data.recentClients} />
        <FeaturedPlan plan={data.featuredPlan} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
        <LastCheck check={data.lastCheck} />
        <ClientsTrend trend={data.trend} />
        <TrainerData data={data.trainerData} />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <Appointments appointments={data.appointments} />
        <MessageList messages={data.messages} />
      </div>
    </div>
  );
}

function OverviewRow({ icon, value, label }) {
  return (
    <li className="flex items-center gap-3">
      <span className="grid h-10 w-10 place-items-center rounded-full bg-white/80 text-brand-700">
        <IconInline icon={icon} />
      </span>
      <span className="w-7 font-display text-2xl font-semibold">{value}</span>
      <span className="text-sm text-ink-700">{label}</span>
    </li>
  );
}

const IconInline = ({ icon: Icon }) => <Icon className="h-5 w-5" />;

const STATUS = {
  on_track: { label: 'In linea', dot: 'bg-brand-500', pill: 'bg-brand-50 text-brand-800' },
  needs_attention: { label: 'Da seguire', dot: 'bg-amber-400', pill: 'bg-amber-50 text-amber-700' },
};

function RecentClients({ clients }) {
  return (
    <Card className="p-5">
      <CardHeader icon={Users} title="I tuoi clienti" action={<ArrowLink to="/app/clienti">Vedi tutti</ArrowLink>} />
      {clients.length === 0 ? (
        <EmptyState title="Nessun cliente" text="Aggiungi il tuo primo cliente dalla sezione Clienti.">
          <Link to="/app/clienti" className="btn-primary mt-2">Aggiungi cliente</Link>
        </EmptyState>
      ) : (
        <div className="mt-4 relative overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="text-left text-[11px] tracking-wider text-ink-500 uppercase">
                <th className="pb-2 font-medium">Cliente</th>
                <th className="pb-2 font-medium">Piano</th>
                <th className="pb-2 font-medium">Ultimo check</th>
                <th className="pb-2 font-medium">Stato</th>
                <th className="pb-2"><span className="sr-only">Apri</span></th>
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
                    <td className="py-2.5 text-ink-700">{c.program ?? '—'}</td>
                    <td className="py-2.5 text-ink-700">{c.lastCheck ? fmtDate(c.lastCheck, { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</td>
                    <td className="py-2.5">
                      <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium ${s.pill}`}>
                        <span className={`h-2 w-2 rounded-full ${s.dot}`} /> {s.label}
                      </span>
                    </td>
                    <td className="py-2.5 text-right">
                      <Link to={`/app/progressi?cliente=${c.client.id}`} className="inline-block p-1 text-ink-400 hover:text-ink-700" aria-label={`Progressi di ${c.client.fullName}`}>
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

const MEAL_LABELS = { colazione: 'Colazione', spuntino: 'Spuntino', pranzo: 'Pranzo', merenda: 'Merenda', cena: 'Cena' };

function FeaturedPlan({ plan }) {
  return (
    <Card className="p-5">
      <CardHeader icon={Utensils} title="Crea o modifica piano alimentare" action={<ArrowLink to={plan ? `/app/piani-alimentari/${plan.id}` : '/app/piani-alimentari/nuovo'}>Apri editor</ArrowLink>} />
      {!plan ? (
        <EmptyState title="Nessun piano attivo" text="Crea il primo piano alimentare per un tuo cliente." />
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_170px]">
          <div className="rounded-xl border border-line p-4">
            <p className="font-display text-lg font-semibold">{plan.title}</p>
            <p className="mt-1 text-xs font-medium text-ink-500">
              Giorno 1{plan.kcalTarget ? ` · obiettivo ${plan.kcalTarget} kcal` : ''}
            </p>
            <ul className="mt-3 space-y-3">
              {(plan.day?.meals ?? []).map((m) => (
                <li key={m.type} className="flex gap-3">
                  <span className="mt-0.5 h-9 w-1 shrink-0 rounded-full bg-brand-300" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{MEAL_LABELS[m.type]}</p>
                    <p className="line-clamp-2 text-[13px] text-ink-500">{m.description ?? m.name}</p>
                  </div>
                  {m.kcal && <span className="ml-auto shrink-0 text-xs text-ink-500">{m.kcal} kcal</span>}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#eaf6f1] to-[#d3ece3] p-4">
            <p className="eyebrow text-[10px]">Piano alimentare</p>
            <p className="mt-1 font-display text-lg font-semibold">{plan.client?.fullName}</p>
            <p className="mt-2 text-xs text-ink-700">Obiettivi, linee guida e menù settimanale</p>
            {plan.goal && <span className="mt-3 inline-block rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-brand-800">{plan.goal}</span>}
            <img src="/brand/logo-mark.png" alt="" className="pointer-events-none absolute -right-8 -bottom-8 h-28 opacity-70" />
          </div>
        </div>
      )}
    </Card>
  );
}

function MetricRow({ label, value, unit, delta, goodWhen = 'down' }) {
  return (
    <div className="flex items-center justify-between gap-2 text-[13px]">
      <span className="text-ink-500">{label}</span>
      <span className="flex items-center gap-2">
        <span className="font-medium">
          {fmtNumber(value)} {unit}
        </span>
        <Delta value={delta} suffix={unit === '%' ? '%' : ''} goodWhen={goodWhen} className="text-xs" />
      </span>
    </div>
  );
}

const diff = (a, b) => (a == null || b == null ? null : Math.round((a - b) * 10) / 10);

function LastCheck({ check }) {
  return (
    <Card className="p-5">
      <CardHeader icon={CalendarDays} title="Ultimo check" action={<ArrowLink to={check ? `/app/progressi?cliente=${check.client?.id}` : '/app/controlli'}>Vedi storico</ArrowLink>} />
      {!check ? (
        <EmptyState title="Nessun controllo registrato" />
      ) : (
        <>
          <div className="mt-4 flex items-center gap-3">
            <Avatar user={check.client} size="lg" />
            <div>
              <p className="font-semibold">{check.client?.fullName}</p>
              <p className="text-xs text-ink-500">{fmtDate(check.date)}</p>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            <div className="flex items-end justify-between gap-3 rounded-xl border border-line p-3">
              <div>
                <p className="text-xs font-semibold">Peso</p>
                <p className="mt-1 font-display text-2xl font-semibold">{fmtNumber(check.current.weightKg)} kg</p>
              </div>
              <p className="text-right text-xs text-ink-500">
                <Delta value={diff(check.current.weightKg, check.previous?.weightKg)} suffix=" kg" goodWhen="any" />
                <span className="block">dal controllo precedente</span>
              </p>
            </div>
            <div className="space-y-1.5 rounded-xl border border-line p-3">
              <MetricRow label="Vita" value={check.current.waistCm} unit="cm" delta={diff(check.current.waistCm, check.previous?.waistCm)} />
              <MetricRow label="Fianchi" value={check.current.hipsCm} unit="cm" delta={diff(check.current.hipsCm, check.previous?.hipsCm)} />
              <MetricRow label="Massa grassa" value={check.current.bodyFatPct} unit="%" delta={diff(check.current.bodyFatPct, check.previous?.bodyFatPct)} />
              <MetricRow
                label="Massa muscolare"
                value={check.current.muscleMassKg}
                unit="kg"
                delta={diff(check.current.muscleMassKg, check.previous?.muscleMassKg)}
                goodWhen="up"
              />
            </div>
          </div>
          {check.notes && (
            <div className="mt-3 rounded-xl border border-line p-3 text-[13px]">
              <p className="font-semibold">Note</p>
              <p className="mt-1 text-ink-700">{check.notes}</p>
            </div>
          )}
        </>
      )}
    </Card>
  );
}

const METRICS = [
  { key: 'weightKg', label: 'Peso medio', unit: 'kg' },
  { key: 'bodyFatPct', label: 'Massa grassa', unit: '%' },
  { key: 'muscleMassKg', label: 'Massa muscolare', unit: 'kg' },
];

function ClientsTrend({ trend }) {
  const [metric, setMetric] = useState('weightKg');
  const [clientId, setClientId] = useState('all');
  const current = METRICS.find((m) => m.key === metric);

  const data = useMemo(() => {
    const isoDaysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);
    const from = isoDaysAgo(91);
    const points = trend.points.filter((p) => p[metric] != null);

    if (clientId !== 'all') {
      return points
        .filter((p) => p.clientId === clientId && p.day >= from)
        .map((p) => ({ day: p.day, value: p[metric] }));
    }

    // Media settimanale: per ogni cliente si usa l'ultima misura disponibile in quella settimana.
    // Sono inclusi solo i clienti già seguiti all'inizio del periodo, così la media non fa salti.
    const byClient = new Map();
    for (const p of points) byClient.set(p.clientId, [...(byClient.get(p.clientId) ?? []), p]);
    const included = [...byClient.values()].filter((list) => list[0].day <= from);
    const lastValue = (list, day) => list.findLast((p) => p.day <= day)?.[metric];

    const result = [];
    for (let i = 13; i >= 0; i -= 1) {
      const day = isoDaysAgo(i * 7);
      const values = included.map((list) => lastValue(list, day)).filter((v) => v != null);
      if (values.length) result.push({ day, value: Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 10) / 10 });
    }
    return result;
  }, [trend.points, metric, clientId]);

  return (
    <Card className="p-5">
      <CardHeader icon={ChartNoAxesColumn} title="Andamento clienti" subtitle="Ultimi 3 mesi" />
      <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Misura">
        {METRICS.map((m) => (
          <button
            key={m.key}
            type="button"
            role="tab"
            aria-selected={metric === m.key}
            onClick={() => setMetric(m.key)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              metric === m.key ? 'bg-brand-800 text-white' : 'bg-[#eef2f1] text-ink-700 hover:bg-[#e3e9e7]'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>
      <label className="mt-3 flex justify-end">
        <span className="sr-only">Cliente</span>
        <select
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          className="rounded-lg border border-line bg-white px-3 py-1.5 text-xs text-ink-700 outline-none focus:border-brand-400"
        >
          <option value="all">Tutti i clienti</option>
          {trend.clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.fullName}
            </option>
          ))}
        </select>
      </label>
      <TrendChart data={data} unit={current.unit} height={200} />
    </Card>
  );
}

function TrainerData({ data }) {
  const [clientId, setClientId] = useState(data.clients[0]?.client.id ?? '');
  const selected = data.clients.find((c) => c.client.id === clientId);
  const pct = selected?.planned ? Math.round((selected.completed / selected.planned) * 100) : 0;

  return (
    <Card className="p-5 lg:col-span-2 xl:col-span-1">
      <CardHeader icon={Dumbbell} title="Dati dal Personal Trainer" />
      {data.clients.length === 0 ? (
        <EmptyState
          icon={Lock}
          title="Nessun dato condiviso"
          text="I dati di allenamento compaiono qui quando i tuoi clienti autorizzano la condivisione con il loro team."
        />
      ) : (
        <>
          <label className="mt-4 block">
            <span className="sr-only">Cliente</span>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand-400"
            >
              {data.clients.map((c) => (
                <option key={c.client.id} value={c.client.id}>
                  {c.client.fullName}
                </option>
              ))}
            </select>
          </label>
          {selected && !selected.hasPlan ? (
            <p className="mt-4 text-sm text-ink-500">{selected.client.firstName} non ha ancora una scheda di allenamento attiva.</p>
          ) : (
            selected && (
              <>
                <p className="mt-4 text-sm font-semibold">
                  Giorni ON/OFF <span className="font-normal text-ink-500">(ultime 2 settimane)</span>
                </p>
                <ol className="mt-2 grid grid-cols-7 gap-y-3 sm:grid-cols-14 xl:grid-cols-7">
                  {selected.days.map((d) => (
                    <li key={d.day} className="flex flex-col items-center gap-1 text-[10px] text-ink-500">
                      <span>{fmtDayKey(d.day, { day: 'numeric' })}</span>
                      <span className="capitalize">{fmtDayKey(d.day, { weekday: 'short' }).replace('.', '')}</span>
                      <span
                        className={`h-4 w-4 rounded-full ${d.on ? 'bg-brand-500' : 'bg-[#e3e9e7]'}`}
                        title={d.on ? 'Allenamento svolto' : 'Nessun allenamento'}
                      />
                    </li>
                  ))}
                </ol>
                <p className="mt-3 flex gap-4 text-xs text-ink-500">
                  <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-brand-500" /> Giorno ON</span>
                  <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#e3e9e7]" /> Giorno OFF</span>
                </p>
                <p className="mt-4 text-sm font-semibold">Adesione ultimi allenamenti</p>
                <div className="mt-2 flex items-center gap-4">
                  <ProgressRing value={pct} size={88} stroke={9} />
                  <p className="text-sm">
                    <span className="font-display text-xl font-semibold">
                      {selected.completed} di {selected.planned}
                    </span>
                    <span className="block text-ink-500">allenamenti completati</span>
                  </p>
                </div>
              </>
            )
          )}
        </>
      )}
      {data.lockedCount > 0 && (
        <p className="mt-4 flex items-start gap-2 rounded-xl bg-[#f4f7f6] p-3 text-xs text-ink-500">
          <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {data.lockedCount === 1 ? '1 cliente non ha' : `${data.lockedCount} clienti non hanno`} ancora autorizzato la
          condivisione dei dati con il team.
        </p>
      )}
    </Card>
  );
}

function Appointments({ appointments }) {
  return (
    <Card className="p-5">
      <CardHeader icon={CalendarDays} title="Prossimi appuntamenti" action={<ArrowLink to="/app/controlli">Vedi agenda</ArrowLink>} />
      {appointments.length === 0 ? (
        <EmptyState title="Nessun appuntamento in programma" />
      ) : (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {appointments.map((a) => (
            <li key={a.id}>
              <Link to="/app/controlli" className="flex items-center gap-3 rounded-xl border border-line p-3 transition hover:border-brand-200">
                <span className="grid w-12 shrink-0 place-items-center rounded-lg bg-brand-50 py-1.5 text-brand-800">
                  <span className="font-display text-xl leading-none font-semibold">{fmtDate(a.date, { day: 'numeric' })}</span>
                  <span className="text-[10px] font-semibold uppercase">{fmtDate(a.date, { month: 'short' }).replace('.', '')}</span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs text-ink-500">{fmtTime(a.date)}</span>
                  <span className="block truncate text-sm font-semibold">{a.client?.fullName}</span>
                  <span className="block truncate text-xs text-ink-500">{a.type}</span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-ink-400" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
