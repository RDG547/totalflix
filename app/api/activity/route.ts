import { FieldValue } from 'firebase-admin/firestore';
import {
  authenticateUserRequest,
  adminAuthErrorResponse,
  requireFirebaseAdmin,
} from '@/lib/admin-server';
import { getFirebaseAdminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

const VALID_TYPES = new Set(['movie', 'tv', 'live_tv']);
const DEDUPLICATION_WINDOW_MS = 10 * 60 * 1000;

export async function POST(request: Request) {
  try {
    const user = await authenticateUserRequest(request);
    requireFirebaseAdmin();
    const payload = await request.json() as {
      type?: unknown;
      contentId?: unknown;
      itemKey?: unknown;
      title?: unknown;
    };

    const type = String(payload.type || '');
    const contentId = String(payload.contentId || '').trim().slice(0, 128);
    const itemKey = String(payload.itemKey || contentId).trim().slice(0, 180);
    const title = String(payload.title || '').trim().slice(0, 200);

    if (!VALID_TYPES.has(type) || !contentId || !itemKey) {
      return Response.json({ error: 'Evento de consumo inválido.' }, { status: 400 });
    }

    const db = getFirebaseAdminDb();
    const safeItemId = Buffer.from(`${type}:${itemKey}`).toString('base64url').slice(0, 180);
    const userRef = db.doc(`users/${user.uid}`);
    const itemRef = db.doc(`userConsumption/${user.uid}/items/${safeItemId}`);
    const now = Date.now();

    const result = await db.runTransaction(async (transaction) => {
      const [userSnapshot, itemSnapshot] = await Promise.all([
        transaction.get(userRef),
        transaction.get(itemRef),
      ]);
      const previous = itemSnapshot.data() || {};
      const lastViewedAt = Number(previous.lastViewedAt) || 0;
      const shouldCountView = now - lastViewedAt >= DEDUPLICATION_WINDOW_MS;
      const firstView = !itemSnapshot.exists;

      if (!userSnapshot.exists) {
        transaction.set(userRef, {
          uid: user.uid,
          email: user.email,
          displayName: '',
          photoURL: '',
          bio: '',
          favorites: [],
          history: [],
          createdAt: now,
          updatedAt: now,
        });
      }

      transaction.set(userRef, {
        contentMetrics: {
          [type]: {
            views: FieldValue.increment(shouldCountView ? 1 : 0),
            unique: FieldValue.increment(firstView ? 1 : 0),
            lastViewedAt: now,
          },
        },
        updatedAt: now,
      }, { merge: true });

      transaction.set(itemRef, {
        type,
        contentId,
        itemKey,
        title,
        viewCount: FieldValue.increment(shouldCountView ? 1 : 0),
        firstViewedAt: firstView ? now : Number(previous.firstViewedAt) || now,
        lastViewedAt: now,
      }, { merge: true });

      return { counted: shouldCountView, firstView };
    });

    return Response.json(result, {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (error) {
    return adminAuthErrorResponse(error);
  }
}
