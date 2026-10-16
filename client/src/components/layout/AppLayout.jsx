import { Suspense, useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router';
import { useAuth } from '../../context/AuthContext.jsx';
import { useApi } from '../../lib/useApi.js';
import { PageLoader } from '../ui.jsx';
import { Sidebar } from './Sidebar.jsx';
import { Topbar } from './Topbar.jsx';

export function AppLayout() {
  const { user } = useAuth();
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
      <Sidebar role={user.role} counters={summary.data} open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="min-w-0 flex-1">
        <Topbar onOpenMenu={() => setMenuOpen(true)} unread={summary.data?.unreadMessages ?? 0} />
        <main className="px-4 pt-4 pb-10 sm:px-6 lg:px-8 lg:pt-3">
          <Suspense fallback={<PageLoader />}>
            <Outlet context={{ refreshCounters: reload }} />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
