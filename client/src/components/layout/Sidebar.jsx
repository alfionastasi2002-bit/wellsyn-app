import { ChevronRight, Leaf, X } from 'lucide-react';
import { Link, NavLink } from 'react-router';
import { NAVIGATION, SIDEBAR_PROMO } from '../../navigation.js';
import { LogoStacked } from '../Logo.jsx';

export function Sidebar({ role, counters, open, onClose }) {
  const items = NAVIGATION[role] ?? [];
  const promo = SIDEBAR_PROMO[role];

  return (
    <>
      {/* Sfondo scuro dietro il menu su smartphone/tablet */}
      <div
        className={`fixed inset-0 z-30 bg-ink-900/30 backdrop-blur-[1px] transition-opacity lg:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[264px] flex-col border-r border-line bg-white px-4 pt-6 pb-5 transition-transform duration-300 lg:sticky lg:top-0 lg:h-dvh lg:translate-x-0 ${
          open ? 'translate-x-0 shadow-float' : '-translate-x-full'
        }`}
        aria-label="Menu principale"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full p-2 text-ink-500 hover:bg-[#f1f5f4] lg:hidden"
          aria-label="Chiudi menu"
        >
          <X className="h-5 w-5" />
        </button>

        <Link to="/app" onClick={onClose} className="mx-auto mb-7">
          <LogoStacked />
        </Link>

        <nav className="flex-1 overflow-y-auto">
          <ul className="space-y-1">
            {items.map(({ path, label, icon: Icon, badge }) => {
              const count = badge ? counters?.[badge] : 0;
              return (
                <li key={path || 'home'}>
                  <NavLink
                    to={path ? `/app/${path}` : '/app'}
                    end={!path}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3.5 rounded-xl px-4 py-3 text-[15px] transition ${
                        isActive
                          ? 'bg-brand-50 font-semibold text-ink-900'
                          : 'text-ink-700 hover:bg-[#f4f8f7] hover:text-ink-900'
                      }`
                    }
                  >
                    <Icon className="h-5 w-5 shrink-0 text-ink-700" strokeWidth={1.8} />
                    <span className="flex-1 truncate">{label}</span>
                    {count > 0 && (
                      <span className="grid h-6 min-w-6 place-items-center rounded-full bg-brand-600 px-1.5 text-xs font-semibold text-white">
                        {count}
                      </span>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {promo && (
          <div className="mt-4 rounded-2xl bg-mint p-5">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-white text-brand-700">
              <Leaf className="h-5 w-5" />
            </span>
            <p className="mt-3 font-display text-lg leading-snug font-semibold text-ink-900">{promo.title}</p>
            <p className="mt-1 text-sm text-ink-700">{promo.text}</p>
            <Link to="/app/supporto" onClick={onClose} className="btn-primary mt-4 w-full justify-between">
              {promo.cta} <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
