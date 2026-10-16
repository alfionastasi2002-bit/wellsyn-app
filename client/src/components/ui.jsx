import { ArrowRight, CircleAlert, LoaderCircle } from 'lucide-react';
import { Link } from 'react-router';
import { locale, t, translateMessage } from '../i18n/index.js';

/** Cerchio color menta con un'icona, usato nelle intestazioni delle card. */
export function IconBadge({ icon: Icon, size = 'md', tone = 'brand' }) {
  const sizes = { sm: 'h-9 w-9 [&>svg]:h-4 [&>svg]:w-4', md: 'h-11 w-11 [&>svg]:h-5 [&>svg]:w-5', lg: 'h-14 w-14 [&>svg]:h-6 [&>svg]:w-6' };
  const tones = {
    brand: 'bg-brand-50 text-brand-700',
    solid: 'bg-primary text-white',
    amber: 'bg-amber-50 text-amber-600',
  };
  return (
    <span className={`grid shrink-0 place-items-center rounded-full ${sizes[size]} ${tones[tone]}`}>
      <Icon strokeWidth={2} />
    </span>
  );
}

export function Card({ className = '', children, as: Tag = 'section', ...props }) {
  return (
    <Tag className={`card ${className}`} {...props}>
      {children}
    </Tag>
  );
}

/** Intestazione di una card: icona + titolo + link opzionale a destra. */
export function CardHeader({ icon, title, subtitle, action, className = '' }) {
  return (
    <header className={`flex items-center gap-3 ${className}`}>
      {icon && <IconBadge icon={icon} />}
      <div className="min-w-0 flex-1">
        <h2 className="text-[17px] leading-snug font-semibold text-ink-900">{title}</h2>
        {subtitle && <p className="truncate text-xs text-ink-500">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}

export function ArrowLink({ to, children }) {
  return (
    <Link to={to} className="link-arrow">
      {children} <ArrowRight className="h-3.5 w-3.5" />
    </Link>
  );
}

export function ProgressBar({ value, max = 100, className = '' }) {
  const pct = max ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div
      className={`h-2 overflow-hidden rounded-full bg-track ${className}`}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="h-full rounded-full bg-brand-500 transition-all duration-500" style={{ width: `${pct}%` }} />
    </div>
  );
}

/** Anello di avanzamento (es. 78% allenamenti completati). */
export function ProgressRing({ value, size = 128, stroke = 12, label, sublabel }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value ?? 0));
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e8efed" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-brand-600)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct / 100)}
          className="transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <div className="absolute inset-0 grid place-content-center text-center">
        <span className="font-display text-2xl font-semibold text-ink-900">{label ?? `${pct}%`}</span>
        {sublabel && <span className="mx-auto max-w-[80%] text-[11px] leading-tight text-ink-500">{sublabel}</span>}
      </div>
    </div>
  );
}

/** Selettore periodo 1M / 3M / 6M / 1A. */
export const RANGES = [
  { key: '1M', label: '1M', weeks: 4 },
  { key: '3M', label: '3M', weeks: 13 },
  { key: '6M', label: '6M', weeks: 26 },
  { key: '1A', label: '1A', weeks: 52 },
];

export function RangeTabs({ value, onChange }) {
  return (
    <div className="flex gap-1" role="tablist" aria-label={t('Periodo')}>
      {RANGES.map((r) => (
        <button
          key={r.key}
          type="button"
          role="tab"
          aria-selected={value === r.key}
          onClick={() => onChange(r.key)}
          className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
            value === r.key ? 'bg-brand-50 font-semibold text-brand-800' : 'text-ink-500 hover:bg-hover'
          }`}
        >
          {t(r.label)}
        </button>
      ))}
    </div>
  );
}

export function Spinner({ className = 'h-5 w-5' }) {
  return <LoaderCircle className={`animate-spin text-brand-600 ${className}`} aria-hidden="true" />;
}

export function PageLoader({ label = t('Caricamento…') }) {
  return (
    <div className="grid min-h-[50vh] place-items-center" role="status">
      <div className="flex items-center gap-3 text-ink-500">
        <Spinner /> {label}
      </div>
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="card mx-auto mt-10 max-w-lg p-8 text-center" role="alert">
      <CircleAlert className="mx-auto h-10 w-10 text-amber-500" />
      <h2 className="mt-3 text-lg font-semibold">{t('Qualcosa non ha funzionato')}</h2>
      <p className="mt-1 text-sm text-ink-500">{error?.message ? translateMessage(error.message) : t('Errore sconosciuto.')}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-primary mt-5">
          {t('Riprova')}
        </button>
      )}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, text, children }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-8 text-center">
      {Icon && <IconBadge icon={Icon} />}
      <p className="font-medium text-ink-900">{title}</p>
      {text && <p className="max-w-xs text-sm text-ink-500">{text}</p>}
      {children}
    </div>
  );
}

/** Variazione con freccia colorata: verde se è un miglioramento, ambra se no. */
export function Delta({ value, suffix = '', goodWhen = 'down', digits = 1, className = '' }) {
  if (value == null) return null;
  const good = goodWhen === 'any' || (goodWhen === 'down' ? value <= 0 : value >= 0);
  const sign = value > 0 ? '+' : value < 0 ? '-' : '';
  const abs = new Intl.NumberFormat(locale(), { maximumFractionDigits: digits }).format(Math.abs(value));
  return (
    <span className={`inline-flex items-center gap-0.5 font-semibold ${good ? 'text-brand-600' : 'text-amber-600'} ${className}`}>
      <span aria-hidden="true">{value < 0 ? '↓' : value > 0 ? '↑' : '•'}</span>
      {sign}
      {abs}
      {suffix}
    </span>
  );
}
