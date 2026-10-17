/** Mostra un testo formattato salvato (l'HTML arriva dal server, che lo ha già ripulito). */
export function RichText({ html, className = '' }) {
  if (!html) return null;
  return <div className={`rich-text ${className}`} dangerouslySetInnerHTML={{ __html: html }} />;
}
