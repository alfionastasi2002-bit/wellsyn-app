/** Logo Wellsyn: simbolo sopra, scritta e payoff sotto (come nel menu dei mockup). */
export function LogoStacked({ className = '', imgClassName = 'h-14' }) {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <img src="/brand/logo-mark.png" alt="" className={`w-auto ${imgClassName}`} />
      {/* Scritta scura sul tema chiaro, chiara sul tema scuro */}
      <img src="/brand/logo-wordmark.png" alt="Wellsyn – Your wellness. Connected." className={`-mt-1 w-auto dark:hidden ${imgClassName}`} />
      <img src="/brand/logo-wordmark-light.png" alt="Wellsyn – Your wellness. Connected." className={`-mt-1 hidden w-auto dark:block ${imgClassName}`} />
    </div>
  );
}

export function LogoMark({ className = 'h-8 w-auto' }) {
  return <img src="/brand/logo-mark.png" alt="Wellsyn" className={className} />;
}
