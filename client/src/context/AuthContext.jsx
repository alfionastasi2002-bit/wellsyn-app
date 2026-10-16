import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, UNAUTHORIZED_EVENT } from '../lib/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // undefined = stiamo ancora verificando la sessione; null = non autenticato
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    api('/auth/me')
      .then((data) => setUser(data.user))
      .catch(() => setUser(null));

    const onUnauthorized = () => setUser(null);
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, []);

  const login = useCallback(async (credentials) => {
    const data = await api('/auth/login', { method: 'POST', body: credentials });
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const data = await api('/auth/register', { method: 'POST', body: payload });
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    await api('/auth/logout', { method: 'POST' }).catch(() => {});
    setUser(null);
  }, []);

  // Dopo una modifica del profilo aggiorniamo i dati mostrati in tutta l'app.
  const updateUser = useCallback((nextUser) => setUser(nextUser), []);

  const value = useMemo(() => ({ user, login, register, logout, updateUser }), [user, login, register, logout, updateUser]);
  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve essere usato dentro <AuthProvider>');
  return ctx;
}
