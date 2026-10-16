import { Moon, Sun } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { usePreferences } from '../../context/PreferencesContext.jsx';
import { LANGUAGES, t } from '../../i18n/index.js';

/** Pulsante sole/luna: passa dal tema chiaro a quello scuro. */
export function ThemeToggle({ className = '' }) {
  const { theme } = usePreferences();
  const { savePreferences } = useAuth();
  const dark = theme === 'dark' || (theme === 'system' && window.matchMedia?.('(prefers-color-scheme: dark)').matches);
  const label = dark ? t('Passa al tema chiaro') : t('Passa al tema scuro');
  return (
    <button
      type="button"
      onClick={() => savePreferences({ theme: dark ? 'light' : 'dark' })}
      className={`rounded-full p-2 text-ink-700 transition hover:bg-surface ${className}`}
      aria-label={label}
      title={label}
    >
      {dark ? <Sun className="h-5 w-5" strokeWidth={1.8} /> : <Moon className="h-5 w-5" strokeWidth={1.8} />}
    </button>
  );
}

/** Selettore lingua a due pulsanti: IT | EN. */
export function LanguageSwitch({ className = '' }) {
  const { language } = usePreferences();
  const { savePreferences } = useAuth();
  return (
    <div role="radiogroup" aria-label={t('Lingua')} className={`flex rounded-full border border-line bg-surface p-0.5 ${className}`}>
      {LANGUAGES.map((l) => (
        <button
          key={l.value}
          type="button"
          role="radio"
          aria-checked={language === l.value}
          title={l.label}
          onClick={() => language !== l.value && savePreferences({ language: l.value })}
          className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${
            language === l.value ? 'bg-primary text-white' : 'text-ink-500 hover:text-ink-900'
          }`}
        >
          {l.short}
        </button>
      ))}
    </div>
  );
}
