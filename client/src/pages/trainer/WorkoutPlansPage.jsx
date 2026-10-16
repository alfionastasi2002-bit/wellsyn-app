import {
  Archive,
  Search,
  ArrowDown,
  ArrowUp,
  ChevronDown,
  CircleCheck,
  Copy,
  CopyPlus,
  Dumbbell,
  LayoutTemplate,
  Pencil,
  Plus,
  RotateCcw,
  StickyNote,
  Timer,
  Trash2,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router';
import { Avatar } from '../../components/Avatar.jsx';
import { DatePicker, Popover } from '../../components/DatePicker.jsx';
import { Chip, Segmented, Stepper, SuggestInput } from '../../components/editor.jsx';
import {
  ClientSelect,
  ConfirmButton,
  Flash,
  PageHeader,
  SaveButton,
  StatusPill,
  Tabs,
  TextInput,
  numberToText,
  toNumber,
} from '../../components/forms.jsx';
import { Card, CardHeader, EmptyState, ErrorState, PageLoader } from '../../components/ui.jsx';
import { t, translateMessage } from '../../i18n/index.js';
import { api } from '../../lib/api.js';
import {
  estimateMinutes,
  exerciseByName,
  FOCUS_OPTIONS,
  REPS_PRESETS,
  REST_OPTIONS,
  searchExercises,
  SESSION_TEMPLATES,
} from '../../lib/exerciseLibrary.js';
import { fmtDate, todayKey } from '../../lib/format.js';
import { LEVEL_LABELS, LEVELS, PLAN_STATUS, WEEKDAYS } from '../../lib/labels.js';
import { useApi } from '../../lib/useApi.js';
import { FormError } from '../auth/fields.jsx';

export default function WorkoutPlansPage({ itemId }) {
  if (itemId) return <WorkoutPlanEditor id={itemId === 'nuova' || itemId === 'nuovo' ? null : itemId} />;
  return <WorkoutPlanList />;
}

// Elenco

const STATUS_LABEL = { active: 'Attiva', draft: 'Bozza', archived: 'Archiviata' };

function WorkoutPlanList() {
  const { data, error, loading, reload, setData } = useApi('/workout-plans');
  const location = useLocation();
  const [tab, setTab] = useState('active');
  const [query, setQuery] = useState('');

  if (loading && !data) return <PageLoader />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const q = query.trim().toLowerCase();
  const plans = data.plans.filter((p) => !q || `${p.title} ${p.client?.fullName ?? ''}`.toLowerCase().includes(q));
  const groups = {
    active: plans.filter((p) => p.status === 'active'),
    review: plans.filter((p) => p.needsReview && p.status !== 'archived'),
    draft: plans.filter((p) => p.status === 'draft'),
    archived: plans.filter((p) => p.status === 'archived'),
  };

  async function patch(plan, body) {
    await api(`/workout-plans/${plan.id}`, { method: 'PATCH', body });
    reload();
  }
  async function remove(plan) {
    await api(`/workout-plans/${plan.id}`, { method: 'DELETE' });
    setData((d) => ({ plans: d.plans.filter((p) => p.id !== plan.id) }));
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('Schede allenamento')}
        subtitle={t('Crea e aggiorna le schede dei tuoi clienti. Ogni cliente ha una sola scheda attiva alla volta.')}
        actions={
          <Link to="/app/schede/nuova" className="btn-primary">
            <Plus className="h-4 w-4" /> {t('Nuova scheda')}
          </Link>
        }
      />
      <Flash>{location.state?.flash}</Flash>
      <div className="flex flex-wrap items-center gap-3">
      <Tabs
        value={tab}
        onChange={setTab}
        className="w-fit max-w-full"
        tabs={[
          { value: 'active', label: t('Attive') },
          { value: 'review', label: t('Da aggiornare'), count: groups.review.length },
          { value: 'draft', label: t('Bozze') },
          { value: 'archived', label: t('Archiviate') },
        ]}
      />
        <label className="relative block w-full sm:w-72">
          <span className="sr-only">{t('Cerca')}</span>
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('Cerca per cliente o titolo…')}
            className="w-full rounded-xl border border-line bg-surface py-2.5 pr-3 pl-10 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
          />
        </label>
      </div>
      <Card className="p-2 sm:p-3">
        {groups[tab].length === 0 ? (
          <EmptyState icon={Dumbbell} title={t('Nessuna scheda in questa sezione')}>
            {tab === 'active' && (
              <Link to="/app/schede/nuova" className="btn-primary mt-2">
                {t('Crea la prima scheda')}
              </Link>
            )}
          </EmptyState>
        ) : (
          <ul className="divide-y divide-line">
            {groups[tab].map((p) => (
              <li key={p.id} className="flex flex-col gap-3 p-3 lg:flex-row lg:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <Avatar user={p.client} />
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{p.title}</p>
                    <p className="truncate text-sm text-ink-500">
                      {p.client?.fullName} · {LEVEL_LABELS[p.level]} · {t('{n} sessioni/settimana', { n: p.sessionsCount })} ·{' '}
                      {t('settimana {current} di {total}', { current: p.currentWeek, total: p.weeks })}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <StatusPill className={PLAN_STATUS[p.status].pill}>{t(STATUS_LABEL[p.status])}</StatusPill>
                  {p.needsReview && <StatusPill className="bg-amber-50 text-amber-700">{t('Da aggiornare')}</StatusPill>}
                  <span className="text-ink-500">{t('Aggiornata il {date}', { date: fmtDate(p.updatedAt, { day: 'numeric', month: 'short' }) })}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link to={`/app/schede/${p.id}`} className="btn-outline">
                    <Pencil className="h-4 w-4" /> {t('Modifica')}
                  </Link>
                  <Link to={`/app/schede/nuova?da=${p.id}`} className="btn-soft" title={t('Usa questa scheda come base per un altro cliente')}>
                    <CopyPlus className="h-4 w-4" /> {t('Duplica')}
                  </Link>
                  {p.needsReview && (
                    <button type="button" className="btn-soft" onClick={() => patch(p, { needsReview: false })}>
                      <CircleCheck className="h-4 w-4" /> {t('Aggiornata')}
                    </button>
                  )}
                  {p.status === 'archived' ? (
                    <button type="button" className="btn-soft" onClick={() => patch(p, { status: 'active' })}>
                      <RotateCcw className="h-4 w-4" /> {t('Riattiva')}
                    </button>
                  ) : (
                    <button type="button" className="btn-soft" onClick={() => patch(p, { status: 'archived' })}>
                      <Archive className="h-4 w-4" /> {t('Archivia')}
                    </button>
                  )}
                  {p.status !== 'active' && (
                    <ConfirmButton confirmLabel={t('Elimina')} onConfirm={() => remove(p)}>
                      <Trash2 className="h-4 w-4" /> {t('Elimina')}
                    </ConfirmButton>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

// Editor

let keySeed = 0;
const newKey = () => `w${++keySeed}`;
const emptyExercise = (values = {}) => ({ key: newKey(), name: '', sets: '3', reps: '', restSec: '60', notes: '', showNotes: false, ...values });
const exerciseFrom = (name) => {
  const e = exerciseByName(name);
  return emptyExercise({ name: t(name), sets: String(e?.sets ?? 3), reps: t(e?.reps ?? ''), restSec: String(e?.restSec ?? 60) });
};
const emptySession = (dayOfWeek = '') => ({
  key: newKey(),
  name: '',
  focus: '',
  description: '',
  durationMin: '',
  dayOfWeek: String(dayOfWeek),
  open: true,
  exercises: [emptyExercise(), emptyExercise()],
});

function fromPlan(plan, { copy = false } = {}) {
  return {
    clientId: copy ? '' : (plan.client?.id ?? ''),
    title: copy ? `${plan.title} (${t('copia')})` : plan.title,
    level: plan.level,
    weeks: String(plan.weeks),
    startDate: copy ? todayKey() : (plan.startDate ?? ''),
    status: copy ? 'active' : plan.status,
    // In ordine di giorno (lunedì per primo, sessioni libere in fondo)
    sessions: [...plan.sessions].sort((a, b) => (a.dayOfWeek ?? 8) - (b.dayOfWeek ?? 8)).map((s, i) => ({
      key: newKey(),
      name: s.name,
      focus: s.focus ?? '',
      description: s.description ?? '',
      durationMin: numberToText(s.durationMin),
      dayOfWeek: s.dayOfWeek ? String(s.dayOfWeek) : '',
      open: i === 0,
      exercises: s.exercises.map((ex) => ({
        key: newKey(),
        name: ex.name,
        sets: numberToText(ex.sets),
        reps: ex.reps ?? '',
        restSec: numberToText(ex.restSec),
        notes: ex.notes ?? '',
        showNotes: Boolean(ex.notes),
      })),
    })),
  };
}

function WorkoutPlanEditor({ id }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sourceId = searchParams.get('da');
  const existing = useApi(id ? `/workout-plans/${id}` : sourceId ? `/workout-plans/${sourceId}` : null);
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const sessionRefs = useRef(new Map());

  useEffect(() => {
    if (existing.data && !form) setForm(fromPlan(existing.data.plan, { copy: !id }));
    if (!id && !sourceId && !form) {
      setForm({
        clientId: searchParams.get('cliente') ?? '',
        title: '',
        level: 'intermedio',
        weeks: '4',
        startDate: todayKey(),
        status: 'active',
        sessions: [emptySession(1)],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, sourceId, existing.data]);

  if (existing.loading || !form) return <PageLoader />;
  if (existing.error) return <ErrorState error={existing.error} onRetry={existing.reload} />;

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const updateSession = (key, patch) => setForm((f) => ({ ...f, sessions: f.sessions.map((s) => (s.key === key ? { ...s, ...patch } : s)) }));
  const takenDays = new Map(form.sessions.filter((s) => s.dayOfWeek).map((s) => [Number(s.dayOfWeek), s]));
  const freeDay = () => WEEKDAYS.find((w) => !takenDays.has(w.value))?.value ?? '';

  function addSession(template) {
    const session = emptySession(freeDay());
    if (template) Object.assign(session, sessionFromTemplate(template));
    setForm((f) => ({ ...f, sessions: [...f.sessions.map((s) => ({ ...s, open: false })), session] }));
    requestAnimationFrame(() => sessionRefs.current.get(session.key)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  function openSession(key) {
    setForm((f) => ({ ...f, sessions: f.sessions.map((s) => (s.key === key ? { ...s, open: true } : s)) }));
    requestAnimationFrame(() => sessionRefs.current.get(key)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  async function save(e) {
    e.preventDefault();
    setError('');
    if (!form.clientId) return setError(t('Seleziona il cliente.'));
    if (!form.title.trim()) return setError(t('Dai un titolo alla scheda.'));
    const weeks = toNumber(form.weeks);
    if (!weeks || Number.isNaN(weeks)) return setError(t('Indica la durata in settimane.'));

    const sessions = [];
    for (const s of form.sessions) {
      if (!s.name.trim()) {
        openSession(s.key);
        return setError(t('Dai un nome a ogni sessione (es. "Forza parte superiore").'));
      }
      const exercises = [];
      for (const ex of s.exercises) {
        if (!ex.name.trim()) continue;
        const sets = toNumber(ex.sets);
        const restSec = toNumber(ex.restSec);
        if (Number.isNaN(sets) || Number.isNaN(restSec)) {
          openSession(s.key);
          return setError(t('Valori non validi nell\'esercizio "{name}".', { name: ex.name }));
        }
        exercises.push({ name: ex.name.trim(), sets, reps: ex.reps.trim(), restSec, notes: ex.notes.trim() });
      }
      const durationMin = toNumber(s.durationMin) ?? (estimateMinutes(exercises) || null);
      if (Number.isNaN(durationMin)) return setError(t('Durata non valida in "{name}".', { name: s.name }));
      sessions.push({
        name: s.name.trim(),
        focus: s.focus.trim(),
        description: s.description.trim(),
        durationMin,
        dayOfWeek: s.dayOfWeek ? Number(s.dayOfWeek) : null,
        exercises,
      });
    }

    const body = { title: form.title, level: form.level, weeks, startDate: form.startDate || null, status: form.status, sessions };
    setSaving(true);
    try {
      if (id) await api(`/workout-plans/${id}`, { method: 'PUT', body });
      else await api('/workout-plans', { method: 'POST', body: { ...body, clientId: form.clientId } });
      navigate('/app/schede', { state: { flash: t('Scheda "{title}" salvata.', { title: form.title }) } });
    } catch (err) {
      setError(translateMessage(err.message));
      setSaving(false);
    }
  }

  const totalExercises = form.sessions.reduce((n, s) => n + s.exercises.filter((x) => x.name.trim()).length, 0);

  return (
    <form onSubmit={save} className="space-y-5" noValidate>
      <PageHeader
        back={{ to: '/app/schede', label: t('Schede allenamento') }}
        title={id ? t('Modifica scheda') : t('Nuova scheda')}
        actions={<SaveButton saving={saving}>{t('Salva scheda')}</SaveButton>}
      />
      <FormError>{error}</FormError>
      {/* Ripetizioni suggerite per tutti gli esercizi */}
      <datalist id="reps-presets">
        {REPS_PRESETS.map((r) => (
          <option key={r} value={t(r)} />
        ))}
      </datalist>

      <Card className="p-5">
        <CardHeader icon={Dumbbell} title={t('Informazioni')} />
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <ClientSelect value={form.clientId} onChange={(v) => set({ clientId: v })} disabled={Boolean(id)} />
          <TextInput label={t('Titolo della scheda')} placeholder={t('es. Ricomposizione corporea')} value={form.title} onChange={(e) => set({ title: e.target.value })} className="xl:col-span-2" />
          <DatePicker label={t('Inizio')} value={form.startDate} onChange={(v) => set({ startDate: v })} />
          <Segmented
            label={t('Livello')}
            value={form.level}
            onChange={(level) => set({ level })}
            options={LEVELS.map((l) => ({ value: l, label: t(l.charAt(0).toUpperCase() + l.slice(1)) }))}
            className="sm:col-span-2"
          />
          <div>
            <span className="mb-1.5 block text-sm font-medium text-ink-700">{t('Durata')}</span>
            <Stepper value={form.weeks} onChange={(weeks) => set({ weeks })} min={1} max={52} label={t('settimane')} suffix={t('sett.')} className="max-w-[180px]" />
          </div>
          <Segmented
            label={t('Stato')}
            value={form.status}
            onChange={(status) => set({ status })}
            options={[
              { value: 'active', label: t('Attiva') },
              { value: 'draft', label: t('Bozza') },
              { value: 'archived', label: t('Archiviata') },
            ]}
          />
        </div>
      </Card>

      {/* Settimana tipo: un colpo d'occhio su quali giorni hanno una sessione */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold">{t('Settimana tipo')}</p>
          <p className="text-xs text-ink-500">
            {t('{s} sessioni · {e} esercizi', { s: form.sessions.length, e: totalExercises })}
          </p>
        </div>
        <div className="mt-3 grid grid-cols-7 gap-1.5">
          {WEEKDAYS.map((w) => {
            const s = takenDays.get(w.value);
            return (
              <button
                key={w.value}
                type="button"
                onClick={() => (s ? openSession(s.key) : addSession())}
                className={`min-w-0 rounded-xl border px-1.5 py-2 text-center transition ${s ? 'border-brand-300 bg-brand-50 hover:border-brand-500' : 'border-dashed border-line text-ink-400 hover:border-brand-300'}`}
                title={s ? s.name || t('Sessione senza nome') : t('Aggiungi una sessione il {day}', { day: w.long.toLowerCase() })}
              >
                <span className={`block text-xs font-semibold ${s ? 'text-brand-800' : ''}`}>{w.short}</span>
                <span className="block truncate text-[11px]">{s ? s.name || '…' : t('Riposo')}</span>
              </button>
            );
          })}
        </div>
      </Card>

      <div className="space-y-4">
        {form.sessions.map((s, si) => (
          <div key={s.key} ref={(el) => (el ? sessionRefs.current.set(s.key, el) : sessionRefs.current.delete(s.key))} className="scroll-mt-24">
            <SessionCard
              session={s}
              index={si}
              takenDays={takenDays}
              canRemove={form.sessions.length > 1}
              canDuplicate={form.sessions.length < 7}
              onChange={(patch) => updateSession(s.key, patch)}
              onRemove={() => setForm((f) => ({ ...f, sessions: f.sessions.filter((x) => x.key !== s.key) }))}
              onDuplicate={() =>
                setForm((f) => ({
                  ...f,
                  sessions: [
                    ...f.sessions.map((x) => ({ ...x, open: false })),
                    { ...s, key: newKey(), open: true, dayOfWeek: String(freeDay()), name: `${s.name} (${t('copia')})`, exercises: s.exercises.map((ex) => ({ ...ex, key: newKey() })) },
                  ],
                }))
              }
            />
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-outline" disabled={form.sessions.length >= 7} onClick={() => addSession()}>
            <Plus className="h-4 w-4" /> {t('Aggiungi sessione')}
          </button>
          <TemplatePicker disabled={form.sessions.length >= 7} onPick={(tpl) => addSession(tpl)} label={t('Sessione da modello')} />
        </div>
        <SaveButton saving={saving}>{t('Salva scheda')}</SaveButton>
      </div>
    </form>
  );
}

function sessionFromTemplate(tpl) {
  return {
    name: t(tpl.name),
    focus: t(tpl.focus),
    description: t(tpl.description),
    durationMin: '',
    exercises: tpl.exercises.map(exerciseFrom),
  };
}

/** Elenco dei modelli di sessione in una finestrella. */
function TemplatePicker({ onPick, label, disabled, variant = 'btn-soft' }) {
  const anchorRef = useRef(null);
  const [open, setOpen] = useState(false);
  return (
    <>
      <button ref={anchorRef} type="button" className={variant} disabled={disabled} onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <LayoutTemplate className="h-4 w-4" /> {label} <ChevronDown className="h-3.5 w-3.5" />
      </button>
      <Popover anchorRef={anchorRef} open={open} onClose={() => setOpen(false)} className="w-80 p-1.5">
        {SESSION_TEMPLATES.map((tpl) => (
          <button
            key={tpl.id}
            type="button"
            onClick={() => {
              onPick(tpl);
              setOpen(false);
            }}
            className="flex w-full flex-col rounded-xl px-3 py-2 text-left hover:bg-brand-50"
          >
            <span className="text-sm font-semibold">{t(tpl.name)}</span>
            <span className="truncate text-xs text-ink-500">{tpl.exercises.map((name) => t(name)).join(' · ')}</span>
          </button>
        ))}
      </Popover>
    </>
  );
}

function SessionCard({ session: s, index, takenDays, canRemove, canDuplicate, onChange, onRemove, onDuplicate }) {
  const filled = s.exercises.filter((x) => x.name.trim());
  const estimate = estimateMinutes(filled);
  const dayLabel = s.dayOfWeek ? WEEKDAYS[Number(s.dayOfWeek) - 1].short : t('Libero');

  const updateExercise = (key, patch) => onChange({ exercises: s.exercises.map((ex) => (ex.key === key ? { ...ex, ...patch } : ex)) });
  const moveExercise = (i, dir) => {
    const list = [...s.exercises];
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    onChange({ exercises: list });
  };

  return (
    <Card className="overflow-visible">
      <div className="flex flex-wrap items-center gap-3 p-4">
        <button type="button" onClick={() => onChange({ open: !s.open })} className="flex min-w-0 flex-1 items-center gap-3 text-left" aria-expanded={s.open}>
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary text-xs font-bold text-white uppercase">{dayLabel}</span>
          <span className="min-w-0">
            <span className="block truncate font-semibold">{s.name || t('Sessione {n}', { n: index + 1 })}</span>
            <span className="block truncate text-xs text-ink-500">
              {t('{n} esercizi', { n: filled.length })}
              {s.focus && ` · ${s.focus}`}
              {(toNumber(s.durationMin) || estimate) > 0 && ` · ${toNumber(s.durationMin) || `~${estimate}`} min`}
            </span>
          </span>
          <ChevronDown className={`ml-auto h-5 w-5 shrink-0 text-ink-400 transition ${s.open ? 'rotate-180' : ''}`} />
        </button>
        <div className="flex gap-1.5">
          <button type="button" className="btn-soft px-3" onClick={onDuplicate} disabled={!canDuplicate} title={t('Duplica sessione')} aria-label={t('Duplica sessione')}>
            <Copy className="h-4 w-4" />
          </button>
          {canRemove && (
            <ConfirmButton className="btn-soft px-3" confirmLabel={t('Rimuovi')} onConfirm={onRemove}>
              <Trash2 className="h-4 w-4" aria-label={t('Rimuovi sessione')} />
            </ConfirmButton>
          )}
        </div>
      </div>

      {s.open && (
        <div className="space-y-4 border-t border-line p-4 sm:p-5">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <TextInput label={t('Nome della sessione')} placeholder={t('es. Forza parte superiore')} value={s.name} onChange={(e) => onChange({ name: e.target.value })} />
            <div>
              <span className="mb-1.5 block text-sm font-medium text-ink-700">{t('Giorno')}</span>
              <div className="flex flex-wrap gap-1.5">
                {WEEKDAYS.map((w) => {
                  const other = takenDays.get(w.value);
                  const busy = other && other.key !== s.key;
                  return (
                    <Chip
                      key={w.value}
                      active={Number(s.dayOfWeek) === w.value}
                      disabled={busy}
                      title={busy ? t('Già usato da "{name}"', { name: other.name || t('un\'altra sessione') }) : w.long}
                      onClick={() => onChange({ dayOfWeek: String(w.value) })}
                      className="px-2.5 py-1 text-xs"
                    >
                      {w.short}
                    </Chip>
                  );
                })}
                <Chip active={!s.dayOfWeek} onClick={() => onChange({ dayOfWeek: '' })} className="px-2.5 py-1 text-xs">
                  {t('Libero')}
                </Chip>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_200px]">
            <div>
              <TextInput label={t('Focus')} placeholder={t('es. Upper Body')} value={s.focus} onChange={(e) => onChange({ focus: e.target.value })} />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {FOCUS_OPTIONS.map((f) => (
                  <Chip key={f} active={s.focus === t(f)} onClick={() => onChange({ focus: t(f) })} className="px-2 py-0.5 text-[11px]">
                    {t(f)}
                  </Chip>
                ))}
              </div>
            </div>
            <TextInput label={t('Descrizione')} placeholder={t('Obiettivo della sessione, indicazioni generali')} value={s.description} onChange={(e) => onChange({ description: e.target.value })} />
            <div>
              <TextInput
                label={t('Durata (min)')}
                inputMode="numeric"
                placeholder={estimate ? `~${estimate}` : '45'}
                value={s.durationMin}
                onChange={(e) => onChange({ durationMin: e.target.value })}
              />
              {estimate > 0 && !s.durationMin && (
                <p className="mt-1 flex items-center gap-1 text-xs text-ink-500">
                  <Timer className="h-3.5 w-3.5" /> {t('Stima automatica: {n} min', { n: estimate })}
                </p>
              )}
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold">{t('Esercizi')}</p>
              <TemplatePicker
                variant="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold text-brand-800 hover:bg-brand-50"
                label={t('Riempi da modello')}
                onPick={(tpl) => onChange(sessionFromTemplate(tpl))}
              />
            </div>
            <div className="mt-2 hidden grid-cols-[minmax(0,1fr)_120px_130px_110px_116px] gap-2 px-1 text-[11px] tracking-wider text-ink-500 uppercase md:grid">
              <span>{t('Esercizio')}</span>
              <span>{t('Serie')}</span>
              <span>{t('Ripetizioni')}</span>
              <span>{t('Recupero')}</span>
              <span className="sr-only">{t('Azioni')}</span>
            </div>
            <ul className="mt-1 space-y-2">
              {s.exercises.map((ex, ei) => (
                <ExerciseRow
                  key={ex.key}
                  exercise={ex}
                  index={ei}
                  onChange={(patch) => updateExercise(ex.key, patch)}
                  onMove={(dir) => moveExercise(ei, dir)}
                  onDuplicate={() => {
                    const list = [...s.exercises];
                    list.splice(ei + 1, 0, { ...ex, key: newKey() });
                    onChange({ exercises: list });
                  }}
                  onRemove={() => onChange({ exercises: s.exercises.filter((x) => x.key !== ex.key) })}
                />
              ))}
            </ul>
            <button type="button" className="btn-outline mt-3" onClick={() => onChange({ exercises: [...s.exercises, emptyExercise()] })}>
              <Plus className="h-4 w-4" /> {t('Aggiungi esercizio')}
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}

const restLabel = (sec) => (sec === 0 ? t('Nessuno') : sec < 60 ? `${sec} s` : sec % 60 ? `${Math.floor(sec / 60)}′${sec % 60}″` : `${sec / 60} min`);

function ExerciseRow({ exercise: ex, index, onChange, onMove, onDuplicate, onRemove }) {
  const suggestions = (query) =>
    searchExercises(query).map((e) => ({
      key: e.name,
      label: t(e.name),
      sub: `${t(e.group)} · ${e.sets} × ${t(e.reps)}`,
      exercise: e,
    }));
  const rest = Number(ex.restSec);
  const restOptions = REST_OPTIONS.includes(rest) || ex.restSec === '' ? REST_OPTIONS : [...REST_OPTIONS, rest].sort((a, b) => a - b);

  return (
    <li className="rounded-xl border border-line p-2.5 md:border-0 md:p-0">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-[minmax(0,1fr)_120px_130px_110px_116px] md:items-center">
        <SuggestInput
          className="col-span-2 md:col-span-1"
          value={ex.name}
          onChange={(name) => onChange({ name })}
          onPick={({ exercise: e }) => onChange({ name: t(e.name), sets: String(e.sets), reps: t(e.reps), restSec: String(e.restSec) })}
          suggestions={suggestions}
          placeholder={t('es. Panca piana')}
          ariaLabel={t('Esercizio {n}', { n: index + 1 })}
        />
        <label className="block">
          <span className="mb-0.5 block text-[11px] text-ink-500 md:sr-only">{t('Serie')}</span>
          <Stepper value={ex.sets} onChange={(sets) => onChange({ sets })} min={1} max={20} label={t('Serie')} />
        </label>
        <label className="block">
          <span className="mb-0.5 block text-[11px] text-ink-500 md:sr-only">{t('Ripetizioni')}</span>
          <input
            value={ex.reps}
            onChange={(e) => onChange({ reps: e.target.value })}
            list="reps-presets"
            placeholder="8 - 10"
            aria-label={t('Ripetizioni')}
            className="w-full min-w-0 rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
          />
        </label>
        <label className="block">
          <span className="mb-0.5 block text-[11px] text-ink-500 md:sr-only">{t('Recupero')}</span>
          <select
            value={ex.restSec}
            onChange={(e) => onChange({ restSec: e.target.value })}
            aria-label={t('Recupero')}
            className="w-full rounded-lg border border-line bg-surface px-2.5 py-2 text-sm outline-none focus:border-brand-500"
          >
            {ex.restSec === '' && <option value="">—</option>}
            {restOptions.map((sec) => (
              <option key={sec} value={sec}>
                {restLabel(sec)}
              </option>
            ))}
          </select>
        </label>
        <div className="col-span-2 flex justify-end md:col-span-1">
          <IconButton onClick={() => onChange({ showNotes: !ex.showNotes })} label={t('Note')} active={ex.showNotes || ex.notes}>
            <StickyNote className="h-4 w-4" />
          </IconButton>
          <IconButton onClick={() => onMove(-1)} label={t('Sposta su')}>
            <ArrowUp className="h-4 w-4" />
          </IconButton>
          <IconButton onClick={() => onMove(1)} label={t('Sposta giù')}>
            <ArrowDown className="h-4 w-4" />
          </IconButton>
          <IconButton onClick={onDuplicate} label={t('Duplica esercizio')}>
            <Copy className="h-4 w-4" />
          </IconButton>
          <IconButton onClick={onRemove} label={t('Rimuovi esercizio')}>
            <Trash2 className="h-4 w-4" />
          </IconButton>
        </div>
      </div>
      {(ex.showNotes || ex.notes) && (
        <input
          value={ex.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          placeholder={t('Note per il cliente (es. tempo 3-1-1, carico, tecnica)')}
          aria-label={t('Note esercizio {n}', { n: index + 1 })}
          className="mt-2 w-full rounded-lg border border-line bg-soft px-3 py-2 text-sm outline-none focus:border-brand-500"
        />
      )}
    </li>
  );
}

function IconButton({ onClick, label, children, active }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`grid h-9 w-8 place-items-center rounded-lg hover:bg-hover hover:text-ink-700 ${active ? 'text-brand-700' : 'text-ink-400'}`}
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  );
}
