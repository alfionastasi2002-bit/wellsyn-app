import { Menu } from 'lucide-react';
import { NavLink, useLocation } from 'react-router';
import { t } from '../../i18n/index.js';
import { NAVIGATION } from '../../navigation.js';

/**
 * Barra di navigazione in basso, solo su smartphone e tablet (comoda da usare con il pollice):
 * le sezioni principali del profilo e "Menu", che apre il menu con tutte le altre.
 */
export function BottomNav({ role, counters, onOpenMenu }) {
  const { pathname } = useLocation();
  // Negli editor (piano alimentare, scheda) al suo posto c'è la barra per salvare (MobileSaveBar)
  if (/^\/app\/(piani-alimentari|schede)\/[^/]+/.test(pathname)) return null;
  const all = NAVIGATION[role] ?? [];
  const tabs = all.filter((i) => i.tab);
  // Un pallino su "Menu" se c'è qualcosa di nuovo nelle sezioni che non sono nella barra (es. messaggi)
  const news = all.some((i) => !i.tab && i.badge && counters?.[i.badge] > 0);
  const cell = 'relative flex w-full flex-col items-center gap-0.5 px-1 pt-1.5 pb-1 text-[11px] leading-tight font-medium transition';
  const pill = (active) => `grid h-8 w-14 place-items-center rounded-full transition ${active ? 'bg-brand-100 text-brand-800' : ''}`;

  return (
    <nav
      aria-label={t('Sezioni principali')}
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line/80 bg-surface/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-6px_20px_-12px_rgb(15_90_83/0.25)] backdrop-blur-md lg:hidden"
    >
      <ul className="mx-auto grid max-w-xl grid-cols-5">
        {tabs.map(({ path, tab, icon: Icon, badge }) => (
          <li key={path || 'home'} className="min-w-0">
            <NavLink
              to={path ? `/app/${path}` : '/app'}
              end={!path}
              className={({ isActive }) => `${cell} ${isActive ? 'text-brand-800' : 'text-ink-500 active:text-ink-900'}`}
            >
              {({ isActive }) => (
                <>
                  <span className={pill(isActive)}>
                    <Icon className="h-5 w-5" strokeWidth={isActive ? 2.2 : 1.8} />
                  </span>
                  <span className="max-w-full truncate">{tab}</span>
                  {badge && counters?.[badge] > 0 && <span className="absolute top-1.5 left-1/2 ml-3 h-2.5 w-2.5 rounded-full bg-brand-500 ring-2 ring-surface" />}
                </>
              )}
            </NavLink>
          </li>
        ))}
        <li className="min-w-0">
          <button type="button" onClick={onOpenMenu} className={`${cell} text-ink-500 active:text-ink-900`} aria-label={t('Apri il menu con tutte le sezioni')}>
            <span className={pill(false)}>
              <Menu className="h-5 w-5" strokeWidth={1.8} />
            </span>
            <span>{t('Menu')}</span>
            {news && <span className="absolute top-1.5 left-1/2 ml-3 h-2.5 w-2.5 rounded-full bg-brand-500 ring-2 ring-surface" />}
          </button>
        </li>
      </ul>
    </nav>
  );
}
