import { Check, ChevronRight, Lock, Mail } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { LogoStacked } from '../../components/Logo.jsx';
import { Spinner } from '../../components/ui.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { NAVIGATION } from '../../navigation.js';
import { AuthShell } from './AuthShell.jsx';
import { Field, FormError, PasswordField, RolePicker } from './fields.jsx';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [role, setRole] = useState('client');
  const [form, setForm] = useState({ email: '', password: '', remember: true });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login({ ...form, role });
      // Torna alla pagina richiesta prima del login, se esiste per questo profilo.
      const from = location.state?.from;
      const section = from?.split('/')[2];
      const allowed = !section || NAVIGATION[user.role].some((item) => item.path === section);
      navigate(from && allowed ? from : '/app', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <div className="mx-auto max-w-[460px]">
        <LogoStacked className="scale-110" />
        <h1 className="mt-8 text-center font-display text-[30px] font-semibold">Bentornato su Wellsyn</h1>
        <p className="mt-2 text-center text-[15px] text-ink-500">
          Accedi al tuo spazio personale e continua il tuo percorso di benessere.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4" noValidate>
          <RolePicker value={role} onChange={setRole} />
          <Field
            icon={Mail}
            label="Email"
            type="email"
            name="email"
            autoComplete="email"
            placeholder="nome@email.com"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <PasswordField
            icon={Lock}
            name="password"
            autoComplete="current-password"
            placeholder="••••••••"
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />

          <div className="flex items-center justify-between gap-3 text-sm">
            <label className="inline-flex cursor-pointer items-center gap-2.5 text-ink-700">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={form.remember}
                onChange={(e) => setForm({ ...form, remember: e.target.checked })}
              />
              <span className="grid h-5 w-5 place-items-center rounded-md border-2 border-ink-300 text-white transition peer-checked:border-brand-800 peer-checked:bg-brand-800 peer-focus-visible:ring-4 peer-focus-visible:ring-brand-100">
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
              </span>
              Ricordami
            </label>
            <button type="button" onClick={() => setShowForgot((v) => !v)} className="font-medium text-brand-800 underline underline-offset-4">
              Password dimenticata?
            </button>
          </div>
          {showForgot && (
            <p className="rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-900">
              Il recupero automatico della password arriverà presto. Nel frattempo chiedi al tuo professionista di
              reimpostarla o scrivi all'assistenza Wellsyn.
            </p>
          )}

          <FormError>{error}</FormError>

          <button type="submit" className="btn-primary w-full py-4 text-base" disabled={loading}>
            {loading ? <Spinner className="h-5 w-5 text-white" /> : null}
            Accedi <ChevronRight className="h-5 w-5" />
          </button>
        </form>

        <div className="my-6 flex items-center gap-4 text-sm text-ink-400">
          <span className="h-px flex-1 bg-line" /> oppure <span className="h-px flex-1 bg-line" />
        </div>
        <Link
          to="/registrati"
          className="flex items-center justify-center gap-1 rounded-xl bg-[#f3f6f5] px-4 py-3.5 text-sm text-ink-700 transition hover:bg-[#eaf0ee]"
        >
          Non hai un account? <span className="font-semibold text-brand-800">Richiedi l'accesso</span>
          <ChevronRight className="h-4 w-4 text-brand-800" />
        </Link>
      </div>
    </AuthShell>
  );
}
