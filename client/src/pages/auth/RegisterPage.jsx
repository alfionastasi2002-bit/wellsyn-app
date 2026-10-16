import { BadgeCheck, ChevronLeft, ChevronRight, Lock, Mail, UserRound } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { LogoStacked } from '../../components/Logo.jsx';
import { Spinner } from '../../components/ui.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
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
    if (form.password.length < 8) return setError('La password deve avere almeno 8 caratteri.');
    setLoading(true);
    try {
      await register({ ...form, specialization: isProfessional ? form.specialization : undefined });
      navigate('/app', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <div className="mx-auto max-w-[460px]">
        <LogoStacked imgClassName="h-12 short:h-9" />
        <h1 className="mt-5 text-center font-display text-[28px] font-semibold short:mt-2 short:text-2xl">Crea il tuo account</h1>
        <p className="mt-2 text-center text-[15px] text-ink-500 short:mt-1 short:text-sm">
          {isProfessional
            ? 'Gestisci i tuoi clienti, i loro piani e i progressi in un unico spazio.'
            : 'Se segui già un professionista, potrà collegarti al suo spazio con la tua email.'}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3 short:mt-4 short:space-y-2.5" noValidate>
          <RolePicker value={form.role} onChange={(role) => setForm({ ...form, role })} />
          <div className="grid gap-3 short:gap-2.5 sm:grid-cols-2">
            <Field icon={UserRound} label="Nome" name="firstName" autoComplete="given-name" required value={form.firstName} onChange={set('firstName')} />
            <Field label="Cognome" name="lastName" autoComplete="family-name" required value={form.lastName} onChange={set('lastName')} />
          </div>
          {isProfessional && (
            <Field
              icon={BadgeCheck}
              label="Qualifica (facoltativa)"
              name="specialization"
              placeholder={form.role === 'nutritionist' ? 'es. Biologa Nutrizionista' : 'es. Personal Trainer certificato'}
              value={form.specialization}
              onChange={set('specialization')}
            />
          )}
          <Field icon={Mail} label="Email" type="email" name="email" autoComplete="email" placeholder="nome@email.com" required value={form.email} onChange={set('email')} />
          <PasswordField
            icon={Lock}
            name="password"
            autoComplete="new-password"
            placeholder="Almeno 8 caratteri"
            required
            value={form.password}
            onChange={set('password')}
          />

          <FormError>{error}</FormError>

          <button type="submit" className="btn-primary w-full py-3.5 text-base short:py-3" disabled={loading}>
            {loading && <Spinner className="h-5 w-5 text-white" />}
            Crea account <ChevronRight className="h-5 w-5" />
          </button>
        </form>

        <Link to="/login" className="mt-5 flex items-center justify-center gap-1 text-sm font-medium text-brand-800 hover:underline short:mt-3">
          <ChevronLeft className="h-4 w-4" /> Hai già un account? Accedi
        </Link>
      </div>
    </AuthShell>
  );
}
