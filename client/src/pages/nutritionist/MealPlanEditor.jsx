import {
  CalendarDays,
  ChevronDown,
  CirclePlus,
  Copy,
  CopyPlus,
  Droplets,
  Drumstick,
  Ellipsis,
  Eraser,
  FileDown,
  FileText,
  Flame,
  LayoutTemplate,
  Lock,
  Plus,
  Save,
  Search,
  Send,
  Target,
  Trash2,
  Wheat,
  Droplet,
} from 'lucide-react';
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router';
import { Avatar } from '../../components/Avatar.jsx';
import { DatePicker, Popover } from '../../components/DatePicker.jsx';
import { Chip, TargetBar } from '../../components/editor.jsx';
import { numberToText, PageHeader, toNumber } from '../../components/forms.jsx';
import { MobileSaveBar } from '../../components/MobileSaveBar.jsx';
import { PlanPrint } from '../../components/PlanPrint.jsx';
import { Card, ErrorState, PageLoader, Spinner } from '../../components/ui.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { getLanguage, t, translateMessage } from '../../i18n/index.js';
import { api } from '../../lib/api.js';
import { ageOf, bmiOf, buildTemplateDays, GOALS, goalOf, macroShare, nameOf, PLAN_TEMPLATES, suggestTargets } from '../../lib/foods.js';
import { displayName, fmtNumber } from '../../lib/format.js';
import { MEAL_META, MEAL_TYPES, WEEKDAYS } from '../../lib/labels.js';
import { useApi } from '../../lib/useApi.js';
import { FormError } from '../auth/fields.jsx';
import { MealCard } from './MealCard.jsx';
import {
  cloneDay,
  cloneMeal,
  dayHasFood,
  dayTotals,
  daysFromTemplate,
  emptyDay,
  emptyMeal,
  formFromPlan,
  MAX_DAYS,
  newForm,
  toPayload,
} from './mealPlanModel.js';

// L'editor di testo è pesante: si carica a parte, mentre il resto della pagina è già utilizzabile.
const RichTextEditor = lazy(() => import('../../components/RichTextEditor.jsx').then((m) => ({ default: m.RichTextEditor })));

const ACTIVITY_TEXT = { sedentario: 'Sedentario', leggero: 'Leggero', moderato: 'Moderato', attivo: 'Attivo', molto_attivo: 'Molto attivo' };

/** Note iniziali dal profilo del cliente: preferenze alimentari, allergie e livello di attività. */
function notesFromProfile(c) {
  return [
    ...(c.dietPreferences ?? []).map((p) => t(p)),
    c.allergies && t('Allergie o intolleranze: {list}', { list: c.allergies }),
    c.activityLevel && t('Livello di attività: {level}', { level: t(ACTIVITY_TEXT[c.activityLevel]).toLowerCase() }),
  ].filter(Boolean);
}

/** Piano pronto per la stampa (anche se non ancora salvato). */
function printablePlan(form) {
  const num = (v) => {
    const n = toNumber(v);
    return Number.isNaN(n) ? null : n;
  };
  return {
    title: form.title.trim() || t('Piano alimentare personalizzato'),
    goal: form.goal,
    intro: form.intro,
    kcalTarget: num(form.kcalTarget),
    proteinTarget: num(form.proteinTarget),
    carbsTarget: num(form.carbsTarget),
    fatTarget: num(form.fatTarget),
    waterLiters: num(form.waterLiters),
    notes: form.notes.filter((n) => n.trim()),
    days: form.days.map((d) => ({
      meals: d.meals
        .map((m) => ({ ...m, items: m.items.filter((i) => i.name.trim()).map((i) => ({ ...i, quantity: num(i.quantity) })) }))
        .filter((m) => m.items.length),
    })),
  };
}

export default function MealPlanEditor({ id }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const sourceId = searchParams.get('da');
  const existing = useApi(id ? `/meal-plans/${id}` : sourceId ? `/meal-plans/${sourceId}` : null);
  const [form, setForm] = useState(null);
  const [dayIndex, setDayIndex] = useState(location.state?.day ?? 0);
  const [error, setError] = useState('');
  const [flash, setFlash] = useState(location.state?.flash ?? '');
  const [saving, setSaving] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [printing, setPrinting] = useState(false);
  const errorRef = useRef(null);
  const prefilled = useRef(null);

  useEffect(() => {
    if (form) return;
    if (existing.data) setForm(formFromPlan(existing.data.plan, { copy: !id }));
    else if (!id && !sourceId) setForm(newForm({ clientId: searchParams.get('cliente') ?? '' }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing.data]);

  const profile = useApi(form?.clientId ? `/clients/${form.clientId}/profile` : null);
  const client = profile.data?.client ?? null;

  // Nuovo piano: obiettivo, fabbisogni e note proposti dai dati del cliente (si possono cambiare).
  useEffect(() => {
    if (!client || id || prefilled.current === client.id) return;
    prefilled.current = client.id;
    setForm((f) => {
      if (!f || f.clientId !== client.id) return f;
      const goal = f.goal || (goalOf(client.program)?.value ?? '');
      const s = suggestTargets({ weightKg: client.weightKg, activityLevel: client.activityLevel, goal });
      return {
        ...f,
        goal,
        notes: f.notes.length ? f.notes : notesFromProfile(client),
        ...(s &&
          !f.kcalTarget && {
            kcalTarget: numberToText(s.kcal),
            proteinTarget: numberToText(s.protein),
            carbsTarget: numberToText(s.carbs),
            fatTarget: numberToText(s.fat),
            waterLiters: numberToText(s.water),
          }),
      };
    });
  }, [client, id]);

  useEffect(() => {
    if (!flash) return undefined;
    const timer = setTimeout(() => setFlash(''), 3500);
    return () => clearTimeout(timer);
  }, [flash]);

  // Avviso se si chiude la pagina con modifiche non salvate
  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const update = useCallback((patch) => {
    setForm((f) => ({ ...f, ...(typeof patch === 'function' ? patch(f) : patch) }));
    setDirty(true);
  }, []);
  const onIntroChange = useCallback((intro) => update({ intro }), [update]);

  if (existing.error) return <ErrorState error={existing.error} onRetry={existing.reload} />;
  if (!form) return <PageLoader />;

  const day = form.days[Math.min(dayIndex, form.days.length - 1)];
  const currentIndex = form.days.indexOf(day);

  async function save(status) {
    setError('');
    if (!form.clientId) return showError(t('Scegli il cliente a cui è destinato il piano.'));
    const { body, error: problem, dayIndex: badDay } = toPayload(form, status);
    if (problem) {
      if (badDay != null) setDayIndex(badDay);
      return showError(problem);
    }
    setSaving(status);
    try {
      const res = id ? await api(`/meal-plans/${id}`, { method: 'PUT', body }) : await api('/meal-plans', { method: 'POST', body: { ...body, clientId: form.clientId } });
      setDirty(false);
      if (status === 'active') {
        navigate('/app/piani-alimentari', { state: { flash: t('Piano "{title}" pubblicato: il cliente lo vede già.', { title: body.title }) } });
      } else if (!id) {
        navigate(`/app/piani-alimentari/${res.plan.id}`, { replace: true, state: { flash: t('Bozza salvata.'), day: currentIndex } });
      } else {
        setForm((f) => ({ ...f, status }));
        setFlash(t('Bozza salvata.'));
        setSaving(null);
      }
    } catch (err) {
      showError(translateMessage(err.message));
      setSaving(null);
    }
  }

  function showError(message) {
    setError(message);
    requestAnimationFrame(() => errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
  }

  return (
    <form onSubmit={(e) => e.preventDefault()} className="space-y-5" noValidate>
      <PageHeader
        back={{ to: '/app/piani-alimentari', label: t('Torna ai piani alimentari') }}
        title={id ? t('Modifica piano alimentare') : t('Compila piano alimentare')}
        subtitle={t('Crea un piano personalizzato per il tuo cliente, definendo pasti, porzioni e indicazioni specifiche.')}
      />
      <div ref={errorRef}>
        <FormError>{error}</FormError>
      </div>
      {flash && (
        <p role="status" className="rounded-xl bg-brand-50 px-4 py-3 text-sm font-medium text-brand-900">
          {flash}
        </p>
      )}

      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-4">
          <Card className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:p-4">
            <ClientPicker clientId={form.clientId} client={client} locked={Boolean(id)} onChange={(clientId) => update({ clientId })} />
            <span aria-hidden="true" className="hidden h-10 w-px shrink-0 bg-line sm:block" />
            <GoalPicker value={form.goal} onChange={(goal) => update({ goal })} />
          </Card>

          <Card className="p-4 sm:p-5">
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_210px]">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink-700">{t('Titolo del piano')}</span>
                <input
                  value={form.title}
                  onChange={(e) => update({ title: e.target.value })}
                  maxLength={100}
                  placeholder={t('Piano alimentare personalizzato')}
                  className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[15px] font-medium outline-none placeholder:text-ink-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                />
              </label>
              <DatePicker label={t('Inizio del piano')} value={form.startDate} onChange={(startDate) => update({ startDate })} clearable placeholder={t('Da subito')} />
            </div>
            <h2 className="mt-5 mb-2 text-[15px] font-semibold">{t('Introduzione e obiettivi del piano')}</h2>
            <Suspense fallback={<div className="grid min-h-[230px] place-items-center rounded-xl border border-line"><Spinner /></div>}>
              <RichTextEditor
                value={form.intro}
                onChange={onIntroChange}
                label={t('Introduzione e obiettivi del piano')}
                placeholder={t('Spiega al cliente come è pensato il piano, gli obiettivi e le indicazioni generali…')}
              />
            </Suspense>
          </Card>

          <DaysCard form={form} update={update} dayIndex={currentIndex} setDayIndex={setDayIndex} />
        </div>

        <PlanAside
          form={form}
          update={update}
          client={client}
          clientLoading={profile.loading}
          day={day}
          dayNumber={currentIndex + 1}
          saving={saving}
          onSave={save}
          onPrint={() => setPrinting(true)}
        />
      </div>

      {/* Telefono e tablet: salvataggio sempre a portata di mano */}
      <MobileSaveBar
        summary={
          <>
            <span className="block font-semibold text-ink-900">{t('Giorno {n}', { n: currentIndex + 1 })} · {fmtNumber(dayTotals(day).kcal, 0)} kcal</span>
            {form.status === 'active' ? t('Pubblicato') : t('Bozza')}
          </>
        }
      >
        <button type="button" className="btn-soft px-3" onClick={() => save('draft')} disabled={Boolean(saving)} aria-label={form.status === 'active' ? t('Sposta in bozza') : t('Salva bozza')} title={form.status === 'active' ? t('Sposta in bozza') : t('Salva bozza')}>
          {saving === 'draft' ? <Spinner className="h-4 w-4" /> : <Save className="h-4 w-4" />}
        </button>
        <button type="button" className="btn-primary px-5" onClick={() => save('active')} disabled={Boolean(saving)}>
          {saving === 'active' ? <Spinner className="h-4 w-4 text-white" /> : <Send className="h-4 w-4" />} {form.status === 'active' ? t('Aggiorna') : t('Pubblica')}
        </button>
      </MobileSaveBar>

      {printing && (
        <PlanPrint
          plan={printablePlan(form)}
          people={{ client: client?.fullName, nutritionist: displayName(user) }}
          onDone={() => setPrinting(false)}
        />
      )}
    </form>
  );
}

// Cliente e obiettivo

function ClientPicker({ clientId, client, locked, onChange }) {
  const anchorRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { data } = useApi(locked ? null : '/clients');
  const clients = (data?.clients ?? [])
    .filter((c) => c.status === 'active')
    .map((c) => c.client)
    .sort((a, b) => a.fullName.localeCompare(b.fullName));
  const q = query.trim().toLowerCase();
  const visible = clients.filter((c) => !q || c.fullName.toLowerCase().includes(q));
  const selected = client ?? clients.find((c) => c.id === clientId) ?? null;
  const age = ageOf(client?.birthDate);
  const details = client ? [age != null && t('{n} anni', { n: age }), client.heightCm && `${client.heightCm} cm`, client.weightKg && `${fmtNumber(client.weightKg)} kg`].filter(Boolean) : [];

  const content = (
    <>
      {selected ? <Avatar user={selected} size="lg" /> : <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-soft text-ink-400"><Search className="h-5 w-5" /></span>}
      <span className="min-w-0 flex-1 text-left">
        <span className="block truncate text-[17px] font-semibold">{selected ? selected.fullName : t('Scegli il cliente')}</span>
        <span className="block truncate text-[13px] text-ink-500">{selected ? details.join(' • ') || t('Dati del cliente non ancora inseriti') : t('Il piano sarà visibile solo a lui o a lei')}</span>
      </span>
    </>
  );

  if (locked) {
    return (
      <div className="flex min-w-0 flex-1 items-center gap-3 px-1" title={t('Il cliente di un piano già creato non si può cambiare')}>
        {content}
        <Lock className="h-4 w-4 shrink-0 text-ink-300" />
      </div>
    );
  }

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={`flex min-w-0 flex-1 items-center gap-3 rounded-xl px-1 py-1 transition hover:bg-soft ${!selected ? 'ring-2 ring-brand-200 ring-offset-2 ring-offset-surface' : ''}`}
      >
        {content}
        <ChevronDown className="h-5 w-5 shrink-0 text-ink-500" />
      </button>
      <Popover anchorRef={anchorRef} open={open} onClose={() => setOpen(false)} className="w-[min(360px,90vw)] p-2">
        <label className="relative block">
          <span className="sr-only">{t('Cerca cliente')}</span>
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('Cerca cliente…')}
            className="w-full rounded-lg border border-line bg-surface py-2 pr-3 pl-9 text-sm outline-none focus:border-brand-500"
          />
        </label>
        <ul role="listbox" aria-label={t('Clienti')} className="mt-1.5 max-h-72 overflow-y-auto">
          {visible.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                role="option"
                aria-selected={c.id === clientId}
                onClick={() => {
                  onChange(c.id);
                  setOpen(false);
                  setQuery('');
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-hover ${c.id === clientId ? 'bg-brand-50 font-semibold text-brand-800' : ''}`}
              >
                <Avatar user={c} size="sm" /> <span className="truncate">{c.fullName}</span>
              </button>
            </li>
          ))}
          {visible.length === 0 && <li className="px-3 py-4 text-center text-sm text-ink-500">{t('Nessun cliente trovato.')}</li>}
        </ul>
      </Popover>
    </>
  );
}

function GoalPicker({ value, onChange }) {
  const anchorRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState('');
  const goal = goalOf(value);
  return (
    <>
      <button ref={anchorRef} type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex shrink-0 items-center gap-2.5 rounded-xl px-2 py-2 transition hover:bg-soft">
        <Target className="h-5 w-5 text-brand-700" strokeWidth={2.2} />
        <span className="text-[15px] font-medium">{t('Obiettivo')}</span>
        <span className={`rounded-full px-3 py-1 text-[13px] font-semibold ${value ? 'bg-brand-50 text-brand-800' : 'bg-muted text-ink-500'}`}>{value ? (goal?.label ?? value) : t('Scegli')}</span>
        <ChevronDown className="h-4 w-4 text-ink-500" />
      </button>
      <Popover anchorRef={anchorRef} open={open} onClose={() => setOpen(false)} align="end" className="w-[min(340px,90vw)] p-2">
        <ul className="space-y-0.5">
          {GOALS.map((g) => (
            <li key={g.value}>
              <button
                type="button"
                onClick={() => {
                  onChange(g.value);
                  setOpen(false);
                }}
                className={`w-full rounded-lg px-3 py-2 text-left hover:bg-hover ${g.value === value ? 'bg-brand-50' : ''}`}
              >
                <span className={`block text-sm font-semibold ${g.value === value ? 'text-brand-800' : ''}`}>{g.label}</span>
                <span className="block text-xs text-ink-500">{g.text}</span>
              </button>
            </li>
          ))}
        </ul>
        <form
          className="mt-1 flex gap-2 border-t border-line p-2"
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!custom.trim()) return;
            onChange(custom.trim().slice(0, 60));
            setCustom('');
            setOpen(false);
          }}
        >
          <input
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder={t('Altro obiettivo…')}
            maxLength={60}
            className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 py-1.5 text-sm outline-none focus:border-brand-500"
          />
          <button type="submit" className="btn-soft px-3 py-1.5">
            {t('Usa')}
          </button>
        </form>
      </Popover>
    </>
  );
}

// Giorni e pasti

function DaysCard({ form, update, dayIndex, setDayIndex }) {
  const day = form.days[dayIndex];
  const empty = !form.days.some(dayHasFood);
  const [focusItem, setFocusItem] = useState(null);
  const clearFocus = useCallback(() => setFocusItem(null), []);
  const [dragKey, setDragKey] = useState(null);
  const [armedKey, setArmedKey] = useState(null);
  const [overKey, setOverKey] = useState(null);

  useEffect(() => {
    if (!armedKey) return undefined;
    const disarm = () => !dragKey && setArmedKey(null);
    document.addEventListener('mouseup', disarm);
    document.addEventListener('touchend', disarm);
    return () => {
      document.removeEventListener('mouseup', disarm);
      document.removeEventListener('touchend', disarm);
    };
  }, [armedKey, dragKey]);

  const setDays = (fn) => update((f) => ({ days: fn(f.days) }));
  const setMeals = (fn) => setDays((days) => days.map((d, i) => (i === dayIndex ? { ...d, meals: fn(d.meals) } : d)));

  function addDay() {
    if (form.days.length >= MAX_DAYS) return;
    setDays((days) => [...days, emptyDay()]);
    setDayIndex(form.days.length);
  }

  function addMeal(type) {
    const meal = emptyMeal(type);
    setMeals((meals) => {
      const at = meals.findIndex((m) => m.start && meal.start && m.start > meal.start);
      const next = [...meals];
      next.splice(at === -1 ? next.length : at, 0, meal);
      return next;
    });
  }

  function moveMeal(fromKey, toKey) {
    if (!fromKey || fromKey === toKey) return;
    setMeals((meals) => {
      const from = meals.findIndex((m) => m.key === fromKey);
      const to = meals.findIndex((m) => m.key === toKey);
      const next = [...meals];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  function shiftMeal(key, delta) {
    const i = day.meals.findIndex((m) => m.key === key);
    const target = day.meals[i + delta];
    if (target) moveMeal(key, target.key);
  }

  const dragProps = (meal) => ({
    armed: armedKey === meal.key,
    dragging: dragKey === meal.key,
    over: Boolean(dragKey) && overKey === meal.key && dragKey !== meal.key,
    arm: () => setArmedKey(meal.key),
    onDragStart: (e) => {
      if (armedKey !== meal.key) return;
      setDragKey(meal.key);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', meal.key);
    },
    onDragOver: (e) => {
      if (!dragKey) return;
      e.preventDefault();
      if (overKey !== meal.key) setOverKey(meal.key);
    },
    onDrop: (e) => {
      e.preventDefault();
      moveMeal(dragKey, meal.key);
      setDragKey(null);
      setOverKey(null);
      setArmedKey(null);
    },
    onDragEnd: () => {
      setDragKey(null);
      setOverKey(null);
      setArmedKey(null);
    },
  });

  const weekly = form.days.length === 7;
  return (
    <Card>
      <div className="flex items-stretch gap-2 border-b border-line pr-2 pl-1 sm:pl-2">
        <div role="tablist" aria-label={t('Giorni del piano')} className="no-scrollbar flex min-w-0 flex-1 overflow-x-auto">
          {form.days.map((d, i) => {
            const active = i === dayIndex;
            const tot = dayTotals(d);
            return (
              <button
                key={d.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setDayIndex(i)}
                title={[weekly && WEEKDAYS[i].long, tot.kcal ? `${fmtNumber(tot.kcal, 0)} kcal` : t('Nessun alimento')].filter(Boolean).join(' · ')}
                className={`relative shrink-0 px-2.5 pt-4 pb-3.5 text-sm font-medium whitespace-nowrap transition 2xl:px-3.5 ${
                  active ? 'text-brand-800 after:absolute after:inset-x-1.5 after:bottom-0 after:h-[3px] after:rounded-full after:bg-brand-700' : 'text-ink-500 hover:text-ink-900'
                }`}
              >
                {t('Giorno {n}', { n: i + 1 })}
                {!dayHasFood(d) && <span aria-hidden="true" className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-ink-300 align-middle" />}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={addDay}
          disabled={form.days.length >= MAX_DAYS}
          className="inline-flex shrink-0 items-center gap-1.5 px-2 text-sm font-semibold text-brand-800 transition hover:text-brand-950 disabled:opacity-40"
          title={form.days.length >= MAX_DAYS ? t('Al massimo {n} giorni', { n: MAX_DAYS }) : undefined}
        >
          <CirclePlus className="h-5 w-5 fill-brand-700 text-surface" /> <span className="hidden sm:inline">{t('Aggiungi giorno')}</span>
          <span className="sr-only sm:hidden">{t('Aggiungi giorno')}</span>
        </button>
      </div>

      <div className="p-3 sm:p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-ink-500">
            <span className="font-semibold text-ink-900">{t('Giorno {n}', { n: dayIndex + 1 })}</span>
            {weekly ? ` · ${WEEKDAYS[dayIndex].long}` : ` · ${t('a rotazione ogni {n} giorni', { n: form.days.length })}`}
          </p>
          <DayActions form={form} dayIndex={dayIndex} setDays={setDays} setDayIndex={setDayIndex} />
        </div>

        {empty && <TemplateBanner onApply={(days) => setDays(() => days)} dayCount={form.days.length} kcal={toNumber(form.kcalTarget)} />}

        {day.meals.length > 0 ? (
          <ul className="space-y-3">
            {day.meals.map((meal) => (
              <MealCard
                key={meal.key}
                meal={meal}
                drag={dragProps(meal)}
                focusItemKey={focusItem}
                onFocusDone={clearFocus}
                onChange={(next, focusKey) => {
                  setMeals((meals) => meals.map((m) => (m.key === meal.key ? next : m)));
                  if (focusKey) setFocusItem(focusKey);
                }}
                onDuplicate={() =>
                  setMeals((meals) => {
                    const i = meals.findIndex((m) => m.key === meal.key);
                    const next = [...meals];
                    next.splice(i + 1, 0, cloneMeal(meal));
                    return next;
                  })
                }
                onRemove={() => setMeals((meals) => meals.filter((m) => m.key !== meal.key))}
                onMove={(delta) => shiftMeal(meal.key, delta)}
              />
            ))}
          </ul>
        ) : (
          <p className="rounded-xl border border-dashed border-line p-6 text-center text-sm text-ink-500">{t('Nessun pasto in questo giorno: aggiungine uno qui sotto.')}</p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-ink-500">{t('Aggiungi pasto')}:</span>
          {MEAL_TYPES.map((type) => {
            const Icon = MEAL_META[type].icon;
            return (
              <Chip key={type} onClick={() => addMeal(type)}>
                <Plus className="h-3.5 w-3.5" /> <Icon className="h-3.5 w-3.5" /> {MEAL_META[type].label}
              </Chip>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

/** Suggerimento per partire da un modello quando il piano è ancora vuoto. */
function TemplateBanner({ onApply, dayCount, kcal }) {
  return (
    <div className="mb-4 rounded-2xl border border-brand-200 bg-brand-50/60 p-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-brand-900">
        <LayoutTemplate className="h-4 w-4" /> {t('Vuoi partire da un modello?')}
      </p>
      <p className="mt-1 text-[13px] text-ink-700">{t('Riempie tutti i giorni con pasti, alimenti e quantità adattate ai fabbisogni: poi personalizzi ogni pasto.')}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {PLAN_TEMPLATES.map((tpl) => (
          <Chip key={tpl.id} onClick={() => onApply(daysFromTemplate(buildTemplateDays(tpl, { days: dayCount, kcal: kcal || tpl.kcal, lang: getLanguage() })))}>
            {nameOf(tpl)} <span className="text-ink-400">≈ {fmtNumber(kcal || tpl.kcal, 0)} kcal</span>
          </Chip>
        ))}
      </div>
    </div>
  );
}

/** Menu "⋯" del giorno: duplica, copia su altri giorni, svuota, elimina, applica un modello. */
function DayActions({ form, dayIndex, setDays, setDayIndex }) {
  const anchorRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('menu');
  const [targets, setTargets] = useState([]);
  const [confirm, setConfirm] = useState(null);
  const count = form.days.length;
  const others = form.days.map((_, i) => i).filter((i) => i !== dayIndex);
  const close = () => {
    setOpen(false);
    setMode('menu');
    setTargets([]);
    setConfirm(null);
  };
  const item = 'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm hover:bg-hover disabled:opacity-40';

  return (
    <>
      <button ref={anchorRef} type="button" className="btn-soft px-3 py-1.5" onClick={() => (open ? close() : setOpen(true))} aria-expanded={open}>
        <Ellipsis className="h-4 w-4" /> {t('Azioni giorno')}
      </button>
      <Popover anchorRef={anchorRef} open={open} onClose={close} align="end" className="w-72 p-2">
        {mode === 'menu' && (
          <ul>
            <li>
              <button
                type="button"
                className={item}
                disabled={count >= MAX_DAYS}
                onClick={() => {
                  setDays((days) => [...days, cloneDay(days[dayIndex])]);
                  setDayIndex(count);
                  close();
                }}
              >
                <CopyPlus className="h-4 w-4 text-ink-500" /> {t('Duplica come nuovo giorno')}
              </button>
            </li>
            <li>
              <button type="button" className={item} disabled={count < 2} onClick={() => setMode('copy')}>
                <Copy className="h-4 w-4 text-ink-500" /> {t('Copia su altri giorni…')}
              </button>
            </li>
            <li>
              <button type="button" className={item} onClick={() => setMode('templates')}>
                <LayoutTemplate className="h-4 w-4 text-ink-500" /> {t('Applica un modello…')}
              </button>
            </li>
            <li>
              <button
                type="button"
                className={item}
                onClick={() => {
                  if (confirm !== 'clear') return setConfirm('clear');
                  setDays((days) => days.map((d, i) => (i === dayIndex ? { ...d, meals: [] } : d)));
                  close();
                }}
              >
                <Eraser className="h-4 w-4 text-ink-500" /> {confirm === 'clear' ? <strong className="text-danger">{t('Conferma: svuota il giorno')}</strong> : t('Svuota giorno')}
              </button>
            </li>
            <li>
              <button
                type="button"
                className={item}
                disabled={count < 2}
                onClick={() => {
                  if (confirm !== 'delete') return setConfirm('delete');
                  setDays((days) => days.filter((_, i) => i !== dayIndex));
                  setDayIndex(Math.max(0, dayIndex - 1));
                  close();
                }}
              >
                <Trash2 className="h-4 w-4 text-danger" /> {confirm === 'delete' ? <strong className="text-danger">{t('Conferma: elimina il giorno')}</strong> : t('Elimina giorno')}
              </button>
            </li>
          </ul>
        )}
        {mode === 'copy' && (
          <div className="p-2">
            <p className="text-sm font-semibold">{t('Copia il giorno {n} su:', { n: dayIndex + 1 })}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {others.map((i) => (
                <Chip key={i} active={targets.includes(i)} onClick={() => setTargets((list) => (list.includes(i) ? list.filter((x) => x !== i) : [...list, i]))} className="px-2.5 py-1 text-xs">
                  {t('Giorno {n}', { n: i + 1 })}
                </Chip>
              ))}
              <Chip active={targets.length === others.length} onClick={() => setTargets(targets.length === others.length ? [] : others)} className="px-2.5 py-1 text-xs">
                {t('Tutti')}
              </Chip>
            </div>
            <p className="mt-3 text-xs text-ink-500">{t('I pasti dei giorni scelti verranno sostituiti.')}</p>
            <button
              type="button"
              className="btn-primary mt-3 w-full py-2"
              disabled={!targets.length}
              onClick={() => {
                setDays((days) => days.map((d, i) => (targets.includes(i) ? { ...cloneDay(days[dayIndex]), key: d.key } : d)));
                close();
              }}
            >
              {t('Copia')}
            </button>
          </div>
        )}
        {mode === 'templates' && (
          <div className="p-1">
            <p className="px-2 pt-1 text-sm font-semibold">{t('Applica un modello a tutti i giorni')}</p>
            <p className="px-2 pb-2 text-xs text-ink-500">{t('I pasti attuali verranno sostituiti.')}</p>
            {PLAN_TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                className={item}
                onClick={() => {
                  if (confirm !== tpl.id) return setConfirm(tpl.id);
                  const kcal = toNumber(form.kcalTarget);
                  setDays(() => daysFromTemplate(buildTemplateDays(tpl, { days: count, kcal: kcal || tpl.kcal, lang: getLanguage() })));
                  close();
                }}
              >
                <LayoutTemplate className="h-4 w-4 text-ink-500" />
                {confirm === tpl.id ? <strong className="text-danger">{t('Conferma: sostituisci i pasti')}</strong> : nameOf(tpl)}
              </button>
            ))}
          </div>
        )}
      </Popover>
    </>
  );
}

// Colonna di destra

const SectionTitle = ({ children, action }) => (
  <div className="flex items-center justify-between gap-2">
    <h2 className="font-display text-[17px] font-semibold">{children}</h2>
    {action}
  </div>
);
const EditLink = ({ onClick, active, children }) => (
  <button type="button" onClick={onClick} className="text-[13px] font-semibold text-brand-800 hover:underline" aria-expanded={active}>
    {children ?? (active ? t('Fatto') : t('Modifica'))}
  </button>
);

const MACROS = [
  { key: 'protein', target: 'proteinTarget', label: 'Proteine', perGram: 4, icon: Drumstick, tone: 'text-iris-500', dot: 'bg-brand-600' },
  { key: 'carbs', target: 'carbsTarget', label: 'Carboidrati', perGram: 4, icon: Wheat, tone: 'text-brand-600', dot: 'bg-amber-400' },
  { key: 'fat', target: 'fatTarget', label: 'Grassi', perGram: 9, icon: Droplet, tone: 'text-amber-500', dot: 'bg-brand-400' },
];

function PlanAside({ form, update, client, clientLoading, day, dayNumber, saving, onSave, onPrint }) {
  const [editTargets, setEditTargets] = useState(false);
  const [editNotes, setEditNotes] = useState(false);
  const kcal = toNumber(form.kcalTarget);
  const goal = goalOf(form.goal);
  const bmi = bmiOf(client?.weightKg, client?.heightCm);
  const age = ageOf(client?.birthDate);
  const totals = dayTotals(day);
  const suggestion = client ? suggestTargets({ weightKg: client.weightKg, activityLevel: client.activityLevel, goal: form.goal }) : null;
  const published = form.status === 'active';

  return (
    <aside className="space-y-4 xl:sticky xl:top-4">
      <Card className="divide-y divide-line">
        {/* Riepilogo cliente */}
        <section className="p-4">
          <SectionTitle action={client && <Link to={`/app/progressi?cliente=${client.id}`} className="text-[13px] font-semibold text-brand-800 hover:underline">{t('Progressi')}</Link>}>
            {t('Riepilogo cliente')}
          </SectionTitle>
          {client ? (
            <div className="mt-3 flex items-center gap-3">
              <Avatar user={client} size="xl" />
              <div className="min-w-0">
                <p className="truncate font-semibold">{client.fullName}</p>
                <p className="text-[13px] text-ink-500">
                  {[age != null && t('{n} anni', { n: age }), client.heightCm && `${client.heightCm} cm`, client.weightKg && `${fmtNumber(client.weightKg)} kg`].filter(Boolean).join(' • ') || t('Dati non ancora inseriti')}
                </p>
                {bmi && <p className="text-[13px] text-ink-500">{t('BMI {value} ({label})', { value: fmtNumber(bmi.value), label: bmi.label })}</p>}
              </div>
            </div>
          ) : (
            <p className="mt-2 text-sm text-ink-500">{clientLoading ? t('Caricamento…') : t('Scegli il cliente per vedere i suoi dati.')}</p>
          )}
          <div className="mt-3 rounded-xl bg-soft p-3">
            <p className="flex items-center gap-2 text-sm font-medium">
              <Target className="h-4 w-4 text-brand-700" strokeWidth={2.2} /> {t('Obiettivo')}
              {form.goal && <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-800">{goal?.label ?? form.goal}</span>}
            </p>
            <p className="mt-1.5 text-[13px] text-ink-700">{goal?.text ?? client?.goal ?? t('Scegli l’obiettivo del piano in alto.')}</p>
          </div>
        </section>

        {/* Fabbisogni */}
        <section className="p-4">
          <SectionTitle action={<EditLink active={editTargets} onClick={() => setEditTargets((v) => !v)} />}>{t('Fabbisogni giornalieri')}</SectionTitle>
          {editTargets ? (
            <div className="mt-3 space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <TargetInput label={t('Calorie')} suffix="kcal" value={form.kcalTarget} onChange={(v) => update({ kcalTarget: v })} />
                <TargetInput label={t('Proteine')} suffix="g" value={form.proteinTarget} onChange={(v) => update({ proteinTarget: v })} />
                <TargetInput label={t('Carboidrati')} suffix="g" value={form.carbsTarget} onChange={(v) => update({ carbsTarget: v })} />
                <TargetInput label={t('Grassi')} suffix="g" value={form.fatTarget} onChange={(v) => update({ fatTarget: v })} />
                <TargetInput label={t('Idratazione')} suffix={t('L/giorno')} value={form.waterLiters} onChange={(v) => update({ waterLiters: v })} />
              </div>
              {suggestion && (
                <button
                  type="button"
                  className="text-left text-xs font-medium text-brand-800 hover:underline"
                  onClick={() =>
                    update({
                      kcalTarget: numberToText(suggestion.kcal),
                      proteinTarget: numberToText(suggestion.protein),
                      carbsTarget: numberToText(suggestion.carbs),
                      fatTarget: numberToText(suggestion.fat),
                      waterLiters: numberToText(suggestion.water),
                    })
                  }
                >
                  {t('Calcola dai dati del cliente (≈ {n} kcal)', { n: fmtNumber(suggestion.kcal, 0) })}
                </button>
              )}
              <p className="text-[11px] leading-snug text-ink-400">{t('Stima indicativa da peso, attività e obiettivo: verifica sempre con la tua valutazione.')}</p>
            </div>
          ) : (
            <>
              <div className="mt-3 grid grid-cols-4 gap-1.5">
                <TargetTile icon={Flame} tone="text-orange-500" value={form.kcalTarget} unit="kcal" label={t('Energia')} />
                {MACROS.map((m) => (
                  <TargetTile key={m.key} icon={m.icon} tone={m.tone} value={form[m.target]} unit="g" label={t(m.label)} share={macroShare(toNumber(form[m.target]), m.perGram, kcal)} />
                ))}
              </div>
              <div className="mt-3 flex items-center gap-3 border-t border-line pt-3">
                <Droplets className="h-5 w-5 text-sky-500" />
                <div>
                  <p className="text-sm font-medium">{t('Idratazione')}</p>
                  <p className="text-[13px] text-ink-500">
                    {form.waterLiters ? (
                      <>
                        <span className="font-semibold text-brand-800">{form.waterLiters} L</span> {t('al giorno')}
                      </>
                    ) : (
                      t('Non indicata')
                    )}
                  </p>
                </div>
              </div>
            </>
          )}
        </section>

        {/* Note e preferenze */}
        <section className="p-4">
          <SectionTitle action={<EditLink active={editNotes} onClick={() => setEditNotes((v) => !v)} />}>{t('Note e preferenze')}</SectionTitle>
          {editNotes ? (
            <label className="mt-3 block">
              <span className="mb-1 block text-xs text-ink-500">{t('Una nota per riga')}</span>
              <textarea
                autoFocus
                rows={6}
                value={form.notes.join('\n')}
                onChange={(e) => update({ notes: e.target.value.split('\n').slice(0, 20) })}
                className="w-full resize-y rounded-xl border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
              />
            </label>
          ) : form.notes.filter((n) => n.trim()).length ? (
            <div className="mt-3 flex gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-700">
                <FileText className="h-4 w-4" />
              </span>
              <ul className="list-disc space-y-1 pl-4 text-[13px] text-ink-700">
                {form.notes
                  .filter((n) => n.trim())
                  .map((n, i) => (
                    <li key={i}>{n}</li>
                  ))}
              </ul>
            </div>
          ) : (
            <p className="mt-2 text-sm text-ink-500">{t('Gusti, intolleranze, abitudini: annota ciò che conta per questo piano.')}</p>
          )}
        </section>
      </Card>

      {/* Totale del giorno */}
      <section className="rounded-2xl bg-gradient-to-br from-glow-2 to-glow-3 p-4" aria-live="polite">
        <p className="text-[15px] font-semibold text-ink-900">{t('Totale Giorno {n}', { n: dayNumber })}</p>
        <p className="mt-1 font-display text-[30px] leading-tight font-semibold">
          {fmtNumber(totals.kcal, 0)} kcal
          {kcal > 0 && <span className="ml-2 align-middle text-sm font-normal text-ink-500">/ {fmtNumber(kcal, 0)}</span>}
        </p>
        {kcal > 0 && <TargetBar value={totals.kcal} target={kcal} className="mt-2 bg-surface/70" />}
        <div className="mt-3 grid grid-cols-3 gap-2">
          {MACROS.map((m) => (
            <p key={m.key} className="flex gap-2">
              <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${m.dot}`} />
              <span>
                <span className="block text-[15px] font-semibold">{fmtNumber(totals[m.key], 0)} g</span>
                <span className="block text-[11px] leading-tight text-ink-500">
                  {t(m.label)}
                  {totals.kcal > 0 && ` (${macroShare(totals[m.key], m.perGram, totals.kcal)}%)`}
                </span>
              </span>
            </p>
          ))}
        </div>
      </section>

      {/* Azioni */}
      <div className="grid grid-cols-2 gap-2">
        <button type="button" className="btn-outline rounded-xl border-line py-3 text-ink-900" onClick={() => onSave('draft')} disabled={Boolean(saving)} title={published ? t('Il cliente non vedrà più il piano finché non lo pubblichi di nuovo') : undefined}>
          {saving === 'draft' ? <Spinner className="h-4 w-4" /> : <Save className="h-4 w-4" />} {published ? t('Sposta in bozza') : t('Salva bozza')}
        </button>
        <button type="button" className="btn-outline rounded-xl py-3" onClick={onPrint}>
          <FileDown className="h-4 w-4" /> {t('Esporta PDF')}
        </button>
        <button type="button" className="btn-primary col-span-2 rounded-xl py-3.5 text-[15px]" onClick={() => onSave('active')} disabled={Boolean(saving)}>
          {saving === 'active' ? <Spinner className="h-5 w-5 text-white" /> : <Send className="h-4 w-4" />} {published ? t('Aggiorna piano') : t('Pubblica piano')}
        </button>
      </div>
      <p className="flex items-center justify-center gap-1.5 text-xs text-ink-500">
        <CalendarDays className="h-3.5 w-3.5" />
        {published ? t('Pubblicato: il cliente vede questo piano.') : t('Bozza: il cliente lo vedrà quando lo pubblichi.')}
      </p>
    </aside>
  );
}

function TargetTile({ icon: Icon, tone, value, unit, label, share }) {
  const n = toNumber(value);
  return (
    <div className="rounded-xl border border-line px-1.5 py-2.5 text-center">
      <Icon className={`mx-auto h-5 w-5 ${tone}`} strokeWidth={2.2} />
      <p className="mt-1 text-[15px] leading-tight font-semibold">{n ? fmtNumber(n, 0) : '—'}</p>
      <p className="text-[11px] leading-tight text-ink-500">{n ? unit : ''}</p>
      <p className="mt-0.5 text-[11px] leading-tight text-ink-500">{label}</p>
      {share != null && <p className="text-[11px] leading-tight text-ink-400">({share}%)</p>}
    </div>
  );
}

function TargetInput({ label, suffix, value, onChange }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-ink-500">{label}</span>
      <span className="relative block">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^\d.,]/g, ''))}
          inputMode="decimal"
          className="w-full rounded-lg border border-line bg-surface py-2 pr-14 pl-3 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
        />
        <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-[11px] text-ink-400">{suffix}</span>
      </span>
    </label>
  );
}
