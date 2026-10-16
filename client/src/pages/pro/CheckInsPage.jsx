import { CalendarDays, ClipboardList, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { Avatar } from '../../components/Avatar.jsx';
import { ConfirmButton, Flash, PageHeader, useFlash } from '../../components/forms.jsx';
import { METRICS } from '../../components/progress.jsx';
import { Card, EmptyState, ErrorState, PageLoader } from '../../components/ui.jsx';
import { t } from '../../i18n/index.js';
import { api } from '../../lib/api.js';
import { fmtDayKey, fmtNumber } from '../../lib/format.js';
import { useApi } from '../../lib/useApi.js';
import { CheckInModal } from './proParts.jsx';

/** Controlli e misurazioni registrati dal professionista (l'agenda ha una sezione sua). */
export default function CheckInsPage() {
  const { data, error, loading, reload, setData } = useApi('/checkins');
  const [open, setOpen] = useState(false);
  const [flash, setFlash] = useFlash();

  if (loading && !data) return <PageLoader />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  async function remove(c) {
    await api(`/checkins/${c.id}`, { method: 'DELETE' });
    setData((d) => ({ checkins: d.checkins.filter((x) => x.id !== c.id) }));
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('Controlli')}
        subtitle={t('Misurazioni e note registrate ai tuoi clienti durante i controlli.')}
        actions={
          <>
            <Link to="/app/agenda" className="btn-outline">
              <CalendarDays className="h-4 w-4" /> {t('Vai all’agenda')}
            </Link>
            <button type="button" className="btn-primary" onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" /> {t('Registra controllo')}
            </button>
          </>
        }
      />
      <Flash>{flash}</Flash>
      <Card className="p-5">
        {data.checkins.length === 0 ? (
          <EmptyState icon={ClipboardList} title={t('Nessun controllo registrato')} text={t('Registra il primo controllo con il pulsante in alto.')} />
        ) : (
          <ul className="divide-y divide-line">
            {data.checkins.map((c) => (
              <li key={c.id} className="flex flex-col gap-3 py-3 md:flex-row md:items-center">
                <div className="flex min-w-0 items-center gap-3 md:w-64">
                  <Avatar user={c.client} />
                  <div className="min-w-0">
                    <Link to={`/app/progressi?cliente=${c.client.id}`} className="truncate font-semibold hover:underline">
                      {c.client.fullName}
                    </Link>
                    <p className="text-xs text-ink-500">{fmtDayKey(c.day, { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                </div>
                <dl className="flex flex-1 flex-wrap gap-x-5 gap-y-1 text-sm">
                  {METRICS.filter((m) => c[m.key] != null).map((m) => (
                    <div key={m.key}>
                      <dt className="text-xs text-ink-500">{m.label}</dt>
                      <dd className="font-medium">
                        {fmtNumber(c[m.key])} {m.unit}
                      </dd>
                    </div>
                  ))}
                  {c.notes && <p className="w-full text-xs text-ink-500 italic">“{c.notes}”</p>}
                </dl>
                <ConfirmButton className="rounded-full p-2 text-ink-400 hover:bg-hover hover:text-ink-700" confirmLabel={t('Elimina')} onConfirm={() => remove(c)}>
                  <Trash2 className="h-4 w-4" aria-label={t('Elimina controllo')} />
                </ConfirmButton>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <CheckInModal
        open={open}
        onClose={() => setOpen(false)}
        onSaved={() => {
          reload();
          setFlash(t('Controllo registrato.'));
        }}
      />
    </div>
  );
}
