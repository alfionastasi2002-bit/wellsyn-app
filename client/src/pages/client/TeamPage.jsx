import { Check, Lock, LockOpen, MapPin, MessageCircle, ShieldCheck, UserRound, Video, X } from 'lucide-react';
import { useState } from 'react';
import { Link, useOutletContext } from 'react-router';
import { Avatar } from '../../components/Avatar.jsx';
import { Card, EmptyState, ErrorState, PageLoader, Spinner } from '../../components/ui.jsx';
import { api } from '../../lib/api.js';
import { displayName, fmtDate, ROLE_LABELS } from '../../lib/format.js';
import { useApi } from '../../lib/useApi.js';
import { t } from '../../i18n/index.js';

// Cosa vede in più un professionista quando il cliente autorizza la condivisione.
const SHARING_DETAILS = {
  nutritionist: 'Potrà vedere i dati di allenamento registrati dal tuo personal trainer: giorni di allenamento e aderenza alla scheda.',
  trainer: 'Potrà vedere i check registrati dalla tua nutrizionista: peso, composizione corporea e note.',
};

export default function TeamPage() {
  const { data, error, loading, reload, setData } = useApi('/team');
  const { refreshCounters } = useOutletContext();

  if (loading && !data) return <PageLoader />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const pending = data.team.filter((x) => x.status === 'pending');
  const active = data.team.filter((x) => x.status === 'active');

  async function update(linkId, body) {
    const { link } = await api(`/team/${linkId}`, { method: 'PATCH', body });
    setData((d) => ({
      team: link.status === 'revoked' ? d.team.filter((x) => x.linkId !== linkId) : d.team.map((x) => (x.linkId === linkId ? link : x)),
    }));
    refreshCounters();
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-3xl font-semibold">{t('I tuoi professionisti')}</h1>
        <p className="mt-1 max-w-2xl text-sm text-ink-500">
          {t('Ogni professionista lavora in modo indipendente. Sei tu a decidere se possono vedere anche i dati raccolti dagli altri membri del tuo team, e puoi cambiare idea in qualsiasi momento.')}
        </p>
      </header>

      {pending.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">{t('Richieste in attesa')}</h2>
          {pending.map((x) => (
            <PendingCard key={x.linkId} item={x} onUpdate={update} />
          ))}
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{t('Il tuo team')}</h2>
        {active.length === 0 ? (
          <Card>
            <EmptyState icon={UserRound} title={t('Nessun professionista collegato')} text={t('Quando un professionista ti aggiungerà con la tua email, troverai qui la sua richiesta.')} />
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {active.map((x) => (
              <ActiveCard key={x.linkId} item={x} onUpdate={update} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function ProfessionalInfo({ item }) {
  const p = item.professional;
  return (
    <div className="flex items-center gap-4">
      <Avatar user={p} size="xl" />
      <div className="min-w-0">
        <p className="font-display text-lg font-semibold">{displayName(p)}</p>
        <p className="text-sm text-ink-500">{p.specialization ?? ROLE_LABELS[item.role]}</p>
        {(p.yearsExperience != null || p.city || p.onlineSessions) && (
          <p className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-ink-500">
            {p.yearsExperience != null && <span>{t('{n} anni di esperienza', { n: p.yearsExperience })}</span>}
            {p.city && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {p.city}
              </span>
            )}
            {p.onlineSessions && (
              <span className="inline-flex items-center gap-1">
                <Video className="h-3 w-3" /> {t('Anche online')}
              </span>
            )}
          </p>
        )}
        {p.bio && <p className="mt-1 text-[13px] text-ink-500">{p.bio}</p>}
        {p.specialties?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {p.specialties.map((s) => (
              <span key={s} className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-800">
                {s}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function useAction(onUpdate, linkId) {
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState('');
  async function run(key, body) {
    setBusy(key);
    setError('');
    try {
      await onUpdate(linkId, body);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  }
  return { busy, error, run };
}

function PendingCard({ item, onUpdate }) {
  const { busy, error, run } = useAction(onUpdate, item.linkId);
  return (
    <Card className="flex flex-col gap-4 border-amber-200 p-5 md:flex-row md:items-center">
      <div className="flex-1">
        <ProfessionalInfo item={item} />
        <p className="mt-3 text-sm text-ink-700">
          {item.program
            ? t('Vuole seguirti come {role} per il percorso “{program}”.', { role: ROLE_LABELS[item.role], program: t(item.program) })
            : t('Vuole seguirti come {role}.', { role: ROLE_LABELS[item.role] })}
        </p>
        {error && <p className="mt-2 text-sm text-amber-700">{error}</p>}
      </div>
      <div className="flex gap-2">
        <button type="button" className="btn-soft" disabled={busy} onClick={() => run('decline', { action: 'decline' })}>
          {busy === 'decline' ? <Spinner className="h-4 w-4" /> : <X className="h-4 w-4" />} {t('Rifiuta')}
        </button>
        <button type="button" className="btn-primary px-5 py-2" disabled={busy} onClick={() => run('accept', { action: 'accept' })}>
          {busy === 'accept' ? <Spinner className="h-4 w-4 text-white" /> : <Check className="h-4 w-4" />} {t('Accetta')}
        </button>
      </div>
    </Card>
  );
}

function ActiveCard({ item, onUpdate }) {
  const { busy, error, run } = useAction(onUpdate, item.linkId);
  const [confirming, setConfirming] = useState(false);

  return (
    <Card className="flex flex-col p-5">
      <ProfessionalInfo item={item} />
      <p className="mt-3 text-xs text-ink-500">
        {t('Collegato dal {date}', { date: fmtDate(item.since) })}
        {item.program && ` · ${t('Percorso: {name}', { name: t(item.program) })}`}
      </p>

      <div className="mt-4 rounded-xl bg-soft p-4">
        <div className="flex items-start gap-3">
          {item.sharedAccess ? <LockOpen className="mt-0.5 h-5 w-5 text-brand-700" /> : <Lock className="mt-0.5 h-5 w-5 text-ink-500" />}
          <div className="flex-1">
            <p className="text-sm font-semibold">{t('Condividi i dati del mio team')}</p>
            <p className="mt-0.5 text-[13px] text-ink-500">{t(SHARING_DETAILS[item.role])}</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={item.sharedAccess}
            aria-label={t('Condivisione dati con {name}', { name: displayName(item.professional) })}
            disabled={busy === 'share'}
            onClick={() => run('share', { sharedAccess: !item.sharedAccess })}
            className={`relative h-7 w-12 shrink-0 rounded-full transition ${item.sharedAccess ? 'bg-brand-600' : 'bg-ink-300'}`}
          >
            <span className={`absolute top-1 left-1 h-5 w-5 rounded-full bg-surface shadow transition-transform ${item.sharedAccess ? 'translate-x-5' : ''}`} />
          </button>
        </div>
      </div>
      {error && <p className="mt-2 text-sm text-amber-700">{error}</p>}

      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 text-xs text-ink-500">
          <ShieldCheck className="h-4 w-4 text-brand-600" /> {t('I tuoi dati restano tuoi')}
        </span>
        {confirming ? (
          <span className="flex gap-2">
            <button type="button" className="btn-soft" onClick={() => setConfirming(false)}>{t('Annulla')}</button>
            <button type="button" className="btn-primary bg-danger px-4 py-2 hover:bg-danger-strong" disabled={busy} onClick={() => run('revoke', { action: 'revoke' })}>
              {t('Conferma')}
            </button>
          </span>
        ) : (
          <span className="flex flex-wrap items-center gap-3">
            <Link to={`/app/notifiche?con=${item.professional.id}`} className="btn-outline">
              <MessageCircle className="h-4 w-4" /> {t('Scrivi')}
            </Link>
            <button type="button" className="text-sm font-medium text-ink-500 hover:text-ink-900" onClick={() => setConfirming(true)}>
              {t('Interrompi collaborazione')}
            </button>
          </span>
        )}
      </div>
    </Card>
  );
}
