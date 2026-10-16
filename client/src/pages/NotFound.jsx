import { Link } from 'react-router';
import { LogoStacked } from '../components/Logo.jsx';

export default function NotFound({ inApp = false }) {
  return (
    <div className={`grid place-items-center px-4 text-center ${inApp ? 'min-h-[60vh]' : 'min-h-dvh bg-canvas'}`}>
      <div>
        {!inApp && <LogoStacked />}
        <h1 className="mt-8 font-display text-3xl font-semibold">Pagina non trovata</h1>
        <p className="mt-2 text-ink-500">Il link potrebbe essere errato oppure la sezione non è disponibile per il tuo profilo.</p>
        <Link to="/app" className="btn-primary mt-6">
          Vai alla dashboard
        </Link>
      </div>
    </div>
  );
}
