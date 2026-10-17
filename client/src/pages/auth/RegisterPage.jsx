import { ArrowLeft, ArrowRight, BadgeCheck, Lock, Mail, UserRound } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { LogoStacked } from '../../components/Logo.jsx';
import { Spinner } from '../../components/ui.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { t, translateMessage } from '../../i18n/index.js';
import { AuthShell } from './AuthShell.jsx';
import { Field, FormError, PasswordField, RolePicker } from './fields.jsx';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ role: 'client', firstName: '', lastName: '', email: '', password: '', specialization: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const isProfessional = form.role !== 'client';

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (form.password.length < 8) return setError(t('La password deve avere almeno 8 caratteri.'));
    setLoading(true);
    try {
      await register({ ...form, specialization: isProfessional ? form.specialization : undefined });
      navigate('/app', { replace: true });
    } catch (err) {
      setError(translateMessage(err.message));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell role={form.role}>
      <div className="mx-auto w-full max-w-[470px]">
        <LogoStacked imgClassName="h-14 short:h-10 tiny:h-7" />
        <h1 className="mt-5 text-center font-display text-[30px] font-semibold short:mt-2 short:text-2xl tiny:mt-1 tiny:text-lg">{t('Crea il tuo account')}</h1>
        <p className="mt-2 text-center text-[15px] text-ink-500 short:mt-1 short:text-sm tiny:hidden">
          {isProfessional
            ? t('Gestisci i tuoi clienti, i loro piani e i progressi in un unico spazio.')
            : t('Se segui già un professionista, potrà collegarti al suo spazio con la tua email.')}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3 short:mt-4 short:space-y-2.5 tiny:mt-3 tiny:space-y-1.5" noValidate>
          <RolePicker value={form.role} onChange={(role) => setForm({ ...form, role })} />
          <div className="grid grid-cols-2 gap-3 short:gap-2.5 tiny:gap-2">
            <Field pill icon={UserRound} label={t('Nome')} name="firstName" autoComplete="given-name" required value={form.firstName} onChange={set('firstName')} />
            <Field pill label={t('Cognome')} name="lastName" autoComplete="family-name" required value={form.lastName} onChange={set('lastName')} />
          </div>
          {isProfessional && (
            <Field
              pill
              icon={BadgeCheck}
              label={t('Qualifica (facoltativa)')}
              name="specialization"
              placeholder={form.role === 'nutritionist' ? t('Qualifica (es. Biologa Nutrizionista)') : t('Qualifica (es. Personal Trainer certificato)')}
              value={form.specialization}
              onChange={set('specialization')}
            />
          )}
          <Field pill icon={Mail} label={t('Email')} type="email" name="email" autoComplete="email" required value={form.email} onChange={set('email')} />
          <PasswordField
            pill
            icon={Lock}
            name="password"
            autoComplete="new-password"
            placeholder={t('Password (almeno 8 caratteri)')}
            required
            value={form.password}
            onChange={set('password')}
          />

          <FormError>{error}</FormError>

          <button type="submit" className="btn-primary w-full py-4 text-base short:py-3 tiny:py-2.5" disabled={loading}>
            {loading && <Spinner className="h-5 w-5 text-white" />}
            {t('Crea account')} <ArrowRight className="h-5 w-5" />
          </button>
        </form>

        <Link
          to="/login"
          className="mt-5 block rounded-full border border-line bg-surface px-4 py-3 text-center text-[14px] text-ink-700 transition hover:border-brand-300 hover:bg-soft sm:text-[15px] short:mt-3 short:py-2.5 tiny:mt-2 tiny:py-2"
        >
          <ArrowLeft className="mr-1.5 inline h-4 w-4 align-[-3px] text-brand-800" />
          {t('Hai già un account?')} <span className="font-semibold whitespace-nowrap text-brand-800">{t('Accedi')}</span>
        </Link>
      </div>
    </AuthShell>
  );
}
