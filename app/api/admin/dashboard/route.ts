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

const ADMIN_COLLECTION_CACHE_TTL_MS = 5 * 60 * 1000;
const ADMIN_COLLECTION_STALE_TTL_MS = 24 * 60 * 60 * 1000;

interface LoadedCollection {
  result: FirestoreCollectionResult | null;
  error: string | null;
  stale: boolean;
}

const adminCollectionCache = new Map<string, {
  result: FirestoreCollectionResult;
  cachedAt: number;
}>();

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
  const firebaseCode = error && typeof error === 'object' && 'code' in error
    ? String(error.code)
    : '';
  if (
    (error instanceof FirestoreRequestError && error.status === 429)
    || firebaseCode === '8'
    || firebaseCode === 'resource-exhausted'
    || firebaseCode === 'firestore/resource-exhausted'
  ) {
    return 'A cota de leituras do Firestore foi excedida. Tente novamente mais tarde.';
  }
  if (error instanceof FirestoreRequestError && error.status === 403) {
    return 'As regras atuais do Firestore não permitem consultar esta coleção.';
  }
  return 'Não foi possível consultar esta coleção agora.';
}

async function loadCollection(
  collectionId: string,
  idToken: string,
): Promise<LoadedCollection> {
  try {
    return {
      result: await listFirestoreCollection(collectionId, idToken),
      error: null,
      stale: false,
    };
  } catch (error) {
    console.error(`Admin collection "${collectionId}" failed:`, error);
    return { result: null, error: collectionError(error), stale: false };
  }
}

async function loadAdminCollection(
  collectionId: string,
): Promise<LoadedCollection> {
  const cached = adminCollectionCache.get(collectionId);
  const now = Date.now();
  if (cached && now - cached.cachedAt < ADMIN_COLLECTION_CACHE_TTL_MS) {
    return { result: cached.result, error: null, stale: false };
  }

  try {
    const snapshot = await getFirebaseAdminDb().collection(collectionId).limit(1001).get();
    const result = {
      documents: snapshot.docs.slice(0, 1000).map((doc) => ({
        id: doc.id,
        data: doc.data(),
      })),
      truncated: snapshot.size > 1000,
    };
    adminCollectionCache.set(collectionId, { result, cachedAt: now });
    return {
      result,
      error: null,
      stale: false,
    };
  } catch (error) {
    console.error(`Admin SDK collection "${collectionId}" failed:`, error);
    if (cached && now - cached.cachedAt < ADMIN_COLLECTION_STALE_TTL_MS) {
      return {
        result: cached.result,
        error: null,
        stale: true,
      };
    }
    return { result: null, error: collectionError(error), stale: false };
  }
}

function profileMap(collection: LoadedCollection) {
  return {
    profiles: new Map(
      (collection.result?.documents || []).map(({ id, data }) => [id, data]),
    ),
    available: collection.result !== null,
  };
}

export async function GET(request: Request) {
  let admin;
  try {
    admin = await authenticateAdminRequest(request);
  } catch (error) {
    return adminAuthErrorResponse(error);
  }

  const adminSdkConfigured = isFirebaseAdminConfigured();
  const usersCollectionPromise = adminSdkConfigured
    ? loadAdminCollection('users')
    : loadCollection('users', admin.idToken);
  const adminProfilesPromise = usersCollectionPromise.then(profileMap);
  const [usersCollection, commentsCollection, adminUsersResult, maintenance] = await Promise.all([
    usersCollectionPromise,
    adminSdkConfigured ? loadAdminCollection('comments') : loadCollection('comments', admin.idToken),
    adminSdkConfigured
      ? listAdminUsers(adminProfilesPromise)
        .then((result) => ({ result, error: null as string | null }))
        .catch((error) => {
          console.error('Could not list Firebase Auth users:', error);
          return { result: null, error: 'Não foi possível consultar o Firebase Auth.' };
        })
      : Promise.resolve({
        result: null,
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
      lastActivityAt: asNumber(data.updatedAt),
    }))
    .sort((a, b) => b.createdAt - a.createdAt);
  const users = adminUsersResult.result?.items || fallbackUsers;
  const profilesAvailable = adminUsersResult.result?.profilesAvailable
    ?? usersCollection.result !== null;
  const achievementsAvailable = adminUsersResult.result?.achievementsAvailable ?? false;

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
      comments: commentsCollection.result ? comments.length : null,
      favorites: profilesAvailable
        ? users.reduce((sum, user) => sum + user.favoritesCount, 0)
        : null,
      historyItems: profilesAvailable
        ? users.reduce((sum, user) => sum + user.historyCount, 0)
        : null,
      activeUsers30d: users.filter((user) => user.lastActivityAt >= updatedSince).length,
      achievementsUnlocked: achievementsAvailable
        ? users.reduce((sum, user) => sum + user.achievementsUnlocked, 0)
        : null,
      consumption: {
        movie: profilesAvailable
          ? users.reduce((sum, user) => sum + user.consumption.movie.views, 0)
          : null,
        tv: profilesAvailable
          ? users.reduce((sum, user) => sum + user.consumption.tv.views, 0)
          : null,
        liveTv: profilesAvailable
          ? users.reduce((sum, user) => sum + user.consumption.liveTv.views, 0)
          : null,
      },
      vipUsers: users.filter((user) => user.vip).length,
    },
    availability: {
      profiles: profilesAvailable,
      profilesStale: usersCollection.stale,
      profilesError: profilesAvailable ? null : usersCollection.error,
      achievements: achievementsAvailable,
      comments: commentsCollection.result !== null,
      commentsStale: commentsCollection.stale,
      commentsError: commentsCollection.error,
    },
    users: {
      items: users,
      truncated: adminUsersResult.result ? false : usersCollection.result?.truncated || false,
      error: adminUsersResult.result ? null : adminUsersResult.error || usersCollection.error,
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
