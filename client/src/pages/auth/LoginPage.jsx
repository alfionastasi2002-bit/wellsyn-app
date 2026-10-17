import { ArrowRight, Check, Lock, UserRound } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { LogoStacked } from '../../components/Logo.jsx';
import { Spinner } from '../../components/ui.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { t, translateMessage } from '../../i18n/index.js';
import { NAVIGATION } from '../../navigation.js';
import { AuthShell } from './AuthShell.jsx';
import { Field, FormError, PasswordField, RolePicker } from './fields.jsx';

const SUBTITLES = {
  client: 'Accedi al tuo account per continuare il tuo percorso di benessere.',
  nutritionist: 'Accedi per seguire i tuoi clienti, i loro piani alimentari e i controlli.',
  trainer: 'Accedi per gestire schede, sessioni e progressi dei tuoi clienti.',
};

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
      const section = from?.split('?')[0].split('/')[2];
      const allowed = !section || section === 'supporto' || NAVIGATION[user.role].some((item) => item.path === section);
      navigate(from && allowed ? from : '/app', { replace: true });
    } catch (err) {
      setError(translateMessage(err.message));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell role={role}>
      <div className="mx-auto w-full max-w-[470px] roomy:py-6">
        <LogoStacked imgClassName="h-20 short:h-12 tiny:h-9 roomy:h-24" />
        <h1 className="mt-6 text-center font-display text-[32px] font-semibold short:mt-3 short:text-[26px] tiny:mt-2 tiny:text-xl roomy:mt-8 roomy:text-[36px]">
          {t('Bentornato!')}
        </h1>
        <p className="mx-auto mt-2 max-w-[360px] text-center text-[15px] leading-relaxed text-ink-500 short:mt-1 short:text-sm tiny:hidden">{t(SUBTITLES[role])}</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3.5 short:mt-4 short:space-y-2.5 tiny:mt-3 tiny:space-y-2 roomy:mt-8 roomy:space-y-4" noValidate>
          <RolePicker value={role} onChange={setRole} />
          <Field
            pill
            icon={UserRound}
            label={t('Email')}
            type="email"
            name="email"
            autoComplete="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <PasswordField
            pill
            icon={Lock}
            name="password"
            autoComplete="current-password"
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />

          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-1 text-[13px] sm:text-sm">
            <label className="inline-flex cursor-pointer items-center gap-2.5 text-ink-700">
              <input type="checkbox" className="peer sr-only" checked={form.remember} onChange={(e) => setForm({ ...form, remember: e.target.checked })} />
              <span className="grid h-5 w-5 place-items-center rounded-md border-2 border-ink-300 text-white transition peer-checked:border-primary peer-checked:bg-primary peer-focus-visible:ring-4 peer-focus-visible:ring-brand-100">
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
              </span>
              {t('Ricorda le mie credenziali')}
            </label>
            <button type="button" onClick={() => setShowForgot((v) => !v)} className="font-semibold text-brand-800 hover:underline" aria-expanded={showForgot}>
              {t('Password dimenticata?')}
            </button>
          </div>
          {showForgot && (
            <p className="rounded-2xl bg-brand-50 px-4 py-3 text-sm text-brand-900">
              {t('Il recupero automatico della password arriverà presto. Nel frattempo chiedi al tuo professionista di reimpostarla o scrivi all’assistenza Wellsyn.')}
            </p>
          )}

          <FormError>{error}</FormError>

          <button type="submit" className="btn-primary w-full py-4 text-base short:py-3 tiny:py-2.5 roomy:py-[18px]" disabled={loading}>
            {loading ? <Spinner className="h-5 w-5 text-white" /> : null}
            {t('Accedi')} <ArrowRight className="h-5 w-5" />
          </button>
        </form>

        <div className="my-5 flex items-center gap-4 text-sm text-ink-500 short:my-3 tiny:my-2 roomy:my-6">
          <span className="h-px flex-1 bg-line" /> {t('oppure')} <span className="h-px flex-1 bg-line" />
        </div>
        <Link
          to="/registrati"
          className="flex items-center justify-center gap-1.5 rounded-full border border-line bg-surface px-4 py-3.5 text-[15px] text-ink-700 transition hover:border-brand-300 hover:bg-soft short:py-3 tiny:py-2"
        >
          {t('Non hai un account?')} <span className="font-semibold text-brand-800">{t('Registrati ora')}</span>
          <ArrowRight className="h-4 w-4 text-brand-800" />
        </Link>
      </div>
    </AuthShell>
  );
}
