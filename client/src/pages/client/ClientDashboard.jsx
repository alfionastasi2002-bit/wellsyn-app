import {
  CalendarCheck,
  CalendarDays,
  ChartNoAxesColumn,
  Check,
  ChevronRight,
  CircleCheck,
  Clock,
  Dumbbell,
  MessageCircle,
  SignalMedium,
  Target,
  Utensils,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { Avatar } from '../../components/Avatar.jsx';
import { ConsistencyChart, totalPercent, TrendChart } from '../../components/charts.jsx';
import { Hero } from '../../components/Hero.jsx';
import {
  ArrowLink,
  Card,
  CardHeader,
  Delta,
  EmptyState,
  ErrorState,
  IconBadge,
  PageLoader,
  ProgressBar,
  ProgressRing,
  RANGES,
  RangeTabs,
  Spinner,
} from '../../components/ui.jsx';
import { api } from '../../lib/api.js';
import { capitalize, DAY_NAMES, displayName, fmtDate, fmtDayKey, fmtNumber, ROLE_LABELS, todayKey } from '../../lib/format.js';
import { LEVEL_LABELS, MEAL_META } from '../../lib/labels.js';
import { useApi } from '../../lib/useApi.js';

export default function ClientDashboard() {
  const { data, error, loading, reload, setData } = useApi('/dashboard/client');
  if (loading && !data) return <PageLoader />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const { weight, workout, meals } = data;

  return (
    <div className="space-y-5">
      <Hero
        firstName={data.user.firstName}
        title="Stai facendo un lavoro fantastico!"
        subtitle="La costanza di oggi costruisce un domani più sano e felice."
        cta={{ label: 'Continua così', to: '/app/allenamenti' }}
        image="/images/hero-client.jpg"
        imagePosition="40% 30%"
        aside={
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-1">
            <div>
              <p className="eyebrow">Peso attuale</p>
              <div className="mt-2 flex flex-wrap items-end gap-x-4 gap-y-1">
                <span className="font-display text-[40px] leading-none font-semibold">
                  {fmtNumber(weight.current)} <span className="text-2xl">kg</span>
                </span>
                {weight.delta != null && (
                  <span className="text-sm leading-tight">
                    <Delta value={weight.delta} suffix=" kg" goodWhen="any" />
                    <span className="block text-ink-700">dall'inizio</span>
                  </span>
                )}
              </div>
            </div>
            <Link to="/app/controlli" className="group block xl:border-t xl:border-brand-200/70 xl:pt-5">
              <p className="eyebrow">Prossimo controllo</p>
              <div className="mt-3 flex items-center gap-3">
                <IconBadge icon={CalendarDays} size="lg" tone="brand" />
                {data.nextCheck ? (
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-ink-900">{fmtDate(data.nextCheck.date)}</span>
                    <span className="block text-sm text-ink-700">{data.nextCheck.type}</span>
                  </span>
                ) : (
                  <span className="flex-1 text-sm text-ink-700">Nessun controllo in programma</span>
                )}
                <ChevronRight className="h-5 w-5 shrink-0 text-ink-400 transition group-hover:translate-x-0.5" />
              </div>
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,0.9fr)]">
        <TodayWorkout workout={workout} onChange={(completedToday) => setData((d) => updateWorkout(d, completedToday))} />
        <TodayMeals meals={meals} onToggle={(type, done) => setData((d) => updateMeal(d, type, done))} />
        <WeekCard workout={workout} />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <WeightCard trend={weight.trend} />
        <ConsistencyCard rows={data.consistency} />
      </div>

      <Professionals professionals={data.professionals} pending={data.pendingRequests} />
    </div>
  );
}

function updateWorkout(data, completedToday) {
  const w = data.workout;
  const today = todayKey();
  const delta = completedToday === w.completedToday ? 0 : completedToday ? 1 : -1;
  return {
    ...data,
    workout: {
      ...w,
      completedToday,
      week: { ...w.week, completed: Math.max(0, w.week.completed + delta) },
      days: w.days.map((d) => (d.day === today ? { ...d, completed: completedToday } : d)),
    },
  };
}

function updateMeal(data, type, done) {
  const today = data.meals.today.map((m) => (m.type === type ? { ...m, done } : m));
  return { ...data, meals: { ...data.meals, today, completed: today.filter((m) => m.done).length } };
}

function TodayWorkout({ workout, onChange }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const session = workout?.today;

  async function toggle(completed) {
    setSaving(true);
    setError(null);
    try {
      await api('/me/workouts/today', { method: 'PUT', body: { completed } });
      onChange(completed);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="flex flex-col p-5">
      <CardHeader icon={Dumbbell} title="Allenamento di oggi" action={<ArrowLink to="/app/allenamenti">Vedi piano</ArrowLink>} />
      {!workout ? (
        <EmptyState icon={Dumbbell} title="Nessuna scheda attiva" text="Il tuo personal trainer non ti ha ancora assegnato una scheda." />
      ) : !session ? (
        <div className="mt-5 flex flex-1 flex-col">
          <p className="font-display text-xl font-semibold">Giorno di recupero</p>
          <p className="mt-2 text-sm text-ink-700">
            Oggi riposo: il recupero fa parte dell'allenamento.
            {workout.next && (
              <>
                {' '}
                Prossima sessione: <strong>{workout.next.name}</strong> ({DAY_NAMES[workout.next.dayOfWeek].toLowerCase()}).
              </>
            )}
          </p>
        </div>
      ) : (
        <div className="mt-5 flex flex-1 flex-col">
          <div className="flex items-start gap-3">
            <IconBadge icon={Dumbbell} />
            <div>
              <h3 className="font-display text-xl font-semibold">{session.name}</h3>
              <p className="mt-1.5 flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-700">
                {session.durationMin && (
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-ink-500" /> {session.durationMin} min
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <SignalMedium className="h-4 w-4 text-ink-500" /> {LEVEL_LABELS[workout.level]}
                </span>
              </p>
            </div>
          </div>
          {session.description && <p className="mt-4 text-[15px] leading-relaxed text-ink-700">{session.description}</p>}
          <div className="mt-auto pt-5">
            {workout.completedToday ? (
              <div className="flex items-center justify-between gap-3 rounded-full bg-brand-50 py-2 pr-2 pl-5">
                <span className="inline-flex items-center gap-2 font-semibold text-brand-800">
                  <CircleCheck className="h-5 w-5" /> Completato, ottimo lavoro!
                </span>
                <button type="button" className="btn-soft" disabled={saving} onClick={() => toggle(false)}>
                  {saving ? <Spinner className="h-4 w-4" /> : 'Annulla'}
                </button>
              </div>
            ) : (
              <button type="button" className="btn-primary w-full py-3.5 text-[15px]" disabled={saving} onClick={() => toggle(true)}>
                {saving ? <Spinner className="h-5 w-5 text-white" /> : <CircleCheck className="h-5 w-5" />} Segna come completato
              </button>
            )}
            {error && <p className="mt-2 text-sm text-amber-700">{error}</p>}
          </div>
        </div>
      )}
    </Card>
  );
}

function TodayMeals({ meals, onToggle }) {
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);

  async function toggle(meal) {
    setBusy(meal.type);
    setError(null);
    try {
      await api('/me/meals/today', { method: 'PUT', body: { mealType: meal.type, done: !meal.done } });
      onToggle(meal.type, !meal.done);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card className="p-5">
      <CardHeader icon={Utensils} title="Piano alimentare" action={<ArrowLink to="/app/alimentazione">Vedi piano</ArrowLink>} />
      {!meals || meals.today.length === 0 ? (
        <EmptyState icon={Utensils} title="Nessun piano attivo" text="La tua nutrizionista non ti ha ancora assegnato un piano." />
      ) : (
        <>
          <div className="mt-5 flex items-center justify-between gap-4">
            <p className="text-sm font-semibold">I pasti di oggi</p>
            <div className="w-36 text-right">
              <p className="text-xs text-ink-500">
                {meals.completed} di {meals.today.length} completati
              </p>
              <ProgressBar value={meals.completed} max={meals.today.length} className="mt-1.5" />
            </div>
          </div>
          <ul className="mt-3 space-y-1">
            {meals.today.map((meal) => {
              const meta = MEAL_META[meal.type] ?? MEAL_META.pranzo;
              const MealIcon = meta.icon;
              return (
                <li key={meal.type} className="flex items-center gap-3 rounded-xl px-1 py-2">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#fdf3e7] text-[#b8692a]">
                    <MealIcon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{meta.label}</p>
                    <p className="truncate text-[13px] text-ink-500">{meal.name}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggle(meal)}
                    disabled={busy === meal.type}
                    aria-pressed={meal.done}
                    aria-label={`${meta.label}: ${meal.done ? 'segna come non consumato' : 'segna come consumato'}`}
                    className={`grid h-7 w-7 place-items-center rounded-full border-2 transition ${
                      meal.done ? 'border-brand-500 bg-brand-500 text-white' : 'border-ink-300 text-transparent hover:border-brand-400'
                    }`}
                  >
                    {busy === meal.type ? <Spinner className="h-3.5 w-3.5" /> : <Check className="h-4 w-4" strokeWidth={3} />}
                  </button>
                  <Link to="/app/alimentazione" className="p-1 text-ink-400 hover:text-ink-700" aria-label={`Dettagli ${meta.label}`}>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </li>
              );
            })}
          </ul>
          {error && <p className="mt-2 text-sm text-amber-700">{error}</p>}
        </>
      )}
    </Card>
  );
}

function WeekCard({ workout }) {
  const today = todayKey();
  return (
    <Card className="p-5 lg:col-span-2 xl:col-span-1">
      <CardHeader icon={CalendarCheck} title="Allenamenti questa settimana" action={<ArrowLink to="/app/allenamenti">Vedi tutti</ArrowLink>} />
      {!workout ? (
        <EmptyState title="Nessuna scheda attiva" text="Qui vedrai gli allenamenti della settimana." />
      ) : (
        <>
          <div className="mt-4 flex items-end justify-between gap-4">
            <p>
              <span className="font-display text-[32px] leading-none font-semibold">
                {workout.week.completed} / {workout.week.planned}
              </span>
              <span className="ml-2 text-sm text-ink-500">completati</span>
            </p>
          </div>
          <ProgressBar value={workout.week.completed} max={workout.week.planned} className="mt-3" />
          <ul className="mt-4 space-y-1">
            {workout.days.map((d) => (
              <WeekDayRow key={d.day} day={d} today={today} />
            ))}
          </ul>
        </>
      )}
    </Card>
  );
}

function WeekDayRow({ day, today }) {
  const isToday = day.day === today;
  const isPast = day.day < today;
  let status;
  if (day.completed) status = <CircleCheck className="h-5 w-5 fill-brand-500 text-white" aria-label="Svolto" />;
  else if (!day.session) status = <span className="text-xs text-ink-400">Riposo</span>;
  else if (isPast) status = <span className="text-xs font-medium text-amber-600">Saltato</span>;
  else status = <span className={`h-5 w-5 rounded-full border-2 ${isToday ? 'border-brand-500' : 'border-ink-300'}`} aria-label="Da fare" />;

  return (
    <li className={`flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm ${isToday ? 'bg-brand-50' : ''}`}>
      <span className={`w-16 shrink-0 ${isToday ? 'font-semibold text-brand-800' : 'text-ink-500'}`}>
        {isToday ? 'Oggi' : capitalize(fmtDayKey(day.day, { weekday: 'short', day: 'numeric' }).replace('.', ''))}
      </span>
      <span className={`min-w-0 flex-1 truncate ${day.session ? 'text-ink-900' : 'text-ink-400'}`}>{day.session ?? '—'}</span>
      {status}
    </li>
  );
}

function WeightCard({ trend }) {
  const [range, setRange] = useState('3M');
  const data = useMemo(() => {
    const weeks = RANGES.find((r) => r.key === range).weeks;
    const from = new Date(Date.now() - weeks * 7 * 86400000).toISOString().slice(0, 10);
    return trend.filter((p) => p.day >= from).map((p) => ({ day: p.day, value: p.weightKg }));
  }, [trend, range]);

  return (
    <Card className="p-5">
      <CardHeader icon={ChartNoAxesColumn} title="Andamento del peso" action={<RangeTabs value={range} onChange={setRange} />} />
      <div className="mt-2">
        <TrendChart data={data} />
      </div>
    </Card>
  );
}

function ConsistencyCard({ rows }) {
  const [range, setRange] = useState('3M');
  const data = useMemo(() => rows.slice(-RANGES.find((r) => r.key === range).weeks), [rows, range]);
  return (
    <Card className="p-5">
      <CardHeader icon={Target} title="Costanza allenamenti" action={<RangeTabs value={range} onChange={setRange} />} />
      <div className="mt-3 flex flex-col items-center gap-4 sm:flex-row">
        <div className="w-full min-w-0 flex-1">
          <ConsistencyChart data={data} />
        </div>
        <ProgressRing value={totalPercent(data)} sublabel="Allenamenti completati" />
      </div>
    </Card>
  );
}

function Professionals({ professionals, pending }) {
  return (
    <Card className="p-5">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-[17px] font-semibold">I tuoi professionisti</h2>
          <p className="text-sm text-ink-500">Un team dedicato, sempre al tuo fianco nel tuo percorso.</p>
        </div>
        <ArrowLink to="/app/professionisti">{pending > 0 ? `${pending} richieste in attesa` : 'Gestisci condivisione'}</ArrowLink>
      </header>
      {professionals.length === 0 ? (
        <EmptyState title="Nessun professionista collegato" text="Quando un professionista ti aggiungerà, lo vedrai qui." />
      ) : (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {professionals.map(({ linkId, role, professional }) => (
            <article key={linkId} className="flex flex-col gap-4 rounded-2xl border border-line p-4 sm:flex-row sm:items-center">
              <Avatar user={professional} size="xl" />
              <div className="min-w-0 flex-1">
                <h3 className="font-display text-lg font-semibold">{displayName(professional)}</h3>
                <p className="text-sm text-ink-500">{professional.specialization ?? ROLE_LABELS[role]}</p>
                {professional.bio && <p className="mt-1.5 text-[13px] text-ink-500">{capitalize(professional.bio)}</p>}
              </div>
              <div className="flex gap-2 sm:flex-col">
                <Link to={`/app/notifiche?con=${professional.id}`} className="btn-outline flex-1">
                  <MessageCircle className="h-4 w-4" /> Messaggia
                </Link>
                <Link to="/app/professionisti" className="btn-soft flex-1">
                  Vedi profilo
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </Card>
  );
}
