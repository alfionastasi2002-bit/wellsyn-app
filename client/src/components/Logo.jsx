/**
 * Logo Wellsyn: simbolo sopra, scritta e payoff sotto (come nel menu dei mockup), in un'unica immagine
 * senza margini vuoti. imgClassName ne fissa l'altezza.
 * Usa PNG grandi ricavati dagli SVG in /brand: a queste misure piccole il browser li rimpicciolisce
 * con bordi più morbidi, mentre l'SVG disegnato direttamente appare scalettato.
 */
export function LogoStacked({ className = '', imgClassName = 'h-28' }) {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Scritta scura sul tema chiaro, chiara sul tema scuro */}
      <img src="/brand/logo-stacked.png" alt="Wellsyn – Your wellness. Connected." className={`w-auto dark:hidden ${imgClassName}`} />
      <img src="/brand/logo-stacked-light.png" alt="Wellsyn – Your wellness. Connected." className={`hidden w-auto dark:block ${imgClassName}`} />
    </div>
  );
}

/** Logo orizzontale (simbolo a sinistra, scritta e payoff a destra), usato nella barra in alto. */
export function LogoFull({ className = 'h-10' }) {
  return (
    <>
      <img src="/brand/logo-full.png" alt="Wellsyn – Your wellness. Connected." className={`w-auto dark:hidden ${className}`} />
      <img src="/brand/logo-full-light.png" alt="Wellsyn – Your wellness. Connected." className={`hidden w-auto dark:block ${className}`} />
    </>
  );
}

export function LogoMark({ className = 'h-8 w-auto' }) {
  return <img src="/brand/logo-mark.png" alt="Wellsyn" className={className} />;
}
