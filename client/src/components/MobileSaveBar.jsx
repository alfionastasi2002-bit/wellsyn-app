/**
 * Barra fissa in fondo agli editor (piani alimentari, schede) su smartphone e tablet: un breve riepilogo
 * e i pulsanti per salvare, sempre a portata di pollice anche quando la pagina è lunga.
 * Negli editor prende il posto della barra di navigazione (vedi BottomNav), quindi lo spazio in fondo alla pagina c'è già.
 */
export function MobileSaveBar({ summary, children }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line/80 bg-surface/95 px-4 pt-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] shadow-[0_-6px_20px_-12px_rgb(15_90_83/0.25)] backdrop-blur-md lg:hidden">
      <div className="mx-auto flex max-w-3xl items-center gap-2">
        <div className="min-w-0 flex-1 text-xs leading-snug text-ink-500">{summary}</div>
        {children}
      </div>
    </div>
  );
}
