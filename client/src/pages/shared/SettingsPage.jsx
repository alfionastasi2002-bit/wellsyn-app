import { KeyRound, LogOut, UserRound } from 'lucide-react';
import { useState } from 'react';
import { Avatar } from '../../components/Avatar.jsx';
import { Flash, NumberInput, PageHeader, SaveButton, TextArea, TextInput, numberToText, toNumber, useFlash } from '../../components/forms.jsx';
import { Card, CardHeader } from '../../components/ui.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { FormError, PasswordField } from '../auth/fields.jsx';
import { api } from '../../lib/api.js';
import { displayName, fmtDate, ROLE_LABELS } from '../../lib/format.js';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  return (
    <div className="space-y-5">
      <PageHeader title="Impostazioni" subtitle="Gestisci il tuo profilo e la sicurezza del tuo account." />
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <ProfileForm />
        <div className="space-y-5">
          <PasswordForm />
          <Card className="p-5">
            <div className="flex items-center gap-4">
              <Avatar user={user} size="lg" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{displayName(user)}</p>
                <p className="truncate text-sm text-ink-500">
                  {ROLE_LABELS[user.role]} · {user.email}
                </p>
                <p className="text-xs text-ink-400">Su Wellsyn dal {fmtDate(user.createdAt)}</p>
              </div>
            </div>
            <button type="button" className="btn-soft mt-4" onClick={logout}>
              <LogOut className="h-4 w-4" /> Esci da Wellsyn
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ProfileForm() {
  const { user, updateUser } = useAuth();
  const isClient = user.role === 'client';
  const [form, setForm] = useState({
    firstName: user.firstName ?? '',
    lastName: user.lastName ?? '',
    phone: user.phone ?? '',
    title: user.title ?? '',
    specialization: user.specialization ?? '',
    bio: user.bio ?? '',
    goal: user.goal ?? '',
    heightCm: numberToText(user.heightCm),
    startWeightKg: numberToText(user.startWeightKg),
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useFlash();
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError('');
    const body = { firstName: form.firstName, lastName: form.lastName, phone: form.phone };
    if (isClient) {
      const heightCm = toNumber(form.heightCm);
      const startWeightKg = toNumber(form.startWeightKg);
      if (Number.isNaN(heightCm) || Number.isNaN(startWeightKg)) return setError('Altezza e peso devono essere numeri.');
      Object.assign(body, { goal: form.goal, heightCm, startWeightKg });
    } else {
      Object.assign(body, { title: form.title, specialization: form.specialization, bio: form.bio });
    }
    setSaving(true);
    try {
      const { user: updated } = await api('/auth/me', { method: 'PATCH', body });
      updateUser(updated);
      setFlash('Profilo aggiornato.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="p-5">
      <CardHeader icon={UserRound} title="Il tuo profilo" subtitle={isClient ? 'Questi dati li vedono i tuoi professionisti.' : 'Questi dati li vedono i tuoi clienti.'} />
      <form onSubmit={submit} className="mt-4 space-y-3" noValidate>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <TextInput label="Nome" value={form.firstName} onChange={set('firstName')} autoComplete="given-name" />
          <TextInput label="Cognome" value={form.lastName} onChange={set('lastName')} autoComplete="family-name" />
          <TextInput label="Email" value={user.email} disabled hint="L'email serve per accedere e non si può cambiare da qui." />
          <TextInput label="Telefono (facoltativo)" type="tel" value={form.phone} onChange={set('phone')} autoComplete="tel" />
        </div>
        {isClient ? (
          <>
            <TextInput label="Obiettivo principale" placeholder="es. Aumentare la forza e sentirmi più energica" value={form.goal} onChange={set('goal')} />
            <div className="grid grid-cols-2 gap-3">
              <NumberInput label="Altezza" suffix="cm" value={form.heightCm} onChange={set('heightCm')} />
              <NumberInput label="Peso di partenza" suffix="kg" value={form.startWeightKg} onChange={set('startWeightKg')} hint="Serve a calcolare i progressi." />
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[140px_minmax(0,1fr)]">
              <TextInput label="Titolo" placeholder="es. Dott.ssa" value={form.title} onChange={set('title')} />
              <TextInput label="Qualifica" placeholder="es. Biologa Nutrizionista" value={form.specialization} onChange={set('specialization')} />
            </div>
            <TextArea label="Presentazione breve" rows={3} maxLength={280} placeholder="Di cosa ti occupi, in una o due frasi" value={form.bio} onChange={set('bio')} />
          </>
        )}
        <FormError>{error}</FormError>
        <Flash>{flash}</Flash>
        <SaveButton saving={saving}>Salva profilo</SaveButton>
      </form>
    </Card>
  );
}

function PasswordForm() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useFlash();
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (form.newPassword.length < 8) return setError('La nuova password deve avere almeno 8 caratteri.');
    if (form.newPassword !== form.confirm) return setError('Le due nuove password non coincidono.');
    setSaving(true);
    try {
      await api('/auth/password', { method: 'PUT', body: { currentPassword: form.currentPassword, newPassword: form.newPassword } });
      setForm({ currentPassword: '', newPassword: '', confirm: '' });
      setFlash('Password aggiornata.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="p-5">
      <CardHeader icon={KeyRound} title="Cambia password" />
      <form onSubmit={submit} className="mt-4 space-y-3" noValidate>
        <PasswordField label="Password attuale" autoComplete="current-password" value={form.currentPassword} onChange={set('currentPassword')} />
        <PasswordField label="Nuova password" autoComplete="new-password" placeholder="Almeno 8 caratteri" value={form.newPassword} onChange={set('newPassword')} />
        <PasswordField label="Ripeti la nuova password" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} />
        <FormError>{error}</FormError>
        <Flash>{flash}</Flash>
        <SaveButton saving={saving}>Aggiorna password</SaveButton>
      </form>
    </Card>
  );
}
