import { Archive, CircleCheck, CopyPlus, Pencil, Plus, RotateCcw, Search, Trash2, Utensils } from 'lucide-react';
import { lazy, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { Avatar } from '../../components/Avatar.jsx';
import { ConfirmButton, Flash, PageHeader, StatusPill, Tabs } from '../../components/forms.jsx';
import { Card, EmptyState, ErrorState, PageLoader } from '../../components/ui.jsx';
import { t } from '../../i18n/index.js';
import { api } from '../../lib/api.js';
import { fmtDate } from '../../lib/format.js';
import { PLAN_STATUS } from '../../lib/labels.js';
import { useApi } from '../../lib/useApi.js';
// L'editor si carica solo quando si apre un piano
const MealPlanEditor = lazy(() => import('./MealPlanEditor.jsx'));

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
                {/* Su telefono le azioni secondarie mostrano solo l'icona */}
                <div className="flex flex-wrap gap-2">
                  <Link to={`/app/piani-alimentari/${p.id}`} className="btn-outline">
                    <Pencil className="h-4 w-4" /> {t('Modifica')}
                  </Link>
                  <Link to={`/app/piani-alimentari/nuovo?da=${p.id}`} className="btn-soft max-sm:px-3" title={t('Usa questo piano come base per un altro cliente')}>
                    <CopyPlus className="h-4 w-4" /> <span className="max-sm:sr-only">{t('Duplica')}</span>
                  </Link>
                  {p.needsReview && (
                    <button type="button" className="btn-soft max-sm:px-3" onClick={() => patch(p, { needsReview: false })}>
                      <CircleCheck className="h-4 w-4" /> <span className="max-sm:sr-only">{t('Revisionato')}</span>
                    </button>
                  )}
                  {p.status === 'archived' ? (
                    <button type="button" className="btn-soft max-sm:px-3" onClick={() => patch(p, { status: 'active' })}>
                      <RotateCcw className="h-4 w-4" /> <span className="max-sm:sr-only">{t('Riattiva')}</span>
                    </button>
                  ) : (
                    <button type="button" className="btn-soft max-sm:px-3" onClick={() => patch(p, { status: 'archived' })}>
                      <Archive className="h-4 w-4" /> <span className="max-sm:sr-only">{t('Archivia')}</span>
                    </button>
                  )}
                  {p.status !== 'active' && (
                    <ConfirmButton className="btn-soft max-sm:px-3" confirmLabel={t('Elimina')} onConfirm={() => remove(p)}>
                      <Trash2 className="h-4 w-4" /> <span className="max-sm:sr-only">{t('Elimina')}</span>
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
