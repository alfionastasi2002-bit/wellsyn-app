import { ArrowLeft, ChartNoAxesColumn, ChevronRight, CircleCheck, Dumbbell, Lock, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Avatar } from '../../components/Avatar.jsx';
import { ConsistencyChart, totalPercent } from '../../components/charts.jsx';
import { DatePicker } from '../../components/DatePicker.jsx';
import { ClientSelect, Modal, NumberInput, SaveButton, TextArea, toNumber } from '../../components/forms.jsx';
import { OnOffGrid } from '../../components/progress.jsx';
import { Card, CardHeader, EmptyState, ProgressRing, RANGES, RangeTabs } from '../../components/ui.jsx';
import { t, translateMessage } from '../../i18n/index.js';
import { api } from '../../lib/api.js';
import { relativeDay, todayKey } from '../../lib/format.js';
import { LEVEL_LABELS, WEEKDAYS } from '../../lib/labels.js';
import { useApi } from '../../lib/useApi.js';
import { FormError } from '../auth/fields.jsx';

/**
 * Cliente scelto tramite il parametro ?cliente= nell'indirizzo (così il link si può aprire
 * direttamente dalla lista clienti). Senza parametro la pagina mostra l'elenco dei clienti.
 */
export function useClientChoice() {
  const { data, loading, error, reload } = useApi('/clients/overview');
  const [params, setParams] = useSearchParams();
  const clients = useMemo(() => data?.clients ?? [], [data]);
  const requested = params.get('cliente');
  const selected = clients.find((c) => c.client.id === requested) ?? null;
  const setClientId = (id) => setParams(id ? { cliente: id } : {});
  return { clients, selected, clientId: selected?.client.id ?? '', setClientId, loading, error, reload };
}

/**
 * Elenco dei clienti a schede, al centro della pagina: si cerca per nome e si apre il dettaglio con un clic.
 * isLocked(item) -> cliente non apribile (es. non ha autorizzato la condivisione); details(item) -> righe di riepilogo.
 */
export function ClientGrid({ clients, onOpen, isLocked = () => false, details, lockedText }) {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const visible = clients.filter((c) => !q || c.client.fullName.toLowerCase().includes(q) || (c.program ?? '').toLowerCase().includes(q));
  const open = visible.filter((c) => !isLocked(c));
  const locked = visible.filter((c) => isLocked(c));

  return (
    <div className="space-y-4">
      {clients.length > 6 && (
        <label className="relative block max-w-md">
          <span className="sr-only">{t('Cerca cliente')}</span>
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('Cerca un cliente…')}
            className="w-full rounded-xl border border-line bg-surface py-2.5 pr-3 pl-10 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
          />
        </label>
      )}
      {visible.length === 0 && <p className="text-sm text-ink-500">{t('Nessun cliente corrisponde alla ricerca.')}</p>}
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {open.map((c) => (
          <li key={c.client.id}>
            <button
              type="button"
              onClick={() => onOpen(c.client.id)}
              className="card group flex h-full w-full flex-col p-4 text-left transition hover:border-brand-300 hover:shadow-float"
            >
              <span className="flex items-center gap-3">
                <Avatar user={c.client} size="lg" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{c.client.fullName}</span>
                  <span className="block truncate text-xs text-ink-500">{c.program ? t(c.program) : t('Cliente')}</span>
                </span>
                <ChevronRight className="h-5 w-5 shrink-0 text-ink-300 transition group-hover:translate-x-0.5 group-hover:text-brand-700" />
              </span>
              {details && <span className="mt-4 block border-t border-line pt-3">{details(c)}</span>}
            </button>
          </li>
        ))}
        {locked.map((c) => (
          <li key={c.client.id}>
            <div className="flex h-full flex-col rounded-2xl border border-dashed border-line bg-soft/60 p-4" aria-disabled="true">
              <span className="flex items-center gap-3 opacity-70">
                <Avatar user={c.client} size="lg" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{c.client.fullName}</span>
                  <span className="block truncate text-xs text-ink-500">{c.program ? t(c.program) : t('Cliente')}</span>
                </span>
                <Lock className="h-4 w-4 shrink-0 text-ink-400" />
              </span>
              <span className="mt-4 block border-t border-line pt-3 text-xs text-ink-500">{lockedText ?? t('Non ha autorizzato la condivisione dei dati.')}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Intestazione del dettaglio di un cliente con il ritorno all'elenco. */
export function ClientDetailHeader({ item, onBack, backLabel, children }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" onClick={onBack} className="btn-soft">
        <ArrowLeft className="h-4 w-4" /> {backLabel ?? t('Tutti i clienti')}
      </button>
      <span className="flex min-w-0 items-center gap-3">
        <Avatar user={item.client} />
        <span className="min-w-0">
          <span className="block truncate font-semibold">{item.client.fullName}</span>
          {item.program && <span className="block truncate text-xs text-ink-500">{t(item.program)}</span>}
        </span>
      </span>
      {children && <span className="ml-auto flex flex-wrap gap-2">{children}</span>}
    </div>
  );
}

/** Piccola riga "etichetta: valore" per i riepiloghi delle schede cliente. */
export function StatLine({ label, children }) {
  return (
    <span className="flex items-center justify-between gap-3 py-0.5 text-sm">
      <span className="text-ink-500">{label}</span>
      <span className="truncate font-medium text-ink-900">{children}</span>
    </span>
  );
}

export function LockedNotice({ title, text }) {
  return (
    <Card>
      <EmptyState icon={Lock} title={title} text={text} />
    </Card>
  );
}

/** Dati di allenamento di un cliente: costanza, ultimi 28 giorni, scheda attiva, storico. */
export function WorkoutSection({ workout }) {
  const [range, setRange] = useState('3M');
  const rows = useMemo(() => workout.consistency.slice(-RANGES.find((r) => r.key === range).weeks), [workout, range]);
  const pct28 = workout.last28.planned ? Math.round((workout.last28.completed / workout.last28.planned) * 100) : 0;

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <Card className="p-5">
        <CardHeader icon={ChartNoAxesColumn} title={t('Costanza negli allenamenti')} action={<RangeTabs value={range} onChange={setRange} />} />
        <div className="mt-3 flex flex-col items-center gap-4 sm:flex-row">
          <div className="w-full min-w-0 flex-1">
            <ConsistencyChart data={rows} />
          </div>
          <ProgressRing value={totalPercent(rows)} sublabel={t('Allenamenti completati')} />
        </div>
      </Card>
      <Card className="p-5">
        <CardHeader
          icon={Dumbbell}
          title={t('Ultime 4 settimane')}
          subtitle={t('{done} di {planned} allenamenti previsti ({pct}%)', { done: workout.last28.completed, planned: workout.last28.planned, pct: pct28 })}
        />
        <div className="mt-4">
          <OnOffGrid days={workout.days} />
        </div>
      </Card>
      <Card className="p-5">
        <CardHeader icon={Dumbbell} title={t('Scheda attiva')} />
        {!workout.plan ? (
          <EmptyState title={t('Nessuna scheda attiva')} />
        ) : (
          <div className="mt-3">
            <p className="font-semibold">{workout.plan.title}</p>
            <p className="text-sm text-ink-500">
              {LEVEL_LABELS[workout.plan.level]} · {t('settimana {current} di {total}', { current: workout.plan.currentWeek, total: workout.plan.weeks })}
            </p>
            <ul className="mt-3 space-y-1.5 text-sm">
              {workout.plan.sessions.map((s, i) => (
                <li key={`${s.name}-${i}`} className="flex gap-3">
                  <span className="w-10 shrink-0 font-semibold text-brand-800">{WEEKDAYS.find((w) => w.value === s.dayOfWeek)?.short ?? '—'}</span>
                  <span>{s.name}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>
      <Card className="p-5">
        <CardHeader icon={CircleCheck} title={t('Ultimi allenamenti svolti')} />
        {workout.history.length === 0 ? (
          <EmptyState title={t('Nessun allenamento registrato')} />
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {workout.history.slice(0, 8).map((h) => (
              <li key={h.day} className="flex justify-between gap-3 py-2 text-sm">
                <span className="truncate font-medium">{h.sessionName ?? t('Allenamento')}</span>
                <span className="shrink-0 text-ink-500">{relativeDay(h.day)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

/** Finestra per registrare un controllo/misurazione. clientId fisso oppure scelto nel modulo. */
export function CheckInModal({ open, onClose, onSaved, clientId: fixedClientId }) {
  const empty = { clientId: fixedClientId ?? '', day: todayKey(), weightKg: '', waistCm: '', hipsCm: '', bodyFatPct: '', muscleMassKg: '', notes: '' };
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({ ...empty, clientId: fixedClientId ?? '' });
      setError('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, fixedClientId]);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!form.clientId) return setError(t('Seleziona il cliente.'));
    const metrics = {};
    for (const key of ['weightKg', 'waistCm', 'hipsCm', 'bodyFatPct', 'muscleMassKg']) {
      const n = toNumber(form[key]);
      if (Number.isNaN(n)) return setError(t('Controlla i valori inseriti: usa solo numeri (es. 64,5).'));
      metrics[key] = n;
    }
    setSaving(true);
    try {
      const { checkin } = await api('/checkins', { method: 'POST', body: { clientId: form.clientId, day: form.day, notes: form.notes, ...metrics } });
      onSaved?.(checkin);
      onClose();
    } catch (err) {
      setError(translateMessage(err.message));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('Registra controllo')}
      footer={
        <>
          <button type="button" className="btn-soft" onClick={onClose}>
            {t('Annulla')}
          </button>
          <SaveButton saving={saving} form="checkin-form">
            {t('Salva controllo')}
          </SaveButton>
        </>
      }
    >
      <form id="checkin-form" onSubmit={submit} className="space-y-3" noValidate>
        {!fixedClientId && <ClientSelect value={form.clientId} onChange={(v) => setForm({ ...form, clientId: v })} />}
        <DatePicker label={t('Data del controllo')} max={todayKey()} value={form.day} onChange={(day) => day && setForm({ ...form, day })} />
        <div className="grid grid-cols-2 gap-3">
          <NumberInput label={t('Peso')} suffix="kg" value={form.weightKg} onChange={set('weightKg')} />
          <NumberInput label={t('Massa grassa')} suffix="%" value={form.bodyFatPct} onChange={set('bodyFatPct')} />
          <NumberInput label={t('Massa muscolare')} suffix="kg" value={form.muscleMassKg} onChange={set('muscleMassKg')} />
          <NumberInput label={t('Vita')} suffix="cm" value={form.waistCm} onChange={set('waistCm')} />
          <NumberInput label={t('Fianchi')} suffix="cm" value={form.hipsCm} onChange={set('hipsCm')} />
        </div>
        <TextArea label={t('Note')} rows={3} placeholder={t('Osservazioni, indicazioni per il cliente…')} value={form.notes} onChange={set('notes')} />
        <p className="text-xs text-ink-500">{t('Compila solo le misure che hai rilevato: le altre possono restare vuote.')}</p>
        <FormError>{error}</FormError>
      </form>
    </Modal>
  );
}
