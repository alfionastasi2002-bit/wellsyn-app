import { ArrowLeft, Bell, MessageSquareText, Search, SendHorizontal, UserRound } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useOutletContext, useSearchParams } from 'react-router';
import { Avatar } from '../../components/Avatar.jsx';
import { PageHeader } from '../../components/forms.jsx';
import { EmptyState, ErrorState, PageLoader, Spinner } from '../../components/ui.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../lib/api.js';
import { capitalize, displayName, fmtDate, fmtTime, relativeTime, ROLE_LABELS } from '../../lib/format.js';
import { useApi } from '../../lib/useApi.js';
import { t } from '../../i18n/index.js';

const relationLabel = (c) =>
  c.relation === 'client' ? t('Cliente') : c.relation === 'colleague' ? `${t('Collega')} · ${ROLE_LABELS[c.user.role]}` : ROLE_LABELS[c.user.role];

export default function MessagesPage() {
  const { user } = useAuth();
  const { refreshCounters } = useOutletContext();
  const [params, setParams] = useSearchParams();
  const contacts = useApi('/messages/contacts');
  const summary = useApi(user.role === 'client' ? '/me/summary' : null);
  const selectedId = params.get('con');
  const [search, setSearch] = useState('');
  const { reload } = contacts;

  // Aggiorna l'elenco ogni 20 secondi per vedere i nuovi messaggi.
  useEffect(() => {
    const timer = setInterval(reload, 20000);
    return () => clearInterval(timer);
  }, [reload]);

  if (contacts.loading && !contacts.data) return <PageLoader />;
  if (contacts.error) return <ErrorState error={contacts.error} onRetry={reload} />;

  const all = contacts.data.contacts;
  const contactsCount = all.length;
  const q = search.trim().toLowerCase();
  const list = q ? all.filter((c) => displayName(c.user).toLowerCase().includes(q)) : all;
  const selected = all.find((c) => c.user.id === selectedId);
  const select = (id) => setParams(id ? { con: id } : {});
  const pending = summary.data?.pendingRequests ?? 0;

  return (
    <div className="space-y-4">
      <PageHeader
        title={user.role === 'client' ? t('Notifiche e messaggi') : t('Messaggi')}
        subtitle={
          user.role === 'client'
            ? t('Scrivi ai tuoi professionisti e ricevi i loro aggiornamenti.')
            : t('Conversazioni con i tuoi clienti e con i colleghi che seguono gli stessi clienti (se il cliente lo ha autorizzato).')
        }
      />

      {pending > 0 && (
        <Link to="/app/professionisti" className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 hover:bg-amber-100/70">
          <Bell className="h-5 w-5 shrink-0" />
          <span className="flex-1">
            {pending === 1
              ? t('Hai 1 richiesta di collegamento da un professionista in attesa di risposta.')
              : t('Hai {n} richieste di collegamento da professionisti in attesa di risposta.', { n: pending })}
          </span>
          <span className="font-semibold">{t('Rispondi')}</span>
        </Link>
      )}

      <div className="card grid h-[calc(100dvh-230px)] min-h-[460px] grid-cols-1 overflow-hidden lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className={`min-h-0 flex-col border-line lg:flex lg:border-r ${selected ? 'hidden' : 'flex'}`}>
          <div className="border-b border-line px-4 py-3">
            <p className="text-sm font-semibold">{t('Conversazioni')}</p>
            {contactsCount > 8 && (
              <label className="relative mt-2 block">
                <span className="sr-only">{t('Cerca una conversazione')}</span>
                <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('Cerca un contatto…')}
                  className="w-full rounded-lg border border-line bg-surface py-2 pr-3 pl-9 text-sm outline-none focus:border-brand-500"
                />
              </label>
            )}
          </div>
          {contactsCount === 0 ? (
            <EmptyState
              icon={UserRound}
              title={t('Nessun contatto')}
              text={user.role === 'client' ? t('Quando un professionista ti seguirà potrai scrivergli da qui.') : t('Aggiungi un cliente per iniziare a scrivergli.')}
            />
          ) : (
            <ul className="no-scrollbar min-h-0 flex-1 overflow-y-auto">
              {list.length === 0 && <li className="px-4 py-6 text-center text-sm text-ink-500">{t('Nessun contatto trovato.')}</li>}
              {list.map((c) => (
                <li key={c.user.id}>
                  <button
                    type="button"
                    onClick={() => select(c.user.id)}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-soft ${c.user.id === selectedId ? 'bg-brand-50' : ''}`}
                  >
                    <Avatar user={c.user} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-sm font-semibold">{displayName(c.user)}</span>
                        {c.lastMessage && <span className="shrink-0 text-[11px] text-ink-500">{relativeTime(c.lastMessage.createdAt)}</span>}
                      </span>
                      <span className="block truncate text-xs text-ink-500">
                        {c.lastMessage ? `${c.lastMessage.mine ? `${t('Tu')}: ` : ''}${c.lastMessage.text}` : relationLabel(c)}
                      </span>
                    </span>
                    {c.unread > 0 && (
                      <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brand-600 px-1 text-[11px] font-semibold text-white">{c.unread}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <section className={`min-h-0 flex-col lg:flex ${selected ? 'flex' : 'hidden'}`}>
          {selected ? (
            <Thread
              key={selected.user.id}
              contact={selected}
              onBack={() => select(null)}
              onActivity={() => {
                reload();
                refreshCounters();
              }}
            />
          ) : (
            <div className="grid flex-1 place-items-center">
              <EmptyState icon={MessageSquareText} title={t('Seleziona una conversazione')} text={t("Scegli un contatto dall'elenco per leggere e inviare messaggi.")} />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Thread({ contact, onBack, onActivity }) {
  const { data, error, loading, reload, setData } = useApi(`/messages/${contact.user.id}`);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const bottomRef = useRef(null);
  const count = data?.messages.length ?? 0;

  // Nuovi messaggi ogni 8 secondi mentre la conversazione è aperta.
  useEffect(() => {
    const timer = setInterval(reload, 8000);
    return () => clearInterval(timer);
  }, [reload]);

  // Dopo la prima apertura i messaggi risultano letti: aggiorna contatori.
  const loaded = Boolean(data);
  useEffect(() => {
    if (loaded && contact.unread > 0) onActivity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [count]);

  const grouped = useMemo(() => {
    const groups = [];
    for (const m of data?.messages ?? []) {
      const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome' }).format(new Date(m.createdAt));
      if (groups.at(-1)?.day !== day) groups.push({ day, items: [] });
      groups.at(-1).items.push(m);
    }
    return groups;
  }, [data]);

  async function send(e) {
    e?.preventDefault();
    const value = text.trim();
    if (!value) return;
    setSending(true);
    setSendError('');
    try {
      const { message } = await api('/messages', { method: 'POST', body: { to: contact.user.id, text: value } });
      setData((d) => ({ ...d, messages: [...d.messages, message] }));
      setText('');
      onActivity();
    } catch (err) {
      setSendError(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <header className="flex items-center gap-3 border-b border-line px-4 py-3">
        <button type="button" onClick={onBack} className="rounded-full p-1.5 text-ink-500 hover:bg-hover lg:hidden" aria-label={t("Torna all'elenco")}>
          <ArrowLeft className="h-5 w-5" />
        </button>
        <Avatar user={contact.user} />
        <div className="min-w-0">
          <p className="truncate font-semibold">{displayName(contact.user)}</p>
          <p className="text-xs text-ink-500">{relationLabel(contact)}</p>
        </div>
      </header>

      <div className="no-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto bg-soft px-4 py-4">
        {loading && !data && <PageLoader />}
        {error && <ErrorState error={error} onRetry={reload} />}
        {data && data.messages.length === 0 && (
          <EmptyState title={t('Nessun messaggio')} text={t('Scrivi il primo messaggio a {name}.', { name: contact.user.firstName })} />
        )}
        {grouped.map((g) => (
          <div key={g.day} className="space-y-2">
            <p className="text-center text-[11px] font-medium text-ink-500">{capitalize(fmtDate(`${g.day}T12:00:00Z`, { weekday: 'long', day: 'numeric', month: 'long' }))}</p>
            {g.items.map((m) => (
              <div key={m.id} className={`flex ${m.mine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm shadow-card ${
                    m.mine ? 'rounded-br-md bg-primary text-white' : 'rounded-bl-md border border-line bg-surface text-ink-900'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>
                  <p className={`mt-1 text-right text-[10px] ${m.mine ? 'text-white/70' : 'text-ink-400'}`}>
                    {fmtTime(m.createdAt)}
                    {m.mine && (m.readAt ? ` · ${t('Letto')}` : '')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} className="border-t border-line p-3">
        {sendError && <p className="mb-2 text-sm text-amber-700">{sendError}</p>}
        <div className="flex items-end gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={1}
            maxLength={2000}
            placeholder={t('Scrivi a {name}…', { name: contact.user.firstName })}
            aria-label={t('Messaggio')}
            className="max-h-32 min-h-11 flex-1 resize-none rounded-2xl border border-line px-4 py-2.5 text-sm outline-none focus:border-brand-400"
          />
          <button type="submit" className="btn-primary h-11 w-11 shrink-0 p-0" disabled={sending || !text.trim()} aria-label={t('Invia')}>
            {sending ? <Spinner className="h-4 w-4 text-white" /> : <SendHorizontal className="h-5 w-5" />}
          </button>
        </div>
        <p className="mt-1 text-[11px] text-ink-400">{t('Invio per mandare · Maiusc + Invio per andare a capo')}</p>
      </form>
    </>
  );
}
