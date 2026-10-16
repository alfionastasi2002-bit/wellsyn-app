import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { setLanguage } from '../i18n/index.js';

// Preferenze dell'interfaccia: tema (chiaro/scuro), lingua e menu laterale ridotto.
// Restano salvate nel browser; per chi ha fatto l'accesso anche nel profilo (vedi AuthContext).

const STORAGE_KEY = 'wellsyn.prefs';
const DEFAULTS = { theme: 'light', language: 'it', sidebarCollapsed: false };
const PreferencesContext = createContext(null);

function readStored() {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') };
  } catch {
    return DEFAULTS;
  }
}

const systemDark = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches;

/** Applica il tema alla pagina (classe "dark" sull'elemento <html>). */
export function applyTheme(theme) {
  const dark = theme === 'dark' || (theme === 'system' && systemDark());
  document.documentElement.classList.toggle('dark', dark);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0d1315' : '#0f5a53');
}

export function PreferencesProvider({ children }) {
  const [prefs, setPrefs] = useState(() => {
    const stored = readStored();
    setLanguage(stored.language);
    return stored;
  });

  useEffect(() => {
    applyTheme(prefs.theme);
    if (prefs.theme !== 'system') return undefined;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyTheme('system');
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [prefs.theme]);

  /** Aggiorna una o più preferenze, es. update({ theme: 'dark' }). */
  const update = useCallback((patch) => {
    setPrefs((current) => {
      const next = { ...current, ...patch };
      if (patch.language) setLanguage(next.language);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Archivio del browser non disponibile (es. navigazione privata): le preferenze valgono solo per questa visita.
      }
      return next;
    });
  }, []);

  const value = useMemo(() => ({ ...prefs, update }), [prefs, update]);
  return <PreferencesContext value={value}>{children}</PreferencesContext>;
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error('usePreferences deve essere usato dentro <PreferencesProvider>');
  return ctx;
}
