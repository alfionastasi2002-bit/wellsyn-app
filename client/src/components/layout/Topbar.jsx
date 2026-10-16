import { Bell, ChevronDown, Languages, LifeBuoy, LogOut, Menu, Moon, Settings, Sun } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../../context/AuthContext.jsx';
import { usePreferences } from '../../context/PreferencesContext.jsx';
import { t } from '../../i18n/index.js';
import { displayName, ROLE_LABELS } from '../../lib/format.js';
import { messagesPath } from '../../navigation.js';
import { Avatar } from '../Avatar.jsx';
import { LogoMark } from '../Logo.jsx';
import { LanguageSwitch, ThemeToggle } from './PreferenceControls.jsx';
import { QuickSearch } from './QuickSearch.jsx';

export function Topbar({ onOpenMenu, unread }) {
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

  const dark = theme === 'dark' || (theme === 'system' && window.matchMedia?.('(prefers-color-scheme: dark)').matches);
  const menuItem = 'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-ink-700 hover:bg-brand-50';

  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-line/70 bg-canvas/90 px-4 py-3 backdrop-blur-md sm:px-6 lg:border-none lg:px-8 lg:pt-4 lg:pb-3">
      <button
        type="button"
        onClick={onOpenMenu}
        className="rounded-xl p-2 text-ink-700 hover:bg-surface lg:hidden"
        aria-label={t('Apri menu')}
      >
        <Menu className="h-6 w-6" />
      </button>
      <Link to="/app" className="lg:hidden" aria-label={t('Wellsyn, vai alla dashboard')}>
        <LogoMark className="h-8 w-auto" />
      </Link>

      <QuickSearch role={user.role} />

      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        <LanguageSwitch className="hidden md:flex" />
        <ThemeToggle className="hidden sm:block" />
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
            <Avatar user={user} size="lg" />
            <span className="hidden text-left sm:block">
              <span className="block text-sm leading-tight font-semibold text-ink-900">{displayName(user)}</span>
              <span className="block text-xs text-ink-500">{ROLE_LABELS[user.role]}</span>
            </span>
            <ChevronDown className="hidden h-4 w-4 text-ink-500 sm:block" />
          </button>

          {menuOpen && (
            <div role="menu" className="card absolute right-0 mt-2 w-60 overflow-hidden p-1.5 shadow-float">
              <div className="px-3 py-2 sm:hidden">
                <p className="text-sm font-semibold">{displayName(user)}</p>
                <p className="text-xs text-ink-500">{ROLE_LABELS[user.role]}</p>
              </div>
              <Link role="menuitem" to="/app/impostazioni" onClick={() => setMenuOpen(false)} className={menuItem}>
                <Settings className="h-4 w-4" /> {t('Il tuo profilo e impostazioni')}
              </Link>
              <button role="menuitem" type="button" className={menuItem} onClick={() => savePreferences({ theme: dark ? 'light' : 'dark' })}>
                {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />} {dark ? t('Tema chiaro') : t('Tema scuro')}
              </button>
              <button
                role="menuitem"
                type="button"
                className={menuItem}
                onClick={() => savePreferences({ language: language === 'en' ? 'it' : 'en' })}
              >
                <Languages className="h-4 w-4" /> {language === 'en' ? t('Passa all’italiano') : t('Switch to English')}
              </button>
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
