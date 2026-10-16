import { CircleCheck, ClipboardList, Plus, RotateCcw, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { AppointmentList } from '../../components/agenda.jsx';
import { Avatar } from '../../components/Avatar.jsx';
import {
  ClientSelect,
  ConfirmButton,
  Flash,
  Modal,
  NumberInput,
  PageHeader,
  SaveButton,
  Tabs,
  TextArea,
  TextInput,
  toNumber,
  useFlash,
} from '../../components/forms.jsx';
import { METRICS } from '../../components/progress.jsx';
import { Card, EmptyState, ErrorState, PageLoader } from '../../components/ui.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { FormError } from '../auth/fields.jsx';
import { api } from '../../lib/api.js';
import { fmtDayKey, fmtNumber, todayKey } from '../../lib/format.js';
import { useApi } from '../../lib/useApi.js';
import { CheckInModal } from './proParts.jsx';

const TYPES = {
  nutritionist: ['Check-up nutrizionale', 'Controllo piano', 'Prima visita', 'Valutazione progressi'],
  trainer: ['Sessione personal training', 'Valutazione funzionale', 'Forza • Upper Body', 'Forza • Lower Body', 'Cardio e mobilità'],
};

export default function AgendaPage() {
  const { user } = useAuth();
  const isNutritionist = user.role === 'nutritionist';
  const [view, setView] = useState('agenda');

  return (
    <div className="space-y-5">
      <PageHeader
        title={isNutritionist ? 'Controlli' : 'Sessioni'}
        subtitle={
          isNutritionist
            ? 'Agenda dei controlli e misurazioni registrate ai tuoi clienti.'
            : 'Agenda delle sessioni con i tuoi clienti.'
        }
      />
      {isNutritionist && (
        <Tabs
          className="w-fit"
          value={view}
          onChange={setView}
          tabs={[
            { value: 'agenda', label: 'Agenda' },
            { value: 'checkins', label: 'Misurazioni' },
          ]}
        />
      )}
      {view === 'agenda' ? <Agenda role={user.role} /> : <CheckIns />}
    </div>
  );
}

function Agenda({ role }) {
  const { data, error, loading, reload, setData } = useApi('/appointments');
  const [tab, setTab] = useState('upcoming');
  const [open, setOpen] = useState(false);
  const [flash, setFlash] = useFlash();

  if (loading && !data) return <PageLoader />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const now = Date.now();
  const all = data.appointments;
  const isUpcoming = (a) => a.status === 'scheduled' && new Date(a.date).getTime() >= now - 60 * 60000;
  const lists = {
    upcoming: all.filter(isUpcoming),
    past: all.filter((a) => !isUpcoming(a) && a.status !== 'cancelled').reverse(),
    cancelled: all.filter((a) => a.status === 'cancelled').reverse(),
  };

  async function setStatus(a, status) {
    const { appointment } = await api(`/appointments/${a.id}`, { method: 'PATCH', body: { status } });
    setData((d) => ({ appointments: d.appointments.map((x) => (x.id === a.id ? appointment : x)) }));
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          className="w-fit max-w-full"
          value={tab}
          onChange={setTab}
          tabs={[
            { value: 'upcoming', label: 'In programma', count: lists.upcoming.length },
            { value: 'past', label: 'Passati' },
            { value: 'cancelled', label: 'Annullati' },
          ]}
        />
        <button type="button" className="btn-primary" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> {role === 'trainer' ? 'Nuova sessione' : 'Nuovo appuntamento'}
        </button>
      </div>
      <Flash>{flash}</Flash>
      <Card className="p-5">
        <AppointmentList
          appointments={lists[tab]}
          person="client"
          emptyText={tab === 'upcoming' ? 'Nessun appuntamento in programma' : 'Nessun appuntamento'}
          actions={(a) =>
            a.status === 'scheduled' ? (
              <>
                <button type="button" className="btn-soft" onClick={() => setStatus(a, 'done')}>
                  <CircleCheck className="h-4 w-4" /> Svolto
                </button>
                <ConfirmButton confirmLabel="Annulla appuntamento" onConfirm={() => setStatus(a, 'cancelled')}>
                  <X className="h-4 w-4" /> Annulla
                </ConfirmButton>
              </>
            ) : (
              <button type="button" className="btn-soft" onClick={() => setStatus(a, 'scheduled')}>
                <RotateCcw className="h-4 w-4" /> Ripristina
              </button>
            )
          }
        />
      </Card>
      <AppointmentModal
        open={open}
        role={role}
        onClose={() => setOpen(false)}
        onSaved={(appointment) => {
          setData((d) => ({ appointments: [...d.appointments, appointment].sort((a, b) => new Date(a.date) - new Date(b.date)) }));
          setTab('upcoming');
          setFlash('Appuntamento aggiunto: il cliente lo vedrà nella sua sezione Controlli.');
        }}
      />
    </>
  );
}

function AppointmentModal({ open, role, onClose, onSaved }) {
  const initial = () => ({ clientId: '', day: todayKey(), time: '10:00', durationMin: role === 'trainer' ? '60' : '45', type: TYPES[role][0], location: '', notes: '' });
  const [form, setForm] = useState(initial);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!form.clientId) return setError('Seleziona il cliente.');
    const durationMin = toNumber(form.durationMin);
    if (!durationMin || Number.isNaN(durationMin)) return setError('Indica la durata in minuti.');
    setSaving(true);
    try {
      const { appointment } = await api('/appointments', { method: 'POST', body: { ...form, durationMin } });
      onSaved(appointment);
      setForm(initial());
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={role === 'trainer' ? 'Nuova sessione' : 'Nuovo appuntamento'}
      footer={
        <>
          <button type="button" className="btn-soft" onClick={onClose}>
            Annulla
          </button>
          <SaveButton saving={saving} form="appointment-form">
            Salva
          </SaveButton>
        </>
      }
    >
      <form id="appointment-form" onSubmit={submit} className="space-y-3" noValidate>
        <ClientSelect value={form.clientId} onChange={(v) => setForm({ ...form, clientId: v })} />
        <div className="grid grid-cols-3 gap-3">
          <TextInput label="Giorno" type="date" min={todayKey()} value={form.day} onChange={set('day')} className="col-span-3 sm:col-span-1" />
          <TextInput label="Ora" type="time" step="300" value={form.time} onChange={set('time')} />
          <NumberInput label="Durata" suffix="min" value={form.durationMin} onChange={set('durationMin')} />
        </div>
        <TextInput label="Tipo" list="appointment-types" value={form.type} onChange={set('type')} />
        <datalist id="appointment-types">
          {TYPES[role].map((t) => (
            <option key={t} value={t} />
          ))}
        </datalist>
        <TextInput label="Luogo (facoltativo)" placeholder={role === 'trainer' ? 'es. Palestra Wellsyn' : 'es. Studio, videochiamata'} value={form.location} onChange={set('location')} />
        <TextArea label="Note (facoltative)" rows={2} value={form.notes} onChange={set('notes')} />
        <FormError>{error}</FormError>
      </form>
    </Modal>
  );
}

function CheckIns() {
  const { data, error, loading, reload, setData } = useApi('/checkins');
  const [open, setOpen] = useState(false);
  const [flash, setFlash] = useFlash();

  if (loading && !data) return <PageLoader />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  async function remove(c) {
    await api(`/checkins/${c.id}`, { method: 'DELETE' });
    setData((d) => ({ checkins: d.checkins.filter((x) => x.id !== c.id) }));
  }

  return (
    <>
      <div className="flex justify-end">
        <button type="button" className="btn-primary" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Registra controllo
        </button>
      </div>
      <Flash>{flash}</Flash>
      <Card className="p-5">
        {data.checkins.length === 0 ? (
          <EmptyState icon={ClipboardList} title="Nessun controllo registrato" text="Registra il primo controllo con il pulsante in alto." />
        ) : (
          <ul className="divide-y divide-line">
            {data.checkins.map((c) => (
              <li key={c.id} className="flex flex-col gap-3 py-3 md:flex-row md:items-center">
                <div className="flex min-w-0 items-center gap-3 md:w-64">
                  <Avatar user={c.client} />
                  <div className="min-w-0">
                    <Link to={`/app/progressi?cliente=${c.client.id}`} className="truncate font-semibold hover:underline">
                      {c.client.fullName}
                    </Link>
                    <p className="text-xs text-ink-500">{fmtDayKey(c.day, { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                </div>
                <dl className="flex flex-1 flex-wrap gap-x-5 gap-y-1 text-sm">
                  {METRICS.filter((m) => c[m.key] != null).map((m) => (
                    <div key={m.key}>
                      <dt className="text-xs text-ink-500">{m.label}</dt>
                      <dd className="font-medium">
                        {fmtNumber(c[m.key])} {m.unit}
                      </dd>
                    </div>
                  ))}
                  {c.notes && <p className="w-full text-xs text-ink-500 italic">“{c.notes}”</p>}
                </dl>
                <ConfirmButton className="rounded-full p-2 text-ink-400 hover:bg-[#f1f5f4] hover:text-ink-700" confirmLabel="Elimina" onConfirm={() => remove(c)}>
                  <Trash2 className="h-4 w-4" aria-label="Elimina controllo" />
                </ConfirmButton>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <CheckInModal
        open={open}
        onClose={() => setOpen(false)}
        onSaved={() => {
          reload();
          setFlash('Controllo registrato.');
        }}
      />
    </>
  );
}

