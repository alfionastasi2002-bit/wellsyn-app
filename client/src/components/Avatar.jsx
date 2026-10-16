// Colori dell'avatar con le iniziali (se l'utente non ha una foto). Il nome è quello salvato nel profilo.
export const AVATAR_COLORS = {
  mint: 'bg-[#d9f0e7] text-[#0f5a53]',
  peach: 'bg-[#fde8d7] text-[#9a4a12]',
  indigo: 'bg-[#e4e9fb] text-[#33449a]',
  rose: 'bg-[#f6e3ef] text-[#8c2f68]',
  olive: 'bg-[#e8f1d9] text-[#4b6a17]',
  sky: 'bg-[#e3f1f8] text-[#1d5f80]',
};
const PALETTE = Object.values(AVATAR_COLORS);

const SIZES = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-20 w-20 text-2xl',
  '2xl': 'h-28 w-28 text-4xl',
};

function colorFor(name = '') {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

export function Avatar({ user, size = 'md', className = '' }) {
  const name = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();
  const base = `${SIZES[size]} shrink-0 rounded-full ${className}`;
  if (user?.avatarUrl) return <img src={user.avatarUrl} alt={name} className={`${base} object-cover`} />;
  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase();
  return (
    <span aria-hidden="true" className={`${base} ${AVATAR_COLORS[user?.avatarColor] ?? colorFor(name)} grid place-items-center font-display font-semibold`}>
      {initials || '?'}
    </span>
  );
}
