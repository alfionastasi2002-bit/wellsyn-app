import { CalendarPlus, ChartNoAxesColumn, ClipboardList, Dumbbell, Lock, LockOpen, MessageCircle, Plus, Scale, Users, Utensils } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { Avatar } from '../../components/Avatar.jsx';
import { Flash, PageHeader, useFlash } from '../../components/forms.jsx';
import { MeasurementsTable, MetricTiles, MetricTrendCard } from '../../components/progress.jsx';
import { Card, CardHeader, Delta, EmptyState, ErrorState, PageLoader } from '../../components/ui.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { t } from '../../i18n/index.js';
import { api } from '../../lib/api.js';
import { fmtDate, fmtNumber, relativeDay } from '../../lib/format.js';
import { useApi } from '../../lib/useApi.js';
import { CheckInModal, ClientDetailHeader, ClientGrid, LockedNotice, StatLine, useClientChoice, WorkoutSection } from './proParts.jsx';

export default function ClientProgressPage() {
  const choice = useClientChoice();

  if (choice.loading && !choice.clients.length) return <PageLoader />;
  if (choice.error) return <ErrorState error={choice.error} onRetry={choice.reload} />;

  return (
    <div className="space-y-5">
      <PageHeader title={t('Progressi')} subtitle={t('Misure, composizione corporea e costanza di ogni cliente.')} />
      {choice.clients.length === 0 ? (
        <Card>
          <EmptyState icon={Users} title={t('Nessun cliente attivo')} text={t('Aggiungi un cliente dalla sezione Clienti per vederne i progressi.')}>
            <Link to="/app/clienti" className="btn-primary mt-2">
              {t('Vai ai clienti')}
            </Link>
          </EmptyState>
        </Card>
      ) : choice.selected ? (
        <>
          <ClientDetailHeader item={choice.selected} onBack={() => choice.setClientId('')} />
          <ClientProgress key={choice.clientId} clientId={choice.clientId} />
        </>
      ) : (
        <>
          <p className="text-sm text-ink-500">{t('Scegli un cliente per vedere misure, andamento e costanza.')}</p>
          <ClientGrid
            clients={choice.clients}
            onOpen={choice.setClientId}
            details={(c) => (
              <>
                <span className="flex items-center justify-between gap-3 py-0.5 text-sm">
                  <span className="text-ink-500">{t('Peso')}</span>
                  <span className="font-medium">
                    {c.weight ? `${fmtNumber(c.weight.current)} kg` : '—'}
                    {c.weight && c.weight.first !== c.weight.current && (
                      <Delta value={Math.round((c.weight.current - c.weight.first) * 10) / 10} suffix=" kg" goodWhen="any" className="ml-2 text-xs" />
                    )}
                  </span>
                </span>
                <StatLine label={t('Ultima misura')}>{c.lastCheck ? relativeDay(c.lastCheck) : '—'}</StatLine>
                <StatLine label={t('Condivisione')}>
                  {c.sharedAccess ? (
                    <span className="inline-flex items-center gap-1 text-brand-800">
                      <LockOpen className="h-3.5 w-3.5" /> {t('Attiva')}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-ink-500">
                      <Lock className="h-3.5 w-3.5" /> {t('Non attiva')}
                    </span>
                  )}
                </StatLine>
              </>
            )}
          />
        </>
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
              {link.program && <span className="font-medium">{t(link.program)}</span>}
              {link.program && ' · '}
              {t('seguito dal {date}', { date: fmtDate(link.since) })}
              {client.heightCm && ` · ${client.heightCm} cm`}
            </p>
            {client.goal && <p className="mt-1 text-sm text-ink-700">{t('Obiettivo: {goal}', { goal: client.goal })}</p>}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${link.sharedAccess ? 'bg-brand-50 text-brand-800' : 'bg-hover text-ink-500'}`}>
            {link.sharedAccess ? <LockOpen className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
            {link.sharedAccess ? t('Dati di team condivisi') : t('Condivisione non autorizzata')}
          </span>
          <Link to={`/app/messaggi?con=${client.id}`} className="btn-soft">
            <MessageCircle className="h-4 w-4" /> {t('Scrivi')}
          </Link>
          <Link to={`/app/agenda?nuovo=1&cliente=${client.id}`} className="btn-soft">
            <CalendarPlus className="h-4 w-4" /> {t('Fissa appuntamento')}
          </Link>
          {isTrainer ? (
            <Link to={workout?.plan ? `/app/schede/${workout.plan.id}` : `/app/schede/nuova?cliente=${client.id}`} className="btn-outline">
              <Dumbbell className="h-4 w-4" /> {workout?.plan ? t('Apri scheda') : t('Crea scheda')}
            </Link>
          ) : (
            <Link to={mealPlan ? `/app/piani-alimentari/${mealPlan.id}` : `/app/piani-alimentari/nuovo?cliente=${client.id}`} className="btn-outline">
              <Utensils className="h-4 w-4" /> {mealPlan ? t('Apri piano') : t('Crea piano')}
            </Link>
          )}
          <button type="button" className="btn-primary" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> {t('Registra controllo')}
          </button>
        </div>
      </Card>
      <Flash>{flash}</Flash>

      <MetricTiles checkins={checkins} startWeight={client.startWeightKg} />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <MetricTrendCard title={t('Andamento del peso')} icon={ChartNoAxesColumn} checkins={checkins} />
        {checkins.some((c) => c.bodyFatPct != null) ? (
          <MetricTrendCard title={t('Massa grassa')} icon={Scale} checkins={checkins} metric="bodyFatPct" unit="%" defaultRange="6M" />
        ) : (
          <MetricTrendCard title={t('Massa muscolare')} icon={Scale} checkins={checkins} metric="muscleMassKg" unit="kg" defaultRange="6M" />
        )}
      </div>

      <Card className="p-5">
        <CardHeader
          icon={ClipboardList}
          title={t('Storico misurazioni')}
          subtitle={
            link.sharedAccess
              ? t('I tuoi controlli, quelli degli altri professionisti del cliente e le sue pesate')
              : t('I tuoi controlli e le pesate del cliente')
          }
        />
        <div className="mt-4">
          <MeasurementsTable
            checkins={checkins}
            meLabel={t('{name} (pesata)', { name: client.firstName })}
            canDelete={(c) => c.author?.id === user.id}
            onDelete={remove}
          />
        </div>
      </Card>

      <h2 className="pt-2 text-lg font-semibold">{t('Allenamenti')}</h2>
      {workout ? (
        <WorkoutSection workout={workout} />
      ) : (
        <LockedNotice
          title={t('Dati di allenamento non condivisi')}
          text={t('{name} non ha ancora autorizzato la condivisione dei dati del suo personal trainer.', { name: client.firstName })}
        />
      )}

      <CheckInModal
        open={open}
        clientId={client.id}
        onClose={() => setOpen(false)}
        onSaved={() => {
          reload();
          setFlash(t('Controllo registrato.'));
        }}
      />
    </div>
  );
}
