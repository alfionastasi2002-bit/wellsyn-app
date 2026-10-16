import { ArrowLeft, X } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router';
import { useApi } from '../lib/useApi.js';
import { Spinner } from './ui.jsx';
import { getLanguage, t } from '../i18n/index.js';

/** Converte il testo di un campo numerico ("64,5") in numero; vuoto → null. */
export function toNumber(value) {
  if (value === '' || value == null) return null;
  const n = Number(String(value).replace(',', '.'));
  return Number.isFinite(n) ? n : NaN;
}
/** Numero → testo per i campi del modulo (virgola decimale in italiano, punto in inglese). */
export const numberToText = (n) => (n == null ? '' : getLanguage() === 'en' ? String(n) : String(n).replace('.', ','));

const fieldClass =
  'w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[15px] text-ink-900 outline-none transition placeholder:text-ink-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-100 disabled:bg-soft disabled:text-ink-500';

function FieldShell({ label, hint, className = '', children, id }) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink-700">
          {label}
        </label>
      )}
      {children}
      {hint && <p className="mt-1 text-xs text-ink-500">{hint}</p>}
    </div>
  );
}

export function TextInput({ label, hint, className, ...props }) {
  const id = useId();
  return (
    <FieldShell label={label} hint={hint} className={className} id={id}>
      <input id={id} className={fieldClass} {...props} />
    </FieldShell>
  );
}

/** Campo numerico che accetta anche la virgola come separatore decimale. */
export function NumberInput({ label, hint, className, suffix, ...props }) {
  const id = useId();
  return (
    <FieldShell label={label} hint={hint} className={className} id={id}>
      <div className="relative">
        <input id={id} type="text" inputMode="decimal" className={`${fieldClass} ${suffix ? 'pr-12' : ''}`} {...props} />
        {suffix && <span className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-sm text-ink-500">{suffix}</span>}
      </div>
    </FieldShell>
  );
}

export function TextArea({ label, hint, className, rows = 3, ...props }) {
  const id = useId();
  return (
    <FieldShell label={label} hint={hint} className={className} id={id}>
      <textarea id={id} rows={rows} className={`${fieldClass} resize-y`} {...props} />
    </FieldShell>
  );
}

export function SelectInput({ label, hint, className, children, ...props }) {
  const id = useId();
  return (
    <FieldShell label={label} hint={hint} className={className} id={id}>
      <select id={id} className={`${fieldClass} pr-9`} {...props}>
        {children}
      </select>
    </FieldShell>
  );
}

/** Elenco dei clienti attivi del professionista. onlyShared: solo chi ha autorizzato la condivisione. */
export function ClientSelect({ value, onChange, label = t('Cliente'), onlyShared = false, placeholder = t('Seleziona un cliente'), disabled, className }) {
  const { data, loading } = useApi('/clients');
  const clients = (data?.clients ?? []).filter((c) => c.status === 'active' && (!onlyShared || c.sharedAccess));
  return (
    <SelectInput label={label} value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled || loading} className={className}>
      <option value="">{loading ? t('Caricamento…') : placeholder}</option>
      {clients.map((c) => (
        <option key={c.client.id} value={c.client.id}>
          {c.client.fullName}
        </option>
      ))}
    </SelectInput>
  );
}

export function PageHeader({ title, subtitle, actions, back }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        {back && (
          <Link to={back.to} className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-brand-800 hover:underline">
            <ArrowLeft className="h-4 w-4" /> {back.label}
          </Link>
        )}
        <h1 className="font-display text-[28px] leading-tight font-semibold sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-ink-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

/** Schede a "pillola" (es. Prossimi / Passati). */
export function Tabs({ tabs, value, onChange, className = '' }) {
  return (
    <div role="tablist" className={`no-scrollbar flex gap-1 overflow-x-auto rounded-2xl border border-line bg-surface p-1 ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={value === tab.value}
          onClick={() => onChange(tab.value)}
          className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium whitespace-nowrap transition ${
            value === tab.value ? 'bg-brand-50 text-brand-800' : 'text-ink-700 hover:bg-soft'
          }`}
        >
          {tab.label}
          {tab.count > 0 && <span className="rounded-full bg-brand-600 px-1.5 text-[11px] font-semibold text-white">{tab.count}</span>}
        </button>
      ))}
    </div>
  );
}

/** Finestra a comparsa sopra la pagina. */
export function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    ref.current?.querySelector('input, select, textarea')?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;
  const width = { md: 'max-w-lg', lg: 'max-w-2xl' }[size];
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 backdrop-blur-[2px] sm:items-center sm:p-4" onMouseDown={onClose}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
        className={`flex max-h-[92dvh] w-full ${width} flex-col overflow-hidden rounded-t-3xl bg-surface shadow-float sm:rounded-3xl`}
      >
        <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-full p-1.5 text-ink-500 hover:bg-hover" aria-label={t('Chiudi')}>
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {footer && <footer className="flex flex-wrap justify-end gap-2 border-t border-line px-5 py-3">{footer}</footer>}
      </div>
    </div>
  );
}

/** Pulsante che chiede conferma con un secondo clic (niente popup del browser). */
export function ConfirmButton({ children, confirmLabel = t('Conferma'), onConfirm, className = 'btn-soft', danger = true }) {
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  if (!asking) {
    return (
      <button type="button" className={className} onClick={() => setAsking(true)}>
        {children}
      </button>
    );
  }
  return (
    <span className="inline-flex gap-1.5">
      <button type="button" className="btn-soft" onClick={() => setAsking(false)} disabled={busy}>
        {t('Annulla')}
      </button>
      <button
        type="button"
        disabled={busy}
        className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-white ${danger ? 'bg-danger hover:bg-danger-strong' : 'bg-primary hover:bg-primary-strong'}`}
        onClick={async () => {
          setBusy(true);
          try {
            await onConfirm();
          } finally {
            setBusy(false);
            setAsking(false);
          }
        }}
      >
        {busy && <Spinner className="h-4 w-4 text-white" />} {confirmLabel}
      </button>
    </span>
  );
}

export function SaveButton({ saving, children = t('Salva'), ...props }) {
  return (
    <button type="submit" className="btn-primary" disabled={saving} {...props}>
      {saving && <Spinner className="h-4 w-4 text-white" />} {children}
    </button>
  );
}

/** Messaggio di esito (successo) che sparisce da solo. */
export function useFlash(timeout = 3500) {
  const [message, setMessage] = useState('');
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(''), timeout);
    return () => clearTimeout(timer);
  }, [message, timeout]);
  return [message, setMessage];
}

export function Flash({ children }) {
  if (!children) return null;
  return (
    <p role="status" className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-medium text-brand-900">
      {children}
    </p>
  );
}

export function StatusPill({ className = '', children }) {
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>{children}</span>;
}
