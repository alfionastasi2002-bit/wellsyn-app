import { ChevronsLeft, ChevronsRight, X } from 'lucide-react';
import { Link, NavLink } from 'react-router';
import { t } from '../../i18n/index.js';
import { NAVIGATION } from '../../navigation.js';
import { LogoMark, LogoStacked } from '../Logo.jsx';

/**
 * Menu laterale. Su smartphone/tablet si apre a scomparsa; da computer è sempre visibile
 * e si può ridurre a una colonna di sole icone (collapsed) e riaprire.
 */
export function Sidebar({ role, counters, open, onClose, collapsed, onToggleCollapsed }) {
  const items = NAVIGATION[role] ?? [];
  // Classi usate solo con il menu ridotto (da computer; su smartphone il menu si apre sempre intero).
  const slim = (classes) => (collapsed ? classes : '');

  return (
    <>
      {/* Sfondo scuro dietro il menu su smartphone/tablet */}
      <div
        className={`fixed inset-0 z-30 bg-black/40 backdrop-blur-[1px] transition-opacity lg:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[264px] flex-col border-r border-line bg-surface pt-6 pb-5 transition-[transform,width] duration-300 lg:sticky lg:top-0 lg:h-dvh lg:translate-x-0 ${
          collapsed ? 'px-4 lg:w-[84px] lg:px-3' : 'px-4'
        } ${open ? 'translate-x-0 shadow-float' : '-translate-x-full'}`}
        aria-label={t('Menu principale')}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full p-2 text-ink-500 hover:bg-hover lg:hidden"
          aria-label={t('Chiudi menu')}
        >
          <X className="h-5 w-5" />
        </button>

        {/* Riduci / espandi il menu (solo da computer) */}
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="absolute top-9 -right-3.5 z-10 hidden h-7 w-7 place-items-center rounded-full border border-line bg-surface text-ink-500 shadow-card transition hover:text-ink-900 lg:grid"
          aria-label={collapsed ? t('Espandi il menu') : t('Riduci il menu')}
          title={collapsed ? t('Espandi il menu') : t('Riduci il menu')}
        >
          {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
        </button>

        <Link to="/app" onClick={onClose} className="mx-auto mb-7 shrink-0" aria-label={t('Wellsyn, vai alla dashboard')}>
          <LogoStacked className={slim('lg:hidden')} />
          {collapsed && <LogoMark className="hidden h-10 w-auto lg:block" />}
        </Link>

        <nav className="no-scrollbar min-h-0 flex-1 overflow-y-auto">
          <ul className="space-y-1">
            {items.map(({ path, label, icon: Icon, badge }) => {
              const count = badge ? counters?.[badge] : 0;
              return (
                <li key={path || 'home'}>
                  <NavLink
                    to={path ? `/app/${path}` : '/app'}
                    end={!path}
                    onClick={onClose}
                    title={collapsed ? label : undefined}
                    className={({ isActive }) =>
                      `relative flex items-center gap-3.5 rounded-xl px-4 py-3 text-[15px] transition ${slim('lg:justify-center lg:px-0')} ${
                        isActive ? 'bg-brand-50 font-semibold text-ink-900' : 'text-ink-700 hover:bg-soft hover:text-ink-900'
                      }`
                    }
                  >
                    <Icon className="h-5 w-5 shrink-0 text-ink-700" strokeWidth={1.8} />
                    <span className={`flex-1 truncate ${slim('lg:sr-only')}`}>{label}</span>
                    {count > 0 && (
                      <span
                        className={`grid h-6 min-w-6 place-items-center rounded-full bg-brand-600 px-1.5 text-xs font-semibold text-white ${slim(
                          'lg:absolute lg:top-1 lg:right-1.5 lg:h-[18px] lg:min-w-[18px] lg:px-1 lg:text-[10px]',
                        )}`}
                      >
                        {count}
                      </span>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
}
