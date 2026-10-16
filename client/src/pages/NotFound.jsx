import { Link } from 'react-router';
import { LogoStacked } from '../components/Logo.jsx';

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center bg-canvas px-4 text-center">
      <div>
        <LogoStacked />
        <h1 className="mt-8 font-display text-3xl font-semibold">Pagina non trovata</h1>
        <p className="mt-2 text-ink-500">Il link potrebbe essere errato o la pagina non esiste più.</p>
        <Link to="/app" className="btn-primary mt-6">
          Vai alla dashboard
        </Link>
      </div>
    </div>
  );
}
