import { Check, Clock, Droplets, FileDown, FileText, Flame, MessageCircle, Target, Utensils } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { Avatar } from '../../components/Avatar.jsx';
import { TargetBar } from '../../components/editor.jsx';
import { PageHeader, Tabs } from '../../components/forms.jsx';
import { PlanPrint } from '../../components/PlanPrint.jsx';
import { RichText } from '../../components/RichText.jsx';
import { Card, CardHeader, EmptyState, ErrorState, PageLoader, ProgressBar, Spinner } from '../../components/ui.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { t, translateMessage } from '../../i18n/index.js';
import { api } from '../../lib/api.js';
import { emojiOf, foodOfItem, goalOf, unitLabel } from '../../lib/foods.js';
import { displayName, fmtDate, fmtNumber } from '../../lib/format.js';
import { MEAL_META, WEEKDAYS } from '../../lib/labels.js';
import { useApi } from '../../lib/useApi.js';

const sum = (meals, key) => meals.reduce((s, m) => s + (m[key] ?? 0), 0);
const quantityText = (i) => (i.unit === 'q.b.' ? unitLabel('q.b.') : i.quantity != null ? `${fmtNumber(i.quantity, i.quantity % 1 ? 1 : 0)} ${unitLabel(i.unit)}` : '');

export default function NutritionPage() {
  const { user } = useAuth();
  const { data, error, loading, reload, setData } = useApi('/me/meal-plan');
  const [selectedDay, setSelectedDay] = useState(null);
  const [busy, setBusy] = useState(null);
  const [toggleError, setToggleError] = useState('');
  const [printing, setPrinting] = useState(false);

  if (loading && !data) return <PageLoader />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const { plan, todayIndex, todayDone } = data;
  if (!plan) {
    return (
      <div className="space-y-5">
        <PageHeader title={t('La mia alimentazione')} />
        <Card>
          <EmptyState
            icon={Utensils}
            title={t('Nessun piano alimentare attivo')}
            text={t('Quando la tua nutrizionista ti assegnerà un piano, lo troverai qui giorno per giorno.')}
          />
        </Card>
      </div>
    );
  }

  const weekly = plan.days.length === 7;
  const day = selectedDay ?? todayIndex ?? 1;
  const isToday = day === todayIndex;
  const meals = plan.days.find((d) => d.dayIndex === day)?.meals ?? [];
  const dayKcal = Math.round(sum(meals, 'kcal'));
  const done = new Set(todayDone);
  const goal = goalOf(plan.goal);
  const dayLabel = (index) => (weekly ? WEEKDAYS[index - 1].long : t('Giorno {n}', { n: index }));

  async function toggle(meal) {
    const next = !done.has(meal.type);
    setBusy(meal.type);
    setToggleError('');
    try {
      await api('/me/meals/today', { method: 'PUT', body: { mealType: meal.type, done: next } });
      setData((d) => ({
        ...d,
        todayDone: next ? [...d.todayDone, meal.type] : d.todayDone.filter((type) => type !== meal.type),
      }));
    } catch (err) {
      setToggleError(translateMessage(err.message));
    } finally {
      setBusy(null);
    }
  }

  const doneToday = meals.filter((m) => done.has(m.type)).length;
  const targets = [
    [t('Proteine'), plan.proteinTarget, sum(meals, 'protein')],
    [t('Carboidrati'), plan.carbsTarget, sum(meals, 'carbs')],
    [t('Grassi'), plan.fatTarget, sum(meals, 'fat')],
  ].filter(([, target]) => target);

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('La mia alimentazione')}
        subtitle={`${plan.title} · ${t('aggiornato il {date}', { date: fmtDate(plan.updatedAt) })}`}
        actions={
          <button type="button" className="btn-outline" onClick={() => setPrinting(true)}>
            <FileDown className="h-4 w-4" /> {t('Scarica PDF')}
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-4">
          <Tabs
            value={day}
            onChange={setSelectedDay}
            tabs={plan.days.map((d) => {
              const label = weekly ? WEEKDAYS[d.dayIndex - 1].short : t('Giorno {n}', { n: d.dayIndex });
              return { value: d.dayIndex, label: d.dayIndex === todayIndex ? `${label} · ${t('Oggi')}` : label };
            })}
          />
          <Card className="p-4 sm:p-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">
                  {dayLabel(day)}
                  {isToday && t(' (oggi)')}
                </h2>
                <p className="text-sm text-ink-500">
                  {t('{n} pasti', { n: meals.length })}
                  {dayKcal > 0 && ` · ${t('circa {n} kcal', { n: fmtNumber(dayKcal, 0) })}`}
                  {dayKcal > 0 && plan.kcalTarget && ` / ${fmtNumber(plan.kcalTarget, 0)}`}
                </p>
              </div>
              {isToday && meals.length > 0 && (
                <div className="w-44 text-right">
                  <p className="text-xs text-ink-500">{t('{done} di {total} completati', { done: doneToday, total: meals.length })}</p>
                  <ProgressBar value={doneToday} max={meals.length} className="mt-1.5" />
                </div>
              )}
            </div>

            {meals.length === 0 ? (
              <EmptyState title={t('Nessun pasto previsto per questo giorno')} />
            ) : (
              <ul className="mt-4 space-y-3">
                {meals.map((meal, i) => {
                  const meta = MEAL_META[meal.type];
                  const Icon = meta.icon;
                  const checked = isToday && done.has(meal.type);
                  const items = meal.items ?? [];
                  return (
                    <li key={`${meal.type}-${i}`} className={`rounded-2xl border p-4 transition ${checked ? 'border-brand-200 bg-brand-50/40' : 'border-line'}`}>
                      <div className="flex items-center gap-3">
                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-700">
                          <Icon className="h-5 w-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-display text-[17px] font-semibold">{(meal.label && t(meal.label)) || meta.label}</p>
                          <p className="flex flex-wrap items-center gap-x-3 text-[13px] text-ink-500">
                            {(meal.start || meal.end) && (
                              <span className="inline-flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" /> {[meal.start, meal.end].filter(Boolean).join(' - ')}
                              </span>
                            )}
                            {meal.kcal != null && (
                              <span className="inline-flex items-center gap-1">
                                <Flame className="h-3.5 w-3.5" /> {fmtNumber(meal.kcal, 0)} kcal
                              </span>
                            )}
                          </p>
                        </div>
                        {isToday && (
                          <button
                            type="button"
                            onClick={() => toggle(meal)}
                            disabled={busy === meal.type}
                            aria-pressed={checked}
                            aria-label={`${(meal.label && t(meal.label)) || meta.label}: ${checked ? t('segna come non consumato') : t('segna come consumato')}`}
                            className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 transition ${
                              checked ? 'border-brand-500 bg-brand-500 text-white' : 'border-ink-300 text-transparent hover:border-brand-400'
                            }`}
                          >
                            {busy === meal.type ? <Spinner className="h-4 w-4" /> : <Check className="h-4 w-4" strokeWidth={3} />}
                          </button>
                        )}
                      </div>

                      {items.length > 0 ? (
                        <ul className="mt-3 divide-y divide-line/70 sm:pl-14">
                          {items.map((item, j) => (
                            <li key={j} className="flex items-center gap-3 py-2">
                              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-soft text-lg leading-none" aria-hidden="true">
                                {emojiOf(foodOfItem(item))}
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium">{item.name}</p>
                                {item.alternative && <p className="text-xs text-ink-500">{t('In alternativa:')} {item.alternative}</p>}
                              </div>
                              <span className="shrink-0 text-sm font-semibold text-ink-700">{quantityText(item)}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        // Piani creati prima degli alimenti: piatto e descrizione
                        <div className="mt-2 sm:pl-14">
                          <p className="font-medium">{meal.name}</p>
                          {meal.description && <p className="mt-0.5 text-sm text-ink-700">{meal.description}</p>}
                        </div>
                      )}
                      {meal.note && (
                        <p className="mt-2 flex items-start gap-2 rounded-lg bg-soft px-3 py-2 text-[13px] text-ink-700 sm:ml-14">
                          <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-400" /> {meal.note}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
            {toggleError && <p className="mt-3 text-sm text-amber-700">{toggleError}</p>}
            {!isToday && <p className="mt-4 text-xs text-ink-500">{t('Puoi spuntare i pasti solo nel giorno corrente.')}</p>}
          </Card>

          {plan.intro && (
            <Card className="p-5">
              <h2 className="text-[17px] font-semibold">{t('Introduzione e obiettivi del piano')}</h2>
              <RichText html={plan.intro} className="mt-2 text-[15px] leading-relaxed text-ink-700" />
            </Card>
          )}
        </div>

        <div className="space-y-5">
          <Card className="p-5">
            <CardHeader icon={Target} title={t('Il tuo piano')} />
            {plan.goal && (
              <div className="mt-4 rounded-xl bg-soft p-3">
                <p className="text-sm font-semibold">{goal?.label ?? plan.goal}</p>
                {goal && <p className="mt-0.5 text-[13px] text-ink-700">{goal.text}</p>}
              </div>
            )}
            {(plan.kcalTarget || targets.length > 0) && (
              <div className="mt-4 space-y-3">
                <p className="text-xs font-semibold tracking-wide text-ink-500 uppercase">{t('Oggi rispetto ai fabbisogni')}</p>
                {plan.kcalTarget && (
                  <div>
                    <p className="flex justify-between text-sm">
                      <span>{t('Calorie')}</span>
                      <span className="font-medium">
                        {fmtNumber(dayKcal, 0)} / {fmtNumber(plan.kcalTarget, 0)} kcal
                      </span>
                    </p>
                    <TargetBar value={dayKcal} target={plan.kcalTarget} className="mt-1" />
                  </div>
                )}
                {targets.map(([label, target, value]) => (
                  <div key={label}>
                    <p className="flex justify-between text-sm">
                      <span>{label}</span>
                      <span className="font-medium">
                        {fmtNumber(value, 0)} / {fmtNumber(target, 0)} g
                      </span>
                    </p>
                    <TargetBar value={value} target={target} className="mt-1" />
                  </div>
                ))}
              </div>
            )}
            {plan.waterLiters && (
              <p className="mt-4 flex items-center gap-2 text-sm">
                <Droplets className="h-4 w-4 text-sky-500" />
                {t('Bevi almeno {n} L di acqua al giorno', { n: fmtNumber(plan.waterLiters) })}
              </p>
            )}
            {plan.nutritionist && (
              <div className="mt-5 flex items-center gap-3 rounded-xl bg-soft p-3">
                <Avatar user={plan.nutritionist} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{displayName(plan.nutritionist)}</p>
                  <p className="text-xs text-ink-500">{plan.nutritionist.specialization ?? t('Nutrizionista')}</p>
                </div>
                <Link to={`/app/notifiche?con=${plan.nutritionist.id}`} className="btn-outline px-3 py-1.5" aria-label={t('Scrivi alla nutrizionista')}>
                  <MessageCircle className="h-4 w-4" />
                </Link>
              </div>
            )}
          </Card>
          {plan.notes?.length > 0 && (
            <Card className="p-5">
              <h2 className="text-[17px] font-semibold">{t('Note e preferenze')}</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-700">
                {plan.notes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            </Card>
          )}
          {plan.guidelines && !plan.intro && (
            <Card className="p-5">
              <h2 className="text-[17px] font-semibold">{t('Linee guida')}</h2>
              <p className="mt-2 text-sm leading-relaxed whitespace-pre-line text-ink-700">{plan.guidelines}</p>
            </Card>
          )}
        </div>
      </div>

      {printing && (
        <PlanPrint
          plan={plan}
          people={{ client: displayName(user), nutritionist: plan.nutritionist && displayName(plan.nutritionist) }}
          onDone={() => setPrinting(false)}
        />
      )}
    </div>
  );
}
