import { ChartNoAxesColumn, Check, ChevronRight, Dumbbell, Target, Utensils } from 'lucide-react';
import { useLayoutEffect, useRef } from 'react';

/** Cornice delle pagine di accesso: modulo a sinistra, vetrina illustrata a destra. */
export function AuthShell({ children }) {
  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-white sm:bg-gradient-to-br sm:from-[#f3faf7] sm:via-[#e8f5f0] sm:to-[#dcefe8] sm:p-4 lg:h-dvh lg:p-6 tiny:p-3">
      {/* Onde decorative di sfondo */}
      <div aria-hidden="true" className="pointer-events-none absolute hidden sm:block -top-40 -right-40 h-[520px] w-[520px] rounded-full bg-[#cfeadf]/60 blur-2xl" />
      <div aria-hidden="true" className="pointer-events-none absolute hidden sm:block -bottom-48 -left-40 h-[560px] w-[560px] rounded-full bg-[#bfe3d5]/50 blur-2xl" />

      <div className="relative grid w-full max-w-[1100px] overflow-hidden bg-white sm:rounded-[28px] sm:border sm:border-white/80 sm:shadow-[0_30px_80px_-30px_rgba(15,90,83,0.35)] lg:h-full lg:max-h-[920px] lg:grid-cols-[1fr_1.05fr]">
        <div className="flex min-h-0 flex-col justify-center px-5 py-6 sm:px-12 sm:py-10 lg:overflow-y-auto lg:px-14 short:py-5 tiny:py-3">{children}</div>
        <Showcase />
      </div>
    </div>
  );
}

/**
 * Adatta il contenuto allo spazio del riquadro: se non ci sta, lo rimpicciolisce in proporzione
 * (testi, schede e citazione restano tutti visibili) e lo allarga in modo che occupi sempre tutta la larghezza.
 */
function useFitToBox(boxRef, contentRef) {
  useLayoutEffect(() => {
    const box = boxRef.current;
    const content = contentRef.current;
    if (!box || !content) return undefined;

    const fit = () => {
      const width = box.clientWidth;
      const height = box.clientHeight;
      if (!width || !height) return;
      content.style.transform = 'none';
      content.style.minHeight = '0px';
      content.style.width = `${width}px`;
      let scale = 1;
      // Allargando il contenuto il testo va meno a capo: si ripete finché la misura è stabile.
      for (let i = 0; i < 4; i += 1) {
        const next = Math.min(1, height / content.offsetHeight);
        content.style.width = `${width / next}px`;
        if (Math.abs(next - scale) < 0.005) {
          scale = next;
          break;
        }
        scale = next;
      }
      scale = Math.min(scale, height / content.offsetHeight);
      content.style.minHeight = `${height / scale}px`;
      content.style.transform = `scale(${scale})`;
    };

    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(box);
    document.fonts?.ready.then(fit);
    return () => observer.disconnect();
  }, [boxRef, contentRef]);
}

function Showcase() {
  const boxRef = useRef(null);
  const contentRef = useRef(null);
  useFitToBox(boxRef, contentRef);

  return (
    <aside ref={boxRef} aria-hidden="true" className="relative hidden overflow-hidden bg-gradient-to-b from-[#eef7f3] to-[#dff0e9] lg:block">
      <img
        src="/images/hero-client.jpg"
        alt=""
        className="absolute top-0 right-0 h-[46%] max-h-[360px] w-[66%] object-cover object-[45%_30%]"
        style={{
          maskImage: 'linear-gradient(to right, transparent 0%, black 55%), linear-gradient(to bottom, black 60%, transparent 100%)',
          maskComposite: 'intersect',
          WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 55%), linear-gradient(to bottom, black 60%, transparent 100%)',
          WebkitMaskComposite: 'source-in',
        }}
      />
      <div ref={contentRef} className="absolute top-0 left-0 z-10 flex origin-top-left flex-col px-10 pt-12 pb-8">
        <h2 className="max-w-[270px] font-display text-[32px] leading-[1.12] font-semibold text-ink-900">
          Un benessere più consapevole, ogni giorno.
        </h2>
        <p className="mt-3 max-w-[250px] text-[15px] leading-relaxed text-ink-700">
          Nutrizione, allenamento e supporto professionale, tutto in un unico luogo per una versione più sana e felice di te.
        </p>

        <div className="mt-6 space-y-4">
          <div className="ml-6 -rotate-[1.5deg] rounded-2xl bg-white/95 p-4 shadow-float">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-50 text-brand-700"><ChartNoAxesColumn className="h-4 w-4" /></span>
              <span className="text-sm font-semibold">Il tuo percorso</span>
            </div>
            <div className="mt-2 flex items-end gap-4">
              <svg viewBox="0 0 220 60" className="h-14 flex-1">
                <defs>
                  <linearGradient id="sc" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0" stopColor="#35a08a" stopOpacity=".25" />
                    <stop offset="1" stopColor="#35a08a" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0 12 L20 16 L38 14 L55 22 L75 20 L95 30 L115 34 L135 32 L155 40 L175 42 L200 46 L220 48 L220 60 L0 60Z" fill="url(#sc)" />
                <path d="M0 12 L20 16 L38 14 L55 22 L75 20 L95 30 L115 34 L135 32 L155 40 L175 42 L200 46 L220 48" fill="none" stroke="#1e8576" strokeWidth="2" />
                <circle cx="218" cy="48" r="3.5" fill="#0f5a53" />
              </svg>
              <div className="text-right">
                <p className="font-display text-lg font-semibold">64,2 kg</p>
                <p className="text-xs font-semibold text-brand-600">↓ -1,8 kg</p>
                <p className="text-[10px] text-ink-500">da inizio percorso</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-[1.15fr_1fr] gap-4">
            <div className="rotate-[1.5deg] rounded-2xl bg-white/95 p-4 shadow-float">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <Utensils className="h-4 w-4 text-brand-700" /> Piano nutrizionale
              </p>
              <ul className="mt-3 space-y-2.5 text-xs">
                {[
                  ['Colazione', "Porridge d'avena", true],
                  ['Pranzo', 'Bowl di pollo grigliato', true],
                  ['Cena', 'Salmone con quinoa', false],
                ].map(([meal, dish, done]) => (
                  <li key={meal} className="flex items-center gap-2">
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">{meal}</span>
                      <span className="block truncate text-ink-500">{dish}</span>
                    </span>
                    <span className={`grid h-5 w-5 place-items-center rounded-full border-2 ${done ? 'border-brand-500 bg-brand-500 text-white' : 'border-ink-300'}`}>
                      {done && <Check className="h-3 w-3" strokeWidth={3} />}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-4">
              <div className="-rotate-[1deg] rounded-2xl bg-white/95 p-4 shadow-float">
                <p className="flex items-center justify-between text-sm font-semibold">
                  <span className="flex items-center gap-2"><Dumbbell className="h-4 w-4 text-brand-700" /> Allenamenti</span>
                  <ChevronRight className="h-4 w-4 text-ink-400" />
                </p>
                <p className="mt-2 font-display text-xl font-semibold">4 / 5</p>
                <p className="text-[11px] text-ink-500">questa settimana</p>
                <div className="mt-2 h-1.5 rounded-full bg-[#e8efed]">
                  <div className="h-full w-4/5 rounded-full bg-brand-500" />
                </div>
              </div>
              <div className="rotate-[1.5deg] rounded-2xl bg-white/95 p-4 shadow-float">
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <Target className="h-4 w-4 text-brand-700" /> I tuoi progressi
                </p>
                <p className="mt-1.5 text-xs text-ink-700">Maggiore energia e forza</p>
              </div>
            </div>
          </div>
        </div>

        <figure className="mt-auto pt-6 pl-6">
          <blockquote className="font-serif text-[24px] leading-snug text-ink-900 italic">
            “Un te più sano
            <br />è un te più felice.”
          </blockquote>
          <figcaption className="mt-3 flex items-center gap-3 text-xs text-ink-700">
            <span className="h-px w-8 bg-ink-500" /> Your wellness. Connected.
          </figcaption>
        </figure>
      </div>
    </aside>
  );
}
