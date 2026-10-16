import { Dumbbell, Eye, EyeOff, UserRound, Utensils } from 'lucide-react';
import { useState } from 'react';

export const ROLE_OPTIONS = [
  { value: 'client', label: 'Cliente', icon: UserRound },
  { value: 'nutritionist', label: 'Nutrizionista', icon: Utensils },
  { value: 'trainer', label: 'Personal Trainer', icon: Dumbbell },
];

/** Selettore del profilo: Cliente / Nutrizionista / Personal Trainer. */
export function RolePicker({ value, onChange }) {
  return (
    <div role="radiogroup" aria-label="Tipo di profilo" className="grid grid-cols-3 gap-1 rounded-2xl border border-line bg-white p-1.5">
      {ROLE_OPTIONS.map(({ value: v, label, icon: Icon }) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={value === v}
          onClick={() => onChange(v)}
          className={`flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2.5 short:py-1.5 text-xs font-medium transition sm:flex-row sm:gap-2 sm:text-sm tiny:py-1 tiny:text-xs ${
            value === v ? 'bg-brand-50 text-brand-800' : 'text-ink-700 hover:bg-[#f4f8f7]'
          }`}
        >
          <Icon className={`h-5 w-5 shrink-0 tiny:hidden ${value === v ? 'fill-brand-700/15' : ''}`} strokeWidth={1.9} />
          <span className="leading-tight">{label}</span>
        </button>
      ))}
    </div>
  );
}

/** Campo con icona a sinistra ed etichetta piccola sopra il valore (stile mockup). */
export function Field({ icon: Icon, label, trailing, ...inputProps }) {
  return (
    <label className="flex items-center gap-4 rounded-xl border border-line bg-white px-4 py-2.5 short:py-1.5 tiny:py-1 transition focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-100">
      {Icon && <Icon className="h-5 w-5 shrink-0 text-ink-700" strokeWidth={1.8} />}
      <span className="min-w-0 flex-1">
        <span className="block text-xs text-ink-500">{label}</span>
        <input className="w-full bg-transparent text-[15px] text-ink-900 outline-none placeholder:text-ink-300" {...inputProps} />
      </span>
      {trailing}
    </label>
  );
}

export function PasswordField({ icon, label = 'Password', ...props }) {
  const [visible, setVisible] = useState(false);
  return (
    <Field
      icon={icon}
      label={label}
      type={visible ? 'text' : 'password'}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="rounded-full p-1.5 text-ink-500 hover:bg-[#f1f5f4]"
          aria-label={visible ? 'Nascondi password' : 'Mostra password'}
        >
          {visible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
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
