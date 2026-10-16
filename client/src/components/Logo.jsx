/** Logo Wellsyn: simbolo sopra, scritta e payoff sotto (come nel menu dei mockup). */
export function LogoStacked({ className = '' }) {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <img src="/brand/logo-mark.png" alt="" className="h-14 w-auto" />
      <img src="/brand/logo-wordmark.png" alt="Wellsyn – Your wellness. Connected." className="-mt-1 h-14 w-auto" />
    </div>
  );
}

export function LogoMark({ className = 'h-8 w-auto' }) {
  return <img src="/brand/logo-mark.png" alt="Wellsyn" className={className} />;
}
