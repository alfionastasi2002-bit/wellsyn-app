import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useParams } from 'react-router';
import { AppLayout } from './components/layout/AppLayout.jsx';
import { PageLoader } from './components/ui.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { COMING_SOON, NAVIGATION } from './navigation.js';
import ComingSoon from './pages/ComingSoon.jsx';
import NotFound from './pages/NotFound.jsx';

// Le pagine vengono caricate solo quando servono (il login resta leggero).
const LoginPage = lazy(() => import('./pages/auth/LoginPage.jsx'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage.jsx'));
const ClientDashboard = lazy(() => import('./pages/client/ClientDashboard.jsx'));
const NutritionistDashboard = lazy(() => import('./pages/nutritionist/NutritionistDashboard.jsx'));
const TrainerDashboard = lazy(() => import('./pages/trainer/TrainerDashboard.jsx'));
const TeamPage = lazy(() => import('./pages/client/TeamPage.jsx'));
const ClientsPage = lazy(() => import('./pages/pro/ClientsPage.jsx'));

const DASHBOARDS = {
  client: ClientDashboard,
  nutritionist: NutritionistDashboard,
  trainer: TrainerDashboard,
};

const PAGES = { team: TeamPage, clients: ClientsPage };

/** Solo per utenti autenticati: altrimenti rimanda al login. */
function RequireAuth({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (user === undefined) return <PageLoader label="Verifica dell'accesso…" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}

/** Login e registrazione: se sei già dentro, vai alla dashboard. */
function GuestOnly({ children }) {
  const { user } = useAuth();
  if (user === undefined) return <PageLoader />;
  if (user) return <Navigate to="/app" replace />;
  return children;
}

function Dashboard() {
  const { user } = useAuth();
  const Page = DASHBOARDS[user.role];
  return <Page />;
}

function Section() {
  const { user } = useAuth();
  const { section } = useParams();
  const item = NAVIGATION[user.role].find((i) => i.path === section);
  const Page = item?.page && PAGES[item.page];
  if (Page) return <Page />;
  if (item || COMING_SOON[section]) {
    return <ComingSoon title={item?.label ?? 'Centro assistenza'} description={COMING_SOON[section]} icon={item?.icon} />;
  }
  return <ComingSoon title="Sezione non disponibile" description="Questa sezione non esiste per il tuo profilo." />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Navigate to="/app" replace />} />
            <Route path="/login" element={<GuestOnly><LoginPage /></GuestOnly>} />
            <Route path="/registrati" element={<GuestOnly><RegisterPage /></GuestOnly>} />
            <Route
              path="/app"
              element={
                <RequireAuth>
                  <AppLayout />
                </RequireAuth>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path=":section" element={<Section />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}
