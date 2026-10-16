import { CircleAlert, Clock, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { DatePicker } from '../../components/DatePicker.jsx';
import { ClientSelect, Modal, SaveButton, TextArea, TextInput } from '../../components/forms.jsx';
import { t, translateMessage } from '../../i18n/index.js';
import { api } from '../../lib/api.js';
import { addDaysKey, fmtDuration, minutesOfDay, minutesToTime, timeToMinutes, todayKey } from '../../lib/format.js';
import { WEEKDAYS } from '../../lib/labels.js';
import { FormError } from '../auth/fields.jsx';
import {
  APPOINTMENT_TYPES,
  DAY_END,
  DAY_START,
  DURATIONS,
  firstFreeSlot,
  LOCATIONS,
  overlaps,
  SLOT_MIN,
  timeOptions,
  workingHoursOf,
} from './agendaUtils.js';

/** Chip selezionabile (tipo, durata, luogo). */
function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3 py-1.5 text-[13px] font-medium transition ${
        active ? 'border-brand-600 bg-brand-50 text-brand-800' : 'border-line bg-surface text-ink-700 hover:border-brand-300'
      }`}
    >
      {children}
    </button>
  );
}

function TimeSelect({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink-700">{label}</span>
      <span className="relative block">
        <Clock className="pointer-events-none absolute top-1/2 left-3.5 h-[18px] w-[18px] -translate-y-1/2 text-brand-700" />
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none rounded-xl border border-line bg-surface py-2.5 pr-3 pl-10 text-[15px] text-ink-900 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value} disabled={o.disabled}>
              {o.label}
            </option>
          ))}
        </select>
      </span>
    </label>
  );
}

/** Barra del giorno: orari occupati (grigio), occupati dal cliente (ambra) e la fascia scelta. */
function DayBar({ hours, busy, clientBusy, start, end, conflict }) {
  const from = Math.min(hours.start, start) - 30;
  const to = Math.max(hours.end, end) + 30;
  const pct = (m) => `${((m - from) / (to - from)) * 100}%`;
  const width = (a, b) => `${((b - a) / (to - from)) * 100}%`;
  const ticks = [];
  for (let h = Math.ceil(from / 60); h * 60 <= to; h += 1) ticks.push(h);
  return (
    <div>
      <div className="relative h-9 overflow-hidden rounded-xl bg-soft ring-1 ring-line">
        <div className="absolute inset-y-0 bg-surface" style={{ left: pct(hours.start), width: width(hours.start, hours.end) }} />
        {busy.map((b, i) => (
          <div
            key={`b${i}`}
            className="absolute inset-y-1.5 rounded-md bg-ink-300/70"
            style={{ left: pct(b.start), width: width(b.start, b.end) }}
            title={b.label}
          />
        ))}
        {clientBusy.map((b, i) => (
          <div
            key={`c${i}`}
            className="absolute inset-y-1.5 rounded-md bg-amber-200 bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,rgb(255_255_255/0.35)_4px,rgb(255_255_255/0.35)_8px)]"
            style={{ left: pct(b.start), width: width(b.start, b.end) }}
          />
        ))}
        <div
          className={`absolute inset-y-0.5 rounded-md border-2 ${conflict ? 'border-amber-600 bg-amber-100/70' : 'border-brand-600 bg-brand-500/25'}`}
          style={{ left: pct(start), width: width(start, end) }}
        />
      </div>
      <div className="relative mt-1 h-4 text-[10px] text-ink-400">
        {ticks.map((h) => (
          <span key={h} className="absolute -translate-x-1/2" style={{ left: pct(h * 60) }}>
            {h}
          </span>
        ))}
      </div>
      <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-ink-500">
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-ink-300/70" /> {t('Già occupato')}</span>
        {clientBusy.length > 0 && (
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-amber-200" /> {t('Il cliente è impegnato')}</span>
        )}
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm border-2 border-brand-600" /> {t('Orario scelto')}</span>
      </p>
    </div>
  );
}

const ranges = (list) => list.map((a) => ({ start: minutesOfDay(a.start ?? a.date), end: minutesOfDay(a.start ?? a.date) + Math.round((new Date(a.end) - new Date(a.start ?? a.date)) / 60000), label: a.client?.fullName }));

/**
 * Finestra per creare o modificare un appuntamento.
 * appointment: quello da modificare (altrimenti se ne crea uno nuovo); initial: { day, time, clientId } proposti.
 */
export function AppointmentModal({ open, onClose, onSaved, user, appointment, initial, marks }) {
  const role = user.role;
  const editing = Boolean(appointment);
  const hours = workingHoursOf(user);
  const defaultDuration = user.appointmentMinutes ?? (role === 'trainer' ? 60 : 45);

  const [form, setForm] = useState(null);
  const [busyData, setBusyData] = useState({ day: null, mine: [], client: [] });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Valori iniziali a ogni apertura
  useEffect(() => {
    if (!open) return;
    setError('');
    if (appointment) {
      const start = minutesOfDay(appointment.date);
      setForm({
        clientId: appointment.client?.id ?? '',
        day: appointment.day,
        start,
        end: start + appointment.durationMin,
        type: appointment.type,
        location: appointment.location ?? '',
        notes: appointment.notes ?? '',
        autoTime: false,
      });
    } else {
      const start = initial?.time ? timeToMinutes(initial.time) : null;
      setForm({
        clientId: initial?.clientId ?? '',
        day: initial?.day ?? todayKey(),
        start: start ?? 10 * 60,
        end: (start ?? 10 * 60) + defaultDuration,
        type: APPOINTMENT_TYPES[role][0],
        location: '',
        notes: '',
        autoTime: start == null, // senza orario proposto, si sceglie il primo libero appena noti gli impegni
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, appointment, initial]);

  // Impegni del giorno scelto (miei e, in forma anonima, del cliente con altri professionisti)
  const day = form?.day;
  const clientId = form?.clientId;
  useEffect(() => {
    if (!open || !day) return undefined;
    const controller = new AbortController();
    const query = new URLSearchParams({ day, ...(clientId && { clientId }) });
    api(`/appointments/busy?${query}`, { signal: controller.signal })
      .then((data) => setBusyData({ ...data, day }))
      .catch(() => {});
    return () => controller.abort();
  }, [open, day, clientId]);

  const busy = useMemo(
    () => ranges(busyData.mine.filter((a) => a.id !== appointment?.id)).map((b) => ({ ...b })),
    [busyData, appointment],
  );
  const clientBusy = useMemo(() => ranges(busyData.client), [busyData]);
  const allBusy = useMemo(() => [...busy, ...clientBusy], [busy, clientBusy]);

  // Primo orario libero quando non ne è stato proposto uno (se oggi è tutto pieno o finito, si passa ai giorni dopo)
  useEffect(() => {
    if (!form?.autoTime || busyData.day !== form.day) return;
    const duration = form.end - form.start;
    const free = firstFreeSlot({ day: form.day, duration, busy: allBusy, hours });
    if (free != null) setForm((f) => ({ ...f, start: free, end: free + duration, autoTime: false }));
    else if (form.day < addDaysKey(todayKey(), 14)) setForm((f) => ({ ...f, day: addDaysKey(f.day, 1) }));
    else setForm((f) => ({ ...f, autoTime: false }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allBusy, busyData.day, form?.autoTime, form?.day]);

  if (!form) return null;

  const duration = form.end - form.start;
  const clash = busy.find((b) => overlaps(form.start, form.end, b.start, b.end));
  const clientClash = clientBusy.some((b) => overlaps(form.start, form.end, b.start, b.end));
  const weekday = new Date(`${form.day}T12:00:00Z`).getUTCDay() || 7;
  const outsideHours = hours && (!hours.days.includes(weekday) || form.start < hours.start || form.end > hours.end);
  const isPast = form.day < todayKey() || (form.day === todayKey() && form.start < minutesOfDay(new Date()) - SLOT_MIN);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const setStart = (value) => {
    const start = timeToMinutes(value);
    set({ start, end: Math.min(start + duration, DAY_END) });
  };
  const setDuration = (minutes) => set({ end: Math.min(form.start + minutes, DAY_END) });

  const startOptions = timeOptions(DAY_START, DAY_END - SLOT_MIN).map((time) => {
    const m = timeToMinutes(time);
    const taken = allBusy.some((b) => overlaps(m, m + duration, b.start, b.end));
    return { value: time, label: taken ? `${time} · ${t('occupato')}` : time };
  });
  const endOptions = timeOptions(form.start + SLOT_MIN, Math.min(form.start + 8 * 60, DAY_END)).map((time) => {
    const m = timeToMinutes(time);
    return { value: time, label: `${time} (${fmtDuration(m - form.start)})` };
  });

  function suggestFree() {
    const free = firstFreeSlot({ day: form.day, duration, busy: allBusy, hours });
    if (free == null) setError(t('Nessun orario libero di questa durata nel giorno scelto.'));
    else {
      setError('');
      set({ start: free, end: free + duration });
    }
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!form.clientId) return setError(t('Seleziona il cliente.'));
    if (!form.type.trim()) return setError(t('Indica il tipo di appuntamento.'));
    if (clash) return setError(t("In questo orario hai già un altro appuntamento: scegli un orario libero."));
    if (clientClash) return setError(t('Il cliente ha già un altro appuntamento in questo orario: scegli un altro orario.'));
    const body = {
      day: form.day,
      time: minutesToTime(form.start),
      endTime: minutesToTime(form.end),
      type: form.type,
      location: form.location,
      notes: form.notes,
    };
    setSaving(true);
    try {
      const { appointment: saved } = editing
        ? await api(`/appointments/${appointment.id}`, { method: 'PUT', body })
        : await api('/appointments', { method: 'POST', body: { ...body, clientId: form.clientId } });
      onSaved(saved, editing);
      onClose();
    } catch (err) {
      setError(translateMessage(err.message));
    } finally {
      setSaving(false);
    }
  }

  const title = editing ? t('Modifica appuntamento') : role === 'trainer' ? t('Nuova sessione') : t('Nuovo appuntamento');

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="lg"
      footer={
        <>
          <button type="button" className="btn-soft" onClick={onClose}>
            {t('Annulla')}
          </button>
          <SaveButton saving={saving} form="appointment-form" disabled={saving || Boolean(clash) || clientClash}>
            {editing ? t('Salva modifiche') : t('Fissa appuntamento')}
          </SaveButton>
        </>
      }
    >
      <form id="appointment-form" onSubmit={submit} className="space-y-4" noValidate>
        <ClientSelect value={form.clientId} onChange={(v) => set({ clientId: v })} disabled={editing} />

        <div>
          <span className="mb-1.5 block text-sm font-medium text-ink-700">{t('Tipo')}</span>
          <div className="flex flex-wrap gap-2">
            {APPOINTMENT_TYPES[role].map((type) => (
              <Chip key={type} active={form.type === type} onClick={() => set({ type })}>
                {t(type)}
              </Chip>
            ))}
          </div>
          <TextInput
            className="mt-2"
            aria-label={t('Tipo personalizzato')}
            placeholder={t('Oppure scrivi un altro tipo…')}
            value={APPOINTMENT_TYPES[role].includes(form.type) ? '' : form.type}
            onChange={(e) => set({ type: e.target.value || APPOINTMENT_TYPES[role][0] })}
          />
        </div>

        <DatePicker label={t('Giorno')} value={form.day} onChange={(v) => v && set({ day: v })} min={editing ? undefined : todayKey()} marks={marks} />

        <div className="rounded-2xl border border-line p-3.5">
          <div className="grid grid-cols-2 gap-3">
            <TimeSelect label={t('Dalle')} value={minutesToTime(form.start)} onChange={setStart} options={startOptions} />
            <TimeSelect label={t('Alle')} value={minutesToTime(form.end)} onChange={(v) => set({ end: timeToMinutes(v) })} options={endOptions} />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-ink-500">{t('Durata')}:</span>
            {DURATIONS.map((m) => (
              <Chip key={m} active={duration === m} onClick={() => setDuration(m)}>
                {fmtDuration(m)}
              </Chip>
            ))}
            <button type="button" onClick={suggestFree} className="ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold text-brand-800 hover:bg-brand-50">
              <Sparkles className="h-4 w-4" /> {t('Primo orario libero')}
            </button>
          </div>
          <div className="mt-3">
            <DayBar hours={hours ?? { start: 9 * 60, end: 19 * 60 }} busy={busy} clientBusy={clientBusy} start={form.start} end={form.end} conflict={Boolean(clash) || clientClash} />
          </div>
          {clash && (
            <p className="mt-2 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
              {t('Si sovrappone a un tuo appuntamento ({from}–{to}, {name}). Scegli un altro orario.', {
                from: minutesToTime(clash.start),
                to: minutesToTime(clash.end),
                name: clash.label ?? '—',
              })}
            </p>
          )}
          {!clash && clientClash && (
            <p className="mt-2 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
              {t('Il cliente ha già un altro appuntamento in questo orario: scegli un altro orario.')}
            </p>
          )}
          {!clash && !clientClash && outsideHours && (
            <p className="mt-2 text-xs text-amber-700">
              {t('Fuori dal tuo orario di lavoro ({days}, {from}–{to}).', {
                days: hours.days.map((d) => WEEKDAYS[d - 1].short).join(' '),
                from: minutesToTime(hours.start),
                to: minutesToTime(hours.end),
              })}
            </p>
          )}
          {isPast && !editing && <p className="mt-2 text-xs text-amber-700">{t('Attenzione: questo orario è già passato.')}</p>}
        </div>

        <div>
          <TextInput
            label={t('Luogo (facoltativo)')}
            placeholder={role === 'trainer' ? t('es. Palestra Wellsyn') : t('es. Studio, videochiamata')}
            value={form.location}
            onChange={(e) => set({ location: e.target.value })}
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {LOCATIONS[role].map((place) => (
              <Chip key={place} active={form.location === t(place)} onClick={() => set({ location: t(place) })}>
                {t(place)}
              </Chip>
            ))}
          </div>
        </div>
        <TextArea label={t('Note (facoltative)')} rows={2} value={form.notes} onChange={(e) => set({ notes: e.target.value })} />
        <FormError>{error}</FormError>
      </form>
    </Modal>
  );
}
