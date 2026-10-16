import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useParams } from 'react-router';
import { AppLayout } from './components/layout/AppLayout.jsx';
import { PageLoader } from './components/ui.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { NAVIGATION } from './navigation.js';
import NotFound from './pages/NotFound.jsx';

// Le pagine vengono caricate solo quando servono (il login resta leggero).
const LoginPage = lazy(() => import('./pages/auth/LoginPage.jsx'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage.jsx'));

const DASHBOARDS = {
  client: lazy(() => import('./pages/client/ClientDashboard.jsx')),
  nutritionist: lazy(() => import('./pages/nutritionist/NutritionistDashboard.jsx')),
  trainer: lazy(() => import('./pages/trainer/TrainerDashboard.jsx')),
};

const PAGES = {
  // Cliente
  clientNutrition: lazy(() => import('./pages/client/NutritionPage.jsx')),
  clientWorkouts: lazy(() => import('./pages/client/WorkoutsPage.jsx')),
  clientProgress: lazy(() => import('./pages/client/ProgressPage.jsx')),
  clientChecks: lazy(() => import('./pages/client/ChecksPage.jsx')),
  team: lazy(() => import('./pages/client/TeamPage.jsx')),
  // Professionisti
  clients: lazy(() => import('./pages/pro/ClientsPage.jsx')),
  agenda: lazy(() => import('./pages/pro/AgendaPage.jsx')),
  proProgress: lazy(() => import('./pages/pro/ClientProgressPage.jsx')),
  mealPlans: lazy(() => import('./pages/nutritionist/MealPlansPage.jsx')),
  sharedActivity: lazy(() => import('./pages/nutritionist/SharedActivityPage.jsx')),
  workoutPlans: lazy(() => import('./pages/trainer/WorkoutPlansPage.jsx')),
  sharedNutrition: lazy(() => import('./pages/trainer/SharedNutritionPage.jsx')),
  // Tutti
  messages: lazy(() => import('./pages/shared/MessagesPage.jsx')),
  settings: lazy(() => import('./pages/shared/SettingsPage.jsx')),
  support: lazy(() => import('./pages/shared/SupportPage.jsx')),
};

/** Solo per utenti autenticati: altrimenti rimanda al login. */
function RequireAuth({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (user === undefined) return <PageLoader label="Verifica dell'accesso…" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
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
  const { section, itemId } = useParams();
  const item = NAVIGATION[user.role].find((i) => i.path === section);
  const Page = section === 'supporto' ? PAGES.support : item && PAGES[item.page];
  if (!Page) return <NotFound inApp />;
  // key: cambiando elemento (es. da un piano all'altro) la pagina riparte pulita
  return <Page key={itemId ?? 'list'} itemId={itemId} />;
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
              <Route path=":section/:itemId" element={<Section />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}
