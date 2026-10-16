import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router';
import { greeting } from '../lib/format.js';

/**
 * Banner di benvenuto in cima alle dashboard: testo a sinistra, foto al centro
 * e un pannello di riepilogo a destra.
 */
export function Hero({ firstName, title, subtitle, cta, image, imagePosition = 'center', aside }) {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-glow-1 via-glow-2 to-glow-3">
      <div className="grid xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="relative min-h-[230px]">
          {image && (
            <img
              src={image}
              alt=""
              className="absolute inset-y-0 right-0 hidden h-full w-[52%] object-cover sm:block"
              style={{
                objectPosition: imagePosition,
                maskImage: 'linear-gradient(to right, transparent 0%, black 32%, black 82%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 32%, black 82%, transparent 100%)',
              }}
            />
          )}
          <div className="relative z-10 max-w-[560px] px-6 py-7 sm:px-8 sm:py-8">
            <p className="eyebrow">
              {greeting()}, {firstName}
            </p>
            <h1 className="mt-2 font-display text-[28px] leading-[1.1] font-bold text-ink-900 sm:max-w-[60%] sm:text-[38px] xl:max-w-none">
              {title}
            </h1>
            <p className="mt-3 max-w-[360px] text-[15px] leading-relaxed text-ink-700 sm:text-base">{subtitle}</p>
            {cta && (
              <Link to={cta.to} className="btn-primary mt-5">
                {cta.label} <ChevronRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
        {aside && (
          <div className="relative z-10 border-t border-surface/70 bg-surface/35 px-6 py-6 backdrop-blur-sm xl:border-t-0 xl:border-l xl:border-l-brand-200/70 xl:bg-transparent xl:px-7 xl:backdrop-blur-none">
            {aside}
          </div>
        )}
      </div>
    </section>
  );
}
