import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, UNAUTHORIZED_EVENT } from '../lib/api.js';
import { usePreferences } from './PreferencesContext.jsx';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // undefined = stiamo ancora verificando la sessione; null = non autenticato
  const [user, setUser] = useState(undefined);
  const { update: updatePreferences } = usePreferences();

  // Tema e lingua scelti nel profilo valgono su ogni dispositivo da cui si accede.
  const applyUser = useCallback(
    (nextUser) => {
      const saved = nextUser?.preferences;
      if (saved) {
        const patch = {};
        if (saved.theme) patch.theme = saved.theme;
        if (saved.language) patch.language = saved.language;
        if (Object.keys(patch).length) updatePreferences(patch);
      }
      setUser(nextUser);
    },
    [updatePreferences],
  );

  useEffect(() => {
    api('/auth/me')
      .then((data) => applyUser(data.user))
      .catch(() => setUser(null));

    const onUnauthorized = () => setUser(null);
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, [applyUser]);

  const login = useCallback(
    async (credentials) => {
      const data = await api('/auth/login', { method: 'POST', body: credentials });
      applyUser(data.user);
      return data.user;
    },
    [applyUser],
  );

  const register = useCallback(
    async (payload) => {
      const data = await api('/auth/register', { method: 'POST', body: payload });
      setUser(data.user);
      return data.user;
    },
    [],
  );

  const logout = useCallback(async () => {
    await api('/auth/logout', { method: 'POST' }).catch(() => {});
    setUser(null);
  }, []);

  // Dopo una modifica del profilo aggiorniamo i dati mostrati in tutta l'app.
  const updateUser = useCallback((nextUser) => setUser(nextUser), []);

  /** Cambia tema o lingua: subito nell'interfaccia e, se hai fatto l'accesso, anche nel profilo. */
  const savePreferences = useCallback(
    (patch) => {
      updatePreferences(patch);
      if (!user) return;
      const preferences = { ...user.preferences, ...patch };
      setUser((u) => (u ? { ...u, preferences } : u));
      api('/auth/me', { method: 'PATCH', body: { preferences } }).catch(() => {});
    },
    [user, updatePreferences],
  );

  const value = useMemo(
    () => ({ user, login, register, logout, updateUser, savePreferences }),
    [user, login, register, logout, updateUser, savePreferences],
  );
  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve essere usato dentro <AuthProvider>');
  return ctx;
}
