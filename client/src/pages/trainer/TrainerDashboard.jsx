import {
  Apple,
  ArrowRight,
  CalendarDays,
  ChartNoAxesColumn,
  ChevronRight,
  CircleCheck,
  Clock,
  ClipboardList,
  Dumbbell,
  Lock,
  MapPin,
  Quote,
  Users,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { Avatar } from '../../components/Avatar.jsx';
import { ConsistencyChart, totalPercent } from '../../components/charts.jsx';
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
  RANGES,
  RangeTabs,
} from '../../components/ui.jsx';
import { displayName, fmtDate, fmtNumber, fmtTime, relativeDay } from '../../lib/format.js';
import { useApi } from '../../lib/useApi.js';
import { t } from '../../i18n/index.js';
import { LEVEL_LABELS } from '../../lib/labels.js';


function nextLabel(minutes) {
  if (minutes == null) return t('Nessun’altra sessione oggi');
  if (minutes < 60) return t('Prossima tra {n} min', { n: minutes });
  const hours = Math.round(minutes / 60);
  return hours === 1 ? t('Prossima tra 1 ora') : t('Prossima tra {n} ore', { n: hours });
}

export default function TrainerDashboard() {
  const { data, error, loading, reload } = useApi('/dashboard/trainer');
  if (loading && !data) return <PageLoader />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const { today, stats } = data;
  const completedDiff = today.completedToday - today.completedYesterday;
  const sessionsDiff = stats.sessionsThisWeek.total - stats.sessionsThisWeek.lastWeek;

  return (
    <div className="space-y-5">
      <Hero
        firstName={data.user.firstName}
        title={t('Ottimo lavoro oggi!')}
        subtitle={t('I tuoi clienti stanno facendo progressi. Continua a guidarli verso i loro obiettivi.')}
        cta={{ label: t('Visualizza clienti'), to: '/app/clienti' }}
        image="/images/hero-trainer.jpg"
        imagePosition="50% 30%"
        aside={
          <div>
            <p className="eyebrow">{t('Panoramica di oggi')}</p>
            <ul className="mt-4 space-y-4">
              <OverviewRow icon={CalendarDays} title={t('{n} sessioni programmate', { n: today.sessions })} sub={nextLabel(today.nextInMinutes)} />
              <OverviewRow
                icon={CircleCheck}
                solid
                title={t('{n} allenamenti completati', { n: today.completedToday })}
                sub={t('{n} rispetto a ieri', { n: `${completedDiff >= 0 ? '+' : ''}${completedDiff}` })}
              />
            </ul>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} label={t('Clienti attivi')} value={stats.activeClients.total} to="/app/clienti">
          <Delta value={stats.activeClients.newThisMonth} digits={0} goodWhen="up" /> {t('nuovi questo mese')}
        </StatCard>
        <StatCard icon={CalendarDays} label={t('Sessioni questa settimana')} value={stats.sessionsThisWeek.total} to="/app/agenda">
          <Delta value={sessionsDiff} digits={0} goodWhen="up" /> {t('rispetto alla settimana scorsa')}
        </StatCard>
        <StatCard icon={CircleCheck} iconTone="solid" label={t('Allenamenti completati')} value={stats.workoutsThisWeek.total}>
          {stats.workoutsThisWeek.changePct != null ? (
            <>
              <Delta value={stats.workoutsThisWeek.changePct} suffix="%" digits={0} goodWhen="up" /> {t('rispetto alla settimana scorsa')}
            </>
          ) : (
            t('questa settimana')
          )}
        </StatCard>
        <StatCard icon={ClipboardList} label={t('Schede in attesa')} value={stats.plansToReview} to="/app/schede">
          {stats.plansToReview > 0 ? (
            <span className="inline-flex items-center gap-1 font-medium text-amber-600">
              <Clock className="h-3.5 w-3.5" /> {t('Da aggiornare')}
            </span>
          ) : (
            t('tutte aggiornate')
          )}
        </StatCard>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 2xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,0.85fr)]">
        <RecentClients clients={data.recentClients} />
        <FeaturedPlan plan={data.featuredPlan} />
        <NutritionCheck check={data.lastNutritionCheck} locked={data.sharingLockedCount} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <Consistency rows={data.consistency} />
        <NextSession session={data.nextSession} />
        <MessageList messages={data.messages} />
      </div>
    </div>
  );
}

function OverviewRow({ icon: Icon, title, sub, solid }) {
  return (
    <li className="flex items-center gap-3">
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${solid ? 'bg-brand-600 text-white' : 'bg-surface/80 text-ink-700'}`}>
        <Icon className="h-5 w-5" />
      </span>
      <span>
        <span className="block text-sm font-semibold">{title}</span>
        <span className="block text-xs text-ink-500">{sub}</span>
      </span>
    </li>
  );
}

function RecentClients({ clients }) {
  return (
    <Card className="p-5">
      <CardHeader icon={Users} title={t('Clienti recenti')} action={<ArrowLink to="/app/clienti">{t('Vedi tutti')}</ArrowLink>} />
      {clients.length === 0 ? (
        <EmptyState title={t('Nessun cliente')} text={t('Aggiungi il tuo primo cliente dalla sezione Clienti.')} />
      ) : (
        <div className="mt-4 relative overflow-x-auto">
          <table className="w-full min-w-[460px] text-sm">
            <thead>
              <tr className="text-left text-[11px] tracking-wider text-ink-500 uppercase">
                <th className="pb-2 font-medium">{t('Cliente')}</th>
                <th className="pb-2 font-medium">{t('Obiettivo')}</th>
                <th className="pb-2 font-medium">{t('Ultimo allenamento')}</th>
                <th className="pb-2 font-medium">{t('Aderenza')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {clients.map((c) => (
                <tr key={c.linkId}>
                  <td className="py-2.5">
                    <span className="flex items-center gap-2.5">
                      <Avatar user={c.client} size="sm" />
                      <span className="font-medium">{c.client.fullName}</span>
                    </span>
                  </td>
                  <td className="py-2.5 text-ink-700">{c.program ? t(c.program) : '—'}</td>
                  <td className="py-2.5 text-ink-700">{relativeDay(c.lastWorkout)}</td>
                  <td className="py-2.5">
                    <span className="font-semibold">{c.adherence}%</span>{' '}
                    <Delta value={c.trend} suffix="%" digits={0} goodWhen="up" className="text-xs" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-[11px] text-ink-400">{t('Aderenza: allenamenti svolti sugli allenamenti previsti nelle ultime 4 settimane.')}</p>
        </div>
      )}
    </Card>
  );
}

function FeaturedPlan({ plan }) {
  return (
    <Card className="flex flex-col p-5">
      <CardHeader icon={Dumbbell} title={t('Scheda allenamento')} action={<ArrowLink to="/app/schede">{t('Vedi tutte')}</ArrowLink>} />
      {!plan ? (
        <EmptyState title={t('Nessuna scheda attiva')} text={t('Crea la prima scheda per un tuo cliente.')} />
      ) : (
        <>
          <div className="mt-4 flex items-center gap-3">
            <Avatar user={plan.client} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{plan.client.fullName}</p>
              <p className="truncate text-xs text-ink-500">
                {plan.session?.focus ?? plan.title} • {LEVEL_LABELS[plan.level]}
              </p>
            </div>
            <span className="text-xs whitespace-nowrap text-ink-500">
              {t('Settimana {current} di {total}', { current: plan.currentWeek, total: plan.weeks })}
            </span>
          </div>
          {plan.session && (
            <div className="mt-4 relative overflow-x-auto">
              <table className="w-full min-w-[360px] text-[13px]">
                <thead>
                  <tr className="text-left text-[10px] tracking-wider text-ink-500 uppercase">
                    <th className="pb-2 font-medium">{t('Esercizio')}</th>
                    <th className="pb-2 text-center font-medium">{t('Serie')}</th>
                    <th className="pb-2 text-center font-medium">{t('Ripetizioni')}</th>
                    <th className="pb-2 text-right font-medium">{t('Recupero')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {plan.session.exercises.map((ex) => (
                    <tr key={ex.name}>
                      <td className="py-2 font-medium">{ex.name}</td>
                      <td className="py-2 text-center text-ink-700">{ex.sets}</td>
                      <td className="py-2 text-center text-ink-700">{ex.reps}</td>
                      <td className="py-2 text-right text-ink-700">{ex.restSec ? `${ex.restSec} sec` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="mt-auto pt-4">
            <Link to={`/app/schede/${plan.id}`} className="btn-primary w-full">
              {t('Aggiorna scheda')} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </>
      )}
    </Card>
  );
}

const diff = (a, b) => (a == null || b == null ? null : Math.round((a - b) * 10) / 10);

function NutritionCheck({ check, locked }) {
  return (
    <Card className="p-5 lg:col-span-2 2xl:col-span-1">
      <CardHeader icon={Apple} title={t('Ultimo check nutrizionale')} />
      {!check ? (
        <EmptyState
          icon={Lock}
          title={t('Nessun check condiviso')}
          text={t('Vedrai i check nutrizionali dei clienti che autorizzano la condivisione con il loro team.')}
        />
      ) : (
        <>
          <div className="mt-4 flex items-center gap-3">
            <Avatar user={check.client} size="lg" />
            <div>
              <p className="font-semibold">{check.client?.fullName}</p>
              <p className="text-xs text-ink-500">{fmtDate(check.date, { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 2xl:grid-cols-2 rounded-xl bg-soft p-3">
            <Metric label={t('Peso attuale')} value={check.current.weightKg} unit="kg" delta={diff(check.current.weightKg, check.previous?.weightKg)} />
            <Metric label={t('Massa grassa')} value={check.current.bodyFatPct} unit="%" delta={diff(check.current.bodyFatPct, check.previous?.bodyFatPct)} />
            <Metric
              label={t('Massa muscolare')}
              value={check.current.muscleMassKg}
              unit="kg"
              delta={diff(check.current.muscleMassKg, check.previous?.muscleMassKg)}
              goodWhen="up"
            />
          </div>
          {check.notes && (
            <div className="mt-3">
              <p className="text-xs font-semibold">{t('Note della nutrizionista')}</p>
              <blockquote className="mt-1.5 flex gap-2 border-l-2 border-brand-200 pl-3 text-[13px] text-ink-700 italic">
                <Quote className="h-3.5 w-3.5 shrink-0 fill-brand-300 text-brand-300" />
                {check.notes}
              </blockquote>
              {check.nutritionist && (
                <p className="mt-2 flex items-center gap-2 text-xs text-ink-500">
                  <Avatar user={check.nutritionist} size="sm" /> {displayName(check.nutritionist)} {t('— Nutrizionista')}
                </p>
              )}
            </div>
          )}
        </>
      )}
      {locked > 0 && (
        <p className="mt-4 flex items-start gap-2 text-xs text-ink-500">
          <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {locked === 1 ? t('1 cliente non ha ancora autorizzato la condivisione.') : t('{n} clienti non hanno ancora autorizzato la condivisione.', { n: locked })}
        </p>
      )}
    </Card>
  );
}

function Metric({ label, value, unit, delta, goodWhen = 'down' }) {
  return (
    <div>
      <p className="text-xs text-ink-500">{label}</p>
      <p className="font-display text-xl font-semibold">
        {fmtNumber(value)} <span className="text-sm">{unit}</span>
      </p>
      <Delta value={delta} suffix={unit === '%' ? '%' : ' kg'} goodWhen={goodWhen} className="text-xs" />
    </div>
  );
}

function Consistency({ rows }) {
  const [range, setRange] = useState('3M');
  const data = useMemo(() => rows.slice(-RANGES.find((r) => r.key === range).weeks), [rows, range]);
  return (
    <Card className="p-5">
      <CardHeader icon={ChartNoAxesColumn} title={t('Costanza negli allenamenti')} action={<RangeTabs value={range} onChange={setRange} />} />
      <div className="mt-3 flex flex-col items-center gap-4 sm:flex-row">
        <div className="w-full min-w-0 flex-1">
          <ConsistencyChart data={data} />
        </div>
        <ProgressRing value={totalPercent(data)} sublabel={t('Allenamenti completati')} />
      </div>
    </Card>
  );
}

function NextSession({ session }) {
  return (
    <Card className="flex flex-col p-5">
      <CardHeader icon={CalendarDays} title={t('Prossima sessione')} action={<ArrowLink to="/app/agenda">{t('Calendario')}</ArrowLink>} />
      {!session ? (
        <EmptyState title={t('Nessuna sessione in programma')} />
      ) : (
        <>
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-line p-3">
            <Avatar user={session.client} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{session.client?.fullName}</p>
              <p className="truncate text-xs text-ink-500">{session.type}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold">{relativeDay(new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome' }).format(new Date(session.date)))}</p>
              <p className="text-xs text-ink-500">
                {fmtTime(session.date)} - {fmtTime(new Date(new Date(session.date).getTime() + session.durationMin * 60000))}
              </p>
            </div>
          </div>
          <ul className="mt-4 space-y-2 text-sm text-ink-700">
            {session.location && (
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-ink-500" /> {session.location}
              </li>
            )}
            <li className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-ink-500" /> {t('{n} minuti', { n: session.durationMin })}
            </li>
            {session.notes && (
              <li className="flex items-center gap-2">
                <Dumbbell className="h-4 w-4 text-ink-500" /> {session.notes}
              </li>
            )}
          </ul>
          <div className="mt-auto pt-4">
            <Link to="/app/agenda" className="btn-outline w-full py-3">
              {t('Visualizza dettagli')} <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </>
      )}
    </Card>
  );
}
