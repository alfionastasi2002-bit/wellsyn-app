import { ChartNoAxesColumn, ClipboardList, Dumbbell, Lock, LockOpen, MessageCircle, Plus, Scale, Users, Utensils } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { Avatar } from '../../components/Avatar.jsx';
import { Flash, PageHeader, useFlash } from '../../components/forms.jsx';
import { MeasurementsTable, MetricTiles, MetricTrendCard } from '../../components/progress.jsx';
import { Card, CardHeader, EmptyState, ErrorState, PageLoader } from '../../components/ui.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../lib/api.js';
import { fmtDate } from '../../lib/format.js';
import { useApi } from '../../lib/useApi.js';
import { CheckInModal, ClientPicker, LockedNotice, useClientChoice, WorkoutSection } from './proParts.jsx';

export default function ClientProgressPage() {
  const choice = useClientChoice();

  if (choice.loading && !choice.clients.length) return <PageLoader />;
  if (choice.error) return <ErrorState error={choice.error} onRetry={choice.reload} />;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Progressi"
        subtitle="Misure, composizione corporea e costanza di ogni cliente."
        actions={choice.clients.length > 0 && <ClientPicker clients={choice.clients} value={choice.clientId} onChange={choice.setClientId} />}
      />
      {choice.clients.length === 0 ? (
        <Card>
          <EmptyState icon={Users} title="Nessun cliente attivo" text="Aggiungi un cliente dalla sezione Clienti per vederne i progressi.">
            <Link to="/app/clienti" className="btn-primary mt-2">
              Vai ai clienti
            </Link>
          </EmptyState>
        </Card>
      ) : (
        <ClientProgress key={choice.clientId} clientId={choice.clientId} />
      )}
    </div>
  );
}

function ClientProgress({ clientId }) {
  const { user } = useAuth();
  const { data, error, loading, reload, setData } = useApi(`/clients/${clientId}/progress`);
  const [open, setOpen] = useState(false);
  const [flash, setFlash] = useFlash();

  if (loading && !data) return <PageLoader />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const { client, link, checkins, workout, mealPlan } = data;
  const isTrainer = user.role === 'trainer';

  async function remove(c) {
    await api(`/checkins/${c.id}`, { method: 'DELETE' });
    setData((d) => ({ ...d, checkins: d.checkins.filter((x) => x.id !== c.id) }));
  }

  return (
    <div className="space-y-5">
      <Card className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <Avatar user={client} size="xl" />
          <div className="min-w-0">
            <h2 className="font-display text-xl font-semibold">{client.fullName}</h2>
            <p className="truncate text-sm text-ink-500">{client.email}</p>
            <p className="mt-1 text-sm text-ink-700">
              {link.program && <span className="font-medium">{link.program}</span>}
              {link.program && ' · '}
              seguito dal {fmtDate(link.since)}
              {client.heightCm && ` · ${client.heightCm} cm`}
            </p>
            {client.goal && <p className="mt-1 text-sm text-ink-700">Obiettivo: {client.goal}</p>}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${link.sharedAccess ? 'bg-brand-50 text-brand-800' : 'bg-[#f1f5f4] text-ink-500'}`}>
            {link.sharedAccess ? <LockOpen className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
            {link.sharedAccess ? 'Dati di team condivisi' : 'Condivisione non autorizzata'}
          </span>
          <Link to={`/app/messaggi?con=${client.id}`} className="btn-soft">
            <MessageCircle className="h-4 w-4" /> Scrivi
          </Link>
          {isTrainer ? (
            <Link to={workout?.plan ? `/app/schede/${workout.plan.id}` : `/app/schede/nuova?cliente=${client.id}`} className="btn-outline">
              <Dumbbell className="h-4 w-4" /> {workout?.plan ? 'Apri scheda' : 'Crea scheda'}
            </Link>
          ) : (
            <Link to={mealPlan ? `/app/piani-alimentari/${mealPlan.id}` : `/app/piani-alimentari/nuovo?cliente=${client.id}`} className="btn-outline">
              <Utensils className="h-4 w-4" /> {mealPlan ? 'Apri piano' : 'Crea piano'}
            </Link>
          )}
          <button type="button" className="btn-primary" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Registra controllo
          </button>
        </div>
      </Card>
      <Flash>{flash}</Flash>

      <MetricTiles checkins={checkins} startWeight={client.startWeightKg} />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <MetricTrendCard title="Andamento del peso" icon={ChartNoAxesColumn} checkins={checkins} />
        {checkins.some((c) => c.bodyFatPct != null) ? (
          <MetricTrendCard title="Massa grassa" icon={Scale} checkins={checkins} metric="bodyFatPct" unit="%" defaultRange="6M" />
        ) : (
          <MetricTrendCard title="Massa muscolare" icon={Scale} checkins={checkins} metric="muscleMassKg" unit="kg" defaultRange="6M" />
        )}
      </div>

      <Card className="p-5">
        <CardHeader
          icon={ClipboardList}
          title="Storico misurazioni"
          subtitle={
            link.sharedAccess
              ? 'I tuoi controlli, quelli degli altri professionisti del cliente e le sue pesate'
              : 'I tuoi controlli e le pesate del cliente'
          }
        />
        <div className="mt-4">
          <MeasurementsTable checkins={checkins} meLabel={`${client.firstName} (pesata)`} canDelete={(c) => c.author?.id === user.id} onDelete={remove} />
        </div>
      </Card>

      <h2 className="pt-2 text-lg font-semibold">Allenamenti</h2>
      {workout ? (
        <WorkoutSection workout={workout} />
      ) : (
        <LockedNotice
          title="Dati di allenamento non condivisi"
          text={`${client.firstName} non ha ancora autorizzato la condivisione dei dati del suo personal trainer.`}
        />
      )}

      <CheckInModal
        open={open}
        clientId={client.id}
        onClose={() => setOpen(false)}
        onSaved={() => {
          reload();
          setFlash('Controllo registrato.');
        }}
      />
    </div>
  );
}
