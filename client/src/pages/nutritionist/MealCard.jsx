import { ChevronUp, CirclePlus, Clock, Copy, FileText, GripVertical, Pencil, Trash2, X } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { Popover } from '../../components/DatePicker.jsx';
import { numberToText, toNumber } from '../../components/forms.jsx';
import { getLanguage, t } from '../../i18n/index.js';
import { emojiOf, FOOD_BY_ID, FOOD_UNITS, foodSuggestions, nameOf, recipeItems, unitLabel } from '../../lib/foods.js';
import { fmtNumber } from '../../lib/format.js';
import { MEAL_META, MEAL_TYPES } from '../../lib/labels.js';
import { emptyItem, itemFrom, itemFromFood, mealTitle, mealTotals, withName, withQuantity } from './mealPlanModel.js';

const iconButton = 'grid h-8 w-8 place-items-center rounded-lg text-ink-500 transition hover:bg-hover hover:text-ink-900';
const fieldCls = 'h-9 w-full min-w-0 rounded-lg border border-line bg-surface px-2.5 text-sm text-ink-900 outline-none transition placeholder:text-ink-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-100';

/**
 * Un pasto del piano: intestazione (nome, orario, azioni) e alimenti con quantità, unità e alternativa.
 * drag: proprietà per riordinare i pasti trascinandoli (o con le frecce della tastiera sulla maniglia).
 */
export function MealCard({ meal, onChange, onDuplicate, onRemove, onMove, drag, focusItemKey, onFocusDone }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const Icon = MEAL_META[meal.type]?.icon;
  const totals = mealTotals(meal);
  const set = (patch) => onChange({ ...meal, ...patch });
  const setItems = (items) => onChange({ ...meal, items });
  const updateItem = (key, next) => setItems(meal.items.map((i) => (i.key === key ? next : i)));
  const removeItem = (key) => setItems(meal.items.filter((i) => i.key !== key));

  useEffect(() => {
    if (!confirmDelete) return undefined;
    const timer = setTimeout(() => setConfirmDelete(false), 4000);
    return () => clearTimeout(timer);
  }, [confirmDelete]);

  function addItem() {
    const item = emptyItem();
    onChange({ ...meal, collapsed: false, items: [...meal.items, item] }, item.key);
  }

  /** Una ricetta scelta al posto di un alimento: i suoi alimenti prendono il posto della riga. */
  function insertRecipe(key, recipe) {
    const items = recipeItems(recipe, { lang: getLanguage() }).map((i) => ({ ...itemFrom(i), custom: false }));
    const index = meal.items.findIndex((i) => i.key === key);
    const next = [...meal.items];
    next.splice(index, 1, ...items);
    setItems(next);
  }

  return (
    <li
      className={`rounded-2xl border bg-surface transition ${drag.over ? 'border-brand-500 ring-4 ring-brand-100' : 'border-line'} ${drag.dragging ? 'opacity-50' : ''}`}
      onDragOver={drag.onDragOver}
      onDrop={drag.onDrop}
      onDragEnd={drag.onDragEnd}
      draggable={drag.armed}
      onDragStart={drag.onDragStart}
    >
      {/* Intestazione */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-2 sm:gap-3">
        <button
          type="button"
          className="hidden h-8 w-5 shrink-0 cursor-grab place-items-center rounded text-ink-300 hover:text-ink-700 active:cursor-grabbing sm:grid"
          aria-label={t('Sposta {meal} (frecce su e giù)', { meal: mealTitle(meal) })}
          title={t('Trascina per riordinare')}
          onMouseDown={drag.arm}
          onTouchStart={drag.arm}
          onKeyDown={(e) => {
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
              e.preventDefault();
              onMove(e.key === 'ArrowUp' ? -1 : 1);
            }
          }}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-700">{Icon && <Icon className="h-5 w-5" />}</span>
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-0.5">
          <h3 className="truncate font-display text-[17px] font-semibold">{mealTitle(meal)}</h3>
          {(meal.start || meal.end) && (
            <span className="inline-flex items-center gap-1 text-[13px] text-ink-500">
              <Clock className="h-3.5 w-3.5" />
              {[meal.start, meal.end].filter(Boolean).join(' - ')}
            </span>
          )}
          {totals.kcal > 0 && <span className="text-[13px] font-medium text-ink-500">{fmtNumber(totals.kcal, 0)} kcal</span>}
        </div>
        <div className="flex shrink-0 items-center">
          <button type="button" className={`${iconButton} ${meal.editing ? 'bg-brand-50 text-brand-800' : ''}`} onClick={() => set({ editing: !meal.editing })} aria-label={t('Modifica nome e orario')} title={t('Modifica nome e orario')} aria-expanded={meal.editing}>
            <Pencil className="h-4 w-4" />
          </button>
          <button type="button" className={iconButton} onClick={onDuplicate} aria-label={t('Duplica pasto')} title={t('Duplica pasto')}>
            <Copy className="h-4 w-4" />
          </button>
          {confirmDelete ? (
            <button type="button" className="rounded-full bg-danger px-2.5 py-1 text-xs font-semibold text-white hover:bg-danger-strong" onClick={onRemove}>
              {t('Elimina')}
            </button>
          ) : (
            <button
              type="button"
              className={`${iconButton} text-danger hover:text-danger-strong`}
              onClick={() => (meal.items.length ? setConfirmDelete(true) : onRemove())}
              aria-label={t('Elimina pasto')}
              title={t('Elimina pasto')}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            className={iconButton}
            onClick={() => set({ collapsed: !meal.collapsed })}
            aria-label={meal.collapsed ? t('Mostra alimenti') : t('Nascondi alimenti')}
            aria-expanded={!meal.collapsed}
          >
            <ChevronUp className={`h-4 w-4 transition ${meal.collapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {meal.editing && <MealSettings meal={meal} onChange={set} />}

      {meal.collapsed ? (
        <p className="truncate px-4 pb-3 text-sm text-ink-500 sm:pl-[60px]">
          {meal.items.length ? meal.items.map((i) => i.name).filter(Boolean).join(', ') : t('Nessun alimento')}
        </p>
      ) : (
        <div className="@container px-3 pb-3 sm:pl-[60px]">
          {meal.items.length > 0 && (
            <ul className="space-y-2">
              {meal.items.map((item) => (
                <FoodRow
                  key={item.key}
                  item={item}
                  mealType={meal.type}
                  autoFocus={item.key === focusItemKey}
                  onFocused={onFocusDone}
                  onChange={(next) => updateItem(item.key, next)}
                  onRemove={() => removeItem(item.key)}
                  onRecipe={(recipe) => insertRecipe(item.key, recipe)}
                />
              ))}
            </ul>
          )}
          <div className="mt-2.5 flex flex-wrap items-start gap-2">
            <button type="button" onClick={addItem} className="inline-flex items-center gap-2 rounded-lg bg-brand-50 px-3.5 py-2 text-[13px] font-semibold text-brand-800 transition hover:bg-brand-100">
              <CirclePlus className="h-4 w-4" /> {t('Aggiungi alimento')}
            </button>
            {meal.showNote ? (
              <label className="relative min-w-[220px] flex-1">
                <span className="sr-only">{t('Nota per questo pasto')}</span>
                <FileText className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-400" />
                <input
                  autoFocus={!meal.note}
                  value={meal.note}
                  onChange={(e) => set({ note: e.target.value })}
                  onBlur={() => !meal.note.trim() && set({ showNote: false, note: '' })}
                  maxLength={300}
                  placeholder={t('Nota per questo pasto…')}
                  className={`${fieldCls} pl-9`}
                />
              </label>
            ) : (
              <button type="button" onClick={() => set({ showNote: true })} className="inline-flex items-center gap-2 rounded-lg border border-line px-3.5 py-2 text-[13px] text-ink-500 transition hover:border-brand-300 hover:text-ink-900">
                <FileText className="h-4 w-4" /> {t('Nota per questo pasto…')}
              </button>
            )}
          </div>
        </div>
      )}
    </li>
  );
}

/** Tipo, nome personalizzato e orario del pasto (si apre con la matita). */
function MealSettings({ meal, onChange }) {
  const id = useId();
  return (
    <div className="mx-3 mb-3 grid grid-cols-2 gap-2 rounded-xl bg-soft p-3 sm:ml-[60px] sm:grid-cols-[150px_minmax(0,1fr)_110px_110px_auto] sm:items-end">
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-ink-500">{t('Tipo di pasto')}</span>
        <select value={meal.type} onChange={(e) => onChange({ type: e.target.value })} className={fieldCls}>
          {MEAL_TYPES.map((type) => (
            <option key={type} value={type}>
              {MEAL_META[type].label}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-ink-500">{t('Nome (facoltativo)')}</span>
        <input value={meal.label} onChange={(e) => onChange({ label: e.target.value })} maxLength={40} placeholder={MEAL_META[meal.type]?.label} className={fieldCls} />
      </label>
      <label className="block" htmlFor={`${id}-start`}>
        <span className="mb-1 block text-xs font-medium text-ink-500">{t('Dalle')}</span>
        <input id={`${id}-start`} type="time" value={meal.start} onChange={(e) => onChange({ start: e.target.value })} className={fieldCls} />
      </label>
      <label className="block" htmlFor={`${id}-end`}>
        <span className="mb-1 block text-xs font-medium text-ink-500">{t('Alle')}</span>
        <input id={`${id}-end`} type="time" value={meal.end} onChange={(e) => onChange({ end: e.target.value })} className={fieldCls} />
      </label>
      <button type="button" className="btn-primary col-span-2 px-4 py-2 sm:col-span-1" onClick={() => onChange({ editing: false })}>
        {t('Fatto')}
      </button>
      {meal.start && meal.end && meal.end <= meal.start && <p className="col-span-full text-xs text-danger">{t('L’orario di fine deve venire dopo l’inizio.')}</p>}
    </div>
  );
}

/** Riga di un alimento: miniatura, nome (con suggerimenti), quantità, unità, alternativa. */
function FoodRow({ item, mealType, onChange, onRemove, onRecipe, autoFocus, onFocused }) {
  const food = item.food ? FOOD_BY_ID[item.food] : null;
  const valuesRef = useRef(null);
  const [valuesOpen, setValuesOpen] = useState(false);

  return (
    <li className="grid grid-cols-[36px_minmax(0,1fr)_32px] items-center gap-x-2 gap-y-1.5 @xl:grid-cols-[36px_minmax(0,1.35fr)_54px_100px_minmax(0,1.15fr)_28px]">
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-soft text-xl leading-none select-none" aria-hidden="true" title={food ? nameOf(food) : undefined}>
        {emojiOf(food)}
      </span>
      <div className="relative min-w-0">
        <FoodNameInput
          value={item.name}
          mealType={mealType}
          autoFocus={autoFocus}
          onFocused={onFocused}
          onChange={(name) => onChange(withName(item, name))}
          onPickFood={(f) => onChange({ ...itemFromFood(f), key: item.key, alternative: item.alternative })}
          onPickRecipe={onRecipe}
        />
        <button
          ref={valuesRef}
          type="button"
          onClick={() => setValuesOpen((o) => !o)}
          className={`absolute top-1/2 right-1 -translate-y-1/2 rounded-md px-1 py-0.5 text-[11px] font-semibold whitespace-nowrap transition hover:bg-brand-50 ${item.kcal != null ? 'text-ink-500' : 'text-brand-700'}`}
          title={t('Calorie e macronutrienti')}
          aria-label={item.kcal != null ? t('{n} kcal: modifica i valori', { n: item.kcal }) : t('Aggiungi calorie e macronutrienti')}
          tabIndex={item.name ? 0 : -1}
          hidden={!item.name}
        >
          {item.kcal != null ? `${fmtNumber(item.kcal, 0)} kcal` : t('+ valori')}
        </button>
        <ValuesPopover anchorRef={valuesRef} open={valuesOpen} onClose={() => setValuesOpen(false)} item={item} food={food} onChange={onChange} />
      </div>
      <button type="button" onClick={onRemove} className="grid h-8 w-8 place-items-center rounded-lg text-ink-400 hover:bg-hover hover:text-ink-900 @xl:order-last @xl:w-7" aria-label={t('Rimuovi {name}', { name: item.name || t('alimento') })}>
        <X className="h-4 w-4" />
      </button>
      <div className="col-span-3 grid grid-cols-[54px_100px_minmax(0,1fr)] gap-2 pl-11 @xl:contents">
        <input
          value={item.quantity}
          onChange={(e) => onChange(withQuantity(item, { quantity: e.target.value.replace(/[^\d.,]/g, '') }))}
          inputMode="decimal"
          disabled={item.unit === 'q.b.'}
          placeholder="—"
          aria-label={t('Quantità')}
          className={`${fieldCls} text-center disabled:bg-soft`}
        />
        <select value={item.unit} onChange={(e) => onChange(withQuantity(item, { unit: e.target.value, ...(e.target.value === 'q.b.' && { quantity: '' }) }))} aria-label={t('Unità di misura')} className={`${fieldCls} pr-1 pl-2 text-[13px]`}>
          {FOOD_UNITS.map((u) => (
            <option key={u} value={u}>
              {unitLabel(u)}
            </option>
          ))}
        </select>
        {/* Su schermi stretti l'alternativa va su una riga tutta sua */}
        <label className="relative col-span-3 min-w-0 @md:col-span-1">
          <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-[12px] whitespace-nowrap text-ink-400">{t('In alternativa:')}</span>
          <AlternativeInput value={item.alternative} onChange={(alternative) => onChange({ ...item, alternative })} />
        </label>
      </div>
    </li>
  );
}

/** Campo "In alternativa:" con il testo che parte dopo l'etichetta. */
function AlternativeInput({ value, onChange }) {
  const labelRef = useRef(null);
  const [pad, setPad] = useState(96);
  useEffect(() => {
    const label = labelRef.current?.previousSibling;
    if (label?.offsetWidth) setPad(label.offsetWidth + 13);
  }, []);
  return (
    <input
      ref={labelRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      maxLength={120}
      placeholder={t('nessuna')}
      aria-label={t('Alternativa')}
      className={`${fieldCls} text-[13px]`}
      style={{ paddingLeft: pad }}
    />
  );
}

/** Nome dell'alimento con suggerimenti dalla libreria (alimenti e ricette per quel pasto). */
function FoodNameInput({ value, mealType, onChange, onPickFood, onPickRecipe, autoFocus, onFocused }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);
  const listId = useId();
  const items = open ? foodSuggestions(value, mealType) : [];

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
      onFocused?.();
    }
  }, [autoFocus, onFocused]);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => !wrapRef.current?.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  function pick(entry) {
    if (entry.kind === 'food') onPickFood(entry.food);
    else onPickRecipe(entry.recipe);
    setOpen(false);
  }

  function onKeyDown(e) {
    if (!items.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => (i + 1) % items.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (i - 1 + items.length) % items.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      pick(items[active]);
    } else if (e.key === 'Escape') {
      e.stopPropagation();
      setOpen(false);
    }
  }

  const hasRecipes = items.some((i) => i.kind === 'recipe');
  const firstRecipe = items.findIndex((i) => i.kind === 'recipe');

  return (
    <div ref={wrapRef} className="relative">
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActive(0);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={t('Cerca un alimento o una ricetta…')}
        aria-label={t('Alimento')}
        role="combobox"
        aria-expanded={items.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        maxLength={80}
        className={`${fieldCls} pr-[64px] font-medium`}
      />
      {items.length > 0 && (
        <ul id={listId} role="listbox" className="absolute top-full left-0 z-40 mt-1 max-h-80 w-[min(380px,85vw)] overflow-y-auto rounded-xl border border-line bg-surface p-1 shadow-float">
          {items.map((entry, i) => (
            <li key={entry.key} role="option" aria-selected={i === active}>
              {i === firstRecipe && hasRecipes && (
                <p className="px-3 pt-2 pb-1 text-[11px] font-semibold tracking-wide text-ink-400 uppercase">{value.trim() ? t('Ricette') : t('Idee per questo pasto')}</p>
              )}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(entry)}
                onMouseEnter={() => setActive(i)}
                className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm ${i === active ? 'bg-brand-50' : ''}`}
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-soft text-lg leading-none" aria-hidden="true">
                  {entry.emoji}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-ink-900">{nameOf(entry.kind === 'food' ? entry.food : entry.recipe)}</span>
                  <span className="block truncate text-xs text-ink-500">
                    {entry.kind === 'food'
                      ? `${numberToText(entry.food.qty)} ${unitLabel(entry.food.unit)}`
                      : t('Ricetta · {n} alimenti', { n: entry.count })}
                  </span>
                </span>
                <span className="shrink-0 text-xs font-semibold text-brand-800">{fmtNumber(entry.kcal, 0)} kcal</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Calorie e macronutrienti dell'alimento per la quantità indicata (calcolati o inseriti a mano). */
function ValuesPopover({ anchorRef, open, onClose, item, food, onChange }) {
  const fields = [
    ['kcal', t('Calorie'), 'kcal'],
    ['protein', t('Proteine'), 'g'],
    ['carbs', t('Carboidrati'), 'g'],
    ['fat', t('Grassi'), 'g'],
  ];
  const qty = toNumber(item.quantity);
  return (
    <Popover anchorRef={anchorRef} open={open} onClose={onClose} align="end" className="w-72 p-4">
      <p className="text-sm font-semibold">{item.name || t('Alimento')}</p>
      <p className="mt-0.5 text-xs text-ink-500">
        {qty ? t('Valori per {qty} {unit}', { qty: numberToText(qty), unit: unitLabel(item.unit) }) : t('Valori per la quantità indicata')}
        {food && !item.custom && ` · ${t('dalla libreria')}`}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {fields.map(([key, label, unit]) => (
          <label key={key} className="block">
            <span className="mb-1 block text-[11px] text-ink-500">{label}</span>
            <span className="relative block">
              <input
                value={item[key] == null ? '' : numberToText(item[key])}
                onChange={(e) => {
                  const n = toNumber(e.target.value.replace(/[^\d.,]/g, ''));
                  onChange({ ...item, [key]: Number.isNaN(n) ? item[key] : n, custom: true });
                }}
                inputMode="decimal"
                placeholder="0"
                className={`${fieldCls} pr-10`}
              />
              <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-[11px] text-ink-400">{unit}</span>
            </span>
          </label>
        ))}
      </div>
      {food && item.custom && (
        <button type="button" className="mt-3 text-xs font-medium text-brand-800 hover:underline" onClick={() => onChange(withQuantity({ ...item, custom: false }, {}))}>
          {t('Usa i valori della libreria')}
        </button>
      )}
      <p className="mt-3 text-[11px] leading-snug text-ink-400">{t('Valori indicativi: puoi correggerli con quelli dell’etichetta.')}</p>
    </Popover>
  );
}
