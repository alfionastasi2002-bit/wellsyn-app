import { ChartNoAxesColumn, CircleCheck, Dumbbell, Lock } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { ConsistencyChart, totalPercent } from '../../components/charts.jsx';
import { ClientSelect, Modal, NumberInput, SaveButton, SelectInput, TextArea, TextInput, toNumber } from '../../components/forms.jsx';
import { OnOffGrid } from '../../components/progress.jsx';
import { Card, CardHeader, EmptyState, ProgressRing, RANGES, RangeTabs } from '../../components/ui.jsx';
import { FormError } from '../auth/fields.jsx';
import { api } from '../../lib/api.js';
import { relativeDay, todayKey } from '../../lib/format.js';
import { LEVEL_LABELS, WEEKDAYS } from '../../lib/labels.js';
import { useApi } from '../../lib/useApi.js';

/**
 * Scelta del cliente tramite il parametro ?cliente= nell'indirizzo
 * (così il link si può aprire direttamente dalla lista clienti).
 * onlyShared: solo i clienti che hanno autorizzato la condivisione.
 */
export function useClientChoice({ onlyShared = false } = {}) {
  const { data, loading, error, reload } = useApi('/clients');
  const [params, setParams] = useSearchParams();
  const clients = useMemo(
    () => (data?.clients ?? []).filter((c) => c.status === 'active' && (!onlyShared || c.sharedAccess)),
    [data, onlyShared],
  );
  const requested = params.get('cliente');
  const clientId = clients.some((c) => c.client.id === requested) ? requested : (clients[0]?.client.id ?? '');
  const setClientId = (id) => setParams(id ? { cliente: id } : {}, { replace: true });
  const lockedCount = (data?.clients ?? []).filter((c) => c.status === 'active' && !c.sharedAccess).length;
  return { clients, clientId, setClientId, loading, error, reload, lockedCount };
}

export function ClientPicker({ clients, value, onChange }) {
  return (
    <SelectInput label="Cliente" value={value} onChange={(e) => onChange(e.target.value)} className="w-full sm:w-80">
      {clients.map((c) => (
        <option key={c.client.id} value={c.client.id}>
          {c.client.fullName}
        </option>
      ))}
    </SelectInput>
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
        <CardHeader icon={ChartNoAxesColumn} title="Costanza negli allenamenti" action={<RangeTabs value={range} onChange={setRange} />} />
        <div className="mt-3 flex flex-col items-center gap-4 sm:flex-row">
          <div className="w-full min-w-0 flex-1">
            <ConsistencyChart data={rows} />
          </div>
          <ProgressRing value={totalPercent(rows)} sublabel="Allenamenti completati" />
        </div>
      </Card>
      <Card className="p-5">
        <CardHeader icon={Dumbbell} title="Ultime 4 settimane" subtitle={`${workout.last28.completed} di ${workout.last28.planned} allenamenti previsti (${pct28}%)`} />
        <div className="mt-4">
          <OnOffGrid days={workout.days} />
        </div>
      </Card>
      <Card className="p-5">
        <CardHeader icon={Dumbbell} title="Scheda attiva" />
        {!workout.plan ? (
          <EmptyState title="Nessuna scheda attiva" />
        ) : (
          <div className="mt-3">
            <p className="font-semibold">{workout.plan.title}</p>
            <p className="text-sm text-ink-500">
              {LEVEL_LABELS[workout.plan.level]} · settimana {workout.plan.currentWeek} di {workout.plan.weeks}
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
        <CardHeader icon={CircleCheck} title="Ultimi allenamenti svolti" />
        {workout.history.length === 0 ? (
          <EmptyState title="Nessun allenamento registrato" />
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {workout.history.slice(0, 8).map((h) => (
              <li key={h.day} className="flex justify-between gap-3 py-2 text-sm">
                <span className="truncate font-medium">{h.sessionName ?? 'Allenamento'}</span>
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
    if (!form.clientId) return setError('Seleziona il cliente.');
    const metrics = {};
    for (const key of ['weightKg', 'waistCm', 'hipsCm', 'bodyFatPct', 'muscleMassKg']) {
      const n = toNumber(form[key]);
      if (Number.isNaN(n)) return setError('Controlla i valori inseriti: usa solo numeri (es. 64,5).');
      metrics[key] = n;
    }
    setSaving(true);
    try {
      const { checkin } = await api('/checkins', { method: 'POST', body: { clientId: form.clientId, day: form.day, notes: form.notes, ...metrics } });
      onSaved?.(checkin);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Registra controllo"
      footer={
        <>
          <button type="button" className="btn-soft" onClick={onClose}>
            Annulla
          </button>
          <SaveButton saving={saving} form="checkin-form">
            Salva controllo
          </SaveButton>
        </>
      }
    >
      <form id="checkin-form" onSubmit={submit} className="space-y-3" noValidate>
        {!fixedClientId && <ClientSelect value={form.clientId} onChange={(v) => setForm({ ...form, clientId: v })} />}
        <TextInput label="Data del controllo" type="date" max={todayKey()} value={form.day} onChange={set('day')} />
        <div className="grid grid-cols-2 gap-3">
          <NumberInput label="Peso" suffix="kg" value={form.weightKg} onChange={set('weightKg')} />
          <NumberInput label="Massa grassa" suffix="%" value={form.bodyFatPct} onChange={set('bodyFatPct')} />
          <NumberInput label="Massa muscolare" suffix="kg" value={form.muscleMassKg} onChange={set('muscleMassKg')} />
          <NumberInput label="Vita" suffix="cm" value={form.waistCm} onChange={set('waistCm')} />
          <NumberInput label="Fianchi" suffix="cm" value={form.hipsCm} onChange={set('hipsCm')} />
        </div>
        <TextArea label="Note" rows={3} placeholder="Osservazioni, indicazioni per il cliente…" value={form.notes} onChange={set('notes')} />
        <p className="text-xs text-ink-500">Compila solo le misure che hai rilevato: le altre possono restare vuote.</p>
        <FormError>{error}</FormError>
      </form>
    </Modal>
  );
}
