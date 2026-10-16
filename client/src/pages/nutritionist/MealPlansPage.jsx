import { Archive, CircleCheck, Copy, Pencil, Plus, RotateCcw, Trash2, Utensils } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
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
  TextArea,
  TextInput,
  numberToText,
  toNumber,
} from '../../components/forms.jsx';
import { Card, CardHeader, EmptyState, ErrorState, PageLoader } from '../../components/ui.jsx';
import { FormError } from '../auth/fields.jsx';
import { api } from '../../lib/api.js';
import { fmtDate } from '../../lib/format.js';
import { MEAL_META, MEAL_TYPES, PLAN_STATUS, WEEKDAYS } from '../../lib/labels.js';
import { useApi } from '../../lib/useApi.js';

export default function MealPlansPage({ itemId }) {
  if (itemId) return <MealPlanEditor id={itemId === 'nuovo' ? null : itemId} />;
  return <MealPlanList />;
}

// Elenco

function MealPlanList() {
  const { data, error, loading, reload, setData } = useApi('/meal-plans');
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
    await api(`/meal-plans/${plan.id}`, { method: 'PATCH', body });
    reload();
  }
  async function remove(plan) {
    await api(`/meal-plans/${plan.id}`, { method: 'DELETE' });
    setData((d) => ({ plans: d.plans.filter((p) => p.id !== plan.id) }));
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Piani alimentari"
        subtitle="Crea e aggiorna i menù settimanali dei tuoi clienti. Ogni cliente ha un solo piano attivo alla volta."
        actions={
          <Link to="/app/piani-alimentari/nuovo" className="btn-primary">
            <Plus className="h-4 w-4" /> Nuovo piano
          </Link>
        }
      />
      <Flash>{location.state?.flash}</Flash>
      <Tabs
        value={tab}
        onChange={setTab}
        className="w-fit max-w-full"
        tabs={[
          { value: 'active', label: 'Attivi', count: 0 },
          { value: 'review', label: 'Da revisionare', count: groups.review.length },
          { value: 'draft', label: 'Bozze' },
          { value: 'archived', label: 'Archiviati' },
        ]}
      />
      <Card className="p-2 sm:p-3">
        {groups[tab].length === 0 ? (
          <EmptyState icon={Utensils} title="Nessun piano in questa sezione">
            {tab === 'active' && (
              <Link to="/app/piani-alimentari/nuovo" className="btn-primary mt-2">
                Crea il primo piano
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
                      {p.client?.fullName} · {p.mealsCount} pasti su {p.daysCount} giorni
                      {p.kcalTarget && ` · ${p.kcalTarget} kcal`}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <StatusPill className={PLAN_STATUS[p.status].pill}>{PLAN_STATUS[p.status].label}</StatusPill>
                  {p.needsReview && <StatusPill className="bg-amber-50 text-amber-700">Da revisionare</StatusPill>}
                  <span className="text-ink-500">Aggiornato il {fmtDate(p.updatedAt, { day: 'numeric', month: 'short' })}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link to={`/app/piani-alimentari/${p.id}`} className="btn-outline">
                    <Pencil className="h-4 w-4" /> Modifica
                  </Link>
                  {p.needsReview && (
                    <button type="button" className="btn-soft" onClick={() => patch(p, { needsReview: false })}>
                      <CircleCheck className="h-4 w-4" /> Revisionato
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

let keySeed = 0;
const newKey = () => `m${++keySeed}`;
const emptyMeal = (type) => ({ key: newKey(), type, name: '', description: '', kcal: '' });
const defaultDays = () =>
  WEEKDAYS.map((w) => ({ dayIndex: w.value, meals: ['colazione', 'pranzo', 'cena'].map(emptyMeal) }));

function fromPlan(plan) {
  return {
    clientId: plan.client?.id ?? '',
    title: plan.title,
    goal: plan.goal ?? '',
    kcalTarget: numberToText(plan.kcalTarget),
    guidelines: plan.guidelines ?? '',
    status: plan.status,
    startDate: plan.startDate ?? '',
    days: WEEKDAYS.map((w) => ({
      dayIndex: w.value,
      meals: (plan.days.find((d) => d.dayIndex === w.value)?.meals ?? []).map((m) => ({
        key: newKey(),
        type: m.type,
        name: m.name,
        description: m.description ?? '',
        kcal: numberToText(m.kcal),
      })),
    })),
  };
}

function MealPlanEditor({ id }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const existing = useApi(id ? `/meal-plans/${id}` : null);
  const [form, setForm] = useState(null);
  const [day, setDay] = useState(1);
  const [copyTarget, setCopyTarget] = useState('all');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id && existing.data) setForm(fromPlan(existing.data.plan));
    if (!id && !form) {
      setForm({
        clientId: searchParams.get('cliente') ?? '',
        title: '',
        goal: '',
        kcalTarget: '',
        guidelines: '',
        status: 'active',
        startDate: '',
        days: defaultDays(),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, existing.data]);

  const filledPerDay = useMemo(
    () => Object.fromEntries((form?.days ?? []).map((d) => [d.dayIndex, d.meals.filter((m) => m.name.trim()).length])),
    [form],
  );

  if (existing.loading || !form) return <PageLoader />;
  if (existing.error) return <ErrorState error={existing.error} onRetry={existing.reload} />;

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const currentDay = form.days.find((d) => d.dayIndex === day);
  const dayKcal = currentDay.meals.reduce((s, m) => s + (toNumber(m.kcal) || 0), 0);

  function updateDayMeals(dayIndex, updater) {
    setForm((f) => ({ ...f, days: f.days.map((d) => (d.dayIndex === dayIndex ? { ...d, meals: updater(d.meals) } : d)) }));
  }
  const updateMeal = (key, patch) => updateDayMeals(day, (meals) => meals.map((m) => (m.key === key ? { ...m, ...patch } : m)));
  const removeMeal = (key) => updateDayMeals(day, (meals) => meals.filter((m) => m.key !== key));
  const addMeal = () => {
    const used = new Set(currentDay.meals.map((m) => m.type));
    updateDayMeals(day, (meals) => [...meals, emptyMeal(MEAL_TYPES.find((t) => !used.has(t)) ?? 'spuntino')]);
  };
  function copyDay() {
    const source = currentDay.meals.map((m) => ({ ...m }));
    setForm((f) => ({
      ...f,
      days: f.days.map((d) =>
        d.dayIndex !== day && (copyTarget === 'all' || Number(copyTarget) === d.dayIndex)
          ? { ...d, meals: source.map((m) => ({ ...m, key: newKey() })) }
          : d,
      ),
    }));
  }

  async function save(e) {
    e.preventDefault();
    setError('');
    if (!form.clientId) return setError('Seleziona il cliente.');
    if (!form.title.trim()) return setError('Dai un titolo al piano.');
    const kcalTarget = toNumber(form.kcalTarget);
    if (Number.isNaN(kcalTarget)) return setError('Obiettivo calorico non valido.');
    const days = [];
    for (const d of form.days) {
      const meals = [];
      for (const m of d.meals) {
        if (!m.name.trim()) continue;
        const kcal = toNumber(m.kcal);
        if (Number.isNaN(kcal)) {
          setDay(d.dayIndex);
          return setError(`Calorie non valide in "${m.name}".`);
        }
        meals.push({ type: m.type, name: m.name.trim(), description: m.description.trim(), kcal });
      }
      days.push({ dayIndex: d.dayIndex, meals });
    }
    const body = {
      title: form.title,
      goal: form.goal,
      kcalTarget,
      guidelines: form.guidelines,
      status: form.status,
      startDate: form.startDate || null,
      days,
    };
    setSaving(true);
    try {
      if (id) await api(`/meal-plans/${id}`, { method: 'PUT', body });
      else await api('/meal-plans', { method: 'POST', body: { ...body, clientId: form.clientId } });
      navigate('/app/piani-alimentari', { state: { flash: `Piano "${form.title}" salvato.` } });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-5" noValidate>
      <PageHeader
        back={{ to: '/app/piani-alimentari', label: 'Piani alimentari' }}
        title={id ? 'Modifica piano alimentare' : 'Nuovo piano alimentare'}
        actions={<SaveButton saving={saving}>Salva piano</SaveButton>}
      />
      <FormError>{error}</FormError>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Card className="h-fit space-y-4 p-5">
          <CardHeader icon={Utensils} title="Informazioni" />
          <ClientSelect value={form.clientId} onChange={(v) => setForm({ ...form, clientId: v })} disabled={Boolean(id)} />
          <TextInput label="Titolo del piano" placeholder="es. Piano alimentare personalizzato" value={form.title} onChange={set('title')} />
          <div className="grid grid-cols-2 gap-3">
            <TextInput label="Obiettivo" placeholder="es. Definizione" value={form.goal} onChange={set('goal')} />
            <NumberInput label="Calorie/giorno" suffix="kcal" value={form.kcalTarget} onChange={set('kcalTarget')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <SelectInput label="Stato" value={form.status} onChange={set('status')}>
              <option value="active">Attivo (visibile al cliente)</option>
              <option value="draft">Bozza</option>
              <option value="archived">Archiviato</option>
            </SelectInput>
            <TextInput label="Inizio" type="date" value={form.startDate} onChange={set('startDate')} />
          </div>
          <TextArea label="Linee guida" rows={5} placeholder="Indicazioni generali, idratazione, sostituzioni…" value={form.guidelines} onChange={set('guidelines')} />
        </Card>

        <Card className="p-5">
          <CardHeader title="Menù settimanale" subtitle="I pasti lasciati senza nome non vengono salvati." />
          <Tabs
            className="mt-4"
            value={day}
            onChange={setDay}
            tabs={WEEKDAYS.map((w) => ({ value: w.value, label: `${w.short} (${filledPerDay[w.value] ?? 0})` }))}
          />
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-ink-500">
              <span className="font-semibold text-ink-900">{WEEKDAYS[day - 1].long}</span>
              {dayKcal > 0 && ` · totale ${dayKcal} kcal`}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={copyTarget}
                onChange={(e) => setCopyTarget(e.target.value)}
                className="rounded-full border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand-400"
                aria-label="Giorno di destinazione"
              >
                <option value="all">su tutti gli altri giorni</option>
                {WEEKDAYS.filter((w) => w.value !== day).map((w) => (
                  <option key={w.value} value={w.value}>
                    su {w.long.toLowerCase()}
                  </option>
                ))}
              </select>
              <button type="button" className="btn-soft" onClick={copyDay}>
                <Copy className="h-4 w-4" /> Copia questo giorno
              </button>
            </div>
          </div>

          <ul className="mt-4 space-y-3">
            {currentDay.meals.map((m) => (
              <li key={m.key} className="rounded-2xl border border-line p-3">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-[150px_minmax(0,1fr)_110px_auto]">
                  <select
                    value={m.type}
                    onChange={(e) => updateMeal(m.key, { type: e.target.value })}
                    className="rounded-xl border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-400"
                    aria-label="Tipo di pasto"
                  >
                    {MEAL_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {MEAL_META[t].label}
                      </option>
                    ))}
                  </select>
                  <input
                    value={m.name}
                    onChange={(e) => updateMeal(m.key, { name: e.target.value })}
                    placeholder="Nome del piatto (es. Porridge d'avena)"
                    aria-label="Nome del piatto"
                    className="rounded-xl border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-400"
                  />
                  <input
                    value={m.kcal}
                    onChange={(e) => updateMeal(m.key, { kcal: e.target.value })}
                    placeholder="kcal"
                    inputMode="numeric"
                    aria-label="Calorie"
                    className="rounded-xl border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-400"
                  />
                  <button
                    type="button"
                    onClick={() => removeMeal(m.key)}
                    className="grid place-items-center rounded-xl p-2.5 text-ink-400 hover:bg-[#f1f5f4] hover:text-ink-700"
                    aria-label="Rimuovi pasto"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <textarea
                  value={m.description}
                  onChange={(e) => updateMeal(m.key, { description: e.target.value })}
                  rows={1}
                  placeholder="Ingredienti, grammature, note (facoltativo)"
                  aria-label="Descrizione"
                  className="mt-2 w-full resize-y rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-brand-400"
                />
              </li>
            ))}
          </ul>
          <button type="button" className="btn-outline mt-3" onClick={addMeal}>
            <Plus className="h-4 w-4" /> Aggiungi pasto
          </button>
        </Card>
      </div>

      <div className="flex justify-end">
        <SaveButton saving={saving}>Salva piano</SaveButton>
      </div>
    </form>
  );
}
