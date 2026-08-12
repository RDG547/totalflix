import { authenticateAdminRequest, adminAuthErrorResponse } from '@/lib/admin-server';
import {
  FirestoreRequestError,
  listFirestoreCollection,
  type FirestoreCollectionResult,
} from '@/lib/firestore-rest';
import { getFirebaseAdminDb, isFirebaseAdminConfigured } from '@/lib/firebase-admin';
import { listAdminUsers } from '@/lib/admin-user-service';
import { getMaintenanceSettings } from '@/lib/site-settings-server';

export const dynamic = 'force-dynamic';

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function asNumber(value: unknown): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function collectionError(error: unknown): string {
  if (error instanceof FirestoreRequestError && error.status === 403) {
    return 'As regras atuais do Firestore não permitem consultar esta coleção.';
  }
  return 'Não foi possível consultar esta coleção agora.';
}

async function loadCollection(
  collectionId: string,
  idToken: string,
): Promise<{ result: FirestoreCollectionResult | null; error: string | null }> {
  try {
    return {
      result: await listFirestoreCollection(collectionId, idToken),
      error: null,
    };
  } catch (error) {
    console.error(`Admin collection "${collectionId}" failed:`, error);
    return { result: null, error: collectionError(error) };
  }
}

async function loadAdminCollection(
  collectionId: string,
): Promise<{ result: FirestoreCollectionResult | null; error: string | null }> {
  try {
    const snapshot = await getFirebaseAdminDb().collection(collectionId).limit(1001).get();
    return {
      result: {
        documents: snapshot.docs.slice(0, 1000).map((doc) => ({
          id: doc.id,
          data: doc.data(),
        })),
        truncated: snapshot.size > 1000,
      },
      error: null,
    };
  } catch (error) {
    console.error(`Admin SDK collection "${collectionId}" failed:`, error);
    return { result: null, error: 'Não foi possível consultar esta coleção agora.' };
  }
}

export async function GET(request: Request) {
  let admin;
  try {
    admin = await authenticateAdminRequest(request);
  } catch (error) {
    return adminAuthErrorResponse(error);
  }

  const adminSdkConfigured = isFirebaseAdminConfigured();
  const [usersCollection, commentsCollection, adminUsersResult, maintenance] = await Promise.all([
    adminSdkConfigured ? loadAdminCollection('users') : loadCollection('users', admin.idToken),
    adminSdkConfigured ? loadAdminCollection('comments') : loadCollection('comments', admin.idToken),
    adminSdkConfigured
      ? listAdminUsers()
        .then((items) => ({ items, error: null as string | null }))
        .catch((error) => {
          console.error('Could not list Firebase Auth users:', error);
          return { items: null, error: 'Não foi possível consultar o Firebase Auth.' };
        })
      : Promise.resolve({
        items: null,
        error: 'Configure FIREBASE_SERVICE_ACCOUNT_JSON para habilitar a gestão completa.',
      }),
    getMaintenanceSettings(),
  ]);

  const fallbackUsers = (usersCollection.result?.documents || [])
    .map(({ id, data }) => ({
      uid: asString(data.uid) || id,
      email: asString(data.email),
      displayName: asString(data.displayName) || 'Usuário sem nome',
      photoURL: asString(data.photoURL),
      role: asString(data.role) === 'admin' || asString(data.email).toLowerCase() === admin.email
        ? 'admin'
        : 'user',
      favoritesCount: asArray(data.favorites).length,
      historyCount: asArray(data.history).length,
      achievementsUnlocked: 0,
      emailVerified: false,
      disabled: false,
      isPrimaryAdmin: asString(data.email).toLowerCase() === admin.email,
      vip: data.vip === true && (!data.vipExpiresAt || asNumber(data.vipExpiresAt) > Date.now()),
      vipExpiresAt: asNumber(data.vipExpiresAt) || null,
      lastSignInAt: 0,
      providers: [],
      consumption: {
        movie: { views: 0, unique: 0, lastViewedAt: 0 },
        tv: { views: 0, unique: 0, lastViewedAt: 0 },
        liveTv: { views: 0, unique: 0, lastViewedAt: 0 },
      },
      createdAt: asNumber(data.createdAt),
      updatedAt: asNumber(data.updatedAt),
    }))
    .sort((a, b) => b.createdAt - a.createdAt);
  const users = adminUsersResult.items || fallbackUsers;

  const comments = (commentsCollection.result?.documents || [])
    .map(({ id, data }) => ({
      id,
      contentId: asNumber(data.contentId),
      contentType: asString(data.contentType) === 'tv' ? 'tv' : 'movie',
      userId: asString(data.userId),
      userName: asString(data.userName) || 'Usuário',
      text: asString(data.text),
      likesCount: asArray(data.likes).length,
      dislikesCount: asArray(data.dislikes).length,
      parentId: asString(data.parentId) || null,
      createdAt: asNumber(data.createdAt),
    }))
    .sort((a, b) => b.createdAt - a.createdAt);

  const updatedSince = Date.now() - (30 * 24 * 60 * 60 * 1000);

  return Response.json({
    generatedAt: Date.now(),
    overview: {
      users: users.length,
      comments: comments.length,
      favorites: users.reduce((sum, user) => sum + user.favoritesCount, 0),
      historyItems: users.reduce((sum, user) => sum + user.historyCount, 0),
      activeUsers30d: users.filter((user) => user.updatedAt >= updatedSince).length,
      achievementsUnlocked: users.reduce((sum, user) => sum + user.achievementsUnlocked, 0),
      consumption: {
        movie: users.reduce((sum, user) => sum + user.consumption.movie.views, 0),
        tv: users.reduce((sum, user) => sum + user.consumption.tv.views, 0),
        liveTv: users.reduce((sum, user) => sum + user.consumption.liveTv.views, 0),
      },
      vipUsers: users.filter((user) => user.vip).length,
    },
    users: {
      items: users,
      truncated: adminUsersResult.items ? false : usersCollection.result?.truncated || false,
      error: adminUsersResult.items ? null : adminUsersResult.error || usersCollection.error,
    },
    comments: {
      items: comments,
      truncated: commentsCollection.result?.truncated || false,
      error: commentsCollection.error,
    },
    maintenance,
  }, {
    headers: { 'Cache-Control': 'private, no-store' },
  });
}
