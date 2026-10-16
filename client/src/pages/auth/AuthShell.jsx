import { CalendarCheck, ChartNoAxesColumn, Check, ChevronRight, Dumbbell, Share2, Target, Utensils } from 'lucide-react';
import { useLayoutEffect, useRef } from 'react';
import { LanguageSwitch, ThemeToggle } from '../../components/layout/PreferenceControls.jsx';
import { t } from '../../i18n/index.js';

/**
 * Cornice delle pagine di accesso: modulo a sinistra, vetrina illustrata a destra.
 * role: profilo scelto nel modulo (Cliente / Nutrizionista / Personal Trainer): la vetrina cambia con lui.
 */
export function AuthShell({ children, role = 'client' }) {
  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-surface sm:bg-gradient-to-br sm:from-glow-1 sm:via-glow-2 sm:to-glow-3 sm:p-4 lg:h-dvh lg:p-6 tiny:p-3">
      {/* Onde decorative di sfondo */}
      <div aria-hidden="true" className="pointer-events-none absolute hidden sm:block -top-40 -right-40 h-[520px] w-[520px] rounded-full bg-glow-4/60 blur-2xl" />
      <div aria-hidden="true" className="pointer-events-none absolute hidden sm:block -bottom-48 -left-40 h-[560px] w-[560px] rounded-full bg-glow-5/50 blur-2xl" />

      <div className="relative grid w-full max-w-[1100px] overflow-hidden bg-surface sm:rounded-[28px] sm:border sm:border-surface/80 sm:shadow-[0_30px_80px_-30px_rgba(15,90,83,0.35)] lg:h-full lg:max-h-[920px] lg:grid-cols-[1fr_1.05fr]">
        <div className="relative flex min-h-0 flex-col justify-center px-5 py-6 sm:px-12 sm:py-10 lg:overflow-y-auto lg:px-14 short:py-5 tiny:py-3">
          {/* Lingua e tema si possono scegliere anche prima di accedere */}
          <div className="absolute top-3 right-3 z-10 flex items-center gap-1 sm:top-4 sm:right-4">
            <LanguageSwitch />
            <ThemeToggle />
          </div>
          {children}
        </div>
        <Showcase role={role} />
      </div>
    </div>
  );
}

/**
 * Adatta il contenuto allo spazio del riquadro: se non ci sta, lo rimpicciolisce in proporzione
 * (testi, schede e citazione restano tutti visibili) e lo allarga in modo che occupi sempre tutta la larghezza.
 * key: quando cambia (es. il profilo scelto) il contenuto nuovo viene misurato di nuovo.
 */
function useFitToBox(boxRef, contentRef, key) {
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
  }, [boxRef, contentRef, key]);
}

const IMAGES = {
  client: { src: '/images/hero-client.jpg', position: '45% 30%' },
  nutritionist: { src: '/images/hero-nutritionist.jpg', position: '50% 22%' },
  trainer: { src: '/images/hero-trainer.jpg', position: '50% 30%' },
};

const MASK = {
  maskImage: 'linear-gradient(to right, transparent 0%, black 55%), linear-gradient(to bottom, black 60%, transparent 100%)',
  maskComposite: 'intersect',
  WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 55%), linear-gradient(to bottom, black 60%, transparent 100%)',
  WebkitMaskComposite: 'source-in',
};

function Showcase({ role }) {
  const boxRef = useRef(null);
  const contentRef = useRef(null);
  useFitToBox(boxRef, contentRef, role);
  const Content = { client: ClientShowcase, nutritionist: NutritionistShowcase, trainer: TrainerShowcase }[role] ?? ClientShowcase;

  return (
    <aside ref={boxRef} aria-hidden="true" className="relative hidden overflow-hidden bg-gradient-to-b from-glow-1 to-glow-3 lg:block">
      {/* Le tre foto restano caricate: cambiando profilo si dissolvono l'una nell'altra */}
      {Object.entries(IMAGES).map(([key, img]) => (
        <img
          key={key}
          src={img.src}
          alt=""
          className={`absolute top-0 right-0 h-[46%] max-h-[360px] w-[66%] object-cover transition-opacity duration-700 ${key === role ? 'opacity-100' : 'opacity-0'}`}
          style={{ ...MASK, objectPosition: img.position }}
        />
      ))}
      <div key={role} ref={contentRef} className="showcase-enter absolute top-0 left-0 z-10 flex origin-top-left flex-col px-10 pt-12 pb-8">
        <Content />
      </div>
    </aside>
  );
}

// Pezzi comuni della vetrina

const card = 'rounded-2xl bg-surface/95 p-4 shadow-float';

function Heading({ title, text }) {
  return (
    <>
      <h2 className="max-w-[270px] font-display text-[32px] leading-[1.12] font-semibold text-ink-900">{title}</h2>
      <p className="mt-3 max-w-[250px] text-[15px] leading-relaxed text-ink-700">{text}</p>
    </>
  );
}

function Quote({ children }) {
  return (
    <figure className="mt-auto pt-6 pl-6">
      <blockquote className="max-w-[360px] font-serif text-[24px] leading-snug text-ink-900 italic">“{children}”</blockquote>
      <figcaption className="mt-3 flex items-center gap-3 text-xs text-ink-700">
        <span className="h-px w-8 bg-ink-500" /> Your wellness. Connected.
      </figcaption>
    </figure>
  );
}

function CardTitle({ icon: Icon, children, arrow = false }) {
  return (
    <p className="flex items-center justify-between gap-2 text-sm font-semibold">
      <span className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-brand-700" /> {children}
      </span>
      {arrow && <ChevronRight className="h-4 w-4 text-ink-400" />}
    </p>
  );
}

function CheckList({ items }) {
  return (
    <ul className="mt-3 space-y-2.5 text-xs">
      {items.map(([title, sub, done, side]) => (
        <li key={title} className="flex items-center gap-2">
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">{title}</span>
            <span className="block truncate text-ink-500">{sub}</span>
          </span>
          {side && <span className="shrink-0 text-[11px] text-ink-500">{side}</span>}
          <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${done ? 'border-brand-500 bg-brand-500 text-white' : 'border-ink-300'}`}>
            {done && <Check className="h-3 w-3" strokeWidth={3} />}
          </span>
        </li>
      ))}
    </ul>
  );
}

function Sparkline({ id, path }) {
  return (
    <svg viewBox="0 0 220 60" className="h-14 flex-1">
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#35a08a" stopOpacity=".25" />
          <stop offset="1" stopColor="#35a08a" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${path} L220 60 L0 60Z`} fill={`url(#${id})`} />
      <path d={path} fill="none" stroke="#1e8576" strokeWidth="2" />
    </svg>
  );
}

function Meter({ value, label, pct, icon, title }) {
  return (
    <div className={`-rotate-[1deg] ${card}`}>
      <CardTitle icon={icon} arrow>
        {title}
      </CardTitle>
      <p className="mt-2 font-display text-xl font-semibold">{value}</p>
      <p className="text-[11px] text-ink-500">{label}</p>
      <div className="mt-2 h-1.5 rounded-full bg-track">
        <div className="h-full rounded-full bg-brand-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// Cliente

function ClientShowcase() {
  return (
    <>
      <Heading
        title={t('Un benessere più consapevole, ogni giorno.')}
        text={t('Nutrizione, allenamento e supporto professionale, tutto in un unico luogo per una versione più sana e felice di te.')}
      />
      <div className="mt-6 space-y-4">
        <div className={`ml-6 -rotate-[1.5deg] ${card}`}>
          <CardTitle icon={ChartNoAxesColumn}>{t('Il tuo percorso')}</CardTitle>
          <div className="mt-2 flex items-end gap-4">
            <Sparkline id="sc-client" path="M0 12 L20 16 L38 14 L55 22 L75 20 L95 30 L115 34 L135 32 L155 40 L175 42 L200 46 L220 48" />
            <div className="text-right">
              <p className="font-display text-lg font-semibold">{t('64,2 kg')}</p>
              <p className="text-xs font-semibold text-brand-600">{t('↓ -1,8 kg')}</p>
              <p className="text-[10px] text-ink-500">{t('da inizio percorso')}</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-[1.15fr_1fr] gap-4">
          <div className={`rotate-[1.5deg] ${card}`}>
            <CardTitle icon={Utensils}>{t('Piano nutrizionale')}</CardTitle>
            <CheckList
              items={[
                [t('Colazione'), t("Porridge d'avena"), true],
                [t('Pranzo'), t('Bowl di pollo grigliato'), true],
                [t('Cena'), t('Salmone con quinoa'), false],
              ]}
            />
          </div>
          <div className="space-y-4">
            <Meter icon={Dumbbell} title={t('Allenamenti')} value="4 / 5" label={t('questa settimana')} pct={80} />
            <div className={`rotate-[1.5deg] ${card}`}>
              <CardTitle icon={Target}>{t('I tuoi progressi')}</CardTitle>
              <p className="mt-1.5 text-xs text-ink-700">{t('Maggiore energia e forza')}</p>
            </div>
          </div>
        </div>
      </div>
      <Quote>
        {t('Un te più sano')}
        <br />
        {t('è un te più felice.')}
      </Quote>
    </>
  );
}

// Nutrizionista

function NutritionistShowcase() {
  return (
    <>
      <Heading
        title={t('I tuoi clienti, sempre sotto controllo.')}
        text={t('Piani alimentari, controlli e progressi in un’unica dashboard, con i dati condivisi dal personal trainer.')}
      />
      <div className="mt-6 space-y-4">
        <div className={`ml-6 -rotate-[1.5deg] ${card}`}>
          <CardTitle icon={ChartNoAxesColumn}>{t('Andamento clienti')}</CardTitle>
          <div className="mt-2 flex items-end gap-4">
            <Sparkline id="sc-nutri" path="M0 10 L22 14 L40 13 L60 19 L80 18 L100 25 L120 27 L140 31 L160 33 L180 38 L200 40 L220 43" />
            <div className="text-right">
              <p className="font-display text-lg font-semibold">{t('-1,2 kg')}</p>
              <p className="text-xs font-semibold text-brand-600">{t('in media')}</p>
              <p className="text-[10px] text-ink-500">{t('negli ultimi 3 mesi')}</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-[1.15fr_1fr] gap-4">
          <div className={`rotate-[1.5deg] ${card}`}>
            <CardTitle icon={Utensils}>{t('Piano alimentare')}</CardTitle>
            <CheckList
              items={[
                [t('Colazione'), t('Yogurt greco con granola'), true, '340 kcal'],
                [t('Pranzo'), t('Insalata di farro e ceci'), true, '540 kcal'],
                [t('Cena'), t('Orata al cartoccio'), true, '470 kcal'],
              ]}
            />
          </div>
          <div className="space-y-4">
            <Meter icon={CalendarCheck} title={t('Check-up')} value={t('5 oggi')} label={t('nella tua agenda')} pct={60} />
            <div className={`rotate-[1.5deg] ${card}`}>
              <CardTitle icon={Share2}>{t('Dati dal trainer')}</CardTitle>
              <p className="mt-1.5 text-xs text-ink-700">{t('Costanza allenamenti: 90%')}</p>
            </div>
          </div>
        </div>
      </div>
      <Quote>
        {t('Ogni piano è una persona,')}
        <br />
        {t('non un numero.')}
      </Quote>
    </>
  );
}

// Personal trainer

function TrainerShowcase() {
  const bars = [62, 74, 70, 82, 78, 88, 86];
  return (
    <>
      <Heading
        title={t('Allenamenti che lasciano il segno.')}
        text={t('Crea schede su misura, segui la costanza dei tuoi clienti e lavora in squadra con la nutrizionista.')}
      />
      <div className="mt-6 space-y-4">
        <div className={`ml-6 -rotate-[1.5deg] ${card}`}>
          <CardTitle icon={ChartNoAxesColumn}>{t('Costanza dei clienti')}</CardTitle>
          <div className="mt-2 flex items-end gap-4">
            <div className="flex h-14 flex-1 items-end gap-2">
              {bars.map((h, i) => (
                <span key={i} className="flex-1 rounded-t-md bg-gradient-to-t from-brand-600 to-brand-400" style={{ height: `${h}%` }} />
              ))}
            </div>
            <div className="text-right">
              <p className="font-display text-lg font-semibold">86%</p>
              <p className="text-xs font-semibold text-brand-600">↑ +6%</p>
              <p className="text-[10px] text-ink-500">{t('questo mese')}</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-[1.15fr_1fr] gap-4">
          <div className={`rotate-[1.5deg] ${card}`}>
            <CardTitle icon={Dumbbell}>{t('Scheda di oggi')}</CardTitle>
            <CheckList
              items={[
                [t('Squat bilanciere'), t('4 serie × 8'), true],
                [t('Panca piana bilanciere'), t('4 serie × 10'), true],
                [t('Rematore manubri'), t('3 serie × 12'), false],
              ]}
            />
          </div>
          <div className="space-y-4">
            <Meter icon={CalendarCheck} title={t('Sessioni')} value="6 / 8" label={t('questa settimana')} pct={75} />
            <div className={`rotate-[1.5deg] ${card}`}>
              <CardTitle icon={Utensils}>{t('Check nutrizionale')}</CardTitle>
              <p className="mt-1.5 text-xs text-ink-700">{t('Condiviso dalla nutrizionista')}</p>
            </div>
          </div>
        </div>
      </div>
      <Quote>
        {t('La costanza batte')}
        <br />
        {t('il talento.')}
      </Quote>
    </>
  );
}
