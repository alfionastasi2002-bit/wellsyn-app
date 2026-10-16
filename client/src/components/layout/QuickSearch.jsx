import { CornerDownLeft, LifeBuoy, Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { api } from '../../lib/api.js';
import { displayName, ROLE_LABELS } from '../../lib/format.js';
import { NAVIGATION } from '../../navigation.js';
import { Avatar } from '../Avatar.jsx';
import { t } from '../../i18n/index.js';

const PLACEHOLDER = {
  client: 'Cerca sezioni o professionisti…',
  nutritionist: 'Cerca clienti o sezioni…',
  trainer: 'Cerca clienti o sezioni…',
};

const normalize = (s) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

/** Ricerca rapida: sezioni dell'app e persone collegate (clienti o professionisti). */
export function QuickSearch({ role }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [people, setPeople] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => !ref.current?.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  // Le persone si caricano solo la prima volta che si usa la ricerca.
  function loadPeople() {
    if (people) return;
    setPeople([]);
    if (role === 'client') {
      api('/team')
        .then(({ team }) =>
          setPeople(
            team
              .filter((link) => link.status === 'active')
              .map((link) => ({ label: displayName(link.professional), sub: ROLE_LABELS[link.role], to: `/app/notifiche?con=${link.professional.id}`, user: link.professional })),
          ),
        )
        .catch(() => {});
    } else {
      api('/clients')
        .then(({ clients }) =>
          setPeople(
            clients
              .filter((c) => c.status === 'active')
              .map((c) => ({ label: c.client.fullName, sub: c.program ? `${t('Cliente')} · ${t(c.program)}` : t('Cliente'), to: `/app/progressi?cliente=${c.client.id}`, user: c.client })),
          ),
        )
        .catch(() => {});
    }
  }

  const sections = [
    ...NAVIGATION[role].map((i) => ({ label: i.label, sub: t('Sezione'), to: i.path ? `/app/${i.path}` : '/app', icon: i.icon })),
    { label: t('Centro assistenza'), sub: t('Sezione'), to: '/app/supporto', icon: LifeBuoy },
  ];
  const q = normalize(query.trim());
  const results = q ? [...(people ?? []), ...sections].filter((r) => normalize(r.label).includes(q)).slice(0, 8) : [];

  function go(result) {
    navigate(result.to);
    setQuery('');
    setOpen(false);
  }

  function onKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter' && results[active]) {
      e.preventDefault();
      go(results[active]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div ref={ref} className="relative hidden max-w-[520px] flex-1 md:block">
      <label className="relative block">
        <span className="sr-only">{t('Cerca')}</span>
        <Search className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-ink-500" />
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={() => {
            loadPeople();
            setOpen(true);
          }}
          onKeyDown={onKeyDown}
          placeholder={t(PLACEHOLDER[role])}
          role="combobox"
          aria-expanded={open && results.length > 0}
          aria-controls="quick-search-results"
          aria-autocomplete="list"
          className="h-11 w-full rounded-xl border border-transparent bg-muted pr-4 pl-12 text-sm text-ink-900 outline-none placeholder:text-ink-400 focus:border-brand-300 focus:bg-surface"
        />
      </label>
      {open && q && (
        <div id="quick-search-results" role="listbox" className="card absolute inset-x-0 top-12 z-30 overflow-hidden p-1.5 shadow-float">
          {results.length === 0 ? (
            <p className="px-3 py-2.5 text-sm text-ink-500">{t('Nessun risultato per “{query}”.', { query })}</p>
          ) : (
            results.map((r, i) => {
              const Icon = r.icon;
              return (
                <button
                  key={`${r.to}-${r.label}`}
                  type="button"
                  role="option"
                  aria-selected={i === active}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(r)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm ${i === active ? 'bg-brand-50' : ''}`}
                >
                  {r.user ? (
                    <Avatar user={r.user} size="sm" />
                  ) : (
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-muted text-ink-700">
                      <Icon className="h-4 w-4" />
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{r.label}</span>
                    <span className="block truncate text-xs text-ink-500">{r.sub}</span>
                  </span>
                  {i === active && <CornerDownLeft className="h-4 w-4 text-ink-400" />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
