import { Apple, ChartNoAxesColumn, Lock, Quote } from 'lucide-react';
import { Avatar } from '../../components/Avatar.jsx';
import { PageHeader } from '../../components/forms.jsx';
import { MeasurementsTable, MetricTiles, MetricTrendCard } from '../../components/progress.jsx';
import { Card, CardHeader, EmptyState, ErrorState, PageLoader } from '../../components/ui.jsx';
import { displayName, fmtDayKey } from '../../lib/format.js';
import { useApi } from '../../lib/useApi.js';
import { ClientPicker, LockedNotice, useClientChoice } from '../pro/proParts.jsx';

// Check nutrizionali registrati dalle nutrizioniste, per i clienti che hanno autorizzato la condivisione.
export default function SharedNutritionPage() {
  const choice = useClientChoice({ onlyShared: true });

  if (choice.loading && !choice.clients.length) return <PageLoader />;
  if (choice.error) return <ErrorState error={choice.error} onRetry={choice.reload} />;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Check nutrizionali"
        subtitle="Controlli registrati dalle nutrizioniste dei tuoi clienti. Visibili solo con il consenso del cliente."
        actions={choice.clients.length > 0 && <ClientPicker clients={choice.clients} value={choice.clientId} onChange={choice.setClientId} />}
      />
      {choice.clients.length === 0 ? (
        <LockedNotice
          title="Nessun cliente ha ancora condiviso i propri dati"
          text="Quando un cliente attiva la condivisione dalla sua sezione Professionisti, qui vedrai i suoi check nutrizionali."
        />
      ) : (
        <SharedChecks key={choice.clientId} clientId={choice.clientId} />
      )}
      {choice.lockedCount > 0 && (
        <p className="flex items-center gap-2 text-xs text-ink-500">
          <Lock className="h-3.5 w-3.5" />
          {choice.lockedCount === 1 ? '1 cliente non ha' : `${choice.lockedCount} clienti non hanno`} autorizzato la condivisione.
        </p>
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
          title="Nessun check nutrizionale"
          text={`Per ${data.client.firstName} non ci sono ancora controlli registrati da una nutrizionista su Wellsyn.`}
        />
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <MetricTiles checkins={checks} startWeight={data.client.startWeightKg} />
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <MetricTrendCard title="Peso ai controlli" icon={ChartNoAxesColumn} checkins={checks} defaultRange="6M" />
        <Card className="p-5">
          <CardHeader icon={Quote} title="Ultime note della nutrizionista" />
          {latestWithNotes ? (
            <div className="mt-4">
              <blockquote className="border-l-2 border-brand-200 pl-3 text-sm text-ink-700 italic">{latestWithNotes.notes}</blockquote>
              <p className="mt-3 flex items-center gap-2 text-xs text-ink-500">
                {latestWithNotes.author && <Avatar user={latestWithNotes.author} size="sm" />}
                {latestWithNotes.author ? displayName(latestWithNotes.author) : 'Nutrizionista'} ·{' '}
                {fmtDayKey(latestWithNotes.day, { day: 'numeric', month: 'long' })}
              </p>
            </div>
          ) : (
            <EmptyState title="Nessuna nota" />
          )}
        </Card>
      </div>
      <Card className="p-5">
        <CardHeader icon={Apple} title="Tutti i check nutrizionali" />
        <div className="mt-4">
          <MeasurementsTable checkins={checks} />
        </div>
      </Card>
    </div>
  );
}
