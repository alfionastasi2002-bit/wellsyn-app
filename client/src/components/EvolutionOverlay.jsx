import { useEffect, useState } from 'react';
import { FIGURES, VIEWBOX } from './evolutionFigures.js';

// Animazione d'ingresso dopo login e registrazione: su sfondo verde Wellsyn compare la "scala evolutiva",
// dall'Australopiteco all'Homo sapiens (sagome in evolutionFigures.js), mentre la dashboard si carica dietro.
// Nessuna scritta: solo l'animazione (per i lettori di schermo resta un'etichetta nascosta).

export const ENTRY_EVENT = 'wellsyn:entry';

/** Avvia l'animazione d'ingresso (chiamata subito dopo un accesso riuscito). */
export function playEntryAnimation() {
  window.dispatchEvent(new Event(ENTRY_EVENT));
}

const DURATION = 2700; // ms prima della dissolvenza finale
const REDUCED_DURATION = 900;
const FADE = 450;

const origin = ([x, y]) => ({ transformOrigin: `${x}px ${y}px` });

/** Una sagoma: arti "dietro" più trasparenti per dare profondità, arti davanti sopra il corpo. */
function Figure({ figure: f, index }) {
  return (
    <svg viewBox={VIEWBOX} className="evo-figure" style={{ '--i': index }} aria-hidden="true">
      <g className="evo-body" fill="currentColor">
        <g opacity=".5">
          <path className="evo-leg-b" style={origin(f.hip)} d={f.legB} />
          <path className="evo-arm-b" style={origin(f.shoulder)} d={f.armB} />
        </g>
        <path className="evo-leg-a" style={origin(f.hip)} d={f.legA} />
        <path d={f.body} />
        <path className="evo-arm-a" style={origin(f.shoulder)} d={f.armA} />
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
