import { CalendarCheck, ChartNoAxesColumn, ChevronRight, ClipboardList, Dumbbell, PersonStanding, Share2, Utensils } from 'lucide-react';
import { useLayoutEffect, useRef, useState } from 'react';
import { LanguageSwitch, ThemeToggle } from '../../components/layout/PreferenceControls.jsx';
import { t } from '../../i18n/index.js';

const WIDE = '(min-width: 1024px)';
// Su telefono e tablet la vetrina compare sotto il modulo solo se resta almeno questo spazio
const MIN_SHOWCASE_HEIGHT = 270;

/**
 * La pagina occupa esattamente lo schermo, senza mai scorrere: se il modulo non ci sta
 * viene rimpicciolito in proporzione (zoom), così non si taglia niente.
 * Restituisce se c'è posto per la vetrina (sempre su computer; su telefono solo se avanza spazio).
 */
function useFitToScreen(cardRef, boxRef, contentRef) {
  const [showcase, setShowcase] = useState(() => typeof window !== 'undefined' && window.matchMedia(WIDE).matches);

  useLayoutEffect(() => {
    const card = cardRef.current;
    const box = boxRef.current;
    const content = contentRef.current;
    if (!card || !box || !content) return undefined;
    const wide = window.matchMedia(WIDE);
    let frame = 0;

    const fit = () => {
      content.style.zoom = '';
      const style = getComputedStyle(box);
      const padding = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
      const natural = content.offsetHeight;
      // Computer: il modulo ha tutta l'altezza della scheda. Telefono: la scheda intera, la vetrina usa ciò che avanza.
      const available = (wide.matches ? box.clientHeight : card.clientHeight) - padding;
      setShowcase(wide.matches || card.clientHeight - natural - padding >= MIN_SHOWCASE_HEIGHT);
      if (available > 0 && natural > available + 0.5) content.style.zoom = String(Math.max(0.55, available / natural));
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(fit);
    };

    fit();
    const observer = new ResizeObserver(schedule);
    observer.observe(card);
    observer.observe(content);
    wide.addEventListener('change', schedule);
    document.fonts?.ready.then(schedule);
    return () => {
      observer.disconnect();
      wide.removeEventListener('change', schedule);
      cancelAnimationFrame(frame);
    };
  }, [cardRef, boxRef, contentRef]);

  return showcase;
}

/**
 * Cornice delle pagine di accesso (come nel mockup): sfondo con onde colorate, scheda con il modulo
 * a sinistra e la vetrina a destra. role: profilo scelto nel modulo; foto e schede della vetrina cambiano con lui.
 * Si adatta sempre all'altezza dello schermo: niente barre di scorrimento, né nella scheda né nella pagina.
 */
export function AuthShell({ children, role = 'client' }) {
  const cardRef = useRef(null);
  const boxRef = useRef(null);
  const contentRef = useRef(null);
  const showcase = useFitToScreen(cardRef, boxRef, contentRef);

  return (
    <div className="relative flex h-dvh items-center justify-center overflow-hidden bg-glow-1 p-3 sm:p-6 lg:p-8 lg:short:p-5 tiny:p-3">
      <AuthWaves />
      <div
        ref={cardRef}
        className="relative z-10 flex h-full max-h-[940px] w-full max-w-[1220px] flex-col justify-center overflow-hidden rounded-[28px] bg-surface/90 shadow-[0_30px_80px_-30px_rgba(15,90,83,0.35)] ring-1 ring-surface/60 backdrop-blur-sm lg:grid lg:grid-cols-2 lg:grid-rows-1 lg:bg-surface"
      >
        <div
          ref={boxRef}
          className={`relative flex min-h-0 flex-col justify-center overflow-hidden px-5 pt-14 pb-5 sm:px-12 sm:pb-8 lg:h-full lg:px-12 lg:py-10 xl:px-16 short:py-5 tiny:py-3 ${showcase ? 'flex-none' : 'flex-1'}`}
        >
          {/* Lingua e tema si possono scegliere anche prima di accedere */}
          <div className="absolute top-3 right-3 z-10 flex items-center gap-1 sm:top-4 sm:right-4">
            <LanguageSwitch />
            <ThemeToggle />
          </div>
          <div ref={contentRef}>{children}</div>
        </div>
        {showcase && <Showcase role={role} />}
      </div>
    </div>
  );
}

// Onde di sfondo

/** Onde morbide color menta attorno alla scheda (si adattano al tema scuro tramite i colori --color-wave-*). */
function AuthWaves() {
  return (
    <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="aw-a" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" className="[stop-color:var(--color-wave-1)]" />
          <stop offset="1" className="[stop-color:var(--color-wave-3)]" />
        </linearGradient>
        <linearGradient id="aw-b" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" className="[stop-color:var(--color-wave-2)]" />
          <stop offset="1" className="[stop-color:var(--color-wave-4)]" />
        </linearGradient>
        <linearGradient id="aw-c" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" className="[stop-color:var(--color-wave-3)]" />
          <stop offset="1" className="[stop-color:var(--color-wave-4)]" />
        </linearGradient>
      </defs>
      {/* In alto a sinistra */}
      <path d="M0 0H520C470 70 360 112 236 122C140 130 60 170 0 236Z" fill="url(#aw-a)" opacity=".55" />
      <path d="M0 0H300C260 48 190 76 112 86C64 92 26 112 0 140Z" fill="url(#aw-c)" opacity=".35" />
      {/* In alto a destra: due fasce che scendono verso destra */}
      <path d="M760 0H1440V250C1340 170 1220 132 1080 124C930 116 830 70 760 0Z" fill="url(#aw-b)" opacity=".6" />
      <path d="M980 0H1440V120C1350 76 1240 56 1130 46C1060 40 1010 22 980 0Z" fill="url(#aw-c)" opacity=".45" />
      <path d="M760 0C830 70 930 116 1080 124C1220 132 1340 170 1440 250" fill="none" className="stroke-surface" strokeWidth="3" opacity=".8" />
      {/* Lobo a sinistra */}
      <path d="M0 300C110 318 196 392 204 488C212 588 132 676 0 726Z" fill="url(#aw-a)" opacity=".6" />
      <path d="M0 382C70 398 116 446 120 508C124 574 80 628 0 660Z" fill="url(#aw-c)" opacity=".4" />
      <path d="M0 300C110 318 196 392 204 488C212 588 132 676 0 726" fill="none" className="stroke-surface" strokeWidth="2.5" opacity=".7" />
      {/* Lobo a destra */}
      <path d="M1440 360C1360 390 1306 456 1312 540C1318 620 1372 676 1440 700Z" fill="url(#aw-a)" opacity=".5" />
      {/* In basso */}
      <path d="M0 770C170 724 340 760 486 836C540 864 580 884 612 900H0Z" fill="url(#aw-b)" opacity=".6" />
      <path d="M700 900C860 806 1040 760 1214 772C1320 780 1394 748 1440 712V900Z" fill="url(#aw-b)" opacity=".55" />
      <path d="M960 900C1080 846 1220 832 1336 844C1388 850 1420 836 1440 824V900Z" fill="url(#aw-c)" opacity=".55" />
      <path d="M700 900C860 806 1040 760 1214 772C1320 780 1394 748 1440 712" fill="none" className="stroke-surface" strokeWidth="3" opacity=".75" />
    </svg>
  );
}

/** Onde in fondo alla vetrina (sotto le foto a fascia, come quelle della foto del cliente). */
function PanelWaves() {
  return (
    <svg aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[46%] w-full" viewBox="0 0 600 400" preserveAspectRatio="none">
      <path d="M0 210C120 150 260 160 380 230C460 276 540 290 600 270V400H0Z" className="fill-wave-2" opacity=".55" />
      <path d="M0 290C140 240 280 250 400 310C470 344 540 352 600 336V400H0Z" className="fill-wave-3" opacity=".5" />
      <path d="M0 350C160 316 320 330 440 372C500 392 560 396 600 388V400H0Z" className="fill-wave-4" opacity=".5" />
      <path d="M0 210C120 150 260 160 380 230C460 276 540 290 600 270" fill="none" className="stroke-surface" strokeWidth="2" opacity=".8" />
    </svg>
  );
}

// Vetrina

// cover: la foto riempie tutta la vetrina; band: foto più piccola in alto a sinistra che sfuma nelle onde
// (la persona resta a sinistra, come nella foto del cliente, così testi e schede a destra non la coprono).
const PHOTOS = {
  client: { src: '/images/login-client.jpg', mode: 'cover' },
  nutritionist: { src: '/images/hero-nutritionist.jpg', mode: 'band' },
  trainer: { src: '/images/hero-trainer.jpg', mode: 'band' },
};
const FADE = 'linear-gradient(to right, black 68%, transparent), linear-gradient(to bottom, black 60%, transparent)';
const PHOTO_STYLE = {
  cover: { inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: '30% 40%' },
  band: { top: 0, left: '-34%', width: '100%', height: 'auto', maskImage: FADE, WebkitMaskImage: FADE, maskComposite: 'intersect', WebkitMaskComposite: 'source-in' },
};

const glass = 'rounded-2xl bg-surface/85 shadow-float backdrop-blur-md';

function Showcase({ role }) {
  const content = SHOWCASE[role] ?? SHOWCASE.client;
  return (
    <aside aria-hidden="true" className="relative mx-3 mb-3 min-h-0 flex-1 overflow-hidden rounded-3xl bg-gradient-to-b from-glow-1 to-glow-3 sm:mx-6 sm:mb-6 lg:m-0 lg:h-full lg:rounded-none">
      <PanelWaves />
      {/* Le foto restano caricate: cambiando profilo si dissolvono l'una nell'altra */}
      {Object.entries(PHOTOS).map(([key, photo]) => (
        <img
          key={key}
          src={photo.src}
          alt=""
          className={`absolute max-w-none transition-opacity duration-700 ${key === role ? 'opacity-100' : 'opacity-0'}`}
          style={PHOTO_STYLE[photo.mode]}
        />
      ))}

      {/* Testi motivazionali (solo su schermi grandi) e schede: a destra, sopra la foto */}
      <div
        key={role}
        className="showcase-enter absolute inset-y-0 right-3 flex w-[min(320px,84%)] flex-col justify-end gap-3 py-4 sm:right-[6%] sm:w-[min(340px,62%)] sm:py-6 lg:justify-between lg:py-[7%] lg:short:py-5"
      >
        <div className={`hidden p-5 lg:block lg:short:p-4 ${glass}`}>
          <h2 className="font-display text-[26px] leading-[1.15] font-semibold text-ink-900 lg:short:text-[22px]">{content.title}</h2>
          <p className="mt-2 text-[14px] leading-relaxed text-ink-700 tiny:hidden">{content.text}</p>
        </div>
        <div className="flex flex-col gap-3 sm:gap-4 lg:gap-5 lg:short:gap-3">
          <MetricCard {...content.metric} />
          <LinkCard {...content.first} className="sm:ml-8" />
          <LinkCard {...content.second} className="sm:ml-3" />
        </div>
        <figure className={`hidden px-5 py-4 lg:block tiny:hidden ${glass}`}>
          <blockquote className="font-serif text-[21px] leading-snug text-ink-900 italic lg:short:text-[18px]">
            “{content.quote[0]}
            <br />
            {content.quote[1]}”
          </blockquote>
          <figcaption className="mt-2 flex items-center gap-3 text-xs text-ink-500">
            <span className="h-px w-8 bg-ink-400" /> Your wellness. Connected.
          </figcaption>
        </figure>
      </div>
    </aside>
  );
}

const cardCls = 'rounded-2xl bg-surface/95 p-2.5 shadow-float backdrop-blur sm:p-4';

function IconTile({ icon: Icon }) {
  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700 sm:h-12 sm:w-12">
      <Icon className="h-[18px] w-[18px] sm:h-6 sm:w-6" strokeWidth={2.2} />
    </span>
  );
}

function MetricCard({ icon, title, value, trend = 'up', bars }) {
  return (
    <div className={`flex items-center gap-2.5 sm:gap-3 ${cardCls}`}>
      <IconTile icon={icon} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] text-ink-700">{title}</p>
        <p className="flex items-center gap-1 font-display text-xl font-semibold text-brand-800 sm:text-2xl">
          {value} <span className="text-base text-brand-600">{trend === 'up' ? '↗' : '↘'}</span>
        </p>
      </div>
      <div className="flex h-11 shrink-0 items-end gap-1.5">
        {bars.map((h, i) => (
          <span key={i} className="w-2.5 rounded-t-[3px] bg-brand-600 sm:w-3" style={{ height: `${h}%`, opacity: 0.25 + (0.75 * (i + 1)) / bars.length }} />
        ))}
      </div>
    </div>
  );
}

function LinkCard({ icon, title, text, className = '' }) {
  return (
    <div className={`flex items-center gap-2.5 sm:gap-3 ${cardCls} ${className}`}>
      <IconTile icon={icon} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold text-ink-900">{title}</p>
        <p className="truncate text-[13px] text-ink-500">{text}</p>
      </div>
      <ChevronRight className="hidden h-5 w-5 shrink-0 text-ink-700 min-[400px]:block" />
    </div>
  );
}

// Testi della vetrina per ogni profilo (getter: si traducono nella lingua attiva)
const SHOWCASE = {
  get client() {
    return {
      title: t('Un benessere più consapevole, ogni giorno.'),
      text: t('Nutrizione, allenamento e supporto professionale, tutto in un unico luogo per una versione più sana e felice di te.'),
      quote: [t('Un te più sano'), t('è un te più felice.')],
      metric: { icon: ChartNoAxesColumn, title: t('I tuoi progressi'), value: '+12%', bars: [22, 40, 62, 100] },
      first: { icon: Utensils, title: t('Nutrizione'), text: t('Piano personalizzato') },
      second: { icon: PersonStanding, title: t('Allenamento'), text: t('I tuoi prossimi obiettivi') },
    };
  },
  get nutritionist() {
    return {
      title: t('I tuoi clienti, sempre sotto controllo.'),
      text: t('Piani alimentari, controlli e progressi in un’unica dashboard, con i dati condivisi dal personal trainer.'),
      quote: [t('Ogni piano è una persona,'), t('non un numero.')],
      metric: { icon: ChartNoAxesColumn, title: t('Andamento clienti'), value: '-1,2 kg', trend: 'down', bars: [100, 78, 64, 50] },
      first: { icon: ClipboardList, title: t('Piani alimentari'), text: t('Su misura per ogni cliente') },
      second: { icon: CalendarCheck, title: t('Controlli'), text: t('Check-up e progressi in agenda') },
    };
  },
  get trainer() {
    return {
      title: t('Allenamenti che lasciano il segno.'),
      text: t('Crea schede su misura, segui la costanza dei tuoi clienti e lavora in squadra con la nutrizionista.'),
      quote: [t('La costanza batte'), t('il talento.')],
      metric: { icon: ChartNoAxesColumn, title: t('Costanza dei clienti'), value: '86%', bars: [48, 66, 74, 100] },
      first: { icon: Dumbbell, title: t('Schede di allenamento'), text: t('Esercizi, serie e recuperi') },
      second: { icon: Share2, title: t('Dati nutrizionali'), text: t('Condivisi dalla nutrizionista') },
    };
  },
};
