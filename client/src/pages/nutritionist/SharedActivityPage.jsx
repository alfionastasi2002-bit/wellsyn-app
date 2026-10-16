import { Lock } from 'lucide-react';
import { PageHeader } from '../../components/forms.jsx';
import { Card, EmptyState, ErrorState, PageLoader, ProgressBar } from '../../components/ui.jsx';
import { t } from '../../i18n/index.js';
import { relativeDay } from '../../lib/format.js';
import { useApi } from '../../lib/useApi.js';
import { ClientDetailHeader, ClientGrid, LockedNotice, StatLine, useClientChoice, WorkoutSection } from '../pro/proParts.jsx';

// Dati di allenamento registrati dai personal trainer, per i clienti che hanno autorizzato la condivisione.
// Senza cliente scelto: elenco dei clienti al centro della pagina; cliccandone uno si apre il suo dettaglio.
export default function SharedActivityPage() {
  const choice = useClientChoice();

  if (choice.loading && !choice.clients.length) return <PageLoader />;
  if (choice.error) return <ErrorState error={choice.error} onRetry={choice.reload} />;

  const shared = choice.clients.filter((c) => c.sharedAccess);
  const lockedCount = choice.clients.length - shared.length;
  const selected = choice.selected?.sharedAccess ? choice.selected : null;

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('Attività fisica')}
        subtitle={t('Allenamenti dei tuoi clienti registrati dai loro personal trainer. Visibili solo con il consenso del cliente.')}
      />
      {selected ? (
        <>
          <ClientDetailHeader item={selected} onBack={() => choice.setClientId('')} />
          <SharedWorkout key={selected.client.id} clientId={selected.client.id} />
        </>
      ) : choice.clients.length === 0 ? (
        <LockedNotice title={t('Nessun cliente attivo')} text={t('Aggiungi un cliente dalla sezione Clienti.')} />
      ) : (
        <>
          {shared.length === 0 && (
            <LockedNotice
              title={t('Nessun cliente ha ancora condiviso i propri dati')}
              text={t('Quando un cliente attiva la condivisione dalla sua sezione Professionisti, qui vedrai costanza e allenamenti svolti.')}
            />
          )}
          <p className="text-sm text-ink-500">{t('Scegli un cliente per vedere costanza, scheda attiva e allenamenti svolti.')}</p>
          <ClientGrid
            clients={choice.clients}
            onOpen={choice.setClientId}
            isLocked={(c) => !c.sharedAccess}
            rank={(c) => (c.workout?.planTitle ? 0 : c.workout?.lastWorkout ? 1 : 2)}
            details={(c) => <ActivitySummary item={c} />}
          />
          {lockedCount > 0 && (
            <p className="flex items-center gap-2 text-xs text-ink-500">
              <Lock className="h-3.5 w-3.5" />
              {lockedCount === 1
                ? t('1 cliente non ha autorizzato la condivisione.')
                : t('{n} clienti non hanno autorizzato la condivisione.', { n: lockedCount })}
            </p>
          )}
        </>
      )}
    </div>
  );
}

function ActivitySummary({ item }) {
  const w = item.workout;
  if (!w?.planTitle && !w?.lastWorkout) return <span className="text-sm text-ink-500">{t('Nessuna scheda attiva con un personal trainer.')}</span>;
  const pct = w.last28.planned ? Math.round((w.last28.completed / w.last28.planned) * 100) : 0;
  return (
    <>
      <StatLine label={t('Scheda')}>{w.planTitle ?? '—'}</StatLine>
      <StatLine label={t('Ultimo allenamento')}>{w.lastWorkout ? relativeDay(w.lastWorkout) : '—'}</StatLine>
      <span className="mt-2 flex items-center gap-3">
        <ProgressBar value={pct} className="flex-1" />
        <span className="text-xs font-semibold text-ink-700">{pct}%</span>
      </span>
      <span className="mt-1 block text-[11px] text-ink-500">
        {t('{done} di {planned} allenamenti nelle ultime 4 settimane', { done: w.last28.completed, planned: w.last28.planned })}
      </span>
    </>
  );
}

function SharedWorkout({ clientId }) {
  const { data, error, loading, reload } = useApi(`/clients/${clientId}/progress`);
  if (loading && !data) return <PageLoader />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (!data.workout || (!data.workout.plan && data.workout.history.length === 0)) {
    return (
      <Card>
        <EmptyState
          title={t('Nessun dato di allenamento')}
          text={t('{name} non ha ancora una scheda attiva con un personal trainer su Wellsyn.', { name: data.client.firstName })}
        />
      </Card>
    );
  }
  return <WorkoutSection workout={data.workout} />;
}
