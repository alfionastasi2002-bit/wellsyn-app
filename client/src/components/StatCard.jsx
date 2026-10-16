import { Link } from 'react-router';
import { IconBadge } from './ui.jsx';

/** Riquadro numerico (es. "Clienti attivi 12 ↑ +2 rispetto al mese scorso"). */
export function StatCard({ icon, label, value, children, to, iconTone }) {
  const body = (
    <>
      <IconBadge icon={icon} size="lg" tone={iconTone} />
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-snug font-medium text-ink-700">{label}</p>
        <p className="mt-1 font-display text-[28px] leading-none font-semibold text-ink-900">{value}</p>
        {children && <p className="mt-1.5 text-xs leading-snug text-ink-500">{children}</p>}
      </div>
    </>
  );
  const className = 'card flex items-center gap-4 p-5 transition';
  return to ? (
    <Link to={to} className={`${className} hover:border-brand-200 hover:shadow-float`}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}
