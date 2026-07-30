import 'server-only';

import { randomUUID } from 'node:crypto';
import type { UserRecord } from 'firebase-admin/auth';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { claimsFromRecord, type UserRole } from './access-control';
import {
  getFirebaseAdminAuth,
  getFirebaseAdminDb,
  getFirebaseAdminStorage,
} from './firebase-admin';
import { isAdminEmail } from './admin';

type ProfileData = Record<string, unknown>;

export interface ConsumptionMetric {
  views: number;
  unique: number;
  lastViewedAt: number;
}

export interface ConsumptionMetrics {
  movie: ConsumptionMetric;
  tv: ConsumptionMetric;
  liveTv: ConsumptionMetric;
}

export interface AdminUserSummary {
  uid: string;
  email: string;
  emailVerified: boolean;
  disabled: boolean;
  displayName: string;
  photoURL: string;
  role: UserRole;
  isPrimaryAdmin: boolean;
  vip: boolean;
  vipExpiresAt: number | null;
  favoritesCount: number;
  historyCount: number;
  achievementsUnlocked: number;
  consumption: ConsumptionMetrics;
  createdAt: number;
  updatedAt: number;
  lastSignInAt: number;
  providers: string[];
}

function numberValue(value: unknown): number {
  if (value instanceof Timestamp) return value.toMillis();
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function arrayValue(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function metricValue(value: unknown): ConsumptionMetric {
  const metric = objectValue(value);
  return {
    views: numberValue(metric.views),
    unique: numberValue(metric.unique),
    lastViewedAt: numberValue(metric.lastViewedAt),
  };
}

function consumptionFromProfile(profile: ProfileData): ConsumptionMetrics {
  const metrics = objectValue(profile.contentMetrics);
  const history = arrayValue(profile.history).map(objectValue);
  const movieHistory = history.filter((item) => item.type === 'movie');
  const tvHistory = history.filter((item) => item.type === 'tv');

  const movie = metricValue(metrics.movie);
  const tv = metricValue(metrics.tv);
  const liveTv = metricValue(metrics.live_tv);

  return {
    movie: {
      views: movie.views || movieHistory.length,
      unique: movie.unique || new Set(movieHistory.map((item) => String(item.id))).size,
      lastViewedAt: movie.lastViewedAt || Math.max(0, ...movieHistory.map((item) => numberValue(item.timestamp))),
    },
    tv: {
      views: tv.views || tvHistory.length,
      unique: tv.unique || new Set(tvHistory.map((item) => String(item.id))).size,
      lastViewedAt: tv.lastViewedAt || Math.max(0, ...tvHistory.map((item) => numberValue(item.timestamp))),
    },
    liveTv,
  };
}

function vipExpirationMs(value: number | null): number | null {
  if (!value) return null;
  return value < 10_000_000_000 ? value * 1000 : value;
}

function summaryFromRecords(
  record: UserRecord,
  profile: ProfileData,
  achievementsUnlocked: number,
): AdminUserSummary {
  const primaryAdmin = isAdminEmail(record.email);
  const access = claimsFromRecord(record.customClaims, primaryAdmin);
  const favorites = arrayValue(profile.favorites);
  const history = arrayValue(profile.history);

  return {
    uid: record.uid,
    email: record.email || String(profile.email || ''),
    emailVerified: record.emailVerified,
    disabled: record.disabled,
    displayName: record.displayName || String(profile.displayName || '') || 'Usuário sem nome',
    photoURL: record.photoURL || String(profile.photoURL || ''),
    role: access.role,
    isPrimaryAdmin: primaryAdmin,
    vip: access.vip,
    vipExpiresAt: vipExpirationMs(access.vipExpiresAt),
    favoritesCount: favorites.length,
    historyCount: history.length,
    achievementsUnlocked,
    consumption: consumptionFromProfile(profile),
    createdAt: Date.parse(record.metadata.creationTime) || numberValue(profile.createdAt),
    updatedAt: numberValue(profile.updatedAt),
    lastSignInAt: Date.parse(record.metadata.lastSignInTime || '') || 0,
    providers: record.providerData.map((provider) => provider.providerId),
  };
}

async function listAllAuthUsers(): Promise<UserRecord[]> {
  const auth = getFirebaseAdminAuth();
  const users: UserRecord[] = [];
  let pageToken: string | undefined;

  do {
    const page = await auth.listUsers(1000, pageToken);
    users.push(...page.users);
    pageToken = page.pageToken;
  } while (pageToken);

  return users;
}

export async function listAdminUsers(): Promise<AdminUserSummary[]> {
  const [records, profilesSnapshot, achievementsSnapshot] = await Promise.all([
    listAllAuthUsers(),
    getFirebaseAdminDb().collection('users').get(),
    getFirebaseAdminDb().collection('achievements').get(),
  ]);

  const profiles = new Map(profilesSnapshot.docs.map((doc) => [doc.id, doc.data()]));
  const achievements = new Map(
    achievementsSnapshot.docs.map((doc) => [
      doc.id,
      arrayValue(doc.data().achievements).map(objectValue).filter((item) => item.unlocked === true).length,
    ]),
  );

  return records
    .map((record) => summaryFromRecords(
      record,
      profiles.get(record.uid) || {},
      achievements.get(record.uid) || 0,
    ))
    .sort((a, b) => b.createdAt - a.createdAt);
}

async function resolveTmdbContent(id: number, preferredType?: 'movie' | 'tv') {
  const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
  const baseUrl = process.env.NEXT_PUBLIC_TMDB_BASE_URL || 'https://api.themoviedb.org/3';
  const types: Array<'movie' | 'tv'> = preferredType ? [preferredType] : ['movie', 'tv'];

  if (!apiKey) {
    return { id, type: preferredType || 'movie', title: `Conteúdo #${id}`, posterPath: '' };
  }

  for (const type of types) {
    try {
      const params = new URLSearchParams({ api_key: apiKey, language: 'pt-BR' });
      const response = await fetch(`${baseUrl}/${type}/${id}?${params.toString()}`, {
        next: { revalidate: 86400 },
      });
      if (!response.ok) continue;
      const data = await response.json() as {
        title?: string;
        name?: string;
        poster_path?: string;
      };
      return {
        id,
        type,
        title: data.title || data.name || `Conteúdo #${id}`,
        posterPath: data.poster_path || '',
      };
    } catch {
      // Tenta o tipo seguinte.
    }
  }

  return { id, type: preferredType || 'movie', title: `Conteúdo #${id}`, posterPath: '' };
}

function serializeAchievement(value: unknown) {
  const achievement = objectValue(value);
  const unlockedAt = achievement.unlockedAt;
  return {
    id: String(achievement.id || ''),
    title: String(achievement.title || ''),
    description: String(achievement.description || ''),
    icon: String(achievement.icon || '🏆'),
    category: String(achievement.category || ''),
    progress: numberValue(achievement.progress),
    requirement: numberValue(achievement.requirement),
    unlocked: achievement.unlocked === true,
    unlockedAt: unlockedAt instanceof Timestamp
      ? unlockedAt.toMillis()
      : unlockedAt instanceof Date
        ? unlockedAt.getTime()
        : numberValue(unlockedAt),
  };
}

export async function getAdminUserDetail(uid: string) {
  const auth = getFirebaseAdminAuth();
  const db = getFirebaseAdminDb();
  const [record, profileSnapshot, achievementSnapshot, consumptionSnapshot] = await Promise.all([
    auth.getUser(uid),
    db.doc(`users/${uid}`).get(),
    db.doc(`achievements/${uid}`).get(),
    db.collection(`userConsumption/${uid}/items`).orderBy('lastViewedAt', 'desc').limit(100).get(),
  ]);

  const profile = profileSnapshot.data() || {};
  const achievementData = achievementSnapshot.data() || {};
  const achievements = arrayValue(achievementData.achievements).map(serializeAchievement);
  const summary = summaryFromRecords(
    record,
    profile,
    achievements.filter((item) => item.unlocked).length,
  );

  const rawHistory = arrayValue(profile.history).map(objectValue).slice(0, 50);
  const rawFavorites = arrayValue(profile.favorites)
    .map((id) => numberValue(id))
    .filter(Boolean)
    .slice(0, 100);

  const [history, favorites] = await Promise.all([
    Promise.all(rawHistory.map(async (item) => ({
      ...await resolveTmdbContent(
        numberValue(item.id),
        item.type === 'tv' ? 'tv' : 'movie',
      ),
      timestamp: numberValue(item.timestamp),
    }))),
    Promise.all(rawFavorites.map((id) => resolveTmdbContent(id))),
  ]);

  return {
    ...summary,
    bio: String(profile.bio || ''),
    favorites,
    favoritesTotal: arrayValue(profile.favorites).length,
    history,
    historyTotal: arrayValue(profile.history).length,
    achievements,
    achievementStats: objectValue(achievementData.stats),
    recentConsumption: consumptionSnapshot.docs.map((doc) => {
      const item = doc.data();
      return {
        id: doc.id,
        type: String(item.type || ''),
        contentId: String(item.contentId || ''),
        itemKey: String(item.itemKey || ''),
        title: String(item.title || ''),
        viewCount: numberValue(item.viewCount),
        firstViewedAt: numberValue(item.firstViewedAt),
        lastViewedAt: numberValue(item.lastViewedAt),
      };
    }),
  };
}

export async function writeAdminAuditLog(input: {
  action: string;
  actorUid: string;
  actorEmail: string;
  targetUid: string;
  metadata?: Record<string, unknown>;
}) {
  await getFirebaseAdminDb().collection('adminAuditLogs').add({
    ...input,
    targetType: 'user',
    createdAt: Date.now(),
  });
}

export async function uploadAdminProfilePhoto(uid: string, file: File): Promise<string> {
  const extension = file.type === 'image/png'
    ? 'png'
    : file.type === 'image/webp'
      ? 'webp'
      : 'jpg';
  const path = `profile-photos/${uid}/admin-${Date.now()}.${extension}`;
  const token = randomUUID();
  const bucket = getFirebaseAdminStorage().bucket();
  const storageFile = bucket.file(path);

  await storageFile.save(Buffer.from(await file.arrayBuffer()), {
    contentType: file.type,
    resumable: false,
    metadata: {
      cacheControl: 'public,max-age=31536000',
      metadata: { firebaseStorageDownloadTokens: token },
    },
  });

  return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(path)}?alt=media&token=${token}`;
}

export async function deleteUserProfilePhotos(uid: string): Promise<void> {
  await getFirebaseAdminStorage().bucket().deleteFiles({
    prefix: `profile-photos/${uid}/`,
  });
}

export async function deleteUserData(uid: string) {
  const db = getFirebaseAdminDb();

  const [commentsSnapshot, ownNotifications, sentNotifications] = await Promise.all([
    db.collection('comments').where('userId', '==', uid).get(),
    db.collection('notifications').where('userId', '==', uid).get(),
    db.collection('notifications').where('fromUserId', '==', uid).get(),
  ]);
  const writer = db.bulkWriter();
  commentsSnapshot.docs.forEach((comment) => {
    writer.update(comment.ref, {
      userName: 'Usuário removido',
      userPhoto: FieldValue.delete(),
      userId: 'deleted',
      updatedAt: Date.now(),
    });
  });
  ownNotifications.docs.forEach((notification) => writer.delete(notification.ref));
  sentNotifications.docs.forEach((notification) => {
    if (!ownNotifications.docs.some((own) => own.id === notification.id)) {
      writer.update(notification.ref, {
        fromUserId: 'deleted',
        fromUserName: 'Usuário removido',
        fromUserPhoto: FieldValue.delete(),
      });
    }
  });

  writer.delete(db.doc(`users/${uid}`));
  writer.delete(db.doc(`achievements/${uid}`));
  await writer.close();

  await Promise.allSettled([
    db.recursiveDelete(db.doc(`userConsumption/${uid}`)),
    deleteUserProfilePhotos(uid),
  ]);
}
