import { Dumbbell, UserRound, Utensils } from 'lucide-react';
import { ROLE_LABELS } from '../lib/format.js';

// Simbolo di ciascun profilo (gli stessi della scelta del profilo nel login).
export const ROLE_ICONS = { client: UserRound, nutritionist: Utensils, trainer: Dumbbell };

/**
 * Simbolo del profilo di chi è entrato (in cima al menu laterale): cerchio con l'icona e, sotto, il nome del profilo.
 * compact = solo il cerchio (menu ridotto alle icone).
 */
export function RoleSymbol({ role, compact = false, className = '' }) {
  const Icon = ROLE_ICONS[role] ?? UserRound;
  return (
    <span className={`flex flex-col items-center gap-2.5 ${className}`}>
      <span
        className={`grid place-items-center rounded-full bg-gradient-to-br from-brand-100 to-brand-300 text-brand-800 shadow-card ring-4 ring-brand-50 ${
          compact ? 'h-11 w-11' : 'h-[72px] w-[72px]'
        }`}
      >
        <Icon className={compact ? 'h-5 w-5' : 'h-8 w-8'} strokeWidth={1.8} />
      </span>
      {!compact && <span className="font-display text-[17px] font-semibold text-ink-900">{ROLE_LABELS[role]}</span>}
    </span>
  );
}
