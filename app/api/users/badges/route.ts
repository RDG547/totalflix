import { claimsFromRecord } from '@/lib/access-control';
import { isAdminEmail } from '@/lib/admin';
import { getFirebaseAdminAuth, isFirebaseAdminConfigured } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

const VALID_UID = /^[A-Za-z0-9_-]{1,128}$/;

export async function GET(request: Request) {
  const rawUids = new URL(request.url).searchParams.get('uids') || '';
  const uids = Array.from(
    new Set(rawUids.split(',').map((uid) => uid.trim()).filter(Boolean)),
  ).slice(0, 50);
  if (uids.some((uid) => !VALID_UID.test(uid))) {
    return Response.json({ error: 'Lista de usuários inválida.' }, { status: 400 });
  }
  if (uids.length === 0 || !isFirebaseAdminConfigured()) {
    return Response.json({ badges: {} }, {
      headers: { 'Cache-Control': 'public, max-age=30, stale-while-revalidate=60' },
    });
  }

  try {
    const result = await getFirebaseAdminAuth().getUsers(uids.map((uid) => ({ uid })));
    const badges = Object.fromEntries(result.users.map((record) => {
      const access = claimsFromRecord(record.customClaims, isAdminEmail(record.email));
      return [record.uid, {
        role: access.role,
        vip: access.vip,
        vipExpiresAt: access.vipExpiresAt,
      }];
    }));

    return Response.json({ badges }, {
      headers: { 'Cache-Control': 'public, max-age=30, stale-while-revalidate=60' },
    });
  } catch (error) {
    console.error('Could not resolve public user badges:', error);
    return Response.json({ badges: {} }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  }
}
