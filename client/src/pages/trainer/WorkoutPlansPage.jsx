import { Archive, ArrowDown, ArrowUp, CircleCheck, CopyPlus, Dumbbell, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router';
import { Avatar } from '../../components/Avatar.jsx';
import {
  ClientSelect,
  ConfirmButton,
  Flash,
  NumberInput,
  PageHeader,
  SaveButton,
  SelectInput,
  StatusPill,
  Tabs,
  TextInput,
  numberToText,
  toNumber,
} from '../../components/forms.jsx';
import { Card, CardHeader, EmptyState, ErrorState, PageLoader } from '../../components/ui.jsx';
import { FormError } from '../auth/fields.jsx';
import { api } from '../../lib/api.js';
import { fmtDate, todayKey } from '../../lib/format.js';
import { LEVEL_LABELS, LEVELS, PLAN_STATUS, WEEKDAYS } from '../../lib/labels.js';
import { useApi } from '../../lib/useApi.js';

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

  if (loading && !data) return <PageLoader />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const plans = data.plans;
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
        title="Schede allenamento"
        subtitle="Crea e aggiorna le schede dei tuoi clienti. Ogni cliente ha una sola scheda attiva alla volta."
        actions={
          <Link to="/app/schede/nuova" className="btn-primary">
            <Plus className="h-4 w-4" /> Nuova scheda
          </Link>
        }
      />
      <Flash>{location.state?.flash}</Flash>
      <Tabs
        value={tab}
        onChange={setTab}
        className="w-fit max-w-full"
        tabs={[
          { value: 'active', label: 'Attive' },
          { value: 'review', label: 'Da aggiornare', count: groups.review.length },
          { value: 'draft', label: 'Bozze' },
          { value: 'archived', label: 'Archiviate' },
        ]}
      />
      <Card className="p-2 sm:p-3">
        {groups[tab].length === 0 ? (
          <EmptyState icon={Dumbbell} title="Nessuna scheda in questa sezione">
            {tab === 'active' && (
              <Link to="/app/schede/nuova" className="btn-primary mt-2">
                Crea la prima scheda
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
                      {p.client?.fullName} · {LEVEL_LABELS[p.level]} · {p.sessionsCount} sessioni/settimana · settimana {p.currentWeek} di{' '}
                      {p.weeks}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <StatusPill className={PLAN_STATUS[p.status].pill}>{STATUS_LABEL[p.status]}</StatusPill>
                  {p.needsReview && <StatusPill className="bg-amber-50 text-amber-700">Da aggiornare</StatusPill>}
                  <span className="text-ink-500">Aggiornata il {fmtDate(p.updatedAt, { day: 'numeric', month: 'short' })}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link to={`/app/schede/${p.id}`} className="btn-outline">
                    <Pencil className="h-4 w-4" /> Modifica
                  </Link>
                  {p.needsReview && (
                    <button type="button" className="btn-soft" onClick={() => patch(p, { needsReview: false })}>
                      <CircleCheck className="h-4 w-4" /> Aggiornata
                    </button>
                  )}
                  {p.status === 'archived' ? (
                    <button type="button" className="btn-soft" onClick={() => patch(p, { status: 'active' })}>
                      <RotateCcw className="h-4 w-4" /> Riattiva
                    </button>
                  ) : (
                    <button type="button" className="btn-soft" onClick={() => patch(p, { status: 'archived' })}>
                      <Archive className="h-4 w-4" /> Archivia
                    </button>
                  )}
                  {p.status !== 'active' && (
                    <ConfirmButton confirmLabel="Elimina" onConfirm={() => remove(p)}>
                      <Trash2 className="h-4 w-4" /> Elimina
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

// Colonne della tabella esercizi (da tablet in su).
const EXERCISE_GRID = 'md:grid-cols-[minmax(0,2fr)_64px_96px_104px_minmax(0,1.3fr)_96px]';
const EXERCISE_FIELDS = [
  { field: 'name', placeholder: 'es. Panca piana', mode: 'text', label: 'Esercizio', span: 'col-span-3 md:col-span-1' },
  { field: 'sets', placeholder: '4', mode: 'numeric', label: 'Serie', span: '' },
  { field: 'reps', placeholder: '8 - 10', mode: 'text', label: 'Ripetizioni', span: '' },
  { field: 'restSec', placeholder: '90', mode: 'numeric', label: 'Recupero (sec)', span: '' },
  { field: 'notes', placeholder: 'facoltative', mode: 'text', label: 'Note', span: 'col-span-3 md:col-span-1' },
];

let keySeed = 0;
const newKey = () => `w${++keySeed}`;
const emptyExercise = () => ({ key: newKey(), name: '', sets: '', reps: '', restSec: '', notes: '' });
const emptySession = (dayOfWeek = '') => ({
  key: newKey(),
  name: '',
  focus: '',
  description: '',
  durationMin: '',
  dayOfWeek: String(dayOfWeek),
  exercises: [emptyExercise(), emptyExercise(), emptyExercise()],
});

function fromPlan(plan) {
  return {
    clientId: plan.client?.id ?? '',
    title: plan.title,
    level: plan.level,
    weeks: String(plan.weeks),
    startDate: plan.startDate ?? '',
    status: plan.status,
    sessions: plan.sessions.map((s) => ({
      key: newKey(),
      name: s.name,
      focus: s.focus ?? '',
      description: s.description ?? '',
      durationMin: numberToText(s.durationMin),
      dayOfWeek: s.dayOfWeek ? String(s.dayOfWeek) : '',
      exercises: s.exercises.map((ex) => ({
        key: newKey(),
        name: ex.name,
        sets: numberToText(ex.sets),
        reps: ex.reps ?? '',
        restSec: numberToText(ex.restSec),
        notes: ex.notes ?? '',
      })),
    })),
  };
}

function WorkoutPlanEditor({ id }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const existing = useApi(id ? `/workout-plans/${id}` : null);
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id && existing.data) setForm(fromPlan(existing.data.plan));
    if (!id && !form) {
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
  }, [id, existing.data]);

  if (existing.loading || !form) return <PageLoader />;
  if (existing.error) return <ErrorState error={existing.error} onRetry={existing.reload} />;

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const updateSession = (key, patch) =>
    setForm((f) => ({ ...f, sessions: f.sessions.map((s) => (s.key === key ? { ...s, ...patch } : s)) }));
  const updateExercise = (sessionKey, exKey, patch) =>
    setForm((f) => ({
      ...f,
      sessions: f.sessions.map((s) =>
        s.key === sessionKey ? { ...s, exercises: s.exercises.map((ex) => (ex.key === exKey ? { ...ex, ...patch } : ex)) } : s,
      ),
    }));
  const moveExercise = (sessionKey, index, dir) =>
    setForm((f) => ({
      ...f,
      sessions: f.sessions.map((s) => {
        if (s.key !== sessionKey) return s;
        const list = [...s.exercises];
        const target = index + dir;
        if (target < 0 || target >= list.length) return s;
        [list[index], list[target]] = [list[target], list[index]];
        return { ...s, exercises: list };
      }),
    }));
  const freeDay = () => {
    const used = new Set(form.sessions.map((s) => Number(s.dayOfWeek)));
    return WEEKDAYS.find((w) => !used.has(w.value))?.value ?? '';
  };

  async function save(e) {
    e.preventDefault();
    setError('');
    if (!form.clientId) return setError('Seleziona il cliente.');
    if (!form.title.trim()) return setError('Dai un titolo alla scheda.');
    const weeks = toNumber(form.weeks);
    if (!weeks || Number.isNaN(weeks)) return setError('Indica la durata in settimane.');
    const days = form.sessions.map((s) => s.dayOfWeek).filter(Boolean);
    if (new Set(days).size !== days.length) return setError('Due sessioni sono nello stesso giorno della settimana.');

    const sessions = [];
    for (const s of form.sessions) {
      if (!s.name.trim()) return setError('Dai un nome a ogni sessione (es. "Forza parte superiore").');
      const exercises = [];
      for (const ex of s.exercises) {
        if (!ex.name.trim()) continue;
        const sets = toNumber(ex.sets);
        const restSec = toNumber(ex.restSec);
        if (Number.isNaN(sets) || Number.isNaN(restSec)) return setError(`Valori non validi nell'esercizio "${ex.name}".`);
        exercises.push({ name: ex.name.trim(), sets, reps: ex.reps.trim(), restSec, notes: ex.notes.trim() });
      }
      const durationMin = toNumber(s.durationMin);
      if (Number.isNaN(durationMin)) return setError(`Durata non valida in "${s.name}".`);
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
      navigate('/app/schede', { state: { flash: `Scheda "${form.title}" salvata.` } });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-5" noValidate>
      <PageHeader
        back={{ to: '/app/schede', label: 'Schede allenamento' }}
        title={id ? 'Modifica scheda' : 'Nuova scheda'}
        actions={<SaveButton saving={saving}>Salva scheda</SaveButton>}
      />
      <FormError>{error}</FormError>

      <Card className="p-5">
        <CardHeader icon={Dumbbell} title="Informazioni" />
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <ClientSelect value={form.clientId} onChange={(v) => setForm({ ...form, clientId: v })} disabled={Boolean(id)} />
          <TextInput label="Titolo della scheda" placeholder="es. Ricomposizione corporea" value={form.title} onChange={set('title')} className="xl:col-span-2" />
          <SelectInput label="Livello" value={form.level} onChange={set('level')}>
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {LEVEL_LABELS[l]}
              </option>
            ))}
          </SelectInput>
          <div className="grid grid-cols-2 gap-3">
            <NumberInput label="Durata" suffix="sett." value={form.weeks} onChange={set('weeks')} />
            <TextInput label="Inizio" type="date" value={form.startDate} onChange={set('startDate')} />
          </div>
          <SelectInput label="Stato" value={form.status} onChange={set('status')}>
            <option value="active">Attiva (visibile al cliente)</option>
            <option value="draft">Bozza</option>
            <option value="archived">Archiviata</option>
          </SelectInput>
        </div>
      </Card>

      <div className="space-y-4">
        {form.sessions.map((s, si) => (
          <Card key={s.key} className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-[17px] font-semibold">Sessione {si + 1}</h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn-soft"
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      sessions: [
                        ...f.sessions,
                        { ...s, key: newKey(), dayOfWeek: String(freeDay()), name: `${s.name} (copia)`, exercises: s.exercises.map((ex) => ({ ...ex, key: newKey() })) },
                      ],
                    }))
                  }
                  disabled={form.sessions.length >= 7}
                >
                  <CopyPlus className="h-4 w-4" /> Duplica
                </button>
                {form.sessions.length > 1 && (
                  <ConfirmButton confirmLabel="Rimuovi" onConfirm={() => setForm((f) => ({ ...f, sessions: f.sessions.filter((x) => x.key !== s.key) }))}>
                    <Trash2 className="h-4 w-4" /> Rimuovi
                  </ConfirmButton>
                )}
              </div>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <TextInput label="Nome" placeholder="es. Forza parte superiore" value={s.name} onChange={(e) => updateSession(s.key, { name: e.target.value })} className="xl:col-span-2" />
              <SelectInput label="Giorno" value={s.dayOfWeek} onChange={(e) => updateSession(s.key, { dayOfWeek: e.target.value })}>
                <option value="">Libero</option>
                {WEEKDAYS.map((w) => (
                  <option key={w.value} value={w.value}>
                    {w.long}
                  </option>
                ))}
              </SelectInput>
              <NumberInput label="Durata" suffix="min" value={s.durationMin} onChange={(e) => updateSession(s.key, { durationMin: e.target.value })} />
              <TextInput label="Focus" placeholder="es. Upper Body" value={s.focus} onChange={(e) => updateSession(s.key, { focus: e.target.value })} />
              <TextInput
                label="Descrizione"
                placeholder="Obiettivo della sessione, indicazioni generali"
                value={s.description}
                onChange={(e) => updateSession(s.key, { description: e.target.value })}
                className="sm:col-span-1 xl:col-span-3"
              />
            </div>

            {/* Righe a griglia: su smartphone ogni esercizio diventa una scheda impilata */}
            <div className="mt-4 space-y-2">
              <div className={`${EXERCISE_GRID} hidden px-1 text-[11px] tracking-wider text-ink-500 uppercase md:grid`}>
                <span>Esercizio</span>
                <span>Serie</span>
                <span>Ripetizioni</span>
                <span>Recupero (sec)</span>
                <span>Note</span>
                <span className="sr-only">Azioni</span>
              </div>
              {s.exercises.map((ex, ei) => (
                <div key={ex.key} className={`${EXERCISE_GRID} grid grid-cols-3 gap-2 rounded-xl border border-line p-2 md:items-center md:border-0 md:p-0`}>
                  {EXERCISE_FIELDS.map(({ field, placeholder, mode, label, span }) => (
                    <label key={field} className={span}>
                      <span className="mb-0.5 block text-[11px] text-ink-500 md:sr-only">{label}</span>
                      <input
                        value={ex[field]}
                        onChange={(e) => updateExercise(s.key, ex.key, { [field]: e.target.value })}
                        placeholder={placeholder}
                        inputMode={mode}
                        aria-label={`${label}, esercizio ${ei + 1}`}
                        className="w-full min-w-0 rounded-lg border border-line px-2.5 py-2 text-sm outline-none focus:border-brand-400"
                      />
                    </label>
                  ))}
                  <div className="col-span-3 flex justify-end md:col-span-1">
                    <button type="button" onClick={() => moveExercise(s.key, ei, -1)} className="rounded-lg p-1.5 text-ink-400 hover:bg-[#f1f5f4]" aria-label="Sposta su">
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => moveExercise(s.key, ei, 1)} className="rounded-lg p-1.5 text-ink-400 hover:bg-[#f1f5f4]" aria-label="Sposta giù">
                      <ArrowDown className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => updateSession(s.key, { exercises: s.exercises.filter((x) => x.key !== ex.key) })}
                      className="rounded-lg p-1.5 text-ink-400 hover:bg-[#f1f5f4] hover:text-ink-700"
                      aria-label="Rimuovi esercizio"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button type="button" className="btn-outline mt-3" onClick={() => updateSession(s.key, { exercises: [...s.exercises, emptyExercise()] })}>
              <Plus className="h-4 w-4" /> Aggiungi esercizio
            </button>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap justify-between gap-3">
        <button
          type="button"
          className="btn-outline"
          disabled={form.sessions.length >= 7}
          onClick={() => setForm((f) => ({ ...f, sessions: [...f.sessions, emptySession(freeDay())] }))}
        >
          <Plus className="h-4 w-4" /> Aggiungi sessione
        </button>
        <SaveButton saving={saving}>Salva scheda</SaveButton>
      </div>
    </form>
  );
}
