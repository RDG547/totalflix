import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
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
  };
}

// Inicializar conquistas do usuário
export async function initializeAchievements(userId: string): Promise<void> {
  const docRef = doc(db, "achievements", userId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    const initialAchievements: Achievement[] = ACHIEVEMENTS_LIST.map((a) => ({
      ...a,
      unlocked: false,
      progress: 0,
    }));

    await setDoc(docRef, {
      userId,
      achievements: initialAchievements,
      stats: {
        moviesWatched: 0,
        seriesWatched: 0,
        commentsCount: 0,
        favoritesCount: 0,
        genresVisited: [],
      },
    });
  }
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
  value?: number
): Promise<Achievement[]> {
  try {
    const docRef = doc(db, "achievements", userId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      await initializeAchievements(userId);
      return [];
    }

    const data = docSnap.data();
    const achievements: Achievement[] = data.achievements || [];
    const stats = data.stats || {
      moviesWatched: 0,
      seriesWatched: 0,
      commentsCount: 0,
      favoritesCount: 0,
      genresVisited: [],
    };

    // Atualizar estatísticas
    switch (type) {
      case "movie":
        stats.moviesWatched += 1;
        break;
      case "series":
        stats.seriesWatched += 1;
        break;
      case "comment":
        stats.commentsCount += 1;
        break;
      case "favorite":
        stats.favoritesCount += 1;
        break;
      case "genre":
        if (value && !stats.genresVisited.includes(value)) {
          stats.genresVisited.push(value);
        }
        break;
    }

    // Verificar e desbloquear conquistas
    const newlyUnlocked: Achievement[] = [];
    const updatedAchievements = achievements.map((achievement) => {
      if (achievement.unlocked) return achievement;

      let progress = 0;

      // Calcular progresso baseado na categoria
      switch (achievement.id) {
        case "first_watch":
        case "movie_enthusiast":
        case "movie_buff":
          progress = stats.moviesWatched;
          break;
        case "binge_watcher":
        case "series_addict":
          progress = stats.seriesWatched;
          break;
        case "first_comment":
        case "commentator":
        case "critic":
          progress = stats.commentsCount;
          break;
        case "first_favorite":
        case "collector":
        case "mega_collector":
          progress = stats.favoritesCount;
          break;
        case "explorer":
        case "genre_master":
          progress = stats.genresVisited.length;
          break;
      }

      const unlocked = progress >= achievement.requirement;

      if (unlocked && !achievement.unlocked) {
        const unlockedAchievement = {
          ...achievement,
          unlocked: true,
          unlockedAt: new Date(),
          progress,
        };
        newlyUnlocked.push(unlockedAchievement);

        // Notificar o usuário sobre a conquista desbloqueada
        toast.success(
          `🎉 Conquista Desbloqueada: ${achievement.title}!`,
          {
            duration: 5000,
            icon: achievement.icon,
          }
        );
      }

      return {
        ...achievement,
        progress,
        unlocked,
        unlockedAt: unlocked && !achievement.unlockedAt ? new Date() : achievement.unlockedAt,
      };
    });

    // Atualizar no Firestore
    await updateDoc(docRef, {
      achievements: updatedAchievements,
      stats,
    });

    return newlyUnlocked;
  } catch (error) {
    console.error("Erro ao atualizar progresso de conquista:", error);
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
