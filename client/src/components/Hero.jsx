import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router';
import { useAuth } from '../context/AuthContext.jsx';
import { greeting } from '../lib/format.js';

// Fondo chiaro delle immagini dei banner: riempie lo spazio del testo su telefono.
const PAPER = 'bg-[#f5f4f0]';

/**
 * Banner di benvenuto in cima alle dashboard: l'immagine fa da sfondo (gli oggetti stanno a destra),
 * il testo sta a sinistra sulla parte libera e il pannello di riepilogo a destra.
 * Su telefono l'immagine scende in una fascia sotto il testo.
 * Se l'utente ha caricato un suo banner (Profilo e impostazioni) si usa quello al posto dell'immagine del profilo.
 */
export function Hero({ firstName, title, subtitle, cta, image, imagePosition = 'right center', aside }) {
  const { user } = useAuth();
  const custom = Boolean(user?.bannerUrl);
  if (custom) {
    image = user.bannerUrl;
    imagePosition = 'center';
  }
  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-glow-1 via-glow-2 to-glow-3">
      <div className="grid xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className={`relative overflow-hidden ${PAPER} dark:bg-glow-1 ${image ? 'pb-[120px] sm:pb-0' : ''} sm:min-h-[270px]`}>
          {image && (
            <img
              src={image}
              alt=""
              className="absolute inset-x-0 bottom-0 h-[140px] w-full object-cover [mask-image:linear-gradient(to_bottom,transparent,black_35%)] sm:inset-y-0 sm:h-full sm:[mask-image:none] dark:opacity-55 dark:saturate-[1.15]"
              style={{ objectPosition: imagePosition }}
            />
          )}
          {/* Velo a sinistra: il testo resta leggibile anche dove l'immagine è più piena */}
          {/* (più coprente con il banner dell'utente, che può avere colori scuri anche a sinistra) */}
          <div
            aria-hidden="true"
            className={`absolute inset-0 hidden bg-gradient-to-r sm:block dark:from-glow-1 dark:via-glow-1/60 ${
              custom ? 'from-[#f5f4f0]/95 via-[#f5f4f0]/75 via-45% to-transparent to-75%' : 'from-[#f5f4f0]/85 via-[#f5f4f0]/20 via-45% to-transparent to-60%'
            }`}
          />
          <div className="relative z-10 px-5 py-6 sm:max-w-[52%] sm:px-8 sm:py-8 xl:max-w-[50%]">
            <p className="eyebrow">
              {greeting()}, {firstName}
            </p>
            <h1 className="mt-2 font-display text-[28px] leading-[1.1] font-bold text-ink-900 sm:text-[34px] 2xl:text-[38px]">{title}</h1>
            <p className="mt-3 max-w-[380px] text-[15px] leading-relaxed text-ink-700 sm:text-base">{subtitle}</p>
            {cta && (
              <Link to={cta.to} className="btn-primary mt-5">
                {cta.label} <ChevronRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
        {aside && (
          <div className="relative z-10 border-t border-surface/70 bg-surface/35 px-5 py-5 backdrop-blur-sm sm:px-6 sm:py-6 xl:border-t-0 xl:border-l xl:border-l-brand-200/70 xl:bg-transparent xl:px-7 xl:backdrop-blur-none">
            {aside}
          </div>
        )}
      </div>
    </section>
  );
}
