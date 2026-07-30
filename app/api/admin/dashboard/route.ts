import { authenticateAdminRequest, adminAuthErrorResponse } from '@/lib/admin-server';
import {
  FirestoreRequestError,
  listFirestoreCollection,
  type FirestoreCollectionResult,
} from '@/lib/firestore-rest';

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

export async function GET(request: Request) {
  let admin;
  try {
    admin = await authenticateAdminRequest(request);
  } catch (error) {
    return adminAuthErrorResponse(error);
  }

  const [usersCollection, commentsCollection] = await Promise.all([
    loadCollection('users', admin.idToken),
    loadCollection('comments', admin.idToken),
  ]);

  const users = (usersCollection.result?.documents || [])
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
      createdAt: asNumber(data.createdAt),
      updatedAt: asNumber(data.updatedAt),
    }))
    .sort((a, b) => b.createdAt - a.createdAt);

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
    administrator: {
      uid: admin.uid,
      email: admin.email,
    },
    overview: {
      users: users.length,
      comments: comments.length,
      favorites: users.reduce((sum, user) => sum + user.favoritesCount, 0),
      historyItems: users.reduce((sum, user) => sum + user.historyCount, 0),
      activeUsers30d: users.filter((user) => user.updatedAt >= updatedSince).length,
    },
    users: {
      items: users,
      truncated: usersCollection.result?.truncated || false,
      error: usersCollection.error,
    },
    comments: {
      items: comments,
      truncated: commentsCollection.result?.truncated || false,
      error: commentsCollection.error,
    },
    system: {
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
      integrations: [
        { name: 'Firebase', configured: Boolean(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) },
        { name: 'TMDB', configured: Boolean(process.env.NEXT_PUBLIC_TMDB_API_KEY) },
        { name: 'OMDb', configured: Boolean(process.env.NEXT_PUBLIC_OMDB_API_KEY) },
        { name: 'Softurl / LinkGate', configured: Boolean(process.env.SOFTURL_API_TOKEN) },
      ],
    },
  }, {
    headers: { 'Cache-Control': 'private, no-store' },
  });
}
