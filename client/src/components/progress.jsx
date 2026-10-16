import { Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { CHECK_SOURCE } from '../lib/labels.js';
import { displayName, fmtDayKey, fmtNumber } from '../lib/format.js';
import { TrendChart } from './charts.jsx';
import { Card, CardHeader, Delta, EmptyState, RANGES, RangeTabs } from './ui.jsx';
import { ConfirmButton } from './forms.jsx';

export const METRICS = [
  { key: 'weightKg', label: 'Peso', unit: 'kg', goodWhen: 'any' },
  { key: 'waistCm', label: 'Vita', unit: 'cm', goodWhen: 'down' },
  { key: 'hipsCm', label: 'Fianchi', unit: 'cm', goodWhen: 'down' },
  { key: 'bodyFatPct', label: 'Massa grassa', unit: '%', goodWhen: 'down' },
  { key: 'muscleMassKg', label: 'Massa muscolare', unit: 'kg', goodWhen: 'up' },
];

/** Ultimo valore, primo valore e variazione di una misura. checkins in ordine cronologico. */
export function metricSummary(checkins, key) {
  const values = checkins.filter((c) => c[key] != null);
  const last = values.at(-1);
  const first = values[0];
  const previous = values.at(-2);
  return {
    last: last?.[key] ?? null,
    lastDay: last?.day ?? null,
    first: first?.[key] ?? null,
    changeFromStart: last && first ? Math.round((last[key] - first[key]) * 10) / 10 : null,
    changeFromPrevious: last && previous ? Math.round((last[key] - previous[key]) * 10) / 10 : null,
  };
}

const sinceDay = (weeks) => new Date(Date.now() - weeks * 7 * 86400000).toISOString().slice(0, 10);

/** Grafico dell'andamento di una misura con selettore del periodo. */
export function MetricTrendCard({ title, icon, checkins, metric = 'weightKg', unit = 'kg', defaultRange = '3M', action }) {
  const [range, setRange] = useState(defaultRange);
  const points = useMemo(() => {
    const from = sinceDay(RANGES.find((r) => r.key === range).weeks);
    return checkins.filter((c) => c[metric] != null && c.day >= from).map((c) => ({ day: c.day, value: c[metric] }));
  }, [checkins, metric, range]);
  return (
    <Card className="p-5">
      <CardHeader icon={icon} title={title} action={<RangeTabs value={range} onChange={setRange} />} />
      <div className="mt-2">
        <TrendChart data={points} unit={unit} />
      </div>
      {action}
    </Card>
  );
}

/** Riquadri con l'ultimo valore delle misure principali. */
export function MetricTiles({ checkins, startWeight }) {
  const weight = metricSummary(checkins, 'weightKg');
  const fromStart = weight.last != null && startWeight != null ? Math.round((weight.last - startWeight) * 10) / 10 : weight.changeFromStart;
  const tiles = [
    { label: 'Peso attuale', value: weight.last, unit: 'kg', delta: fromStart, deltaLabel: "dall'inizio", goodWhen: 'any' },
    ...METRICS.slice(1).map((m) => {
      const s = metricSummary(checkins, m.key);
      return { label: m.label, value: s.last, unit: m.unit, delta: s.changeFromPrevious, deltaLabel: 'dal precedente', goodWhen: m.goodWhen };
    }),
  ];
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
      {tiles.map((t) => (
        <div key={t.label} className="card p-4">
          <p className="text-xs font-medium text-ink-500">{t.label}</p>
          <p className="mt-1 font-display text-2xl font-semibold">
            {t.value == null ? '—' : fmtNumber(t.value)} {t.value != null && <span className="text-sm">{t.unit}</span>}
          </p>
          {t.delta != null && (
            <p className="mt-0.5 text-xs text-ink-500">
              <Delta value={t.delta} suffix={t.unit === '%' ? '%' : ` ${t.unit}`} goodWhen={t.goodWhen} /> {t.deltaLabel}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

/** Tabella di tutte le misurazioni (le più recenti in alto). */
export function MeasurementsTable({ checkins, canDelete, onDelete, meLabel }) {
  const rows = [...checkins].reverse();
  if (!rows.length) return <EmptyState title="Nessuna misurazione" text="Le misurazioni registrate compariranno qui." />;
  return (
    <div className="relative overflow-x-auto">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="text-left text-[11px] tracking-wider text-ink-500 uppercase">
            <th className="pb-2 font-medium">Data</th>
            <th className="pb-2 font-medium">Registrato da</th>
            {METRICS.map((m) => (
              <th key={m.key} className="pb-2 text-right font-medium">
                {m.label} ({m.unit})
              </th>
            ))}
            <th className="pb-2">
              <span className="sr-only">Azioni</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((c) => (
            <tr key={c.id} className="align-top">
              <td className="py-2.5 whitespace-nowrap">{fmtDayKey(c.day, { day: 'numeric', month: 'short', year: 'numeric' })}</td>
              <td className="py-2.5 text-ink-700">
                {c.source === 'self' ? (meLabel ?? CHECK_SOURCE.self) : c.author ? displayName(c.author) : CHECK_SOURCE[c.source]}
                {c.notes && <p className="mt-0.5 max-w-[260px] text-xs text-ink-500 italic">“{c.notes}”</p>}
              </td>
              {METRICS.map((m) => (
                <td key={m.key} className="py-2.5 text-right tabular-nums">
                  {c[m.key] == null ? <span className="text-ink-300">—</span> : fmtNumber(c[m.key])}
                </td>
              ))}
              <td className="py-1.5 text-right">
                {canDelete?.(c) && (
                  <ConfirmButton className="rounded-full p-2 text-ink-400 hover:bg-[#f1f5f4] hover:text-ink-700" confirmLabel="Elimina" onConfirm={() => onDelete(c)}>
                    <Trash2 className="h-4 w-4" aria-label="Elimina misurazione" />
                  </ConfirmButton>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Calendario ON/OFF degli ultimi giorni (allenamenti svolti). */
export function OnOffGrid({ days }) {
  return (
    <div>
      <ol className="grid grid-cols-7 gap-1.5">
        {days.map((d) => (
          <li
            key={d.day}
            title={`${fmtDayKey(d.day, { weekday: 'long', day: 'numeric', month: 'long' })}: ${d.on ? 'allenamento svolto' : 'nessun allenamento'}`}
            className={`flex h-10 flex-col items-center justify-center rounded-lg text-[11px] ${d.on ? 'bg-brand-500 font-semibold text-white' : 'bg-[#eef2f1] text-ink-500'}`}
          >
            <span>{fmtDayKey(d.day, { day: 'numeric' })}</span>
            <span className="text-[9px] uppercase opacity-80">{fmtDayKey(d.day, { weekday: 'short' }).replace('.', '').slice(0, 3)}</span>
          </li>
        ))}
      </ol>
      <p className="mt-2 flex gap-4 text-xs text-ink-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-brand-500" /> Allenamento svolto
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#dfe6e4]" /> Nessun allenamento
        </span>
      </p>
    </div>
  );
}
