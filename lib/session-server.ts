import 'server-only';

import { cookies } from 'next/headers';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { claimsFromRecord } from './access-control';
import { getFirebaseAdminAuth, isFirebaseAdminConfigured } from './firebase-admin';
import { isAdminEmail } from './admin';

export const SESSION_COOKIE_NAME = 'totalflix_session';
export const SESSION_DURATION_MS = 5 * 24 * 60 * 60 * 1000;

export interface ServerSessionUser {
  uid: string;
  email: string;
  role: 'user' | 'moderator' | 'admin';
  admin: boolean;
  vip: boolean;
  vipExpiresAt: number | null;
  isPrimaryAdmin: boolean;
}

export async function verifySessionCookieValue(
  sessionCookie: string | undefined,
): Promise<ServerSessionUser | null> {
  if (!sessionCookie || !isFirebaseAdminConfigured()) return null;

  try {
    const auth = getFirebaseAdminAuth();
    const decoded = await auth.verifySessionCookie(sessionCookie, true) as DecodedIdToken;
    const record = await auth.getUser(decoded.uid);
    if (!record.email || record.disabled) return null;

    const primaryAdmin = isAdminEmail(record.email);
    return {
      uid: record.uid,
      email: record.email.toLowerCase(),
      isPrimaryAdmin: primaryAdmin,
      ...claimsFromRecord(record.customClaims, primaryAdmin),
    };
  } catch {
    return null;
  }
}

export async function getServerSessionUser(): Promise<ServerSessionUser | null> {
  const cookieStore = await cookies();
  return verifySessionCookieValue(cookieStore.get(SESSION_COOKIE_NAME)?.value);
}

export function readCookie(request: Request, name: string): string | undefined {
  const cookieHeader = request.headers.get('cookie') || '';
  return cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

export async function getRequestSessionUser(request: Request): Promise<ServerSessionUser | null> {
  return verifySessionCookieValue(readCookie(request, SESSION_COOKIE_NAME));
}
