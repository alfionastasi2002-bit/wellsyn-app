import { useEffect, useState } from 'react';

// Animazione d'ingresso dopo login e registrazione: su sfondo verde Wellsyn compare la "scala evolutiva",
// dall'ominide che cammina a quattro zampe fino all'Homo sapiens, mentre la dashboard si carica dietro.
// Nessuna scritta: solo l'animazione (per i lettori di schermo resta un'etichetta nascosta).

export const ENTRY_EVENT = 'wellsyn:entry';

/** Avvia l'animazione d'ingresso (chiamata subito dopo un accesso riuscito). */
export function playEntryAnimation() {
  window.dispatchEvent(new Event(ENTRY_EVENT));
}

const DURATION = 2700; // ms prima della dissolvenza finale
const REDUCED_DURATION = 900;
const FADE = 450;

// Le cinque figure (coordinate in un riquadro 64×100, piedi a terra a y = 95):
// anca, spalla, testa e, per gamba e braccio davanti (a) e dietro (b), ginocchio/gomito e piede/mano.
const FIGURES = [
  // Ominide che cammina sulle nocche
  { hip: [15, 54], shoulder: [39, 47], head: [50, 42, 6.5], legA: [[21, 73], [19, 95]], legB: [[11, 74], [10, 95]], armA: [[44, 70], [46, 95]], armB: [[38, 71], [38, 95]] },
  // Australopiteco: si alza, ancora curvo e con braccia lunghe
  { hip: [24, 57], shoulder: [35, 31], head: [42.5, 22, 6.5], legA: [[30, 76], [28, 95]], legB: [[20, 77], [19, 95]], armA: [[42, 47], [47, 63]], armB: [[31, 49], [25, 62]] },
  // Homo habilis
  { hip: [27, 56], shoulder: [33.5, 28], head: [38.5, 17.5, 6.6], legA: [[32, 76], [32, 95]], legB: [[22, 76], [21, 95]], armA: [[40, 42], [46, 55]], armB: [[30, 43], [23, 55]] },
  // Homo erectus
  { hip: [29, 55], shoulder: [31.5, 26], head: [34, 13.5, 6.8], legA: [[34, 75], [35, 95]], legB: [[25, 75], [23, 95]], armA: [[38, 39], [44, 51]], armB: [[27, 40], [20, 51]] },
  // Homo sapiens: completamente eretto
  { hip: [31, 54], shoulder: [31, 24], head: [31, 11, 7.2], legA: [[35, 74], [37, 95]], legB: [[27, 74], [25, 95]], armA: [[37.5, 37], [43, 49]], armB: [[25.5, 37], [19, 48]] },
];

const path = (points) => points.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ');
const origin = ([x, y]) => ({ transformOrigin: `${x}px ${y}px` });

function Figure({ figure: f, index }) {
  return (
    <svg viewBox="0 0 64 100" className="evo-figure" style={{ '--i': index }} aria-hidden="true">
      <g className="evo-body" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="6.5">
        {/* Arti "dietro": un po' più trasparenti per dare profondità */}
        <g opacity=".5">
          <path className="evo-leg-b" style={origin(f.hip)} d={path([f.hip, ...f.legB])} />
          <path className="evo-arm-b" style={origin(f.shoulder)} d={path([f.shoulder, ...f.armB])} strokeWidth="5.5" />
        </g>
        <path d={path([f.hip, f.shoulder])} strokeWidth="9.5" />
        <circle cx={f.head[0]} cy={f.head[1]} r={f.head[2]} fill="currentColor" stroke="none" />
        <path className="evo-leg-a" style={origin(f.hip)} d={path([f.hip, ...f.legA])} />
        <path className="evo-arm-a" style={origin(f.shoulder)} d={path([f.shoulder, ...f.armA])} strokeWidth="5.5" />
      </g>
    </svg>
  );
}

/** Schermata verde con la scala evolutiva: si mostra su richiesta (playEntryAnimation) e poi sfuma. */
export function EvolutionOverlay() {
  const [phase, setPhase] = useState(null); // null | 'in' | 'out'
  const [run, setRun] = useState(0);

  useEffect(() => {
    const timers = [];
    const play = () => {
      timers.forEach(clearTimeout);
      timers.length = 0;
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const duration = reduced ? REDUCED_DURATION : DURATION;
      setRun((n) => n + 1);
      setPhase('in');
      timers.push(setTimeout(() => setPhase('out'), duration));
      timers.push(setTimeout(() => setPhase(null), duration + FADE));
    };
    window.addEventListener(ENTRY_EVENT, play);
    // In sviluppo si può riprovare dalla console: __wellsynEntry()
    if (import.meta.env.DEV) window.__wellsynEntry = playEntryAnimation;
    return () => {
      window.removeEventListener(ENTRY_EVENT, play);
      timers.forEach(clearTimeout);
    };
  }, []);

  if (!phase) return null;
  return (
    <div key={run} role="status" aria-label="Wellsyn" className={`evo-overlay ${phase === 'out' ? 'evo-overlay-out' : ''}`}>
      <div className="evo-stage">
        <div className="evo-row">
          {FIGURES.map((figure, i) => (
            <Figure key={i} figure={figure} index={i} />
          ))}
        </div>
        <div className="evo-ground">
          <span className="evo-progress" />
        </div>
      </div>
    </div>
  );
}
