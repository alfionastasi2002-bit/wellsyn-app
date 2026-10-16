/** Dati di un utente che è sicuro mostrare ad altri utenti (niente password, niente dati sensibili). */
export function publicUser(user) {
  if (!user) return null;
  return {
    id: String(user._id ?? user.id),
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: `${user.firstName} ${user.lastName}`,
    title: user.title ?? null,
    role: user.role,
    avatarUrl: user.avatarUrl ?? null,
    avatarColor: user.avatarColor ?? null,
    specialization: user.specialization ?? null,
    bio: user.bio ?? null,
    specialties: user.specialties?.length ? user.specialties : [],
    yearsExperience: user.yearsExperience ?? null,
    city: user.city ?? null,
    studioAddress: user.studioAddress ?? null,
    onlineSessions: user.onlineSessions ?? null,
  };
}

export const round1 = (n) => (n == null ? null : Math.round(n * 10) / 10);

export const pickMetrics = (c) =>
  c && {
    weightKg: c.weightKg ?? null,
    waistCm: c.waistCm ?? null,
    hipsCm: c.hipsCm ?? null,
    bodyFatPct: c.bodyFatPct ?? null,
    muscleMassKg: c.muscleMassKg ?? null,
  };
