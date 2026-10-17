import { CalendarCheck, ChartNoAxesColumn, ChevronRight, ClipboardList, Dumbbell, PersonStanding, Share2, Utensils } from 'lucide-react';
import { LanguageSwitch, ThemeToggle } from '../../components/layout/PreferenceControls.jsx';
import { t } from '../../i18n/index.js';

/**
 * Cornice delle pagine di accesso (come nel mockup): sfondo con onde colorate, scheda con il modulo
 * a sinistra e la vetrina a destra. role: profilo scelto nel modulo; foto e schede della vetrina cambiano con lui.
 * Su telefono la vetrina scende sotto il modulo.
 */
export function AuthShell({ children, role = 'client' }) {
  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-glow-1 px-4 py-6 sm:p-6 lg:h-dvh lg:p-8 lg:short:p-5 tiny:p-3">
      <AuthWaves />
      <div className="relative z-10 grid w-full max-w-[1220px] overflow-hidden rounded-[28px] bg-surface/90 shadow-[0_30px_80px_-30px_rgba(15,90,83,0.35)] ring-1 ring-surface/60 backdrop-blur-sm lg:h-full lg:max-h-[940px] lg:grid-cols-2 lg:bg-surface">
        <div className="relative flex min-h-0 flex-col justify-center px-5 pt-14 pb-6 sm:px-12 sm:pb-10 lg:overflow-y-auto lg:px-16 lg:py-10 short:py-5 tiny:py-3">
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

// cover: la foto riempie tutta la vetrina; band: foto più piccola in alto che sfuma nelle onde.
const PHOTOS = {
  client: { src: '/images/login-client.jpg', mode: 'cover', position: '30% 40%' },
  nutritionist: { src: '/images/hero-nutritionist.jpg', mode: 'band', position: '50% 30%' },
  trainer: { src: '/images/hero-trainer.jpg', mode: 'band', position: '50% 30%' },
};

const COVER = 'inset-0 h-full w-full object-cover';
const BAND = 'inset-x-0 top-0 h-auto w-full [mask-image:linear-gradient(to_bottom,black_62%,transparent)]';

function Showcase({ role }) {
  const cards = SHOWCASE[role] ?? SHOWCASE.client;
  return (
    <aside aria-hidden="true" className="relative mx-4 mb-4 h-[440px] overflow-hidden rounded-3xl bg-gradient-to-b from-glow-1 to-glow-3 sm:mx-6 sm:mb-6 sm:h-[520px] lg:m-0 lg:h-auto lg:rounded-none">
      <PanelWaves />
      {/* Le foto restano caricate: cambiando profilo si dissolvono l'una nell'altra */}
      {Object.entries(PHOTOS).map(([key, photo]) => (
        <img
          key={key}
          src={photo.src}
          alt=""
          className={`absolute transition-opacity duration-700 ${photo.mode === 'cover' ? COVER : BAND} ${key === role ? 'opacity-100' : 'opacity-0'}`}
          style={{ objectPosition: photo.position }}
        />
      ))}

      <div key={role} className="showcase-enter absolute top-[38%] right-3 flex w-[min(320px,74%)] flex-col gap-3 sm:top-[18%] sm:right-[6%] sm:w-[min(320px,64%)] sm:gap-4 lg:top-[22%] lg:gap-6">
        <MetricCard {...cards.metric} />
        <LinkCard {...cards.first} className="sm:ml-8" />
        <LinkCard {...cards.second} className="sm:ml-3" />
      </div>
    </aside>
  );
}

const cardCls = 'rounded-2xl bg-surface/95 p-3 shadow-float backdrop-blur sm:p-4';

function IconTile({ icon: Icon }) {
  return (
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700 sm:h-12 sm:w-12">
      <Icon className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.2} />
    </span>
  );
}

function MetricCard({ icon, title, value, trend = 'up', bars }) {
  return (
    <div className={`flex items-center gap-3 ${cardCls}`}>
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
    <div className={`flex items-center gap-3 ${cardCls} ${className}`}>
      <IconTile icon={icon} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold text-ink-900">{title}</p>
        <p className="truncate text-[13px] text-ink-500">{text}</p>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-ink-700" />
    </div>
  );
}

// Testi della vetrina per ogni profilo (getter: si traducono nella lingua attiva)
const SHOWCASE = {
  get client() {
    return {
      metric: { icon: ChartNoAxesColumn, title: t('I tuoi progressi'), value: '+12%', bars: [22, 40, 62, 100] },
      first: { icon: Utensils, title: t('Nutrizione'), text: t('Piano personalizzato') },
      second: { icon: PersonStanding, title: t('Allenamento'), text: t('I tuoi prossimi obiettivi') },
    };
  },
  get nutritionist() {
    return {
      metric: { icon: ChartNoAxesColumn, title: t('Andamento clienti'), value: '-1,2 kg', trend: 'down', bars: [100, 78, 64, 50] },
      first: { icon: ClipboardList, title: t('Piani alimentari'), text: t('Su misura per ogni cliente') },
      second: { icon: CalendarCheck, title: t('Controlli'), text: t('Check-up e progressi in agenda') },
    };
  },
  get trainer() {
    return {
      metric: { icon: ChartNoAxesColumn, title: t('Costanza dei clienti'), value: '86%', bars: [48, 66, 74, 100] },
      first: { icon: Dumbbell, title: t('Schede di allenamento'), text: t('Esercizi, serie e recuperi') },
      second: { icon: Share2, title: t('Dati nutrizionali'), text: t('Condivisi dalla nutrizionista') },
    };
  },
};
