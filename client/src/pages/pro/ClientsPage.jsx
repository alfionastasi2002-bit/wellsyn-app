import { CalendarPlus, ChartNoAxesColumn, Copy, Lock, LockOpen, Mail, MessageCircle, Plus, Search, Target, UserPlus, UserRound, Users, X } from 'lucide-react';
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
          <ClientList clients={data.clients} onRemoved={reload} />
        )}
      </Card>
    </div>
  );
}

const FILTERS = [
  { value: 'all', label: 'Tutti', test: () => true },
  { value: 'shared', label: 'Condivisione attiva', test: (c) => c.status === 'active' && c.sharedAccess },
  { value: 'private', label: 'Senza condivisione', test: (c) => c.status === 'active' && !c.sharedAccess },
  { value: 'pending', label: 'In attesa', test: (c) => c.status === 'pending' },
];
const SORTS = {
  name: (a, b) => a.client.fullName.localeCompare(b.client.fullName),
  recent: (a, b) => new Date(b.since) - new Date(a.since),
  // chi non fa un controllo da più tempo per primo (i clienti mai controllati in cima)
  check: (a, b) => (a.lastCheck ? new Date(a.lastCheck.date).getTime() : 0) - (b.lastCheck ? new Date(b.lastCheck.date).getTime() : 0),
};

/** Elenco dei clienti con ricerca, filtri e ordinamento (utile quando i clienti sono tanti). */
function ClientList({ clients, onRemoved }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('name');
  const q = query.trim().toLowerCase();
  const matches = (c) => !q || `${c.client.fullName} ${c.client.email} ${c.program ?? ''}`.toLowerCase().includes(q);
  const current = FILTERS.find((f) => f.value === filter);
  const visible = clients.filter((c) => current.test(c) && matches(c)).sort(SORTS[sort]);

  return (
    <>
      <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <label className="relative block shrink-0 lg:w-72">
          <span className="sr-only">{t('Cerca cliente')}</span>
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('Cerca per nome, email o percorso…')}
            className="w-full rounded-xl border border-line bg-surface py-2.5 pr-3 pl-10 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
          />
        </label>
        <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
          {FILTERS.map((f) => {
            const count = clients.filter(f.test).length;
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => setFilter(f.value)}
                aria-pressed={filter === f.value}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-[13px] font-medium whitespace-nowrap transition ${
                  filter === f.value ? 'border-brand-600 bg-brand-50 text-brand-800' : 'border-line text-ink-700 hover:border-brand-300'
                }`}
              >
                {t(f.label)} <span className="text-ink-400">{count}</span>
              </button>
            );
          })}
        </div>
        <label className="flex shrink-0 items-center gap-2 text-sm whitespace-nowrap text-ink-500 lg:ml-auto">
          {t('Ordina per')}
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-sm text-ink-900 outline-none focus:border-brand-500">
            <option value="name">{t('Nome (A–Z)')}</option>
            <option value="recent">{t('Aggiunti di recente')}</option>
            <option value="check">{t('Controllo meno recente')}</option>
          </select>
        </label>
      </div>
      {visible.length === 0 ? (
        <p className="py-8 text-center text-sm text-ink-500">{t('Nessun cliente corrisponde alla ricerca.')}</p>
      ) : (
        <ul className="mt-3 divide-y divide-line">
          {visible.map((c) => (
            <ClientRow key={c.linkId} item={c} onRemoved={onRemoved} />
          ))}
        </ul>
      )}
      <p className="mt-3 text-xs text-ink-400">{t('{shown} di {total} clienti', { shown: visible.length, total: clients.length })}</p>
    </>
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
    <li className="grid grid-cols-1 gap-3 py-3.5 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] md:items-center xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1.1fr)_minmax(0,1fr)_340px]">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar user={client} size="lg" />
        <div className="min-w-0">
          {item.status === 'active' ? (
            <Link to={`/app/progressi?cliente=${client.id}`} className="block truncate font-semibold hover:underline">
              {client.fullName}
            </Link>
          ) : (
            <p className="truncate font-semibold">{client.fullName}</p>
          )}
          <p className="truncate text-sm text-ink-500">{client.email}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        {item.program && <span className="rounded-full bg-hover px-2.5 py-1 text-ink-700">{t(item.program)}</span>}
        {item.status === 'pending' ? (
          <span className="rounded-full bg-amber-50 px-2.5 py-1 font-medium text-amber-700">{t('In attesa di conferma')}</span>
        ) : item.sharedAccess ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 font-medium text-brand-800">
            <LockOpen className="h-3.5 w-3.5" /> {t('Dati di team condivisi')}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-hover px-2.5 py-1 text-ink-500">
            <Lock className="h-3.5 w-3.5" /> {t('Condivisione non autorizzata')}
          </span>
        )}
      </div>
      {item.status === 'active' ? (
        <p className="text-xs text-ink-500 xl:text-sm">
          {item.lastCheck ? (
            <>
              <span className="block">{t('Ultimo controllo: {date}', { date: fmtDate(item.lastCheck.date, { day: 'numeric', month: 'short' }) })}</span>
              {item.lastCheck.weightKg != null && <span className="font-medium text-ink-700">{fmtNumber(item.lastCheck.weightKg)} kg</span>}
            </>
          ) : (
            t('Nessun controllo ancora')
          )}
        </p>
      ) : (
        <span className="hidden xl:block" aria-hidden="true" />
      )}
      <div className="flex shrink-0 flex-wrap gap-2 md:col-span-2 xl:col-span-1 xl:justify-end">
        {item.status === 'active' && !confirming && (
          <>
            <Link to={`/app/progressi?cliente=${client.id}`} className="btn-outline">
              <ChartNoAxesColumn className="h-4 w-4" /> {t('Progressi')}
            </Link>
            <Link
              to={`/app/agenda?nuovo=1&cliente=${client.id}`}
              className="btn-soft px-3"
              aria-label={t('Fissa un appuntamento con {name}', { name: client.firstName })}
              title={t('Fissa appuntamento')}
            >
              <CalendarPlus className="h-4 w-4" />
            </Link>
            <Link to={`/app/messaggi?con=${client.id}`} className="btn-soft px-3" aria-label={t('Scrivi a {name}', { name: client.firstName })} title={t('Scrivi')}>
              <MessageCircle className="h-4 w-4" />
            </Link>
          </>
        )}
        {confirming ? (
          <>
            <button type="button" className="btn-soft" onClick={() => setConfirming(false)}>
              {t('Annulla')}
            </button>
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
