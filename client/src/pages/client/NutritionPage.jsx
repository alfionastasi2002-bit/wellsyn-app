import { Check, Flame, MessageCircle, Target, Utensils } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { Avatar } from '../../components/Avatar.jsx';
import { PageHeader, Tabs } from '../../components/forms.jsx';
import { Card, CardHeader, EmptyState, ErrorState, PageLoader, ProgressBar, Spinner } from '../../components/ui.jsx';
import { api } from '../../lib/api.js';
import { displayName, fmtDate, fmtNumber } from '../../lib/format.js';
import { MEAL_META, WEEKDAYS } from '../../lib/labels.js';
import { useApi } from '../../lib/useApi.js';
import { t, translateMessage } from '../../i18n/index.js';

export default function NutritionPage() {
  const { data, error, loading, reload, setData } = useApi('/me/meal-plan');
  const [selectedDay, setSelectedDay] = useState(null);
  const [busy, setBusy] = useState(null);
  const [toggleError, setToggleError] = useState('');

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

  const day = selectedDay ?? todayIndex;
  const isToday = day === todayIndex;
  const meals = plan.days.find((d) => d.dayIndex === day)?.meals ?? [];
  const dayKcal = meals.reduce((sum, m) => sum + (m.kcal ?? 0), 0);
  const done = new Set(todayDone);

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

  return (
    <div className="space-y-5">
      <PageHeader title={t('La mia alimentazione')} subtitle={`${plan.title} · ${t('aggiornato il {date}', { date: fmtDate(plan.updatedAt) })}`} />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <Tabs
            value={day}
            onChange={setSelectedDay}
            tabs={WEEKDAYS.map((w) => ({ value: w.value, label: w.value === todayIndex ? `${w.short} · ${t('Oggi')}` : w.short }))}
          />
          <Card className="p-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">{WEEKDAYS[day - 1].long}{isToday && t(' (oggi)')}</h2>
                <p className="text-sm text-ink-500">
                  {t('{n} pasti', { n: meals.length })}
                  {dayKcal > 0 && ` · ${t('circa {n} kcal', { n: dayKcal })}`}
                </p>
              </div>
              {isToday && meals.length > 0 && (
                <div className="w-44 text-right">
                  <p className="text-xs text-ink-500">
                    {t('{done} di {total} completati', { done: doneToday, total: meals.length })}
                  </p>
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
                  return (
                    <li key={`${meal.type}-${i}`} className="flex gap-4 rounded-2xl border border-line p-4">
                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-warm text-warm-ink">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold tracking-wide text-ink-500 uppercase">{meta.label}</p>
                        <p className="font-semibold">{meal.name}</p>
                        {meal.description && <p className="mt-0.5 text-sm text-ink-700">{meal.description}</p>}
                        {(meal.kcal != null || meal.protein != null) && (
                          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-ink-500">
                            {meal.kcal != null && (
                              <span className="inline-flex items-center gap-1">
                                <Flame className="h-3.5 w-3.5" /> {meal.kcal} kcal
                              </span>
                            )}
                            {meal.protein != null && <span>{t('Proteine')} {fmtNumber(meal.protein, 0)} g</span>}
                            {meal.carbs != null && <span>{t('Carboidrati')} {fmtNumber(meal.carbs, 0)} g</span>}
                            {meal.fat != null && <span>{t('Grassi')} {fmtNumber(meal.fat, 0)} g</span>}
                          </p>
                        )}
                      </div>
                      {isToday && (
                        <button
                          type="button"
                          onClick={() => toggle(meal)}
                          disabled={busy === meal.type}
                          aria-pressed={checked}
                          aria-label={`${meta.label}: ${checked ? t('segna come non consumato') : t('segna come consumato')}`}
                          className={`grid h-8 w-8 shrink-0 place-items-center self-center rounded-full border-2 transition ${
                            checked ? 'border-brand-500 bg-brand-500 text-white' : 'border-ink-300 text-transparent hover:border-brand-400'
                          }`}
                        >
                          {busy === meal.type ? <Spinner className="h-4 w-4" /> : <Check className="h-4 w-4" strokeWidth={3} />}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
            {toggleError && <p className="mt-3 text-sm text-amber-700">{toggleError}</p>}
            {!isToday && <p className="mt-4 text-xs text-ink-500">{t('Puoi spuntare i pasti solo nel giorno corrente.')}</p>}
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="p-5">
            <CardHeader icon={Target} title={t('Il tuo piano')} />
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-ink-500">{t('Piano')}</dt>
                <dd className="text-right font-medium">{plan.title}</dd>
              </div>
              {plan.goal && (
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-500">{t('Obiettivo')}</dt>
                  <dd className="font-medium">{plan.goal}</dd>
                </div>
              )}
              {plan.kcalTarget && (
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-500">{t('Calorie giornaliere')}</dt>
                  <dd className="font-medium">{plan.kcalTarget} kcal</dd>
                </div>
              )}
            </dl>
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
          {plan.guidelines && (
            <Card className="p-5">
              <h2 className="text-[17px] font-semibold">{t('Linee guida')}</h2>
              <p className="mt-2 text-sm leading-relaxed whitespace-pre-line text-ink-700">{plan.guidelines}</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
