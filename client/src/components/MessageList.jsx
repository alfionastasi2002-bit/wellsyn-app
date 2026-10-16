import { MessageSquareText } from 'lucide-react';
import { relativeTime, displayName } from '../lib/format.js';
import { Avatar } from './Avatar.jsx';
import { ArrowLink, Card, CardHeader, EmptyState } from './ui.jsx';

export function MessageList({ messages, to = '/app/messaggi', className = '' }) {
  return (
    <Card className={`p-5 ${className}`}>
      <CardHeader icon={MessageSquareText} title="Messaggi recenti" action={<ArrowLink to={to}>Vedi tutti</ArrowLink>} />
      {messages.length === 0 ? (
        <EmptyState title="Nessun messaggio" text="Qui vedrai gli ultimi messaggi ricevuti." />
      ) : (
        <ul className="mt-3 divide-y divide-line">
          {messages.map((m) => (
            <li key={m.id} className="flex items-start gap-3 py-3">
              <Avatar user={m.from} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate text-sm font-semibold">{displayName(m.from)}</p>
                  <span className="shrink-0 text-xs text-ink-500">{relativeTime(m.createdAt)}</span>
                </div>
                <p className="mt-0.5 line-clamp-2 text-[13px] text-ink-500">{m.text}</p>
              </div>
              {m.unread && <span className="mt-6 h-2.5 w-2.5 shrink-0 rounded-full bg-brand-500" aria-label="Non letto" />}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
