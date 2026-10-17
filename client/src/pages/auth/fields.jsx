import { Dumbbell, Eye, EyeOff, UserRound, Utensils } from 'lucide-react';
import { useState } from 'react';
import { localized, t } from '../../i18n/index.js';

export const ROLE_OPTIONS = [
  Object.assign(localized({ label: 'Cliente' }), { value: 'client', icon: UserRound }),
  Object.assign(localized({ label: 'Nutrizionista' }), { value: 'nutritionist', icon: Utensils }),
  Object.assign(localized({ label: 'Personal Trainer' }), { value: 'trainer', icon: Dumbbell }),
];

/** Selettore del profilo: Cliente / Nutrizionista / Personal Trainer. */
export function RolePicker({ value, onChange }) {
  return (
    <div role="radiogroup" aria-label={t('Tipo di profilo')} className="flex gap-1 rounded-full border border-line bg-soft/70 p-1">
      {ROLE_OPTIONS.map(({ value: v, label, icon: Icon }) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={value === v}
          onClick={() => onChange(v)}
          className={`flex min-w-0 flex-auto items-center justify-center gap-1.5 rounded-full px-2 py-2 text-center text-[13px] leading-tight font-medium transition sm:gap-2 sm:px-3 sm:py-2.5 sm:text-sm sm:whitespace-nowrap short:py-2 tiny:py-1.5 ${
            value === v ? 'bg-surface text-brand-800 shadow-card ring-1 ring-brand-200' : 'text-ink-700 hover:bg-surface/70'
          }`}
        >
          {/* Icone solo dove c'è spazio: così il selettore non esce mai dalla scheda */}
          <Icon className={`hidden h-4.5 w-4.5 shrink-0 sm:block lg:hidden xl:block ${value === v ? 'fill-brand-700/15' : ''}`} strokeWidth={1.9} />
          <span className="min-w-0">{label}</span>
        </button>
      ))}
    </div>
  );
}

/**
 * Campo con icona a sinistra. Normale: etichetta piccola sopra il valore.
 * pill: campo arrotondato con il solo segnaposto, come nel mockup del login (l'etichetta resta per i lettori di schermo).
 */
export function Field({ icon: Icon, label, trailing, pill = false, placeholder, ...inputProps }) {
  if (pill) {
    return (
      <label className="flex items-center gap-3.5 rounded-full border border-line bg-soft/70 px-5 py-3.5 transition focus-within:border-brand-500 focus-within:bg-surface focus-within:ring-4 focus-within:ring-brand-100 short:py-3 tiny:py-2">
        {Icon && <Icon className="h-5 w-5 shrink-0 text-ink-700" strokeWidth={1.8} />}
        <span className="sr-only">{label}</span>
        <input className="w-full min-w-0 bg-transparent text-[15px] text-ink-900 outline-none placeholder:text-ink-500" placeholder={placeholder ?? label} {...inputProps} />
        {trailing}
      </label>
    );
  }
  return (
    <label className="flex items-center gap-4 rounded-xl border border-line bg-surface px-4 py-2.5 short:py-1.5 tiny:py-1 transition focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-100">
      {Icon && <Icon className="h-5 w-5 shrink-0 text-ink-700" strokeWidth={1.8} />}
      <span className="min-w-0 flex-1">
        <span className="block text-xs text-ink-500">{label}</span>
        <input className="w-full bg-transparent text-[15px] text-ink-900 outline-none placeholder:text-ink-300" placeholder={placeholder} {...inputProps} />
      </span>
      {trailing}
    </label>
  );
}

export function PasswordField({ icon, label, ...props }) {
  const [visible, setVisible] = useState(false);
  return (
    <Field
      icon={icon}
      label={label ?? t('Password')}
      type={visible ? 'text' : 'password'}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="-my-1 rounded-full p-1.5 text-ink-700 hover:bg-hover"
          aria-label={visible ? t('Nascondi password') : t('Mostra password')}
        >
          {visible ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
        </button>
      }
      {...props}
    />
  );
}

export function FormError({ children }) {
  if (!children) return null;
  return (
    <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      {children}
    </p>
  );
}
