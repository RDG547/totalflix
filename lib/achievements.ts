import { collection, doc, getDoc, getDocs, query, runTransaction, setDoc, where } from "firebase/firestore";
import { db } from "./firebase";
import toast from "react-hot-toast";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  requirement: number;
  category: "watch" | "social" | "explore";
  unlocked: boolean;
  unlockedAt?: Date;
  progress: number;
  badge?: string; // Badge emoji para exibir no perfil
}

export const ACHIEVEMENTS_LIST: Omit<Achievement, "unlocked" | "unlockedAt" | "progress">[] = [
  {
    id: "first_watch",
    title: "Primeira Visualização",
    description: "Assista seu primeiro conteúdo",
    icon: "🎬",
    badge: "🎬",
    requirement: 1,
    category: "watch",
  },
  {
    id: "movie_enthusiast",
    title: "Entusiasta do Cinema",
    description: "Assista 10 filmes",
    icon: "🍿",
    badge: "🍿",
    requirement: 10,
    category: "watch",
  },
  {
    id: "binge_watcher",
    title: "Maratonista",
    description: "Assista 5 séries diferentes",
    icon: "📺",
    badge: "📺",
    requirement: 5,
    category: "watch",
  },
  {
    id: "movie_buff",
    title: "Cinéfilo",
    description: "Assista 50 filmes",
    icon: "🎞️",
    badge: "🎞️",
    requirement: 50,
    category: "watch",
  },
  {
    id: "series_addict",
    title: "Viciado em Séries",
    description: "Assista 20 séries diferentes",
    icon: "📺",
    badge: "📺",
    requirement: 20,
    category: "watch",
  },
  {
    id: "first_comment",
    title: "Primeira Opinião",
    description: "Faça seu primeiro comentário",
    icon: "💬",
    badge: "💬",
    requirement: 1,
    category: "social",
  },
  {
    id: "commentator",
    title: "Comentarista Ativo",
    description: "Faça 10 comentários",
    icon: "💭",
    badge: "💭",
    requirement: 10,
    category: "social",
  },
  {
    id: "critic",
    title: "Crítico Profissional",
    description: "Faça 50 comentários",
    icon: "✍️",
    badge: "✍️",
    requirement: 50,
    category: "social",
  },
  {
    id: "first_favorite",
    title: "Primeiro Favorito",
    description: "Adicione seu primeiro favorito",
    icon: "❤️",
    badge: "❤️",
    requirement: 1,
    category: "social",
  },
  {
    id: "collector",
    title: "Colecionador",
    description: "Tenha 25 favoritos",
    icon: "⭐",
    badge: "⭐",
    requirement: 25,
    category: "social",
  },
  {
    id: "mega_collector",
    title: "Mega Colecionador",
    description: "Tenha 100 favoritos",
    icon: "🌟",
    badge: "🌟",
    requirement: 100,
    category: "social",
  },
  {
    id: "explorer",
    title: "Explorador",
    description: "Visite 5 gêneros diferentes",
    icon: "🧭",
    badge: "🧭",
    requirement: 5,
    category: "explore",
  },
  {
    id: "genre_master",
    title: "Mestre dos Gêneros",
    description: "Visite todos os gêneros disponíveis",
    icon: "🎭",
    badge: "🎭",
    requirement: 15,
    category: "explore",
  },
];

export interface UserAchievements {
  userId: string;
  achievements: Achievement[];
  stats: {
    moviesWatched: number;
    seriesWatched: number;
    commentsCount: number;
    favoritesCount: number;
    genresVisited: Set<number>;
    watchedMovieIds?: string[];
    watchedSeriesIds?: string[];
    favoriteIds?: string[];
    commentIds?: string[];
  };
}

// Inicializar conquistas do usuário
export async function initializeAchievements(userId: string): Promise<void> {
  const docRef = doc(db, "achievements", userId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) return;

  await setDoc(docRef, createInitialDocument(userId));
}

interface StoredStats {
  moviesWatched: number;
  seriesWatched: number;
  commentsCount: number;
  favoritesCount: number;
  genresVisited: number[];
  watchedMovieIds: string[];
  watchedSeriesIds: string[];
  favoriteIds: string[];
  commentIds: string[];
}

function createInitialDocument(userId: string) {
  return {
    userId,
    achievements: ACHIEVEMENTS_LIST.map((achievement) => ({
      ...achievement,
      unlocked: false,
      progress: 0,
    })),
    stats: normalizeStats({}),
  };
}

function normalizeStats(value: Record<string, unknown>): StoredStats {
  const list = (item: unknown) => Array.isArray(item) ? item.map(String) : [];
  const number = (item: unknown) => Number.isFinite(Number(item)) ? Number(item) : 0;
  return {
    moviesWatched: number(value.moviesWatched),
    seriesWatched: number(value.seriesWatched),
    commentsCount: number(value.commentsCount),
    favoritesCount: number(value.favoritesCount),
    genresVisited: Array.isArray(value.genresVisited)
      ? value.genresVisited.map(Number).filter(Number.isFinite)
      : [],
    watchedMovieIds: list(value.watchedMovieIds),
    watchedSeriesIds: list(value.watchedSeriesIds),
    favoriteIds: list(value.favoriteIds),
    commentIds: list(value.commentIds),
  };
}

function achievementProgress(id: string, stats: StoredStats): number {
  if (id === "first_watch") return stats.moviesWatched + stats.seriesWatched;
  if (["movie_enthusiast", "movie_buff"].includes(id)) return stats.moviesWatched;
  if (["binge_watcher", "series_addict"].includes(id)) return stats.seriesWatched;
  if (["first_comment", "commentator", "critic"].includes(id)) return stats.commentsCount;
  if (["first_favorite", "collector", "mega_collector"].includes(id)) return stats.favoritesCount;
  if (["explorer", "genre_master"].includes(id)) return stats.genresVisited.length;
  return 0;
}

function evaluateAchievements(
  existing: Achievement[],
  stats: StoredStats,
): { achievements: Achievement[]; newlyUnlocked: Achievement[] } {
  const existingById = new Map(existing.map((achievement) => [achievement.id, achievement]));
  const newlyUnlocked: Achievement[] = [];
  const achievements = ACHIEVEMENTS_LIST.map((definition) => {
    const previous = existingById.get(definition.id);
    const progress = achievementProgress(definition.id, stats);
    const unlocked = previous?.unlocked === true || progress >= definition.requirement;
    const achievement: Achievement = {
      ...definition,
      progress,
      unlocked,
      ...(previous?.unlockedAt ? { unlockedAt: previous.unlockedAt } : {}),
    };
    if (unlocked && !previous?.unlocked) {
      achievement.unlockedAt = new Date();
      newlyUnlocked.push(achievement);
    }
    return achievement;
  });
  return { achievements, newlyUnlocked };
}

function notifyUnlocked(achievements: Achievement[]) {
  achievements.forEach((achievement) => {
    toast.success(`🎉 Conquista Desbloqueada: ${achievement.title}!`, {
      duration: 5000,
      icon: achievement.icon,
    });
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("achievementUnlocked", {
        detail: { achievement },
      }));
    }
  });
}

// Obter conquistas do usuário
export async function getUserAchievements(userId: string): Promise<UserAchievements | null> {
  try {
    const docRef = doc(db, "achievements", userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        ...data,
        stats: {
          ...data.stats,
          genresVisited: new Set(data.stats.genresVisited || []),
        },
      } as UserAchievements;
    }
    return null;
  } catch (error) {
    console.error("Erro ao obter conquistas:", error);
    return null;
  }
}

// Atualizar progresso de conquista
export async function updateAchievementProgress(
  userId: string,
  type: "movie" | "series" | "comment" | "favorite" | "genre",
  value?: number | string
): Promise<Achievement[]> {
  try {
    const docRef = doc(db, "achievements", userId);
    const newlyUnlocked = await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(docRef);
      const data = snapshot.exists() ? snapshot.data() : createInitialDocument(userId);
      const stats = normalizeStats((data.stats || {}) as Record<string, unknown>);
      const uniqueValue = value === undefined ? "" : String(value);

      const addUnique = (field: "watchedMovieIds" | "watchedSeriesIds" | "favoriteIds" | "commentIds") => {
        const values = new Set(stats[field]);
        if (uniqueValue) {
          if (values.has(uniqueValue)) return false;
          values.add(uniqueValue);
          stats[field] = Array.from(values);
        }
        return true;
      };

      if (type === "movie" && addUnique("watchedMovieIds")) stats.moviesWatched += 1;
      if (type === "series" && addUnique("watchedSeriesIds")) stats.seriesWatched += 1;
      if (type === "comment" && addUnique("commentIds")) stats.commentsCount += 1;
      if (type === "favorite" && addUnique("favoriteIds")) stats.favoritesCount += 1;
      if (type === "genre") {
        const genre = Number(value);
        if (Number.isFinite(genre) && !stats.genresVisited.includes(genre)) {
          stats.genresVisited.push(genre);
        }
      }

      const evaluated = evaluateAchievements((data.achievements || []) as Achievement[], stats);
      transaction.set(docRef, {
        userId,
        achievements: evaluated.achievements,
        stats,
      }, { merge: true });
      return evaluated.newlyUnlocked;
    });
    notifyUnlocked(newlyUnlocked);
    return newlyUnlocked;
  } catch (error) {
    console.error("Erro ao atualizar progresso de conquista:", error);
    return [];
  }
}

export async function synchronizeAchievementsFromProfile(userId: string): Promise<Achievement[]> {
  try {
    const userRef = doc(db, "users", userId);
    const achievementRef = doc(db, "achievements", userId);
    const [profileSnapshot, commentsSnapshot] = await Promise.all([
      getDoc(userRef),
      getDocs(query(collection(db, "comments"), where("userId", "==", userId))).catch(() => null),
    ]);
    const profile = profileSnapshot.data() || {};
    const history = Array.isArray(profile.history) ? profile.history : [];
    const favorites = Array.isArray(profile.favorites) ? profile.favorites : [];
    const movieIds = new Set<string>();
    const seriesIds = new Set<string>();
    history.forEach((item) => {
      if (!item || typeof item !== "object") return;
      const entry = item as { id?: unknown; type?: unknown };
      if (entry.type === "movie") movieIds.add(String(entry.id));
      if (entry.type === "tv") seriesIds.add(String(entry.id));
    });
    const favoriteIds = new Set(favorites.map((item) => {
      if (typeof item === "number") return `legacy:${item}`;
      if (typeof item === "string") return item;
      const entry = item as { id?: unknown; type?: unknown };
      return `${entry.type || "legacy"}:${entry.id}`;
    }));

    const newlyUnlocked = await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(achievementRef);
      const data = snapshot.exists() ? snapshot.data() : createInitialDocument(userId);
      const stats = normalizeStats((data.stats || {}) as Record<string, unknown>);
      stats.watchedMovieIds = Array.from(movieIds);
      stats.watchedSeriesIds = Array.from(seriesIds);
      stats.favoriteIds = Array.from(favoriteIds);
      stats.moviesWatched = movieIds.size;
      stats.seriesWatched = seriesIds.size;
      stats.favoritesCount = favoriteIds.size;
      if (commentsSnapshot) {
        stats.commentIds = commentsSnapshot.docs.map((comment) => comment.id);
        stats.commentsCount = commentsSnapshot.size;
      }
      const evaluated = evaluateAchievements((data.achievements || []) as Achievement[], stats);
      transaction.set(achievementRef, {
        userId,
        achievements: evaluated.achievements,
        stats,
      }, { merge: true });
      return evaluated.newlyUnlocked;
    });
    notifyUnlocked(newlyUnlocked);
    return newlyUnlocked;
  } catch (error) {
    console.error("Erro ao sincronizar conquistas:", error);
    return [];
  }
}

// Obter conquistas desbloqueadas recentemente
export function getRecentlyUnlocked(achievements: Achievement[]): Achievement[] {
  return achievements
    .filter((a) => a.unlocked && a.unlockedAt)
    .sort((a, b) => {
      const dateA = a.unlockedAt ? new Date(a.unlockedAt).getTime() : 0;
      const dateB = b.unlockedAt ? new Date(b.unlockedAt).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 5);
}

// Obter porcentagem de conquistas
export function getAchievementPercentage(achievements: Achievement[]): number {
  const unlocked = achievements.filter((a) => a.unlocked).length;
  return Math.round((unlocked / achievements.length) * 100);
}
