import { Bell, ChevronDown, LifeBuoy, LogOut, Monitor, Moon, Settings, Sun } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../../context/AuthContext.jsx';
import { usePreferences } from '../../context/PreferencesContext.jsx';
import { LANGUAGES, t } from '../../i18n/index.js';
import { displayName, ROLE_LABELS } from '../../lib/format.js';
import { messagesPath } from '../../navigation.js';
import { Avatar } from '../Avatar.jsx';
import { LogoFull } from '../Logo.jsx';

export function Topbar({ unread }) {
  const { user, logout, savePreferences } = useAuth();
  const { theme, language } = usePreferences();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e) => {
      if (e.type === 'keydown' ? e.key === 'Escape' : !menuRef.current?.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [menuOpen]);

  const menuItem = 'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-ink-700 hover:bg-brand-50';

  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-line/70 bg-canvas/90 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 backdrop-blur-md sm:px-6 lg:border-none lg:px-8 lg:pt-4 lg:pb-3">
      {/* Logo Wellsyn (nel menu laterale c'è il simbolo del profilo; su smartphone e tablet il menu si apre dalla barra in basso) */}
      <Link to="/app" className="min-w-0 shrink" aria-label={t('Wellsyn, vai alla dashboard')}>
        <LogoFull className="h-7 max-w-full object-contain object-left sm:h-9 lg:h-10" />
      </Link>

      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        <Link
          to="/app/supporto"
          className="flex items-center gap-1.5 rounded-full p-2 text-ink-700 hover:bg-surface xl:px-3"
          aria-label={t('Centro assistenza')}
          title={t('Centro assistenza')}
        >
          <LifeBuoy className="h-5 w-5" strokeWidth={1.8} />
          <span className="hidden text-sm font-medium xl:inline">{t('Assistenza')}</span>
        </Link>
        <Link
          to={messagesPath(user.role)}
          className="relative rounded-full p-2 text-ink-700 hover:bg-surface"
          aria-label={unread ? t('Notifiche: {n} non lette', { n: unread }) : t('Notifiche')}
        >
          <Bell className="h-6 w-6" strokeWidth={1.8} />
          {unread > 0 && (
            <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-brand-500 ring-2 ring-canvas" />
          )}
        </Link>
        <span className="hidden h-8 w-px bg-line sm:block" aria-hidden="true" />

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-3 rounded-full py-1 pr-2 pl-1 hover:bg-surface"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label={t('Menu utente')}
          >
            <Avatar user={user} size="md" className="sm:h-12 sm:w-12 sm:text-base" />
            <span className="hidden text-left sm:block">
              <span className="block text-sm leading-tight font-semibold text-ink-900">{displayName(user)}</span>
              <span className="block text-xs text-ink-500">{ROLE_LABELS[user.role]}</span>
            </span>
            <ChevronDown className="hidden h-4 w-4 text-ink-500 sm:block" />
          </button>

          {menuOpen && (
            <div role="menu" className="card absolute right-0 mt-2 w-72 overflow-hidden p-1.5 shadow-float">
              <div className="px-3 py-2 sm:hidden">
                <p className="text-sm font-semibold">{displayName(user)}</p>
                <p className="text-xs text-ink-500">{ROLE_LABELS[user.role]}</p>
              </div>
              <Link role="menuitem" to="/app/impostazioni" onClick={() => setMenuOpen(false)} className={menuItem}>
                <Settings className="h-4 w-4" /> {t('Il tuo profilo e impostazioni')}
              </Link>
              {/* Lingua e tema si scelgono solo qui */}
              <div className="my-1 h-px bg-line" />
              <MenuChoice
                label={t('Lingua')}
                value={language}
                onChange={(v) => savePreferences({ language: v })}
                options={LANGUAGES.map((l) => ({ value: l.value, label: l.label }))}
              />
              <MenuChoice
                label={t('Tema')}
                value={theme}
                onChange={(v) => savePreferences({ theme: v })}
                options={[
                  { value: 'light', label: t('Chiaro'), icon: Sun },
                  { value: 'dark', label: t('Scuro'), icon: Moon },
                  { value: 'system', label: t('Automatico'), icon: Monitor },
                ]}
              />
              <div className="my-1 h-px bg-line" />
              <button role="menuitem" type="button" onClick={logout} className={menuItem}>
                <LogOut className="h-4 w-4" /> {t('Esci')}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

/** Scelta a pulsanti dentro il menu utente (lingua, tema): il menu resta aperto. */
function MenuChoice({ label, value, onChange, options }) {
  return (
    <div className="px-3 py-1.5">
      <p className="text-[11px] font-semibold tracking-wide text-ink-400 uppercase">{label}</p>
      <div role="radiogroup" aria-label={label} className="mt-1.5 flex gap-1 rounded-xl bg-soft p-1">
        {options.map(({ value: v, label: optionLabel, icon: Icon }) => (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={value === v}
            onClick={() => value !== v && onChange(v)}
            className={`flex min-w-0 flex-1 items-center justify-center gap-1 rounded-lg px-1 py-1.5 text-xs font-medium transition ${Icon ? 'flex-col' : ''} ${
              value === v ? 'bg-surface text-brand-800 shadow-card' : 'text-ink-500 hover:text-ink-900'
            }`}
          >
            {Icon && <Icon className="h-4 w-4 shrink-0" />}
            <span className="max-w-full truncate">{optionLabel}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
