import {
  Archive,
  Search,
  ChevronDown,
  CircleCheck,
  Copy,
  CopyPlus,
  Eraser,
  Flame,
  LayoutTemplate,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  Utensils,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router';
import { Avatar } from '../../components/Avatar.jsx';
import { DatePicker, Popover } from '../../components/DatePicker.jsx';
import { Chip, Segmented, SuggestInput, TargetBar } from '../../components/editor.jsx';
import {
  ClientSelect,
  ConfirmButton,
  Flash,
  NumberInput,
  PageHeader,
  SaveButton,
  StatusPill,
  Tabs,
  TextArea,
  TextInput,
  numberToText,
  toNumber,
} from '../../components/forms.jsx';
import { Card, CardHeader, EmptyState, ErrorState, PageLoader } from '../../components/ui.jsx';
import { t, translateMessage } from '../../i18n/index.js';
import { api } from '../../lib/api.js';
import { buildTemplateWeek, dishesFor, kcalFromMacros, MEAL_TEMPLATES } from '../../lib/foodLibrary.js';
import { fmtDate, fmtNumber } from '../../lib/format.js';
import { MEAL_META, MEAL_TYPES, PLAN_STATUS, WEEKDAYS } from '../../lib/labels.js';
import { useApi } from '../../lib/useApi.js';
import { FormError } from '../auth/fields.jsx';

export default function MealPlansPage({ itemId }) {
  if (itemId) return <MealPlanEditor id={itemId === 'nuovo' ? null : itemId} />;
  return <MealPlanList />;
}

// Elenco

function MealPlanList() {
  const { data, error, loading, reload, setData } = useApi('/meal-plans');
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
        title={t('Piani alimentari')}
        subtitle={t('Crea e aggiorna i menù settimanali dei tuoi clienti. Ogni cliente ha un solo piano attivo alla volta.')}
        actions={
          <Link to="/app/piani-alimentari/nuovo" className="btn-primary">
            <Plus className="h-4 w-4" /> {t('Nuovo piano')}
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
          { value: 'active', label: t('Attivi') },
          { value: 'review', label: t('Da revisionare'), count: groups.review.length },
          { value: 'draft', label: t('Bozze') },
          { value: 'archived', label: t('Archiviati') },
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
          <EmptyState icon={Utensils} title={t('Nessun piano in questa sezione')}>
            {tab === 'active' && (
              <Link to="/app/piani-alimentari/nuovo" className="btn-primary mt-2">
                {t('Crea il primo piano')}
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
                      {p.client?.fullName} · {t('{meals} pasti su {days} giorni', { meals: p.mealsCount, days: p.daysCount })}
                      {p.kcalTarget && ` · ${p.kcalTarget} kcal`}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <StatusPill className={PLAN_STATUS[p.status].pill}>{PLAN_STATUS[p.status].label}</StatusPill>
                  {p.needsReview && <StatusPill className="bg-amber-50 text-amber-700">{t('Da revisionare')}</StatusPill>}
                  <span className="text-ink-500">{t('Aggiornato il {date}', { date: fmtDate(p.updatedAt, { day: 'numeric', month: 'short' }) })}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link to={`/app/piani-alimentari/${p.id}`} className="btn-outline">
                    <Pencil className="h-4 w-4" /> {t('Modifica')}
                  </Link>
                  <Link to={`/app/piani-alimentari/nuovo?da=${p.id}`} className="btn-soft" title={t('Usa questo piano come base per un altro cliente')}>
                    <CopyPlus className="h-4 w-4" /> {t('Duplica')}
                  </Link>
                  {p.needsReview && (
                    <button type="button" className="btn-soft" onClick={() => patch(p, { needsReview: false })}>
                      <CircleCheck className="h-4 w-4" /> {t('Revisionato')}
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
const newKey = () => `m${++keySeed}`;
const MEAL_ORDER = Object.fromEntries(MEAL_TYPES.map((type, i) => [type, i]));
const sortMeals = (meals) => [...meals].sort((a, b) => MEAL_ORDER[a.type] - MEAL_ORDER[b.type]);

// open: dettagli aperti/chiusi a mano (undefined = aperti solo se compilati)
const emptyMeal = (type) => ({ key: newKey(), type, name: '', description: '', kcal: '', protein: '', carbs: '', fat: '', open: undefined });
const mealFrom = (m) => ({
  key: newKey(),
  type: m.type,
  name: m.name ?? '',
  description: m.description ?? '',
  kcal: numberToText(m.kcal),
  protein: numberToText(m.protein),
  carbs: numberToText(m.carbs),
  fat: numberToText(m.fat),
  open: undefined,
});
const defaultDays = () => WEEKDAYS.map((w) => ({ dayIndex: w.value, meals: ['colazione', 'pranzo', 'cena'].map(emptyMeal) }));
const GOALS = ['Dimagrimento', 'Definizione', 'Massa muscolare', 'Mantenimento', 'Educazione alimentare'];

function fromPlan(plan, { copy = false } = {}) {
  return {
    clientId: copy ? '' : (plan.client?.id ?? ''),
    title: copy ? `${plan.title} (${t('copia')})` : plan.title,
    goal: plan.goal ?? '',
    kcalTarget: numberToText(plan.kcalTarget),
    guidelines: plan.guidelines ?? '',
    status: copy ? 'active' : plan.status,
    startDate: copy ? '' : (plan.startDate ?? ''),
    days: WEEKDAYS.map((w) => ({
      dayIndex: w.value,
      meals: sortMeals((plan.days.find((d) => d.dayIndex === w.value)?.meals ?? []).map(mealFrom)),
    })),
  };
}

/** Totali di un giorno (calorie e macronutrienti) dei pasti compilati. */
function totalsOf(meals) {
  const sum = (key) => meals.reduce((s, m) => s + (toNumber(m[key]) || 0), 0);
  return { kcal: sum('kcal'), protein: sum('protein'), carbs: sum('carbs'), fat: sum('fat'), count: meals.filter((m) => m.name.trim()).length };
}

function MealPlanEditor({ id }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sourceId = searchParams.get('da');
  const existing = useApi(id ? `/meal-plans/${id}` : sourceId ? `/meal-plans/${sourceId}` : null);
  const [form, setForm] = useState(null);
  const [day, setDay] = useState(1);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState('');

  useEffect(() => {
    if (existing.data && !form) setForm(fromPlan(existing.data.plan, { copy: !id }));
    if (!id && !sourceId && !form) {
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
  }, [id, sourceId, existing.data]);

  useEffect(() => {
    if (!flash) return undefined;
    const timer = setTimeout(() => setFlash(''), 3000);
    return () => clearTimeout(timer);
  }, [flash]);

  const totals = useMemo(() => Object.fromEntries((form?.days ?? []).map((d) => [d.dayIndex, totalsOf(d.meals)])), [form]);

  if (existing.loading || !form) return <PageLoader />;
  if (existing.error) return <ErrorState error={existing.error} onRetry={existing.reload} />;

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const target = toNumber(form.kcalTarget) || null;
  const currentDay = form.days.find((d) => d.dayIndex === day);
  const dayTotals = totals[day];
  const filledDays = form.days.filter((d) => totals[d.dayIndex].count > 0);
  const avgKcal = filledDays.length ? Math.round(filledDays.reduce((s, d) => s + totals[d.dayIndex].kcal, 0) / filledDays.length) : 0;

  function updateDayMeals(dayIndex, updater) {
    setForm((f) => ({ ...f, days: f.days.map((d) => (d.dayIndex === dayIndex ? { ...d, meals: updater(d.meals) } : d)) }));
  }
  const updateMeal = (key, patch) => updateDayMeals(day, (meals) => meals.map((m) => (m.key === key ? { ...m, ...patch } : m)));
  const removeMeal = (key) => updateDayMeals(day, (meals) => meals.filter((m) => m.key !== key));
  const addMeal = (type) => updateDayMeals(day, (meals) => sortMeals([...meals, emptyMeal(type)]));

  function copyDayTo(targets) {
    const source = currentDay.meals.map((m) => ({ ...m }));
    setForm((f) => ({
      ...f,
      days: f.days.map((d) => (targets.includes(d.dayIndex) ? { ...d, meals: source.map((m) => ({ ...m, key: newKey() })) } : d)),
    }));
    setFlash(t('{day} copiato su {n} giorni.', { day: WEEKDAYS[day - 1].long, n: targets.length }));
  }

  function applyTemplate(template) {
    const week = buildTemplateWeek(template);
    setForm((f) => ({
      ...f,
      kcalTarget: f.kcalTarget || String(template.kcal),
      title: f.title || t(template.label),
      days: week.map((d) => ({
        dayIndex: d.dayIndex,
        meals: d.meals.map((m) => ({ ...mealFrom({ ...m, name: t(m.name), description: t(m.description) }) })),
      })),
    }));
    setFlash(t('Modello "{name}" applicato: ora puoi personalizzare ogni pasto.', { name: t(template.label) }));
  }

  async function save(e) {
    e.preventDefault();
    setError('');
    if (!form.clientId) return setError(t('Seleziona il cliente.'));
    if (!form.title.trim()) return setError(t('Dai un titolo al piano.'));
    const kcalTarget = toNumber(form.kcalTarget);
    if (Number.isNaN(kcalTarget)) return setError(t('Obiettivo calorico non valido.'));
    const days = [];
    for (const d of form.days) {
      const meals = [];
      for (const m of d.meals) {
        if (!m.name.trim()) continue;
        const values = Object.fromEntries(['kcal', 'protein', 'carbs', 'fat'].map((k) => [k, toNumber(m[k])]));
        if (Object.values(values).some((v) => Number.isNaN(v))) {
          setDay(d.dayIndex);
          return setError(t('Valori non validi in "{name}": usa solo numeri.', { name: m.name }));
        }
        meals.push({ type: m.type, name: m.name.trim(), description: m.description.trim(), ...values });
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
      navigate('/app/piani-alimentari', { state: { flash: t('Piano "{title}" salvato.', { title: form.title }) } });
    } catch (err) {
      setError(translateMessage(err.message));
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-5" noValidate>
      <PageHeader
        back={{ to: '/app/piani-alimentari', label: t('Piani alimentari') }}
        title={id ? t('Modifica piano alimentare') : t('Nuovo piano alimentare')}
        actions={<SaveButton saving={saving}>{t('Salva piano')}</SaveButton>}
      />
      <FormError>{error}</FormError>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
        {/* ── Informazioni ── */}
        <div className="space-y-5">
          <Card className="space-y-4 p-5">
            <CardHeader icon={Utensils} title={t('Informazioni')} />
            <ClientSelect value={form.clientId} onChange={(v) => set({ clientId: v })} disabled={Boolean(id)} />
            <TextInput label={t('Titolo del piano')} placeholder={t('es. Piano alimentare personalizzato')} value={form.title} onChange={(e) => set({ title: e.target.value })} />
            <div>
              <TextInput label={t('Obiettivo')} placeholder={t('es. Definizione')} value={form.goal} onChange={(e) => set({ goal: e.target.value })} />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {GOALS.map((g) => (
                  <Chip key={g} active={form.goal === t(g)} onClick={() => set({ goal: t(g) })} className="px-2.5 py-1 text-xs">
                    {t(g)}
                  </Chip>
                ))}
              </div>
            </div>
            <NumberInput label={t('Calorie al giorno (obiettivo)')} suffix="kcal" value={form.kcalTarget} onChange={(e) => set({ kcalTarget: e.target.value })} />
            <Segmented
              label={t('Stato')}
              value={form.status}
              onChange={(status) => set({ status })}
              options={[
                { value: 'active', label: t('Attivo') },
                { value: 'draft', label: t('Bozza') },
                { value: 'archived', label: t('Archiviato') },
              ]}
            />
            <p className="-mt-2 text-xs text-ink-500">{t('Solo il piano attivo è visibile al cliente.')}</p>
            <DatePicker label={t('Inizio (facoltativo)')} value={form.startDate} onChange={(v) => set({ startDate: v })} clearable placeholder={t('Nessuna data')} />
            <TextArea label={t('Linee guida')} rows={5} placeholder={t('Indicazioni generali, idratazione, sostituzioni…')} value={form.guidelines} onChange={(e) => set({ guidelines: e.target.value })} />
          </Card>

          <Card className="p-5">
            <CardHeader icon={LayoutTemplate} title={t('Parti da un modello')} subtitle={t('Riempie tutta la settimana: poi personalizzi')} />
            <div className="mt-4 grid gap-2">
              {MEAL_TEMPLATES.map((tpl) => (
                <ConfirmButton
                  key={tpl.id}
                  danger={false}
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-line px-3.5 py-2.5 text-left text-sm transition hover:border-brand-300 hover:bg-soft"
                  confirmLabel={t('Sostituisci il menù')}
                  onConfirm={() => applyTemplate(tpl)}
                >
                  <span className="font-semibold">{t(tpl.label)}</span>
                  <span className="text-xs text-ink-500">{t(tpl.hint)}</span>
                </ConfirmButton>
              ))}
            </div>
          </Card>
        </div>

        {/* ── Menù settimanale ── */}
        <Card className="p-5">
          <CardHeader title={t('Menù settimanale')} subtitle={t('Scegli un giorno e componi i pasti: scrivendo il nome ti suggeriamo piatti con calorie e macro.')} />

          <div className="mt-4 grid grid-cols-7 gap-1.5" role="tablist" aria-label={t('Giorni della settimana')}>
            {WEEKDAYS.map((w) => {
              const tot = totals[w.value];
              const active = w.value === day;
              return (
                <button
                  key={w.value}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setDay(w.value)}
                  className={`rounded-xl border px-1 py-2 text-center transition ${active ? 'border-brand-600 bg-brand-50' : 'border-line hover:border-brand-300'}`}
                >
                  <span className={`block text-xs font-semibold ${active ? 'text-brand-800' : 'text-ink-700'}`}>{w.short}</span>
                  <span className="block text-[11px] text-ink-500">{tot.kcal ? fmtNumber(tot.kcal, 0) : '—'}</span>
                  <TargetBar value={tot.kcal} target={target} className="mx-1.5 mt-1" />
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-soft p-3.5">
            <div className="min-w-0">
              <p className="font-display text-lg font-semibold">{WEEKDAYS[day - 1].long}</p>
              <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-700">
                <span className="inline-flex items-center gap-1 font-semibold">
                  <Flame className="h-4 w-4 text-warm-ink" /> {fmtNumber(dayTotals.kcal, 0)} kcal
                  {target && <span className="font-normal text-ink-500">/ {fmtNumber(target, 0)}</span>}
                </span>
                {dayTotals.protein + dayTotals.carbs + dayTotals.fat > 0 && (
                  <>
                    <MacroBadge label={t('P')} title={t('Proteine')} value={dayTotals.protein} />
                    <MacroBadge label={t('C')} title={t('Carboidrati')} value={dayTotals.carbs} />
                    <MacroBadge label={t('G')} title={t('Grassi')} value={dayTotals.fat} />
                  </>
                )}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <CopyDayButton day={day} onCopy={copyDayTo} />
              <ConfirmButton confirmLabel={t('Svuota')} onConfirm={() => updateDayMeals(day, () => [])}>
                <Eraser className="h-4 w-4" /> {t('Svuota')}
              </ConfirmButton>
            </div>
          </div>
          {flash && <p role="status" className="mt-3 rounded-xl bg-brand-50 px-3 py-2 text-sm text-brand-900">{flash}</p>}

          <ul className="mt-4 space-y-3">
            {currentDay.meals.map((m) => (
              <MealRow key={m.key} meal={m} onChange={(patch) => updateMeal(m.key, patch)} onRemove={() => removeMeal(m.key)} />
            ))}
          </ul>
          {currentDay.meals.length === 0 && <p className="mt-4 rounded-xl border border-dashed border-line p-6 text-center text-sm text-ink-500">{t('Nessun pasto: aggiungine uno qui sotto.')}</p>}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-ink-500">{t('Aggiungi')}:</span>
            {MEAL_TYPES.map((type) => {
              const Icon = MEAL_META[type].icon;
              const present = currentDay.meals.some((m) => m.type === type);
              return (
                <Chip key={type} onClick={() => addMeal(type)} className={present ? 'opacity-60' : ''}>
                  <Plus className="h-3.5 w-3.5" /> <Icon className="h-3.5 w-3.5" /> {MEAL_META[type].label}
                </Chip>
              );
            })}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-line pt-4 text-sm sm:grid-cols-3">
            <p>
              <span className="block text-xs text-ink-500">{t('Giorni compilati')}</span>
              <span className="font-semibold">{filledDays.length} / 7</span>
            </p>
            <p>
              <span className="block text-xs text-ink-500">{t('Media giornaliera')}</span>
              <span className="font-semibold">{avgKcal ? `${fmtNumber(avgKcal, 0)} kcal` : '—'}</span>
            </p>
            {target && (
              <p>
                <span className="block text-xs text-ink-500">{t('Rispetto all’obiettivo')}</span>
                <span className={`font-semibold ${avgKcal && Math.abs(avgKcal / target - 1) <= 0.1 ? 'text-brand-700' : 'text-amber-700'}`}>
                  {avgKcal ? `${avgKcal > target ? '+' : ''}${fmtNumber(avgKcal - target, 0)} kcal` : '—'}
                </span>
              </p>
            )}
          </div>
        </Card>
      </div>

      <div className="flex justify-end">
        <SaveButton saving={saving}>{t('Salva piano')}</SaveButton>
      </div>
    </form>
  );
}

function MacroBadge({ label, title, value }) {
  return (
    <span className="text-xs text-ink-500" title={title}>
      <span className="font-semibold text-ink-700">{label}</span> {fmtNumber(value, 0)} g
    </span>
  );
}

/** "Copia su…": scegli i giorni su cui copiare i pasti del giorno aperto. */
function CopyDayButton({ day, onCopy }) {
  const anchorRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [targets, setTargets] = useState([]);
  const others = WEEKDAYS.filter((w) => w.value !== day);
  const toggle = (v) => setTargets((list) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]));
  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        className="btn-soft"
        onClick={() => {
          setTargets([]);
          setOpen((o) => !o);
        }}
        aria-expanded={open}
      >
        <Copy className="h-4 w-4" /> {t('Copia su…')} <ChevronDown className="h-3.5 w-3.5" />
      </button>
      <Popover anchorRef={anchorRef} open={open} onClose={() => setOpen(false)} align="end" className="w-72 p-4">
        <p className="text-sm font-semibold">{t('Copia {day} su:', { day: WEEKDAYS[day - 1].long.toLowerCase() })}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {others.map((w) => (
            <Chip key={w.value} active={targets.includes(w.value)} onClick={() => toggle(w.value)} className="px-2.5 py-1 text-xs">
              {w.short}
            </Chip>
          ))}
          <Chip active={targets.length === others.length} onClick={() => setTargets(targets.length === others.length ? [] : others.map((w) => w.value))} className="px-2.5 py-1 text-xs">
            {t('Tutti')}
          </Chip>
        </div>
        <p className="mt-3 text-xs text-ink-500">{t('I pasti dei giorni scelti verranno sostituiti.')}</p>
        <button
          type="button"
          className="btn-primary mt-3 w-full py-2"
          disabled={!targets.length}
          onClick={() => {
            onCopy(targets);
            setOpen(false);
          }}
        >
          {t('Copia')}
        </button>
      </Popover>
    </>
  );
}

const inputCls = 'w-full min-w-0 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink-900 outline-none placeholder:text-ink-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-100';

/** Un pasto: tipo, piatto (con suggerimenti), calorie e, aprendo i dettagli, descrizione e macronutrienti. */
function MealRow({ meal: m, onChange, onRemove }) {
  const Icon = MEAL_META[m.type].icon;
  const macrosKcal = kcalFromMacros(toNumber(m.protein), toNumber(m.carbs), toNumber(m.fat));
  const hasMacros = [m.protein, m.carbs, m.fat].some((v) => v !== '' && v != null);
  const showDetails = m.open ?? Boolean(m.description || hasMacros);

  const suggestions = (query) =>
    dishesFor(m.type, query).map((d) => ({
      key: d.name,
      label: t(d.name),
      sub: t(d.description),
      detail: `${d.kcal} kcal`,
      dish: d,
    }));

  return (
    <li className="rounded-2xl border border-line p-3">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 sm:grid-cols-[150px_minmax(0,1fr)_96px_auto]">
        <label className="relative col-span-2 sm:col-span-1">
          <span className="sr-only">{t('Tipo di pasto')}</span>
          <Icon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-brand-700" />
          <select value={m.type} onChange={(e) => onChange({ type: e.target.value })} className={`${inputCls} appearance-none pl-9 font-medium`}>
            {MEAL_TYPES.map((type) => (
              <option key={type} value={type}>
                {MEAL_META[type].label}
              </option>
            ))}
          </select>
        </label>
        <SuggestInput
          className="col-span-2 sm:col-span-1"
          value={m.name}
          onChange={(name) => onChange({ name })}
          onPick={({ dish }) =>
            onChange({
              name: t(dish.name),
              description: t(dish.description),
              kcal: String(dish.kcal),
              protein: String(dish.protein),
              carbs: String(dish.carbs),
              fat: String(dish.fat),
            })
          }
          suggestions={suggestions}
          placeholder={t("Nome del piatto (es. Porridge d'avena)")}
          ariaLabel={t('Nome del piatto')}
        />
        <div className="relative">
          <input value={m.kcal} onChange={(e) => onChange({ kcal: e.target.value })} placeholder="0" inputMode="numeric" aria-label={t('Calorie')} className={`${inputCls} pr-10`} />
          <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-xs text-ink-400">kcal</span>
        </div>
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => onChange({ open: !showDetails })}
            className={`grid h-9 w-9 place-items-center rounded-lg text-ink-400 hover:bg-hover hover:text-ink-700 ${showDetails ? 'rotate-180' : ''}`}
            aria-label={showDetails ? t('Nascondi dettagli') : t('Mostra dettagli')}
            aria-expanded={Boolean(showDetails)}
          >
            <ChevronDown className="h-4 w-4" />
          </button>
          <button type="button" onClick={onRemove} className="grid h-9 w-9 place-items-center rounded-lg text-ink-400 hover:bg-hover hover:text-ink-700" aria-label={t('Rimuovi pasto')}>
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      {showDetails && (
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_260px]">
          <textarea
            value={m.description}
            onChange={(e) => onChange({ description: e.target.value })}
            rows={2}
            placeholder={t('Ingredienti, grammature, note (facoltativo)')}
            aria-label={t('Descrizione')}
            className={`${inputCls} resize-y`}
          />
          <div>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                ['protein', t('Proteine')],
                ['carbs', t('Carboidrati')],
                ['fat', t('Grassi')],
              ].map(([key, label]) => (
                <label key={key} className="block">
                  <span className="block text-[11px] text-ink-500">{label}</span>
                  <span className="relative block">
                    <input value={m[key]} onChange={(e) => onChange({ [key]: e.target.value })} inputMode="decimal" placeholder="0" className={`${inputCls} px-2 pr-6`} />
                    <span className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-[11px] text-ink-400">g</span>
                  </span>
                </label>
              ))}
            </div>
            {hasMacros && macrosKcal > 0 && Math.abs(macrosKcal - (toNumber(m.kcal) || 0)) > Math.max(15, macrosKcal * 0.08) && (
              <button type="button" onClick={() => onChange({ kcal: String(macrosKcal) })} className="mt-1.5 text-xs font-medium text-brand-800 hover:underline">
                {t('Dai macro risultano ≈ {n} kcal: usa questo valore', { n: macrosKcal })}
              </button>
            )}
          </div>
        </div>
      )}
    </li>
  );
}
