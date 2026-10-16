import { CalendarCheck, CalendarDays, ChevronLeft, ChevronRight, Clock, Eye, EyeOff, Hourglass, Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { AppointmentList } from '../../components/agenda.jsx';
import { Flash, PageHeader, Tabs, useFlash } from '../../components/forms.jsx';
import { Card, ErrorState, PageLoader } from '../../components/ui.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { t } from '../../i18n/index.js';
import { addDaysKey, capitalize, displayName, fmtDayKey, fmtDuration, fmtTime, todayKey, weekStartKey } from '../../lib/format.js';
import { useApi } from '../../lib/useApi.js';
import { useMediaQuery } from '../../lib/useMediaQuery.js';
import { monthGrid, shiftMonthKey, workingHoursOf } from './agendaUtils.js';
import { AppointmentDetails } from './AppointmentDetails.jsx';
import { AppointmentModal } from './AppointmentModal.jsx';
import { DayPanel, MonthView } from './MonthView.jsx';
import { DayStrip, WeekView } from './WeekView.jsx';

const VIEW_KEY = 'wellsyn.agendaView';
const readView = () => {
  try {
    return localStorage.getItem(VIEW_KEY) ?? 'week';
  } catch {
    return 'week';
  }
};

const byDate = (a, b) => new Date(a.date) - new Date(b.date);

export default function AgendaPage() {
  const { user } = useAuth();
  const isPro = user.role !== 'client';
  const today = todayKey();
  const isPhone = useMediaQuery('(max-width: 767px)');
  const [params, setParams] = useSearchParams();

  const [view, setViewState] = useState(readView);
  const [anchor, setAnchor] = useState(() => params.get('giorno') ?? today);
  const [listTab, setListTab] = useState('upcoming');
  const [showCancelled, setShowCancelled] = useState(false);
  const [editor, setEditor] = useState(null); // { appointment } oppure { initial }
  const [openId, setOpenId] = useState(null);
  const [flash, setFlash] = useFlash();

  const setView = (v) => {
    setViewState(v);
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {
      // preferenza non salvata: pazienza
    }
  };

  // Periodo da caricare: l'intero mese mostrato (copre anche la settimana) oppure un intervallo ampio per l'elenco
  const grid = monthGrid(anchor);
  const range = view === 'list' ? { from: addDaysKey(today, -120), to: addDaysKey(today, 240) } : { from: grid[0], to: grid[41] };
  const { data, error, loading, reload, setData } = useApi(`/appointments?from=${range.from}&to=${range.to}`);
  // Riepilogo della settimana in corso e prossimi appuntamenti
  const upcoming = useApi(`/appointments?from=${weekStartKey(today)}&to=${addDaysKey(today, 90)}`);

  // Apertura diretta del modulo da altre pagine: /app/agenda?nuovo=1&cliente=ID
  useEffect(() => {
    if (isPro && params.get('nuovo')) {
      setEditor({ initial: { clientId: params.get('cliente') ?? '', day: params.get('giorno') ?? undefined } });
      setParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const appointments = useMemo(() => [...(data?.appointments ?? [])].sort(byDate), [data]);
  const marks = useMemo(() => new Set(appointments.filter((a) => a.status === 'scheduled').map((a) => a.day)), [appointments]);
  const opened = appointments.find((a) => a.id === openId) ?? upcoming.data?.appointments.find((a) => a.id === openId);
  const hours = workingHoursOf(user);

  if (loading && !data) return <PageLoader />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  // Navigazione nel tempo
  const weekStart = weekStartKey(anchor);
  const step = (dir) => {
    if (view === 'month') setAnchor(shiftMonthKey(anchor, dir));
    else setAnchor(addDaysKey(anchor, (isPhone ? 1 : 7) * dir));
  };
  const periodTitle =
    view === 'month'
      ? capitalize(fmtDayKey(anchor, { month: 'long', year: 'numeric' }))
      : isPhone
        ? capitalize(fmtDayKey(anchor, { weekday: 'long', day: 'numeric', month: 'long' }))
        : weekTitle(weekStart);

  // Aggiornamenti dopo le azioni
  function upsert(appointment) {
    setData((d) => ({
      appointments: [...d.appointments.filter((a) => a.id !== appointment.id), appointment],
    }));
    upcoming.reload();
  }
  function onSaved(appointment, edited) {
    upsert(appointment);
    setOpenId(null);
    if (appointment.day < range.from || appointment.day > range.to) setAnchor(appointment.day);
    setFlash(
      edited
        ? t('Appuntamento aggiornato.')
        : t('Appuntamento fissato: {client} lo vedrà nella sua agenda.', { client: appointment.client?.firstName ?? t('il cliente') }),
    );
  }

  const create = (initial = {}) => setEditor({ initial });

  // Elenco
  const now = Date.now();
  const isUpcoming = (a) => a.status === 'scheduled' && new Date(a.end).getTime() >= now;
  const lists = {
    upcoming: appointments.filter(isUpcoming),
    past: appointments.filter((a) => !isUpcoming(a) && a.status !== 'cancelled').reverse(),
    cancelled: appointments.filter((a) => a.status === 'cancelled').reverse(),
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('Agenda')}
        subtitle={
          isPro
            ? t('I tuoi appuntamenti con i clienti: fissali, spostali e tieni d’occhio gli orari liberi.')
            : t('I tuoi appuntamenti con i professionisti che ti seguono.')
        }
        actions={
          isPro && (
            <button type="button" className="btn-primary" onClick={() => create({ day: anchor >= today ? anchor : today })}>
              <Plus className="h-4 w-4" /> {user.role === 'trainer' ? t('Nuova sessione') : t('Nuovo appuntamento')}
            </button>
          )
        }
      />
      <Flash>{flash}</Flash>

      <Summary appointments={upcoming.data?.appointments ?? []} isPro={isPro} onOpen={(a) => setOpenId(a.id)} />

      {/* Barra degli strumenti */}
      <div className="flex flex-wrap items-center gap-3">
        {view !== 'list' && (
          <div className="flex items-center gap-2">
            <button type="button" className="btn-soft px-3.5" onClick={() => setAnchor(today)}>
              {t('Oggi')}
            </button>
            <div className="flex rounded-full border border-line bg-surface">
              <button type="button" onClick={() => step(-1)} className="grid h-9 w-9 place-items-center rounded-full text-ink-700 hover:bg-hover" aria-label={t('Precedente')}>
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => step(1)} className="grid h-9 w-9 place-items-center rounded-full text-ink-700 hover:bg-hover" aria-label={t('Successivo')}>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <h2 className="font-display text-lg font-semibold sm:text-xl">{periodTitle}</h2>
            {loading && <span className="h-2 w-2 animate-pulse rounded-full bg-brand-500" aria-label={t('Caricamento…')} />}
          </div>
        )}
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {view !== 'list' && (
            <button
              type="button"
              onClick={() => setShowCancelled((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium text-ink-500 hover:bg-surface"
              aria-pressed={showCancelled}
            >
              {showCancelled ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showCancelled ? t('Nascondi annullati') : t('Mostra annullati')}
            </button>
          )}
          <Tabs
            value={view}
            onChange={setView}
            tabs={[
              { value: 'week', label: isPhone ? t('Giorno') : t('Settimana') },
              { value: 'month', label: t('Mese') },
              { value: 'list', label: t('Elenco') },
            ]}
          />
        </div>
      </div>

      {!isPro && <Legend />}

      {view === 'week' && (
        <div className="space-y-3">
          {isPhone && <DayStrip weekStart={weekStart} selected={anchor} onSelect={setAnchor} appointments={appointments} />}
          <WeekView
            days={isPhone ? [anchor] : Array.from({ length: 7 }, (_, i) => addDaysKey(weekStart, i))}
            appointments={appointments}
            viewerRole={user.role}
            hours={hours}
            showCancelled={showCancelled}
            onOpen={(a) => setOpenId(a.id)}
            onSlot={isPro ? (day, time) => create({ day, time }) : undefined}
          />
          {isPro && <p className="text-xs text-ink-500">{t('Suggerimento: clicca uno spazio libero della griglia per fissare un appuntamento a quell’ora.')}</p>}
        </div>
      )}

      {view === 'month' && (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <MonthView
            anchor={anchor}
            selected={anchor}
            onSelect={setAnchor}
            appointments={appointments}
            viewerRole={user.role}
            showCancelled={showCancelled}
            onCreate={isPro ? (day) => create({ day }) : undefined}
          />
          <DayPanel day={anchor} appointments={appointments.filter((a) => showCancelled || a.status !== 'cancelled')} viewerRole={user.role} onOpen={(a) => setOpenId(a.id)} onCreate={isPro ? (day) => create({ day }) : undefined} />
        </div>
      )}

      {view === 'list' && (
        <>
          <Tabs
            className="w-fit max-w-full"
            value={listTab}
            onChange={setListTab}
            tabs={[
              { value: 'upcoming', label: t('In programma'), count: lists.upcoming.length },
              { value: 'past', label: t('Passati') },
              { value: 'cancelled', label: t('Annullati') },
            ]}
          />
          <Card className="p-5">
            <AppointmentList
              appointments={lists[listTab]}
              person={isPro ? 'client' : 'professional'}
              onOpen={(a) => setOpenId(a.id)}
              emptyText={listTab === 'upcoming' ? t('Nessun appuntamento in programma') : t('Nessun appuntamento')}
            />
          </Card>
        </>
      )}

      {opened && (
        <AppointmentDetails
          appointment={opened}
          viewerRole={user.role}
          onClose={() => setOpenId(null)}
          onChanged={(a) => {
            upsert(a);
            setFlash(t('Appuntamento aggiornato.'));
          }}
          onRemoved={(a) => {
            setData((d) => ({ appointments: d.appointments.filter((x) => x.id !== a.id) }));
            upcoming.reload();
            setOpenId(null);
            setFlash(t('Appuntamento eliminato.'));
          }}
          onEdit={(a) => {
            setOpenId(null);
            setEditor({ appointment: a });
          }}
        />
      )}

      {isPro && (
        <AppointmentModal
          open={Boolean(editor)}
          onClose={() => setEditor(null)}
          onSaved={onSaved}
          user={user}
          appointment={editor?.appointment}
          initial={editor?.initial}
          marks={marks}
        />
      )}
    </div>
  );
}

function weekTitle(start) {
  const end = addDaysKey(start, 6);
  const sameMonth = start.slice(0, 7) === end.slice(0, 7);
  const from = fmtDayKey(start, sameMonth ? { day: 'numeric' } : { day: 'numeric', month: 'short' });
  return `${from} – ${fmtDayKey(end, { day: 'numeric', month: sameMonth ? 'long' : 'short', year: 'numeric' })}`;
}

/** Riepilogo in cima: oggi, settimana, ore prenotate e prossimo appuntamento. */
function Summary({ appointments, isPro, onOpen }) {
  const today = todayKey();
  const weekEnd = addDaysKey(weekStartKey(today), 6);
  const scheduled = appointments.filter((a) => a.status === 'scheduled');
  const todayCount = scheduled.filter((a) => a.day === today).length;
  const week = scheduled.filter((a) => a.day <= weekEnd);
  const minutes = week.reduce((s, a) => s + a.durationMin, 0);
  const next = scheduled.find((a) => new Date(a.end).getTime() > Date.now());
  const person = next && (isPro ? next.client : next.professional);

  const tiles = [
    { icon: CalendarCheck, label: t('Oggi'), value: todayCount, sub: todayCount === 1 ? t('appuntamento') : t('appuntamenti') },
    { icon: CalendarDays, label: t('Questa settimana'), value: week.length, sub: week.length === 1 ? t('appuntamento') : t('appuntamenti') },
    ...(isPro ? [{ icon: Hourglass, label: t('Ore prenotate'), value: minutes ? fmtDuration(minutes) : '0 h', sub: t('questa settimana') }] : []),
  ];

  return (
    <div className={`grid gap-3 ${isPro ? 'grid-cols-3 lg:grid-cols-4' : 'grid-cols-2 lg:grid-cols-3'}`}>
      {tiles.map(({ icon: Icon, label, value, sub }) => (
        <div key={label} className="card flex items-center gap-3 p-3 sm:p-4">
          <span className="hidden h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-700 sm:grid">
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-ink-500">{label}</p>
            <p className="font-display text-xl leading-tight font-semibold">
              {value} <span className="block text-xs font-normal text-ink-500 sm:inline">{sub}</span>
            </p>
          </div>
        </div>
      ))}
      <button
        type="button"
        disabled={!next}
        onClick={() => next && onOpen(next)}
        className="card col-span-full flex items-center gap-3 bg-primary p-4 text-left text-white disabled:opacity-90 lg:col-span-1"
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/15">
          <Clock className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-medium text-white/75">{t('Prossimo appuntamento')}</p>
          {next ? (
            <p className="truncate font-semibold">
              {next.day === today ? t('Oggi') : capitalize(fmtDayKey(next.day, { weekday: 'short', day: 'numeric', month: 'short' }))}, {fmtTime(next.date)}
              {person && <span className="font-normal text-white/80"> · {displayName(person)}</span>}
            </p>
          ) : (
            <p className="font-semibold">{t('Nessuno in programma')}</p>
          )}
        </div>
      </button>
    </div>
  );
}

function Legend() {
  return (
    <p className="flex flex-wrap gap-4 text-xs text-ink-500">
      <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-brand-500" /> {t('Nutrizionista')}</span>
      <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-iris-500" /> {t('Personal Trainer')}</span>
      <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-ink-400" /> {t('Svolto')}</span>
    </p>
  );
}
