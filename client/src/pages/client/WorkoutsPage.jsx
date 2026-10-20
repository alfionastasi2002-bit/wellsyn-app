import { CalendarCheck, ChartNoAxesColumn, ChevronDown, CircleCheck, Clock, Dumbbell, History, MessageCircle, SignalMedium } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { Avatar } from '../../components/Avatar.jsx';
import { ConsistencyChart, totalPercent } from '../../components/charts.jsx';
import { PageHeader } from '../../components/forms.jsx';
import {
  Card,
  CardHeader,
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
import { capitalize, displayName, fmtDayKey, relativeDay } from '../../lib/format.js';
import { LEVEL_LABELS, WEEKDAYS } from '../../lib/labels.js';
import { useApi } from '../../lib/useApi.js';
import { t } from '../../i18n/index.js';

export default function WorkoutsPage() {
  const { data, error, loading, reload, setData } = useApi('/me/workout-plan');
  if (loading && !data) return <PageLoader />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const { plan } = data;
  if (!plan) {
    return (
      <div className="space-y-5">
        <PageHeader title={t('I miei allenamenti')} />
        <Card>
          <EmptyState
            icon={Dumbbell}
            title={t('Nessuna scheda attiva')}
            text={t('Quando il tuo personal trainer ti assegnerà una scheda, troverai qui sessioni ed esercizi.')}
          />
        </Card>
      </div>
    );
  }

  const todaySession = plan.sessions.find((s) => s.dayOfWeek === data.todayWeekday);

  function onToggle(completed) {
    setData((d) => {
      const delta = completed === d.completedToday ? 0 : completed ? 1 : -1;
      return {
        ...d,
        completedToday: completed,
        week: {
          ...d.week,
          completed: Math.max(0, d.week.completed + delta),
          days: d.week.days.map((x) => (x.day === d.today ? { ...x, completed } : x)),
        },
        history: completed
          ? [{ day: d.today, sessionName: todaySession?.name ?? t('Allenamento extra') }, ...d.history.filter((h) => h.day !== d.today)]
          : d.history.filter((h) => h.day !== d.today),
      };
    });
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('I miei allenamenti')}
        subtitle={`${plan.title} · ${LEVEL_LABELS[plan.level]} · ${t('Settimana {current} di {total}', { current: plan.currentWeek, total: plan.weeks })}`}
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <TodayCard session={todaySession} completed={data.completedToday} onToggle={onToggle} level={plan.level} />
        <WeekCard week={data.week} today={data.today} trainer={plan.trainer} />
      </div>

      <Card className="p-5">
        <CardHeader icon={Dumbbell} title={t('La tua scheda')} subtitle={t('{n} sessioni a settimana', { n: plan.sessions.length })} />
        <div className="mt-4 space-y-3">
          {plan.sessions.map((s) => (
            <SessionAccordion key={s.id} session={s} defaultOpen={s.dayOfWeek === data.todayWeekday} />
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <ConsistencyCard rows={data.consistency} />
        <Card className="p-5">
          <CardHeader icon={History} title={t('Ultimi allenamenti')} />
          {data.history.length === 0 ? (
            <EmptyState title={t('Ancora nessun allenamento registrato')} />
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {data.history.slice(0, 10).map((h) => (
                <li key={h.day} className="flex items-center gap-3 py-2.5 text-sm">
                  <CircleCheck className="h-5 w-5 shrink-0 fill-brand-500 text-white" />
                  <span className="min-w-0 flex-1 truncate font-medium">{h.sessionName ?? t('Allenamento')}</span>
                  <span className="shrink-0 text-ink-500">{relativeDay(h.day)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function ExercisesTable({ exercises }) {
  if (!exercises.length) return <p className="text-sm text-ink-500">{t('Nessun esercizio indicato.')}</p>;
  return (
    <div className="relative overflow-x-auto">
      <table className="w-full text-sm sm:min-w-[480px]">
        <thead>
          <tr className="text-left text-[11px] tracking-wider text-ink-500 uppercase">
            <th className="pb-2 font-medium">{t('Esercizio')}</th>
            <th className="px-1 pb-2 text-center font-medium">{t('Serie')}</th>
            <th className="px-1 pb-2 text-center font-medium">
              <span className="sm:hidden">{t('Rip.')}</span>
              <span className="hidden sm:inline">{t('Ripetizioni')}</span>
            </th>
            <th className="pb-2 text-right font-medium">
              <span className="sm:hidden">{t('Rec.')}</span>
              <span className="hidden sm:inline">{t('Recupero')}</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {exercises.map((ex, i) => (
            <tr key={`${ex.name}-${i}`}>
              <td className="py-2.5">
                <span className="font-medium">{ex.name}</span>
                {ex.notes && <span className="block text-xs text-ink-500">{ex.notes}</span>}
              </td>
              <td className="px-1 py-2.5 text-center text-ink-700">{ex.sets ?? '—'}</td>
              <td className="px-1 py-2.5 text-center whitespace-nowrap text-ink-700">{ex.reps ?? '—'}</td>
              <td className="py-2.5 text-right whitespace-nowrap text-ink-700">{ex.restSec ? `${ex.restSec} sec` : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TodayCard({ session, completed, onToggle, level }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function toggle(next) {
    setSaving(true);
    setError('');
    try {
      await api('/me/workouts/today', { method: 'PUT', body: { completed: next } });
      onToggle(next);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="flex flex-col p-5">
      <CardHeader icon={Dumbbell} title={t('Allenamento di oggi')} />
      {!session ? (
        <div className="mt-4">
          <p className="font-display text-xl font-semibold">{t('Giorno di recupero')}</p>
          <p className="mt-1 text-sm text-ink-700">{t('Oggi non è prevista una sessione: il recupero fa parte del percorso.')}</p>
          <button type="button" className="btn-soft mt-4" disabled={saving} onClick={() => toggle(!completed)}>
            {completed ? t('Annulla allenamento extra') : t('Ho fatto comunque un allenamento')}
          </button>
        </div>
      ) : (
        <>
          <div className="mt-4 flex items-start gap-3">
            <IconBadge icon={Dumbbell} />
            <div>
              <h2 className="font-display text-xl font-semibold">{session.name}</h2>
              <p className="mt-1 flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-700">
                {session.durationMin && (
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-ink-500" /> {session.durationMin} min
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <SignalMedium className="h-4 w-4 text-ink-500" /> {LEVEL_LABELS[level]}
                </span>
                {session.focus && <span className="text-ink-500">{session.focus}</span>}
              </p>
            </div>
          </div>
          {session.description && <p className="mt-3 text-sm text-ink-700">{session.description}</p>}
          <div className="mt-4">
            <ExercisesTable exercises={session.exercises} />
          </div>
          <div className="mt-auto pt-5">
            {completed ? (
              <div className="flex items-center justify-between gap-3 rounded-full bg-brand-50 py-2 pr-2 pl-5">
                <span className="inline-flex items-center gap-2 font-semibold text-brand-800">
                  <CircleCheck className="h-5 w-5" /> {t('Completato, ottimo lavoro!')}
                </span>
                <button type="button" className="btn-soft" disabled={saving} onClick={() => toggle(false)}>
                  {saving ? <Spinner className="h-4 w-4" /> : t('Annulla')}
                </button>
              </div>
            ) : (
              <button type="button" className="btn-primary w-full" disabled={saving} onClick={() => toggle(true)}>
                {saving ? <Spinner className="h-5 w-5 text-white" /> : <CircleCheck className="h-5 w-5" />} {t('Segna come completato')}
              </button>
            )}
          </div>
        </>
      )}
      {error && <p className="mt-2 text-sm text-amber-700">{error}</p>}
    </Card>
  );
}

function WeekCard({ week, today, trainer }) {
  return (
    <Card className="p-5">
      <CardHeader icon={CalendarCheck} title={t('Questa settimana')} />
      <p className="mt-4">
        <span className="font-display text-[32px] leading-none font-semibold">
          {week.completed} / {week.planned}
        </span>
        <span className="ml-2 text-sm text-ink-500">{t('completati')}</span>
      </p>
      <ProgressBar value={week.completed} max={week.planned} className="mt-3" />
      <ul className="mt-4 space-y-1">
        {week.days.map((d) => {
          const isToday = d.day === today;
          return (
            <li key={d.day} className={`flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm ${isToday ? 'bg-brand-50' : ''}`}>
              <span className={`w-16 shrink-0 ${isToday ? 'font-semibold text-brand-800' : 'text-ink-500'}`}>
                {isToday ? t('Oggi') : capitalize(fmtDayKey(d.day, { weekday: 'short', day: 'numeric' }).replace('.', ''))}
              </span>
              <span className={`min-w-0 flex-1 truncate ${d.session ? '' : 'text-ink-400'}`}>{d.session ?? t('Riposo')}</span>
              {d.completed ? (
                <CircleCheck className="h-5 w-5 fill-brand-500 text-white" aria-label={t('Svolto')} />
              ) : d.session && d.day < today ? (
                <span className="text-xs font-medium text-amber-600">{t('Saltato')}</span>
              ) : null}
            </li>
          );
        })}
      </ul>
      {trainer && (
        <div className="mt-4 flex items-center gap-3 rounded-xl bg-soft p-3">
          <Avatar user={trainer} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{displayName(trainer)}</p>
            <p className="text-xs text-ink-500">{t('Il tuo personal trainer')}</p>
          </div>
          <Link to={`/app/notifiche?con=${trainer.id}`} className="btn-outline px-3 py-1.5" aria-label={t('Scrivi al personal trainer')}>
            <MessageCircle className="h-4 w-4" />
          </Link>
        </div>
      )}
    </Card>
  );
}

function SessionAccordion({ session, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  const day = WEEKDAYS.find((w) => w.value === session.dayOfWeek);
  return (
    <div className="rounded-2xl border border-line">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-center gap-3 px-4 py-3 text-left">
        <span className="grid h-10 w-12 shrink-0 place-items-center rounded-lg bg-brand-50 text-xs font-semibold text-brand-800">
          {day?.short ?? '—'}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold">{session.name}</span>
          <span className="block truncate text-xs text-ink-500">
            {[session.focus, session.durationMin && `${session.durationMin} min`, t('{n} esercizi', { n: session.exercises.length })].filter(Boolean).join(' · ')}
          </span>
        </span>
        <ChevronDown className={`h-5 w-5 shrink-0 text-ink-400 transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="border-t border-line px-4 py-3">
          {session.description && <p className="mb-3 text-sm text-ink-700">{session.description}</p>}
          <ExercisesTable exercises={session.exercises} />
        </div>
      )}
    </div>
  );
}

function ConsistencyCard({ rows }) {
  const [range, setRange] = useState('3M');
  const data = useMemo(() => rows.slice(-RANGES.find((r) => r.key === range).weeks), [rows, range]);
  return (
    <Card className="p-5">
      <CardHeader icon={ChartNoAxesColumn} title={t('La tua costanza')} action={<RangeTabs value={range} onChange={setRange} />} />
      <div className="mt-3 flex flex-col items-center gap-4 sm:flex-row">
        <div className="w-full min-w-0 flex-1">
          <ConsistencyChart data={data} />
        </div>
        <ProgressRing value={totalPercent(data)} sublabel={t('Allenamenti completati')} />
      </div>
    </Card>
  );
}
