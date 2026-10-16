import { CalendarPlus, ChartNoAxesColumn, Copy, Lock, LockOpen, Mail, MessageCircle, Plus, Target, UserPlus, UserRound, Users, X } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { Avatar } from '../../components/Avatar.jsx';
import { Card, CardHeader, EmptyState, ErrorState, PageLoader, Spinner } from '../../components/ui.jsx';
import { api } from '../../lib/api.js';
import { fmtDate, fmtNumber } from '../../lib/format.js';
import { useApi } from '../../lib/useApi.js';
import { Field, FormError } from '../auth/fields.jsx';
import { t, translateMessage } from '../../i18n/index.js';

export default function ClientsPage() {
  const { data, error, loading, reload } = useApi('/clients');
  const [showForm, setShowForm] = useState(false);
  const [result, setResult] = useState(null);

  if (loading && !data) return <PageLoader />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const active = data.clients.filter((c) => c.status === 'active');
  const pending = data.clients.filter((c) => c.status === 'pending');

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold">{t('Clienti')}</h1>
          <p className="text-sm text-ink-500">
            {t('{n} attivi', { n: active.length })}
            {pending.length > 0 && ` · ${t('{n} in attesa di conferma', { n: pending.length })}`}
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={() => { setShowForm((v) => !v); setResult(null); }}>
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />} {showForm ? t('Chiudi') : t('Aggiungi cliente')}
        </button>
      </header>

      {showForm && (
        <AddClientForm
          onDone={(res) => {
            setResult(res);
            setShowForm(false);
            reload();
          }}
        />
      )}
      {result && <AddResult result={result} onClose={() => setResult(null)} />}

      <Card className="p-5">
        <CardHeader icon={Users} title={t('I tuoi clienti')} subtitle={t('La condivisione dei dati con il resto del team la decide sempre il cliente.')} />
        {data.clients.length === 0 ? (
          <EmptyState icon={UserPlus} title={t('Nessun cliente ancora')} text={t('Aggiungi il tuo primo cliente con il pulsante in alto.')} />
        ) : (
          <ul className="mt-4 divide-y divide-line">
            {data.clients.map((c) => (
              <ClientRow key={c.linkId} item={c} onRemoved={reload} />
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function ClientRow({ item, onRemoved }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const { client } = item;

  async function remove() {
    setBusy(true);
    try {
      await api(`/clients/${item.linkId}`, { method: 'DELETE' });
      onRemoved();
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="flex flex-col gap-3 py-4 md:flex-row md:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar user={client} size="lg" />
        <div className="min-w-0">
          {item.status === 'active' ? (
            <Link to={`/app/progressi?cliente=${client.id}`} className="font-semibold hover:underline">
              {client.fullName}
            </Link>
          ) : (
            <p className="font-semibold">{client.fullName}</p>
          )}
          <p className="truncate text-sm text-ink-500">{client.email}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs md:w-[46%] md:justify-end">
        {item.program && <span className="rounded-full bg-hover px-3 py-1 text-ink-700">{t(item.program)}</span>}
        {item.status === 'pending' ? (
          <span className="rounded-full bg-amber-50 px-3 py-1 font-medium text-amber-700">{t('In attesa di conferma')}</span>
        ) : item.sharedAccess ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 font-medium text-brand-800">
            <LockOpen className="h-3.5 w-3.5" /> {t('Dati di team condivisi')}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-hover px-3 py-1 text-ink-500">
            <Lock className="h-3.5 w-3.5" /> {t('Condivisione non autorizzata')}
          </span>
        )}
        {item.lastCheck && (
          <span className="text-ink-500">
            {t('Ultimo controllo: {date}', { date: fmtDate(item.lastCheck.date, { day: 'numeric', month: 'short' }) })}
            {item.lastCheck.weightKg != null && ` · ${fmtNumber(item.lastCheck.weightKg)} kg`}
          </span>
        )}
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        {item.status === 'active' && !confirming && (
          <>
            <Link to={`/app/progressi?cliente=${client.id}`} className="btn-outline">
              <ChartNoAxesColumn className="h-4 w-4" /> {t('Progressi')}
            </Link>
            <Link to={`/app/agenda?nuovo=1&cliente=${client.id}`} className="btn-soft px-3" aria-label={t('Fissa un appuntamento con {name}', { name: client.firstName })} title={t('Fissa appuntamento')}>
              <CalendarPlus className="h-4 w-4" />
            </Link>
            <Link to={`/app/messaggi?con=${client.id}`} className="btn-soft px-3" aria-label={t('Scrivi a {name}', { name: client.firstName })} title={t('Scrivi')}>
              <MessageCircle className="h-4 w-4" />
            </Link>
          </>
        )}
        {confirming ? (
          <>
            <button type="button" className="btn-soft" onClick={() => setConfirming(false)}>{t('Annulla')}</button>
            <button type="button" className="btn-primary bg-danger px-4 py-2 hover:bg-danger-strong" disabled={busy} onClick={remove}>
              {busy && <Spinner className="h-4 w-4 text-white" />} {t('Conferma rimozione')}
            </button>
          </>
        ) : (
          <button type="button" className="btn-soft" onClick={() => setConfirming(true)}>
            {t('Rimuovi')}
          </button>
        )}
      </div>
    </li>
  );
}

function AddClientForm({ onDone }) {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', program: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api('/clients', { method: 'POST', body: { ...form, program: form.program || undefined } });
      onDone({ ...res, email: form.email });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="p-5">
      <CardHeader icon={UserPlus} title={t('Aggiungi un cliente')} subtitle={t('Se ha già un account Wellsyn riceverà una richiesta da accettare; altrimenti gli creiamo un account.')} />
      <form onSubmit={submit} className="mt-4 grid gap-3 md:grid-cols-2" noValidate>
        <Field icon={UserRound} label={t('Nome')} required value={form.firstName} onChange={set('firstName')} />
        <Field label={t('Cognome')} required value={form.lastName} onChange={set('lastName')} />
        <Field icon={Mail} label={t('Email')} type="email" required value={form.email} onChange={set('email')} />
        <Field icon={Target} label={t('Percorso (facoltativo)')} placeholder={t('es. Definizione')} value={form.program} onChange={set('program')} />
        <div className="md:col-span-2">
          <FormError>{error}</FormError>
        </div>
        <div className="md:col-span-2">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading && <Spinner className="h-4 w-4 text-white" />} {t('Aggiungi cliente')}
          </button>
        </div>
      </form>
    </Card>
  );
}

function AddResult({ result, onClose }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard?.writeText(t('Email: {email} · Password temporanea: {password}', { email: result.email, password: result.tempPassword }));
    setCopied(true);
  }
  return (
    <div role="status" className="relative rounded-2xl border border-brand-200 bg-brand-50 p-5 text-sm text-brand-900">
      <button type="button" onClick={onClose} className="absolute top-3 right-3 rounded-full p-1 hover:bg-surface/60" aria-label={t('Chiudi')}>
        <X className="h-4 w-4" />
      </button>
      <p className="font-semibold">{translateMessage(result.message)}</p>
      {result.tempPassword && (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <code className="rounded-lg bg-surface px-3 py-2 font-mono text-base">{result.tempPassword}</code>
          <button type="button" className="btn-outline" onClick={copy}>
            <Copy className="h-4 w-4" /> {copied ? t('Copiato!') : t('Copia credenziali')}
          </button>
          <p className="w-full text-xs text-brand-800">{t('Questa password viene mostrata una sola volta: annotala e consegnala al cliente.')}</p>
        </div>
      )}
    </div>
  );
}
