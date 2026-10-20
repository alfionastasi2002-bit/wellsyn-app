import { Link } from 'react-router';
import { IconBadge } from './ui.jsx';

/**
 * Riquadro numerico (es. "Clienti attivi 12 ↑ +2 rispetto al mese scorso").
 * Sui telefoni stanno due per riga: icona sopra e testo sotto, più compatti.
 */
export function StatCard({ icon, label, value, children, to, iconTone }) {
  const body = (
    <>
      <IconBadge icon={icon} size="lg" tone={iconTone} className="max-sm:h-10 max-sm:w-10 max-sm:[&>svg]:h-5 max-sm:[&>svg]:w-5" />
      <div className="min-w-0 flex-1">
        <p className="text-[13px] leading-snug font-medium text-ink-700 sm:text-sm">{label}</p>
        <p className="mt-1 font-display text-2xl leading-none font-semibold text-ink-900 sm:text-[28px]">{value}</p>
        {children && <p className="mt-1.5 text-[11px] leading-snug text-ink-500 sm:text-xs">{children}</p>}
      </div>
    </>
  );
  const className = 'card flex flex-col items-start gap-2.5 p-4 transition sm:flex-row sm:items-center sm:gap-4 sm:p-5';
  return to ? (
    <Link to={to} className={`${className} hover:border-brand-200 hover:shadow-float`}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}
