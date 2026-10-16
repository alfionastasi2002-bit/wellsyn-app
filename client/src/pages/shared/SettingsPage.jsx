import {
  Briefcase,
  Camera,
  Check,
  Eye,
  HeartPulse,
  KeyRound,
  Languages,
  LogOut,
  MapPin,
  Monitor,
  Moon,
  Palette,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Sun,
  Trash2,
  UserRound,
  Video,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { Avatar, AVATAR_COLORS } from '../../components/Avatar.jsx';
import { DatePicker } from '../../components/DatePicker.jsx';
import { Chip, Segmented } from '../../components/editor.jsx';
import { Flash, NumberInput, PageHeader, SaveButton, Tabs, TextArea, TextInput, numberToText, toNumber, useFlash } from '../../components/forms.jsx';
import { Card, CardHeader, Spinner } from '../../components/ui.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { usePreferences } from '../../context/PreferencesContext.jsx';
import { LANGUAGES, t, translateMessage } from '../../i18n/index.js';
import { api } from '../../lib/api.js';
import { displayName, fmtDate, fmtNumber, ROLE_LABELS, todayKey } from '../../lib/format.js';
import { WEEKDAYS } from '../../lib/labels.js';
import { FormError, PasswordField } from '../auth/fields.jsx';
import { DURATIONS, timeOptions } from '../agenda/agendaUtils.js';

// Sfondi della copertina del profilo
const COVERS = {
  mint: 'linear-gradient(120deg, #d9f0e7 0%, #a8dcc8 100%)',
  ocean: 'linear-gradient(120deg, #d6e8f7 0%, #9cc3e6 100%)',
  sunset: 'linear-gradient(120deg, #fde3cf 0%, #f6b89a 100%)',
  forest: 'linear-gradient(120deg, #cfe5c9 0%, #7fb27a 100%)',
  lavender: 'linear-gradient(120deg, #e6defa 0%, #bfaee9 100%)',
  sand: 'linear-gradient(120deg, #f3ead9 0%, #dcc7a1 100%)',
};

const ACTIVITY = [
  { value: 'sedentario', label: 'Sedentario' },
  { value: 'leggero', label: 'Leggero' },
  { value: 'moderato', label: 'Moderato' },
  { value: 'attivo', label: 'Attivo' },
  { value: 'molto_attivo', label: 'Molto attivo' },
];
const DIET_TAGS = ['Vegetariano', 'Vegano', 'Senza glutine', 'Senza lattosio', 'Pescetariano', 'Low carb', 'Halal', 'Kosher'];
const SPECIALTIES = {
  nutritionist: ['Nutrizione sportiva', 'Dimagrimento', 'Educazione alimentare', 'Ricomposizione corporea', 'Alimentazione vegetale', 'Disturbi gastrointestinali', 'Gravidanza e allattamento'],
  trainer: ['Forza', 'Ipertrofia', 'Dimagrimento', 'Mobilità', 'Ricomposizione', 'Preparazione atletica', 'Postura', 'Over 60'],
};

/** Salva una parte del profilo e aggiorna i dati in tutta l'app. */
function useProfileSave() {
  const { updateUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [flash, setFlash] = useFlash();
  async function save(body, message = t('Profilo aggiornato.')) {
    setError('');
    setSaving(true);
    try {
      const { user } = await api('/auth/me', { method: 'PATCH', body });
      updateUser(user);
      setFlash(message);
      return true;
    } catch (err) {
      setError(translateMessage(err.message));
      return false;
    } finally {
      setSaving(false);
    }
  }
  return { save, saving, error, setError, flash };
}

export default function SettingsPage() {
  const { user } = useAuth();
  const isClient = user.role === 'client';
  const [tab, setTab] = useState('profile');

  return (
    <div className="space-y-5">
      <PageHeader title={t('Profilo e impostazioni')} subtitle={t('Personalizza come ti vedono gli altri, il tuo lavoro e l’aspetto di Wellsyn.')} />
      <ProfileHero />
      <Tabs
        className="w-fit max-w-full"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'profile', label: t('Dati personali') },
          { value: 'details', label: isClient ? t('Obiettivi e salute') : t('Professione e orari') },
          { value: 'look', label: t('Aspetto') },
          { value: 'security', label: t('Sicurezza') },
        ]}
      />
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          {tab === 'profile' && <PersonalForm />}
          {tab === 'details' && (isClient ? <ClientDetailsForm /> : <ProDetailsForm />)}
          {tab === 'look' && <Appearance />}
          {tab === 'security' && <Security />}
        </div>
        <PublicPreview />
      </div>
    </div>
  );
}

// Copertina con foto

/** Riduce l'immagine scelta a un quadrato di 256 px (JPEG leggero). */
function resizeImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(t('Impossibile leggere il file.')));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error(t('Il file scelto non è un’immagine valida.')));
      img.onload = () => {
        const size = 256;
        const side = Math.min(img.width, img.height);
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function ProfileHero() {
  const { user } = useAuth();
  const { save, saving, error, setError, flash } = useProfileSave();
  const fileRef = useRef(null);

  async function onFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) return setError(t('Il file scelto non è un’immagine valida.'));
    if (file.size > 15 * 1024 * 1024) return setError(t('L’immagine è troppo grande (massimo 15 MB).'));
    try {
      const avatarUrl = await resizeImage(file);
      await save({ avatarUrl }, t('Foto profilo aggiornata.'));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <Card className="overflow-hidden">
      <div className="h-28 sm:h-36" style={{ background: COVERS[user.coverStyle] ?? COVERS.mint }} />
      <div className="flex flex-col gap-4 px-5 pb-5 sm:flex-row sm:items-end">
        <div className="relative -mt-14 w-fit">
          <Avatar user={user} size="2xl" className="ring-4 ring-surface" />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="absolute right-0 bottom-1 grid h-9 w-9 place-items-center rounded-full bg-primary text-white shadow-float ring-2 ring-surface hover:bg-primary-strong"
            aria-label={t('Cambia foto profilo')}
            title={t('Cambia foto profilo')}
          >
            {saving ? <Spinner className="h-4 w-4 text-white" /> : <Camera className="h-4 w-4" />}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-display text-2xl font-semibold">{displayName(user)}</h2>
          <p className="truncate text-sm text-ink-500">
            {ROLE_LABELS[user.role]}
            {user.specialization && user.role !== 'client' && ` · ${user.specialization}`} · {user.email}
          </p>
          <p className="text-xs text-ink-400">{t('Su Wellsyn dal {date}', { date: fmtDate(user.createdAt) })}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-outline" onClick={() => fileRef.current?.click()} disabled={saving}>
            <Camera className="h-4 w-4" /> {user.avatarUrl ? t('Cambia foto') : t('Carica una foto')}
          </button>
          {user.avatarUrl && (
            <button type="button" className="btn-soft" onClick={() => save({ avatarUrl: null }, t('Foto rimossa.'))} disabled={saving}>
              <Trash2 className="h-4 w-4" /> {t('Rimuovi')}
            </button>
          )}
        </div>
      </div>
      {(error || flash) && (
        <div className="px-5 pb-5">
          <FormError>{error}</FormError>
          <Flash>{flash}</Flash>
        </div>
      )}
    </Card>
  );
}

// Dati personali

function PersonalForm() {
  const { user } = useAuth();
  const isClient = user.role === 'client';
  const [form, setForm] = useState({
    firstName: user.firstName ?? '',
    lastName: user.lastName ?? '',
    title: user.title ?? '',
    phone: user.phone ?? '',
    city: user.city ?? '',
    birthDate: user.birthDate ?? '',
  });
  const { save, saving, error, flash } = useProfileSave();
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  function submit(e) {
    e.preventDefault();
    const body = { firstName: form.firstName, lastName: form.lastName, phone: form.phone, city: form.city, birthDate: form.birthDate || null };
    if (!isClient) body.title = form.title;
    save(body);
  }

  return (
    <Card className="p-5">
      <CardHeader icon={UserRound} title={t('Dati personali')} subtitle={isClient ? t('Questi dati li vedono i tuoi professionisti.') : t('Questi dati li vedono i tuoi clienti.')} />
      <form onSubmit={submit} className="mt-4 space-y-3" noValidate>
        <div className={`grid grid-cols-1 gap-3 ${isClient ? 'sm:grid-cols-2' : 'sm:grid-cols-[120px_minmax(0,1fr)_minmax(0,1fr)]'}`}>
          {!isClient && <TextInput label={t('Titolo')} placeholder={t('es. Dott.ssa')} value={form.title} onChange={set('title')} />}
          <TextInput label={t('Nome')} value={form.firstName} onChange={set('firstName')} autoComplete="given-name" />
          <TextInput label={t('Cognome')} value={form.lastName} onChange={set('lastName')} autoComplete="family-name" />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <TextInput label={t('Email')} value={user.email} disabled hint={t("L'email serve per accedere e non si può cambiare da qui.")} />
          <TextInput label={t('Telefono (facoltativo)')} type="tel" value={form.phone} onChange={set('phone')} autoComplete="tel" />
          <TextInput label={t('Città (facoltativa)')} placeholder={t('es. Milano')} value={form.city} onChange={set('city')} autoComplete="address-level2" />
          <DatePicker label={t('Data di nascita (facoltativa)')} value={form.birthDate} onChange={(birthDate) => setForm({ ...form, birthDate })} max={todayKey()} clearable placeholder={t('Nessuna data')} />
        </div>
        <FormError>{error}</FormError>
        <Flash>{flash}</Flash>
        <SaveButton saving={saving}>{t('Salva')}</SaveButton>
      </form>
    </Card>
  );
}

// Etichette personalizzabili

function TagPicker({ label, value, onChange, presets, max }) {
  const [custom, setCustom] = useState('');
  const toggle = (tag) => onChange(value.includes(tag) ? value.filter((x) => x !== tag) : value.length < max ? [...value, tag] : value);
  const extra = value.filter((v) => !presets.map((p) => t(p)).includes(v));
  function add() {
    const tag = custom.trim();
    if (tag && !value.includes(tag) && value.length < max) onChange([...value, tag]);
    setCustom('');
  }
  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-ink-700">
        {label} <span className="font-normal text-ink-400">({value.length}/{max})</span>
      </span>
      <div className="flex flex-wrap gap-1.5">
        {presets.map((p) => (
          <Chip key={p} active={value.includes(t(p))} onClick={() => toggle(t(p))} className="px-2.5 py-1 text-xs">
            {value.includes(t(p)) && <Check className="h-3 w-3" />} {t(p)}
          </Chip>
        ))}
        {extra.map((tag) => (
          <Chip key={tag} active onClick={() => toggle(tag)} className="px-2.5 py-1 text-xs">
            <Check className="h-3 w-3" /> {tag}
          </Chip>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
          maxLength={40}
          placeholder={t('Aggiungi una voce…')}
          aria-label={t('Aggiungi una voce')}
          className="min-w-0 flex-1 rounded-xl border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-brand-500"
        />
        <button type="button" className="btn-soft px-3" onClick={add} disabled={!custom.trim() || value.length >= max} aria-label={t('Aggiungi')}>
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// Cliente: obiettivi e salute

function ClientDetailsForm() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    goal: user.goal ?? '',
    heightCm: numberToText(user.heightCm),
    startWeightKg: numberToText(user.startWeightKg),
    targetWeightKg: numberToText(user.targetWeightKg),
    activityLevel: user.activityLevel ?? '',
    dietPreferences: user.dietPreferences ?? [],
    allergies: user.allergies ?? '',
  });
  const { save, saving, error, setError, flash } = useProfileSave();
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const height = toNumber(form.heightCm);
  const weight = toNumber(form.startWeightKg);
  const bmi = height && weight && !Number.isNaN(height) && !Number.isNaN(weight) ? weight / (height / 100) ** 2 : null;

  function submit(e) {
    e.preventDefault();
    const numbers = Object.fromEntries(['heightCm', 'startWeightKg', 'targetWeightKg'].map((k) => [k, toNumber(form[k])]));
    if (Object.values(numbers).some((n) => Number.isNaN(n))) return setError(t('Altezza e peso devono essere numeri.'));
    save({ goal: form.goal, ...numbers, activityLevel: form.activityLevel || null, dietPreferences: form.dietPreferences, allergies: form.allergies });
  }

  return (
    <Card className="p-5">
      <CardHeader icon={HeartPulse} title={t('Obiettivi e salute')} subtitle={t('Aiutano i tuoi professionisti a preparare piani su misura per te.')} />
      <form onSubmit={submit} className="mt-4 space-y-4" noValidate>
        <TextInput label={t('Obiettivo principale')} placeholder={t('es. Aumentare la forza e sentirmi più energica')} value={form.goal} onChange={set('goal')} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <NumberInput label={t('Altezza')} suffix="cm" value={form.heightCm} onChange={set('heightCm')} />
          <NumberInput label={t('Peso di partenza')} suffix="kg" value={form.startWeightKg} onChange={set('startWeightKg')} />
          <NumberInput label={t('Peso obiettivo')} suffix="kg" value={form.targetWeightKg} onChange={set('targetWeightKg')} />
        </div>
        {bmi && (
          <p className="text-xs text-ink-500">
            {t('Indice di massa corporea (BMI) di partenza: {bmi}', { bmi: fmtNumber(bmi) })}
          </p>
        )}
        <Segmented
          label={t('Livello di attività')}
          value={form.activityLevel}
          onChange={(activityLevel) => setForm({ ...form, activityLevel })}
          options={ACTIVITY.map((a) => ({ value: a.value, label: t(a.label) }))}
        />
        <TagPicker label={t('Preferenze alimentari')} value={form.dietPreferences} onChange={(dietPreferences) => setForm({ ...form, dietPreferences })} presets={DIET_TAGS} max={10} />
        <TextArea label={t('Allergie e intolleranze')} rows={2} maxLength={200} placeholder={t('es. Frutta a guscio, crostacei')} value={form.allergies} onChange={set('allergies')} />
        <FormError>{error}</FormError>
        <Flash>{flash}</Flash>
        <SaveButton saving={saving}>{t('Salva')}</SaveButton>
      </form>
    </Card>
  );
}

// Professionista: professione e orari

function ProDetailsForm() {
  const { user } = useAuth();
  const wh = user.workingHours ?? {};
  const [form, setForm] = useState({
    specialization: user.specialization ?? '',
    bio: user.bio ?? '',
    specialties: user.specialties ?? [],
    yearsExperience: numberToText(user.yearsExperience),
    studioAddress: user.studioAddress ?? '',
    onlineSessions: Boolean(user.onlineSessions),
    days: wh.days?.length ? wh.days : [1, 2, 3, 4, 5],
    start: wh.start ?? '09:00',
    end: wh.end ?? '18:00',
    appointmentMinutes: user.appointmentMinutes ?? (user.role === 'trainer' ? 60 : 45),
  });
  const { save, saving, error, setError, flash } = useProfileSave();
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const toggleDay = (d) => setForm({ ...form, days: form.days.includes(d) ? form.days.filter((x) => x !== d) : [...form.days, d].sort() });

  function submit(e) {
    e.preventDefault();
    const yearsExperience = toNumber(form.yearsExperience);
    if (Number.isNaN(yearsExperience)) return setError(t('Gli anni di esperienza devono essere un numero.'));
    if (form.end <= form.start) return setError(t("L'orario di fine lavoro deve essere dopo quello di inizio."));
    save({
      specialization: form.specialization,
      bio: form.bio,
      specialties: form.specialties,
      yearsExperience,
      studioAddress: form.studioAddress,
      onlineSessions: form.onlineSessions,
      workingHours: { days: form.days, start: form.start, end: form.end },
      appointmentMinutes: form.appointmentMinutes,
    });
  }

  const times = timeOptions(5 * 60, 23 * 60);
  return (
    <Card className="p-5">
      <CardHeader icon={Briefcase} title={t('Professione e orari')} subtitle={t('Le informazioni professionali le vedono i tuoi clienti; gli orari servono all’agenda.')} />
      <form onSubmit={submit} className="mt-4 space-y-4" noValidate>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_160px]">
          <TextInput label={t('Qualifica')} placeholder={t('es. Biologa Nutrizionista')} value={form.specialization} onChange={set('specialization')} />
          <NumberInput label={t('Anni di esperienza')} value={form.yearsExperience} onChange={set('yearsExperience')} />
        </div>
        <TextArea label={t('Presentazione breve')} rows={3} maxLength={280} placeholder={t('Di cosa ti occupi, in una o due frasi')} value={form.bio} onChange={set('bio')} />
        <TagPicker label={t('Specializzazioni')} value={form.specialties} onChange={(specialties) => setForm({ ...form, specialties })} presets={SPECIALTIES[user.role]} max={8} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <TextInput label={t('Studio o palestra (facoltativo)')} placeholder={t('es. Via Roma 10, Milano')} value={form.studioAddress} onChange={set('studioAddress')} />
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-line px-3.5 py-2.5">
            <input type="checkbox" className="peer sr-only" checked={form.onlineSessions} onChange={(e) => setForm({ ...form, onlineSessions: e.target.checked })} />
            <span className={`relative h-6 w-10 shrink-0 rounded-full transition ${form.onlineSessions ? 'bg-brand-600' : 'bg-ink-300'}`}>
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${form.onlineSessions ? 'left-[18px]' : 'left-0.5'}`} />
            </span>
            <span className="text-sm font-medium text-ink-700">{t('Anche online')}</span>
          </label>
        </div>

        <div className="rounded-2xl border border-line p-4">
          <p className="text-sm font-semibold">{t('Orario di lavoro')}</p>
          <p className="text-xs text-ink-500">{t('L’agenda evidenzia queste ore e propone il primo orario libero al loro interno.')}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {WEEKDAYS.map((w) => (
              <Chip key={w.value} active={form.days.includes(w.value)} onClick={() => toggleDay(w.value)} className="px-2.5 py-1 text-xs">
                {w.short}
              </Chip>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:max-w-sm">
            {[
              ['start', t('Dalle')],
              ['end', t('Alle')],
            ].map(([key, label]) => (
              <label key={key} className="block">
                <span className="mb-1 block text-xs font-medium text-ink-500">{label}</span>
                <select value={form[key]} onChange={set(key)} className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-brand-500">
                  {times.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          <p className="mt-4 text-sm font-medium text-ink-700">{t('Durata predefinita di un appuntamento')}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {DURATIONS.map((m) => (
              <Chip key={m} active={form.appointmentMinutes === m} onClick={() => setForm({ ...form, appointmentMinutes: m })} className="px-2.5 py-1 text-xs">
                {m} min
              </Chip>
            ))}
          </div>
        </div>
        <FormError>{error}</FormError>
        <Flash>{flash}</Flash>
        <SaveButton saving={saving}>{t('Salva')}</SaveButton>
      </form>
    </Card>
  );
}

// Aspetto

function OptionCard({ active, onClick, icon: Icon, label, preview }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`relative flex flex-col overflow-hidden rounded-2xl border-2 text-left transition ${active ? 'border-brand-600' : 'border-line hover:border-brand-300'}`}
    >
      {preview}
      <span className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium">
        <Icon className="h-4 w-4 text-brand-700" /> {label}
        {active && <Check className="ml-auto h-4 w-4 text-brand-700" />}
      </span>
    </button>
  );
}

const ThemePreview = ({ dark }) => (
  <span className={`block h-20 p-2.5 ${dark ? 'bg-[#0d1315]' : 'bg-[#f6f9f8]'}`}>
    <span className={`flex h-full gap-1.5 rounded-lg p-1.5 ${dark ? 'bg-[#141c1f]' : 'bg-white'}`}>
      <span className={`w-1/4 rounded ${dark ? 'bg-[#1d282c]' : 'bg-[#eef2f1]'}`} />
      <span className="flex flex-1 flex-col gap-1">
        <span className={`h-2 w-2/3 rounded ${dark ? 'bg-[#c3cdd3]' : 'bg-[#172233]'}`} />
        <span className={`h-1.5 w-1/2 rounded ${dark ? 'bg-[#56626e]' : 'bg-[#b8c0cc]'}`} />
        <span className="mt-auto h-3 w-1/3 rounded bg-[#1e8576]" />
      </span>
    </span>
  </span>
);

function Appearance() {
  const { user, savePreferences } = useAuth();
  const prefs = usePreferences();
  const { save, error } = useProfileSave();

  return (
    <div className="space-y-5">
      <Card className="p-5">
        <CardHeader icon={Palette} title={t('Tema')} subtitle={t('Scegli come vuoi vedere Wellsyn: vale su ogni dispositivo da cui accedi.')} />
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <OptionCard active={prefs.theme === 'light'} onClick={() => savePreferences({ theme: 'light' })} icon={Sun} label={t('Chiaro')} preview={<ThemePreview />} />
          <OptionCard active={prefs.theme === 'dark'} onClick={() => savePreferences({ theme: 'dark' })} icon={Moon} label={t('Scuro')} preview={<ThemePreview dark />} />
          <OptionCard
            active={prefs.theme === 'system'}
            onClick={() => savePreferences({ theme: 'system' })}
            icon={Monitor}
            label={t('Automatico')}
            preview={
              <span className="flex h-20">
                <span className="w-1/2 overflow-hidden">
                  <ThemePreview />
                </span>
                <span className="w-1/2 overflow-hidden">
                  <ThemePreview dark />
                </span>
              </span>
            }
          />
        </div>
      </Card>

      <Card className="p-5">
        <CardHeader icon={Languages} title={t('Lingua')} />
        <div className="mt-4 grid grid-cols-2 gap-3 sm:max-w-md">
          {LANGUAGES.map((l) => (
            <button
              key={l.value}
              type="button"
              onClick={() => prefs.language !== l.value && savePreferences({ language: l.value })}
              aria-pressed={prefs.language === l.value}
              className={`flex items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left transition ${prefs.language === l.value ? 'border-brand-600 bg-brand-50' : 'border-line hover:border-brand-300'}`}
            >
              <span className="grid h-9 w-9 place-items-center rounded-full bg-surface text-xs font-bold text-brand-800 shadow-card">{l.short}</span>
              <span className="font-medium">{l.label}</span>
              {prefs.language === l.value && <Check className="ml-auto h-4 w-4 text-brand-700" />}
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <CardHeader icon={UserRound} title={t('Avatar e copertina')} subtitle={t('Il colore dell’avatar si vede quando non hai una foto.')} />
        <p className="mt-4 text-sm font-medium text-ink-700">{t('Colore dell’avatar')}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {Object.entries(AVATAR_COLORS).map(([key, cls]) => (
            <button
              key={key}
              type="button"
              onClick={() => save({ avatarColor: key }, t('Colore aggiornato.'))}
              className={`grid h-11 w-11 place-items-center rounded-full font-display text-sm font-semibold ${cls} ${user.avatarColor === key ? 'ring-2 ring-brand-600 ring-offset-2 ring-offset-surface' : ''}`}
              aria-label={t('Colore {n}', { n: key })}
              aria-pressed={user.avatarColor === key}
            >
              {`${user.firstName[0]}${user.lastName[0]}`.toUpperCase()}
            </button>
          ))}
        </div>
        <p className="mt-5 text-sm font-medium text-ink-700">{t('Copertina del profilo')}</p>
        <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {Object.entries(COVERS).map(([key, background]) => (
            <button
              key={key}
              type="button"
              onClick={() => save({ coverStyle: key }, t('Copertina aggiornata.'))}
              className={`h-12 rounded-xl ${(user.coverStyle ?? 'mint') === key ? 'ring-2 ring-brand-600 ring-offset-2 ring-offset-surface' : ''}`}
              style={{ background }}
              aria-label={t('Copertina {n}', { n: key })}
              aria-pressed={(user.coverStyle ?? 'mint') === key}
            />
          ))}
        </div>
        <FormError>{error}</FormError>
      </Card>

      <Card className="p-5">
        <CardHeader icon={prefs.sidebarCollapsed ? PanelLeftClose : PanelLeftOpen} title={t('Menu laterale')} subtitle={t('Da computer puoi ridurlo alle sole icone anche con il pulsante sul suo bordo.')} />
        <Segmented
          className="mt-4 sm:max-w-sm"
          value={prefs.sidebarCollapsed ? 'slim' : 'full'}
          onChange={(v) => prefs.update({ sidebarCollapsed: v === 'slim' })}
          options={[
            { value: 'full', label: t('Espanso') },
            { value: 'slim', label: t('Solo icone') },
          ]}
        />
      </Card>
    </div>
  );
}

// Sicurezza

function Security() {
  const { logout } = useAuth();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useFlash();
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (form.newPassword.length < 8) return setError(t('La nuova password deve avere almeno 8 caratteri.'));
    if (form.newPassword !== form.confirm) return setError(t('Le due nuove password non coincidono.'));
    setSaving(true);
    try {
      await api('/auth/password', { method: 'PUT', body: { currentPassword: form.currentPassword, newPassword: form.newPassword } });
      setForm({ currentPassword: '', newPassword: '', confirm: '' });
      setFlash(t('Password aggiornata.'));
    } catch (err) {
      setError(translateMessage(err.message));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <Card className="p-5">
        <CardHeader icon={KeyRound} title={t('Cambia password')} />
        <form onSubmit={submit} className="mt-4 space-y-3" noValidate>
          <PasswordField label={t('Password attuale')} autoComplete="current-password" value={form.currentPassword} onChange={set('currentPassword')} />
          <PasswordField label={t('Nuova password')} autoComplete="new-password" placeholder={t('Almeno 8 caratteri')} value={form.newPassword} onChange={set('newPassword')} />
          <PasswordField label={t('Ripeti la nuova password')} autoComplete="new-password" value={form.confirm} onChange={set('confirm')} />
          <FormError>{error}</FormError>
          <Flash>{flash}</Flash>
          <SaveButton saving={saving}>{t('Aggiorna password')}</SaveButton>
        </form>
      </Card>
      <Card className="flex flex-wrap items-center justify-between gap-3 p-5">
        <p className="text-sm text-ink-700">{t('Hai finito? Esci dal tuo account su questo dispositivo.')}</p>
        <button type="button" className="btn-soft" onClick={logout}>
          <LogOut className="h-4 w-4" /> {t('Esci da Wellsyn')}
        </button>
      </Card>
    </div>
  );
}

// Anteprima pubblica

function PublicPreview() {
  const { user } = useAuth();
  const isClient = user.role === 'client';
  const activity = ACTIVITY.find((a) => a.value === user.activityLevel);
  return (
    <div className="h-fit xl:sticky xl:top-24">
      <p className="mb-2 flex items-center gap-2 text-xs font-semibold tracking-wider text-ink-500 uppercase">
        <Eye className="h-3.5 w-3.5" /> {isClient ? t('Così ti vedono i tuoi professionisti') : t('Così ti vedono i tuoi clienti')}
      </p>
      <Card className="overflow-hidden">
        <div className="h-16" style={{ background: COVERS[user.coverStyle] ?? COVERS.mint }} />
        <div className="px-5 pb-5">
          <Avatar user={user} size="xl" className="-mt-10 ring-4 ring-surface" />
          <p className="mt-2 font-display text-lg font-semibold">{displayName(user)}</p>
          <p className="text-sm text-ink-500">{isClient ? ROLE_LABELS.client : user.specialization || ROLE_LABELS[user.role]}</p>
          {!isClient && (
            <>
              <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-500">
                {user.yearsExperience != null && <span>{t('{n} anni di esperienza', { n: user.yearsExperience })}</span>}
                {user.city && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {user.city}
                  </span>
                )}
                {user.onlineSessions && (
                  <span className="inline-flex items-center gap-1">
                    <Video className="h-3 w-3" /> {t('Anche online')}
                  </span>
                )}
              </p>
              {user.bio && <p className="mt-3 text-sm text-ink-700">{user.bio}</p>}
              {user.specialties?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {user.specialties.map((s) => (
                    <span key={s} className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-800">
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </>
          )}
          {isClient && (
            <div className="mt-3 space-y-1.5 text-sm">
              {user.goal && (
                <p>
                  <span className="text-ink-500">{t('Obiettivo')}:</span> {user.goal}
                </p>
              )}
              <p className="flex flex-wrap gap-x-4 gap-y-1 text-ink-700">
                {user.heightCm && <span>{user.heightCm} cm</span>}
                {user.targetWeightKg && <span>{t('Obiettivo {n} kg', { n: fmtNumber(user.targetWeightKg) })}</span>}
                {activity && <span>{t('Attività: {level}', { level: t(activity.label).toLowerCase() })}</span>}
              </p>
              {user.dietPreferences?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {user.dietPreferences.map((s) => (
                    <span key={s} className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-800">
                      {s}
                    </span>
                  ))}
                </div>
              )}
              {user.allergies && <p className="text-xs text-amber-700">{t('Allergie: {list}', { list: user.allergies })}</p>}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
