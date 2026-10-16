import { Lock } from 'lucide-react';
import { PageHeader } from '../../components/forms.jsx';
import { Card, EmptyState, ErrorState, PageLoader } from '../../components/ui.jsx';
import { useApi } from '../../lib/useApi.js';
import { ClientPicker, LockedNotice, useClientChoice, WorkoutSection } from '../pro/proParts.jsx';

// Dati di allenamento registrati dai personal trainer, per i clienti che hanno autorizzato la condivisione.
export default function SharedActivityPage() {
  const choice = useClientChoice({ onlyShared: true });

  if (choice.loading && !choice.clients.length) return <PageLoader />;
  if (choice.error) return <ErrorState error={choice.error} onRetry={choice.reload} />;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Attività fisica"
        subtitle="Allenamenti dei tuoi clienti registrati dai loro personal trainer. Visibili solo con il consenso del cliente."
        actions={choice.clients.length > 0 && <ClientPicker clients={choice.clients} value={choice.clientId} onChange={choice.setClientId} />}
      />
      {choice.clients.length === 0 ? (
        <LockedNotice
          title="Nessun cliente ha ancora condiviso i propri dati"
          text="Quando un cliente attiva la condivisione dalla sua sezione Professionisti, qui vedrai costanza e allenamenti svolti."
        />
      ) : (
        <SharedWorkout key={choice.clientId} clientId={choice.clientId} />
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

function SharedWorkout({ clientId }) {
  const { data, error, loading, reload } = useApi(`/clients/${clientId}/progress`);
  if (loading && !data) return <PageLoader />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (!data.workout || (!data.workout.plan && data.workout.history.length === 0)) {
    return (
      <Card>
        <EmptyState
          title="Nessun dato di allenamento"
          text={`${data.client.firstName} non ha ancora una scheda attiva con un personal trainer su Wellsyn.`}
        />
      </Card>
    );
  }
  return <WorkoutSection workout={data.workout} />;
}
