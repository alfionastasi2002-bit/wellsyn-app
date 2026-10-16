import { ArrowLeft, Hammer } from 'lucide-react';
import { Link } from 'react-router';
import { IconBadge } from '../components/ui.jsx';

export default function ComingSoon({ title, description, icon = Hammer }) {
  return (
    <div className="card mx-auto mt-6 max-w-2xl overflow-hidden">
      <div className="relative bg-gradient-to-br from-[#eef8f4] to-[#d9efe7] px-8 py-10">
        <IconBadge icon={icon} size="lg" tone="solid" />
        <h1 className="mt-4 font-display text-3xl font-semibold">{title}</h1>
        <p className="mt-2 max-w-md text-ink-700">{description}</p>
        <img src="/brand/logo-mark.png" alt="" className="pointer-events-none absolute -right-10 -bottom-10 h-44 opacity-60" />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 px-8 py-5">
        <p className="text-sm text-ink-500">Questa sezione è in sviluppo e arriverà nei prossimi aggiornamenti.</p>
        <Link to="/app" className="btn-soft">
          <ArrowLeft className="h-4 w-4" /> Torna alla dashboard
        </Link>
      </div>
    </div>
  );
}
