import { Fragment, lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useParams } from 'react-router';
import { EvolutionOverlay } from './components/EvolutionOverlay.jsx';
import { AppLayout } from './components/layout/AppLayout.jsx';
import { PageLoader } from './components/ui.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { PreferencesProvider, usePreferences } from './context/PreferencesContext.jsx';
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
  checkins: lazy(() => import('./pages/pro/CheckInsPage.jsx')),
  proProgress: lazy(() => import('./pages/pro/ClientProgressPage.jsx')),
  mealPlans: lazy(() => import('./pages/nutritionist/MealPlansPage.jsx')),
  sharedActivity: lazy(() => import('./pages/nutritionist/SharedActivityPage.jsx')),
  workoutPlans: lazy(() => import('./pages/trainer/WorkoutPlansPage.jsx')),
  sharedNutrition: lazy(() => import('./pages/trainer/SharedNutritionPage.jsx')),
  // Tutti
  agenda: lazy(() => import('./pages/agenda/AgendaPage.jsx')),
  messages: lazy(() => import('./pages/shared/MessagesPage.jsx')),
  settings: lazy(() => import('./pages/shared/SettingsPage.jsx')),
  support: lazy(() => import('./pages/shared/SupportPage.jsx')),
};

// Vecchi indirizzi ancora validi (es. link salvati prima che l'agenda avesse una sezione sua).
const REDIRECTS = { sessioni: 'agenda' };

/** Solo per utenti autenticati: altrimenti rimanda al login. */
function RequireAuth({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (user === undefined) return <PageLoader />;
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
  const location = useLocation();
  if (REDIRECTS[section]) return <Navigate to={`/app/${REDIRECTS[section]}${location.search}`} replace />;
  const item = NAVIGATION[user.role].find((i) => i.path === section);
  const Page = section === 'supporto' ? PAGES.support : item && PAGES[item.page];
  if (!Page) return <NotFound inApp />;
  // key: cambiando elemento (es. da un piano all'altro) la pagina riparte pulita
  return <Page key={itemId ?? 'list'} itemId={itemId} />;
}

/** Cambiando lingua l'interfaccia si ridisegna da capo, così ogni testo usa la nuova lingua. */
function LanguageBoundary({ children }) {
  const { language } = usePreferences();
  return <Fragment key={language}>{children}</Fragment>;
}

export default function App() {
  return (
    <PreferencesProvider>
      <BrowserRouter>
        <AuthProvider>
          <LanguageBoundary>
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
          </LanguageBoundary>
        </AuthProvider>
      </BrowserRouter>
      {/* Fuori dal cambio lingua: l'animazione d'ingresso non si interrompe se al login cambia la lingua */}
      <EvolutionOverlay />
    </PreferencesProvider>
  );
}
