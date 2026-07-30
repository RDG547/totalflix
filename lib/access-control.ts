export type UserRole = 'user' | 'moderator' | 'admin';

export interface AccessClaims {
  role: UserRole;
  admin: boolean;
  vip: boolean;
  vipExpiresAt: number | null;
}

export function normalizeRole(value: unknown): UserRole {
  if (value === 'admin' || value === 'moderator') return value;
  return 'user';
}

export function isVipActive(vip: unknown, vipExpiresAt: unknown, now = Date.now()): boolean {
  if (vip !== true) return false;
  if (vipExpiresAt === null || vipExpiresAt === undefined || vipExpiresAt === 0) return true;

  const expiration = Number(vipExpiresAt);
  if (!Number.isFinite(expiration)) return false;

  // Claims usam segundos; perfis Firestore usam milissegundos.
  const expirationMs = expiration < 10_000_000_000 ? expiration * 1000 : expiration;
  return expirationMs > now;
}

export function claimsFromRecord(
  claims: Record<string, unknown> | undefined,
  primaryAdmin = false,
): AccessClaims {
  const role = primaryAdmin ? 'admin' : normalizeRole(claims?.role);
  const vipExpiresAt = claims?.vipExpiresAt === undefined || claims.vipExpiresAt === null
    ? null
    : Number(claims.vipExpiresAt);

  return {
    role,
    admin: primaryAdmin || claims?.admin === true || role === 'admin',
    vip: isVipActive(claims?.vip, vipExpiresAt),
    vipExpiresAt: Number.isFinite(vipExpiresAt) ? vipExpiresAt : null,
  };
}
