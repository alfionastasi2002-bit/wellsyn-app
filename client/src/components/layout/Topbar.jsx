import { Bell, ChevronDown, LogOut, Menu, Search, Settings } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../../context/AuthContext.jsx';
import { displayName, ROLE_LABELS } from '../../lib/format.js';
import { Avatar } from '../Avatar.jsx';
import { LogoMark } from '../Logo.jsx';

const SEARCH_PLACEHOLDER = {
  client: 'Cerca ricette, allenamenti, articoli…',
  nutritionist: 'Cerca clienti, piani alimentari, controlli…',
  trainer: 'Cerca clienti, schede, sessioni, articoli…',
};

export function Topbar({ onOpenMenu, unread }) {
  const { user, logout } = useAuth();
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

  const messagesPath = user.role === 'client' ? '/app/notifiche' : '/app/messaggi';

  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-line/70 bg-canvas/90 px-4 py-3 backdrop-blur-md sm:px-6 lg:border-none lg:px-8 lg:pt-4 lg:pb-3">
      <button
        type="button"
        onClick={onOpenMenu}
        className="rounded-xl p-2 text-ink-700 hover:bg-white lg:hidden"
        aria-label="Apri menu"
      >
        <Menu className="h-6 w-6" />
      </button>
      <Link to="/app" className="lg:hidden" aria-label="Wellsyn, vai alla dashboard">
        <LogoMark className="h-8 w-auto" />
      </Link>

      <form role="search" className="hidden max-w-[520px] flex-1 md:block" onSubmit={(e) => e.preventDefault()}>
        <label className="relative block">
          <span className="sr-only">Cerca</span>
          <Search className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-ink-500" />
          <input
            type="search"
            placeholder={SEARCH_PLACEHOLDER[user.role]}
            className="h-11 w-full rounded-xl border border-transparent bg-[#eef3f1] pr-4 pl-12 text-sm text-ink-900 outline-none placeholder:text-ink-400 focus:border-brand-300 focus:bg-white"
          />
        </label>
      </form>

      <div className="ml-auto flex items-center gap-2 sm:gap-4">
        <Link
          to={messagesPath}
          className="relative rounded-full p-2 text-ink-700 hover:bg-white"
          aria-label={unread ? `Notifiche: ${unread} non lette` : 'Notifiche'}
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
            className="flex items-center gap-3 rounded-full py-1 pr-2 pl-1 hover:bg-white"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <Avatar user={user} size="lg" />
            <span className="hidden text-left sm:block">
              <span className="block text-sm leading-tight font-semibold text-ink-900">{displayName(user)}</span>
              <span className="block text-xs text-ink-500">{ROLE_LABELS[user.role]}</span>
            </span>
            <ChevronDown className="hidden h-4 w-4 text-ink-500 sm:block" />
          </button>

          {menuOpen && (
            <div role="menu" className="card absolute right-0 mt-2 w-56 overflow-hidden p-1.5 shadow-float">
              <div className="px-3 py-2 sm:hidden">
                <p className="text-sm font-semibold">{displayName(user)}</p>
                <p className="text-xs text-ink-500">{ROLE_LABELS[user.role]}</p>
              </div>
              <Link
                role="menuitem"
                to="/app/impostazioni"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-700 hover:bg-brand-50"
              >
                <Settings className="h-4 w-4" /> Impostazioni
              </Link>
              <button
                role="menuitem"
                type="button"
                onClick={logout}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-700 hover:bg-brand-50"
              >
                <LogOut className="h-4 w-4" /> Esci
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
