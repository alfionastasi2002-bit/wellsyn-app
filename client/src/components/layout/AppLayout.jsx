import { Suspense, useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router';
import { useAuth } from '../../context/AuthContext.jsx';
import { usePreferences } from '../../context/PreferencesContext.jsx';
import { useApi } from '../../lib/useApi.js';
import { PageLoader } from '../ui.jsx';
import { BottomNav } from './BottomNav.jsx';
import { Sidebar } from './Sidebar.jsx';
import { Topbar } from './Topbar.jsx';

export function AppLayout() {
  const { user } = useAuth();
  const { sidebarCollapsed, update } = usePreferences();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const summary = useApi('/me/summary');
  const { reload } = summary;

  // Aggiorna i contatori (messaggi, richieste) quando si cambia pagina.
  useEffect(() => {
    reload();
    window.scrollTo(0, 0);
  }, [pathname, reload]);

  return (
    <div className="lg:flex">
      <Sidebar
        role={user.role}
        counters={summary.data}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() => update({ sidebarCollapsed: !sidebarCollapsed })}
      />
      <div className="min-w-0 flex-1">
        <Topbar unread={summary.data?.unreadMessages ?? 0} />
        {/* Su smartphone e tablet lo spazio in fondo lascia libera la barra di navigazione */}
        <main className="px-4 pt-4 pb-[calc(6.5rem+env(safe-area-inset-bottom))] sm:px-6 lg:px-8 lg:pt-3 lg:pb-10">
          <Suspense fallback={<PageLoader />}>
            <Outlet context={{ refreshCounters: reload }} />
          </Suspense>
        </main>
      </div>
      <BottomNav role={user.role} counters={summary.data} onOpenMenu={() => setMenuOpen(true)} />
    </div>
  );
}
