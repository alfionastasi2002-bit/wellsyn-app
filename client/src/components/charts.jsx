import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { fmtDayKey, fmtNumber } from '../lib/format.js';

const AXIS = { fontSize: 11, fill: '#8a94a6' };
const monthLabel = (key) => {
  const label = fmtDayKey(key, { month: 'short' });
  return label[0].toUpperCase() + label.slice(1).replace('.', '');
};

/** Mostra un'etichetta per mese: tick sul primo punto di ogni mese. */
function monthTicks(keys) {
  const seen = new Set();
  return keys.filter((k) => {
    const m = k.slice(0, 7);
    if (seen.has(m)) return false;
    seen.add(m);
    return true;
  });
}

function TooltipBox({ active, payload, unit, digits }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-lg border border-line bg-white px-3 py-2 text-xs shadow-card">
      <p className="font-semibold text-ink-900">
        {fmtNumber(p.value, digits)} {unit}
      </p>
      <p className="text-ink-500">{fmtDayKey(p.day, { day: 'numeric', month: 'short', year: 'numeric' })}</p>
    </div>
  );
}

function Callout({ viewBox, value, sub }) {
  if (!viewBox) return null;
  const { x, y } = viewBox;
  return (
    <g transform={`translate(${Math.max(x - 84, 4)},${y - 56})`}>
      <rect width="80" height="42" rx="8" fill="white" stroke="#e5ecea" />
      <text x="40" y="18" textAnchor="middle" fontSize="13" fontWeight="600" fill="#172233">
        {value}
      </text>
      <text x="40" y="33" textAnchor="middle" fontSize="10" fill="#667085">
        {sub}
      </text>
    </g>
  );
}

/** Grafico ad area (andamento del peso o di altre misure). data: [{ day, value }] */
export function TrendChart({ data, unit = 'kg', digits = 1, height = 190 }) {
  if (!data.length) {
    return <p className="grid h-[160px] place-items-center text-sm text-ink-500">Nessuna misurazione nel periodo.</p>;
  }
  const values = data.map((d) => d.value);
  const min = Math.floor(Math.min(...values) - 1);
  const max = Math.ceil(Math.max(...values) + 1);
  const last = data.at(-1);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 56, right: 12, bottom: 0, left: -18 }}>
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#35a08a" stopOpacity={0.28} />
            <stop offset="100%" stopColor="#35a08a" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="#eef2f1" />
        <XAxis
          dataKey="day"
          ticks={monthTicks(data.map((d) => d.day))}
          tickFormatter={monthLabel}
          tick={AXIS}
          axisLine={false}
          tickLine={false}
        />
        <YAxis domain={[min, max]} tick={AXIS} axisLine={false} tickLine={false} tickCount={4} />
        <Tooltip content={<TooltipBox unit={unit} digits={digits} />} cursor={{ stroke: '#c4e7da' }} />
        <Area type="monotone" dataKey="value" stroke="#1e8576" strokeWidth={2} fill="url(#trendFill)" dot={false} />
        <ReferenceLine x={last.day} stroke="#97d4c0" strokeDasharray="3 3" />
        <ReferenceDot
          x={last.day}
          y={last.value}
          r={5}
          fill="#0f5a53"
          stroke="white"
          strokeWidth={2}
          label={<Callout value={`${fmtNumber(last.value, digits)} ${unit}`} sub={fmtDayKey(last.day)} />}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function ConsistencyTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-lg border border-line bg-white px-3 py-2 text-xs shadow-card">
      <p className="font-semibold text-ink-900">{p.pct}% completati</p>
      <p className="text-ink-500">
        {p.completed} di {p.planned} · sett. del {fmtDayKey(p.week)}
      </p>
    </div>
  );
}

/** Barre settimanali della costanza negli allenamenti. data: [{ week, completed, planned }] */
export function ConsistencyChart({ data, height = 170 }) {
  if (!data.length) {
    return <p className="grid h-[150px] place-items-center text-sm text-ink-500">Nessun allenamento registrato.</p>;
  }
  const rows = data.map((d) => {
    const pct = d.planned ? Math.round((d.completed / d.planned) * 100) : 0;
    return { ...d, day: d.week, pct, rest: 100 - pct };
  });
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={rows} margin={{ top: 8, right: 4, bottom: 0, left: -18 }} barCategoryGap="22%">
        <XAxis
          dataKey="day"
          ticks={monthTicks(rows.map((r) => r.day))}
          tickFormatter={monthLabel}
          tick={AXIS}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[0, 100]}
          ticks={[0, 50, 100]}
          tickFormatter={(v) => `${v}%`}
          tick={AXIS}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<ConsistencyTooltip />} cursor={{ fill: '#f1f6f4' }} />
        <Bar dataKey="pct" stackId="a" fill="#35a08a" radius={[0, 0, 3, 3]} />
        <Bar dataKey="rest" stackId="a" fill="#e6eeeb" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function totalPercent(rows) {
  const planned = rows.reduce((s, r) => s + r.planned, 0);
  const completed = rows.reduce((s, r) => s + r.completed, 0);
  return planned ? Math.round((completed / planned) * 100) : 0;
}
