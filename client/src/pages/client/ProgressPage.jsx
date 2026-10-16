import { ChartNoAxesColumn, ClipboardList, Dumbbell, Scale, Target } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { Flash, NumberInput, PageHeader, SaveButton, TextInput, toNumber, useFlash } from '../../components/forms.jsx';
import { MeasurementsTable, MetricTiles, MetricTrendCard } from '../../components/progress.jsx';
import { Card, CardHeader, ErrorState, IconBadge, PageLoader } from '../../components/ui.jsx';
import { api } from '../../lib/api.js';
import { todayKey } from '../../lib/format.js';
import { useApi } from '../../lib/useApi.js';
import { t } from '../../i18n/index.js';

export default function ProgressPage() {
  const { data, error, loading, reload, setData } = useApi('/me/checkins');
  if (loading && !data) return <PageLoader />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const { checkins, profile } = data;
  const hasComposition = checkins.some((c) => c.bodyFatPct != null);
  const hasMuscle = checkins.some((c) => c.muscleMassKg != null);

  async function remove(c) {
    await api(`/me/checkins/${c.id}`, { method: 'DELETE' });
    setData((d) => ({ ...d, checkins: d.checkins.filter((x) => x.id !== c.id) }));
  }

  return (
    <div className="space-y-5">
      <PageHeader title={t('Progressi')} subtitle={t('Il tuo percorso nel tempo: peso, misure e composizione corporea.')} />

      <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
        <IconBadge icon={Target} size="lg" />
        <div className="flex-1">
          <p className="eyebrow">{t('Obiettivo principale')}</p>
          <p className="mt-1 font-semibold">{profile.goal ?? t('Non hai ancora indicato un obiettivo.')}</p>
        </div>
        <Link to="/app/impostazioni" className="btn-soft">
          {profile.goal ? t('Modifica obiettivo') : t('Imposta obiettivo')}
        </Link>
      </Card>

      <MetricTiles checkins={checkins} startWeight={profile.startWeightKg} />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <MetricTrendCard title={t('Andamento del peso')} icon={ChartNoAxesColumn} checkins={checkins} />
        <WeighInCard onAdded={(checkin) => setData((d) => ({ ...d, checkins: [...d.checkins, checkin].sort((a, b) => a.day.localeCompare(b.day)) }))} />
      </div>

      {(hasComposition || hasMuscle) && (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          {hasComposition && <MetricTrendCard title={t('Massa grassa')} icon={Scale} checkins={checkins} metric="bodyFatPct" unit="%" defaultRange="6M" />}
          {hasMuscle && <MetricTrendCard title={t('Massa muscolare')} icon={Dumbbell} checkins={checkins} metric="muscleMassKg" unit="kg" defaultRange="6M" />}
        </div>
      )}

      <Card className="p-5">
        <CardHeader icon={ClipboardList} title={t('Storico misurazioni')} subtitle={t('Le tue pesate e i controlli dei tuoi professionisti')} />
        <div className="mt-4">
          <MeasurementsTable checkins={checkins} meLabel="Tu" canDelete={(c) => c.source === 'self'} onDelete={remove} />
        </div>
      </Card>
    </div>
  );
}

function WeighInCard({ onAdded }) {
  const [form, setForm] = useState({ weight: '', day: todayKey() });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useFlash();

  async function submit(e) {
    e.preventDefault();
    setError('');
    const weightKg = toNumber(form.weight);
    if (weightKg == null || Number.isNaN(weightKg)) return setError(t('Inserisci il peso in kg (es. 64,5).'));
    setSaving(true);
    try {
      const { checkin } = await api('/me/checkins', { method: 'POST', body: { weightKg, day: form.day } });
      onAdded(checkin);
      setForm({ weight: '', day: todayKey() });
      setFlash(t('Pesata registrata!'));
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="p-5">
      <CardHeader icon={Scale} title={t('Registra il tuo peso')} subtitle={t('Pesati possibilmente alla stessa ora, a digiuno.')} />
      <form onSubmit={submit} className="mt-4 space-y-3" noValidate>
        <NumberInput label={t('Peso')} suffix="kg" placeholder={t('es. 64,5')} value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
        <TextInput label={t('Data')} type="date" max={todayKey()} value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value })} />
        {error && <p className="text-sm text-amber-700">{error}</p>}
        <Flash>{flash}</Flash>
        <SaveButton saving={saving}>{t('Salva pesata')}</SaveButton>
      </form>
    </Card>
  );
}
