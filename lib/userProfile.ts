import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  runTransaction,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';

export interface UserProfile {
  uid: string;
  email: string;
  role?: 'admin' | 'moderator' | 'user';
  vip?: boolean;
  vipExpiresAt?: number | null;
  displayName?: string;
  photoURL?: string;
  bio?: string;
  favorites: StoredFavorite[];
  history: HistoryEntry[];
  watchedSeries?: Record<string, SeriesWatchProgress>;
  createdAt: number;
  updatedAt: number;
}

export type FavoriteType = 'movie' | 'tv';

export interface FavoriteEntry {
  id: number;
  type: FavoriteType;
}

export type StoredFavorite = number | string | FavoriteEntry;

export interface HistoryEntry {
  id: number | string;
  type: 'movie' | 'tv' | 'live_tv';
  timestamp: number;
  title?: string;
}

export interface SeriesWatchProgress {
  episodes: string[];
  completedSeasons: number[];
  updatedAt: number;
}

export function favoriteKey(id: number, type: FavoriteType): string {
  return `${type}:${id}`;
}

export function parseFavorite(value: StoredFavorite): FavoriteEntry | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return { id: value, type: 'movie' };
  }

  if (typeof value === 'string') {
    const match = /^(movie|tv):(\d+)$/.exec(value);
    return match ? { type: match[1] as FavoriteType, id: Number(match[2]) } : null;
  }

  if (value && typeof value === 'object') {
    const id = Number(value.id);
    if (Number.isFinite(id) && (value.type === 'movie' || value.type === 'tv')) {
      return { id, type: value.type };
    }
  }

  return null;
}

export function isLegacyFavorite(value: StoredFavorite): boolean {
  return typeof value === 'number';
}

export function hasFavorite(
  favorites: StoredFavorite[] | undefined,
  contentId: number,
  type: FavoriteType,
): boolean {
  return (favorites || []).some((value) => {
    if (typeof value === 'number') return value === contentId;
    const favorite = parseFavorite(value);
    return favorite?.id === contentId && favorite.type === type;
  });
}

// Criar ou atualizar perfil do usuário
export async function createUserProfile(uid: string, email: string, displayName?: string, photoURL?: string) {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    const newProfile: UserProfile = {
      uid,
      email,
      displayName: displayName || '',
      photoURL: photoURL || '',
      bio: '',
      favorites: [],
      history: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await setDoc(userRef, newProfile);
    return newProfile;
  }

  return userSnap.data() as UserProfile;
}

// Obter perfil do usuário
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    const data = userSnap.data() as Partial<UserProfile>;
    return {
      ...data,
      uid: data.uid || uid,
      email: data.email || '',
      favorites: Array.isArray(data.favorites) ? data.favorites : [],
      history: Array.isArray(data.history) ? data.history : [],
      watchedSeries: data.watchedSeries && typeof data.watchedSeries === 'object'
        ? data.watchedSeries
        : {},
      createdAt: Number(data.createdAt) || 0,
      updatedAt: Number(data.updatedAt) || 0,
    };
  }

  return null;
}

// Atualizar informações do perfil
export async function updateUserProfile(
  uid: string,
  updates: { displayName?: string; photoURL?: string; bio?: string; email?: string }
) {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    ...updates,
    updatedAt: Date.now(),
  });
}

// Adicionar aos favoritos
export async function addToFavorites(uid: string, contentId: number, type: FavoriteType) {
  const userRef = doc(db, 'users', uid);
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(userRef);
    const current = (snapshot.data()?.favorites || []) as StoredFavorite[];
    const next = current.filter((value) => {
      if (typeof value === 'number') return value !== contentId;
      const favorite = parseFavorite(value);
      return favorite?.id !== contentId || favorite.type !== type;
    });
    next.push({ id: contentId, type });
    transaction.update(userRef, { favorites: next, updatedAt: Date.now() });
  });
}

// Remover dos favoritos
export async function removeFromFavorites(uid: string, contentId: number, type: FavoriteType) {
  const userRef = doc(db, 'users', uid);
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(userRef);
    const current = (snapshot.data()?.favorites || []) as StoredFavorite[];
    const next = current.filter((value) => {
      // Favoritos legados não possuem tipo. Removê-los aqui permite que o
      // próximo acréscimo seja salvo no formato correto e encerra a colisão.
      if (typeof value === 'number') return value !== contentId;
      const favorite = parseFavorite(value);
      return favorite?.id !== contentId || favorite.type !== type;
    });
    transaction.update(userRef, { favorites: next, updatedAt: Date.now() });
  });
}

export async function migrateLegacyFavorite(
  uid: string,
  contentId: number,
  type: FavoriteType,
) {
  const userRef = doc(db, 'users', uid);
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(userRef);
    const current = (snapshot.data()?.favorites || []) as StoredFavorite[];
    if (!current.some((value) => typeof value === 'number' && value === contentId)) return;

    const next = current.filter((value) => !(typeof value === 'number' && value === contentId));
    if (!hasFavorite(next, contentId, type)) next.push({ id: contentId, type });
    transaction.update(userRef, { favorites: next, updatedAt: Date.now() });
  });
}

// Adicionar ao histórico
export async function addToHistory(
  uid: string,
  contentId: number | string,
  type: HistoryEntry['type'],
  title?: string,
) {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    const userData = userSnap.data() as UserProfile;
    const history = userData.history || [];

    // Remove entrada anterior do mesmo conteúdo
    const filteredHistory = history.filter(item => (
      String(item.id) !== String(contentId) || item.type !== type
    ));

    // Adiciona nova entrada no início
    const newHistory = [
      { id: contentId, type, timestamp: Date.now(), ...(title ? { title } : {}) },
      ...filteredHistory,
    ].slice(0, 50); // Mantém apenas os últimos 50 itens

    await updateDoc(userRef, {
      history: newHistory,
      updatedAt: Date.now(),
    });
  }
}

function episodeKey(season: number, episode: number): string {
  return `${season}:${episode}`;
}

export async function setEpisodeWatched(
  uid: string,
  seriesId: number,
  season: number,
  episode: number,
  watched: boolean,
) {
  const userRef = doc(db, 'users', uid);
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(userRef);
    const data = snapshot.data() || {};
    const watchedSeries = { ...(data.watchedSeries || {}) } as Record<string, SeriesWatchProgress>;
    const current = watchedSeries[String(seriesId)] || {
      episodes: [],
      completedSeasons: [],
      updatedAt: 0,
    };
    const key = episodeKey(season, episode);
    const episodes = new Set(current.episodes || []);
    watched ? episodes.add(key) : episodes.delete(key);

    watchedSeries[String(seriesId)] = {
      ...current,
      episodes: Array.from(episodes),
      completedSeasons: watched
        ? current.completedSeasons || []
        : (current.completedSeasons || []).filter((value) => value !== season),
      updatedAt: Date.now(),
    };
    transaction.update(userRef, { watchedSeries, updatedAt: Date.now() });
  });
}

export async function setSeasonWatched(
  uid: string,
  seriesId: number,
  season: number,
  episodeNumbers: number[],
  watched: boolean,
) {
  const userRef = doc(db, 'users', uid);
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(userRef);
    const data = snapshot.data() || {};
    const watchedSeries = { ...(data.watchedSeries || {}) } as Record<string, SeriesWatchProgress>;
    const current = watchedSeries[String(seriesId)] || {
      episodes: [],
      completedSeasons: [],
      updatedAt: 0,
    };
    const episodes = new Set(current.episodes || []);
    episodeNumbers.forEach((episode) => {
      const key = episodeKey(season, episode);
      watched ? episodes.add(key) : episodes.delete(key);
    });
    const completedSeasons = new Set(current.completedSeasons || []);
    watched ? completedSeasons.add(season) : completedSeasons.delete(season);

    watchedSeries[String(seriesId)] = {
      episodes: Array.from(episodes),
      completedSeasons: Array.from(completedSeasons).sort((a, b) => a - b),
      updatedAt: Date.now(),
    };
    transaction.update(userRef, { watchedSeries, updatedAt: Date.now() });
  });
}

// Limpar histórico
export async function clearHistory(uid: string) {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    history: [],
    updatedAt: Date.now(),
  });
}

// Upload de foto de perfil
export async function uploadProfilePhoto(uid: string, file: File): Promise<string> {
  const storageRef = ref(storage, `profile-photos/${uid}/${Date.now()}_${file.name}`);
  await uploadBytes(storageRef, file);
  const photoURL = await getDownloadURL(storageRef);

  // Atualizar perfil com nova URL
  await updateUserProfile(uid, { photoURL });

  return photoURL;
}
