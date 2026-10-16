import { Apple, ChartNoAxesColumn, Lock, Quote } from 'lucide-react';
import { Avatar } from '../../components/Avatar.jsx';
import { PageHeader } from '../../components/forms.jsx';
import { MeasurementsTable, MetricTiles, MetricTrendCard } from '../../components/progress.jsx';
import { Card, CardHeader, EmptyState, ErrorState, PageLoader } from '../../components/ui.jsx';
import { t } from '../../i18n/index.js';
import { displayName, fmtDayKey, fmtNumber, relativeDay } from '../../lib/format.js';
import { useApi } from '../../lib/useApi.js';
import { ClientDetailHeader, ClientGrid, LockedNotice, StatLine, useClientChoice } from '../pro/proParts.jsx';

// Check nutrizionali registrati dalle nutrizioniste, per i clienti che hanno autorizzato la condivisione.
export default function SharedNutritionPage() {
  const choice = useClientChoice();

  if (choice.loading && !choice.clients.length) return <PageLoader />;
  if (choice.error) return <ErrorState error={choice.error} onRetry={choice.reload} />;

  const shared = choice.clients.filter((c) => c.sharedAccess);
  const lockedCount = choice.clients.length - shared.length;
  const selected = choice.selected?.sharedAccess ? choice.selected : null;

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('Check nutrizionali')}
        subtitle={t('Controlli registrati dalle nutrizioniste dei tuoi clienti. Visibili solo con il consenso del cliente.')}
      />
      {selected ? (
        <>
          <ClientDetailHeader item={selected} onBack={() => choice.setClientId('')} />
          <SharedChecks key={selected.client.id} clientId={selected.client.id} />
        </>
      ) : choice.clients.length === 0 ? (
        <LockedNotice title={t('Nessun cliente attivo')} text={t('Aggiungi un cliente dalla sezione Clienti.')} />
      ) : (
        <>
          {shared.length === 0 && (
            <LockedNotice
              title={t('Nessun cliente ha ancora condiviso i propri dati')}
              text={t('Quando un cliente attiva la condivisione dalla sua sezione Professionisti, qui vedrai i suoi check nutrizionali.')}
            />
          )}
          <p className="text-sm text-ink-500">{t('Scegli un cliente per vedere i suoi check nutrizionali.')}</p>
          <ClientGrid
            clients={choice.clients}
            onOpen={choice.setClientId}
            isLocked={(c) => !c.sharedAccess}
            details={(c) => (
              <>
                <StatLine label={t('Check nutrizionali')}>{c.nutrition?.count ?? 0}</StatLine>
                <StatLine label={t('Ultimo check')}>{c.nutrition ? relativeDay(c.nutrition.lastDay) : '—'}</StatLine>
                <StatLine label={t('Peso attuale')}>{c.weight ? `${fmtNumber(c.weight.current)} kg` : '—'}</StatLine>
              </>
            )}
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

function SharedChecks({ clientId }) {
  const { data, error, loading, reload } = useApi(`/clients/${clientId}/progress`);
  if (loading && !data) return <PageLoader />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const checks = data.checkins.filter((c) => c.source === 'nutritionist');
  const latestWithNotes = [...checks].reverse().find((c) => c.notes);

  if (!checks.length) {
    return (
      <Card>
        <EmptyState
          icon={Apple}
          title={t('Nessun check nutrizionale')}
          text={t('Per {name} non ci sono ancora controlli registrati da una nutrizionista su Wellsyn.', { name: data.client.firstName })}
        />
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <MetricTiles checkins={checks} startWeight={data.client.startWeightKg} />
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <MetricTrendCard title={t('Peso ai controlli')} icon={ChartNoAxesColumn} checkins={checks} defaultRange="6M" />
        <Card className="p-5">
          <CardHeader icon={Quote} title={t('Ultime note della nutrizionista')} />
          {latestWithNotes ? (
            <div className="mt-4">
              <blockquote className="border-l-2 border-brand-200 pl-3 text-sm text-ink-700 italic">{latestWithNotes.notes}</blockquote>
              <p className="mt-3 flex items-center gap-2 text-xs text-ink-500">
                {latestWithNotes.author && <Avatar user={latestWithNotes.author} size="sm" />}
                {latestWithNotes.author ? displayName(latestWithNotes.author) : t('Nutrizionista')} ·{' '}
                {fmtDayKey(latestWithNotes.day, { day: 'numeric', month: 'long' })}
              </p>
            </div>
          ) : (
            <EmptyState title={t('Nessuna nota')} />
          )}
        </Card>
      </div>
      <Card className="p-5">
        <CardHeader icon={Apple} title={t('Tutti i check nutrizionali')} />
        <div className="mt-4">
          <MeasurementsTable checkins={checks} />
        </div>
      </Card>
    </div>
  );
}
