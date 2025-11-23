"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { getUserProfile, updateUserProfile, clearHistory, uploadProfilePhoto, UserProfile } from "@/lib/userProfile";
import { tmdb, Movie } from "@/lib/tmdb";
import { MovieCard } from "@/components/MovieCard";
import { AchievementCard } from "@/components/AchievementCard";
import { AchievementTree } from "@/components/AchievementTree";
import { getUserAchievements, getAchievementPercentage, UserAchievements, initializeAchievements } from "@/lib/achievements";
import {
  User,
  Heart,
  History,
  Settings,
  Loader2,
  Pencil,
  Check,
  X,
  Trash2,
  Camera,
  Trophy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import toast from "react-hot-toast";

// Mapa de gêneros
const GENRE_MAP: Record<number, string> = {
  28: "Ação",
  12: "Aventura",
  16: "Animação",
  35: "Comédia",
  80: "Crime",
  99: "Documentário",
  18: "Drama",
  10751: "Família",
  14: "Fantasia",
  36: "História",
  27: "Terror",
  10402: "Música",
  9648: "Mistério",
  10749: "Romance",
  878: "Ficção Científica",
  10770: "Cinema TV",
  53: "Thriller",
  10752: "Guerra",
  37: "Faroeste",
};

const getGenreName = (genreId: number): string => {
  return GENRE_MAP[genreId] || "Outros";
};

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [favorites, setFavorites] = useState<Movie[]>([]);
  const [historyMovies, setHistoryMovies] = useState<Movie[]>([]);
  const [achievements, setAchievements] = useState<UserAchievements | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [activeTab, setActiveTab] = useState<"favorites" | "history" | "achievements" | "settings">("favorites");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: "",
    bio: "",
  });

  useEffect(() => {
    if (!user) {
      router.push("/");
      return;
    }

    loadProfile();

    // Listener para atualização em tempo real dos favoritos
    const handleFavoriteRemoved = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { movieId } = customEvent.detail;

      // Remover o filme da lista imediatamente (atualização otimista)
      setFavorites(prev => prev.filter(movie => movie.id !== movieId));
    };

    const handleFavoriteAdded = () => {
      // Recarregar favoritos quando um novo é adicionado
      loadProfile();
    };

    const handleAchievementUnlocked = () => {
      // Recarregar conquistas quando uma nova é desbloqueada
      if (user) {
        getUserAchievements(user.uid).then((userAchievements) => {
          if (userAchievements) {
            setAchievements(userAchievements);
          }
        });
      }
    };

    window.addEventListener('favoriteRemoved', handleFavoriteRemoved);
    window.addEventListener('favoriteAdded', handleFavoriteAdded);
    window.addEventListener('achievementUnlocked', handleAchievementUnlocked);

    return () => {
      window.removeEventListener('favoriteRemoved', handleFavoriteRemoved);
      window.removeEventListener('favoriteAdded', handleFavoriteAdded);
      window.removeEventListener('achievementUnlocked', handleAchievementUnlocked);
    };
  }, [user, router]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const userProfile = await getUserProfile(user.uid);

      if (userProfile) {
        setProfile(userProfile);
        setEditForm({
          displayName: userProfile.displayName || "",
          bio: userProfile.bio || "",
        });

        // Carregar favoritos
        if (userProfile.favorites.length > 0) {
          const favPromises = userProfile.favorites.map(async (id) => {
            // Tentar buscar como filme primeiro
            try {
              const movieData = await tmdb.getDetails('movie', id);
              return { ...movieData, media_type: 'movie' };
            } catch {
              // Se falhar, tentar como série
              try {
                const tvData = await tmdb.getDetails('tv', id);
                return { ...tvData, media_type: 'tv' };
              } catch {
                return null;
              }
            }
          });
          const favResults = await Promise.all(favPromises);
          setFavorites(favResults.filter(Boolean) as Movie[]);
        }        // Carregar histórico
        if (userProfile.history.length > 0) {
          const histPromises = userProfile.history.map(item =>
            tmdb.getDetails(item.type, item.id).catch(() => null)
          );
          const histResults = await Promise.all(histPromises);
          setHistoryMovies(histResults.filter(Boolean) as Movie[]);
        }

        // Carregar conquistas
        let userAchievements = await getUserAchievements(user.uid);
        if (!userAchievements) {
          // Inicializar conquistas se não existir
          await initializeAchievements(user.uid);
          userAchievements = await getUserAchievements(user.uid);
        }
        if (userAchievements) {
          setAchievements(userAchievements);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar perfil:", error);
      toast.error("Erro ao carregar perfil");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    try {
      await updateUserProfile(user.uid, {
        displayName: editForm.displayName,
        bio: editForm.bio,
      });

      setProfile(prev => prev ? {
        ...prev,
        displayName: editForm.displayName,
        bio: editForm.bio,
      } : null);

      setIsEditing(false);
      toast.success("Perfil atualizado com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar perfil:", error);
      toast.error("Erro ao salvar perfil");
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files || !e.target.files[0]) return;

    const file = e.target.files[0];

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast.error("Por favor, selecione uma imagem válida");
      return;
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB");
      return;
    }

    try {
      setUploadingPhoto(true);
      toast.loading("Enviando foto...", { id: "photo-upload" });

      const photoURL = await uploadProfilePhoto(user.uid, file);

      setProfile(prev => prev ? { ...prev, photoURL } : null);

      toast.success("Foto atualizada com sucesso!", { id: "photo-upload" });

      // Recarregar página para atualizar navbar
      window.location.reload();
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      toast.error("Erro ao fazer upload da foto", { id: "photo-upload" });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleClearHistory = async () => {
    if (!user || !confirm("Deseja realmente limpar todo o histórico?")) return;

    try {
      await clearHistory(user.uid);
      setHistoryMovies([]);
      setProfile(prev => prev ? { ...prev, history: [] } : null);
      toast.success("Histórico limpo com sucesso!");
    } catch (error) {
      console.error("Erro ao limpar histórico:", error);
      toast.error("Erro ao limpar histórico");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-purple-400" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <p className="text-gray-400">Perfil não encontrado</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4 space-y-8">
        {/* Header do Perfil */}
        <div className="glass-effect border border-purple-500/30 rounded-2xl p-8">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Avatar */}
            <div className="relative group">
              {profile.photoURL ? (
                <Image
                  src={profile.photoURL}
                  alt={profile.displayName || "Avatar"}
                  width={120}
                  height={120}
                  className="rounded-full border-4 border-purple-500 glow-effect object-cover"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-purple-600 flex items-center justify-center border-4 border-purple-500 glow-effect">
                  <User className="w-16 h-16 text-white" />
                </div>
              )}

              {/* Botão de upload */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="absolute bottom-0 right-0 p-2 bg-purple-600 rounded-full border-2 border-black hover:bg-purple-700 transition-all disabled:opacity-50"
                title="Alterar foto"
              >
                {uploadingPhoto ? (
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                ) : (
                  <Camera className="w-5 h-5 text-white" />
                )}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>

            {/* Informações */}
            <div className="flex-1 space-y-4">
              {isEditing ? (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={editForm.displayName}
                    onChange={(e) => setEditForm(prev => ({ ...prev, displayName: e.target.value }))}
                    placeholder="Nome de exibição"
                    className="w-full px-4 py-2 bg-black/60 border border-purple-500/30 rounded-lg text-white focus:border-purple-500 outline-none"
                  />
                  <textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Bio"
                    rows={3}
                    className="w-full px-4 py-2 bg-black/60 border border-purple-500/30 rounded-lg text-white focus:border-purple-500 outline-none resize-none"
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleSaveProfile} className="glow-effect">
                      <Check className="w-4 h-4 mr-2" />
                      Salvar
                    </Button>
                    <Button onClick={() => setIsEditing(false)} variant="outline" className="border-purple-500/50">
                      <X className="w-4 h-4 mr-2" />
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <h1 className="text-3xl font-bold text-gradient">
                      {profile.displayName || "Usuário"}
                    </h1>
                    <p className="text-gray-400">{profile.email}</p>
                  </div>
                  {profile.bio && (
                    <p className="text-gray-300">{profile.bio}</p>
                  )}

                  {/* Selos de Conquistas Desbloqueadas */}
                  {achievements && achievements.achievements.filter(a => a.unlocked).length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-400 font-semibold uppercase">Conquistas Desbloqueadas</p>
                      <div className="flex flex-wrap gap-2">
                        {achievements.achievements
                          .filter(a => a.unlocked)
                          .slice(0, 10)
                          .map(achievement => (
                            <div
                              key={achievement.id}
                              className="relative group"
                            >
                              <span className="text-2xl cursor-help hover:scale-125 transition-transform inline-block">
                                {achievement.badge || achievement.icon}
                              </span>
                              {/* Tooltip */}
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap">
                                <div className="glass-effect border border-purple-500/30 rounded-lg p-2 text-xs">
                                  <p className="font-bold text-white">{achievement.title}</p>
                                  <p className="text-gray-400">{achievement.description}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        {achievements.achievements.filter(a => a.unlocked).length > 10 && (
                          <span className="text-sm text-purple-400 self-center">
                            +{achievements.achievements.filter(a => a.unlocked).length - 10} mais
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4 text-sm text-gray-400">
                    <span>{favorites.length} favoritos</span>
                    <span>•</span>
                    <span>{historyMovies.length} visualizações</span>
                    {achievements && (
                      <>
                        <span>•</span>
                        <span>{getAchievementPercentage(achievements.achievements)}% conquistas</span>
                      </>
                    )}
                  </div>
                  <Button onClick={() => setIsEditing(true)} variant="outline" className="border-purple-500/50">
                    <Pencil className="w-4 h-4 mr-2" />
                    Editar Perfil
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-purple-500/30">
          <button
            onClick={() => setActiveTab("favorites")}
            className={`px-6 py-3 font-medium transition-all ${
              activeTab === "favorites"
                ? "text-purple-400 border-b-2 border-purple-400"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            <Heart className="w-5 h-5 inline mr-2" />
            Favoritos
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-6 py-3 font-medium transition-all ${
              activeTab === "history"
                ? "text-purple-400 border-b-2 border-purple-400"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            <History className="w-5 h-5 inline mr-2" />
            Histórico
          </button>
          <button
            onClick={() => setActiveTab("achievements")}
            className={`px-6 py-3 font-medium transition-all ${
              activeTab === "achievements"
                ? "text-purple-400 border-b-2 border-purple-400"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            <Trophy className="w-5 h-5 inline mr-2" />
            Conquistas
          </button>
        </div>

        {/* Conteúdo das Tabs */}
        <div className="space-y-6">
          {activeTab === "favorites" && (
            <>
              {favorites.length > 0 ? (
                <div className="space-y-8">
                  {/* Filmes */}
                  {favorites.filter(m => m.media_type === 'movie' || m.title).length > 0 && (
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                        🎬 Filmes
                        <span className="text-sm text-gray-400 font-normal">
                          ({favorites.filter(m => m.media_type === 'movie' || m.title).length})
                        </span>
                      </h2>

                      {/* Agrupar por gênero */}
                      {(() => {
                        const moviesByGenre: Record<string, Movie[]> = {};
                        favorites
                          .filter(m => m.media_type === 'movie' || m.title)
                          .forEach(movie => {
                            if (movie.genre_ids && movie.genre_ids.length > 0) {
                              const genreId = movie.genre_ids[0];
                              const genreName = getGenreName(genreId);
                              if (!moviesByGenre[genreName]) {
                                moviesByGenre[genreName] = [];
                              }
                              moviesByGenre[genreName].push(movie);
                            } else {
                              if (!moviesByGenre['Outros']) {
                                moviesByGenre['Outros'] = [];
                              }
                              moviesByGenre['Outros'].push(movie);
                            }
                          });

                        return Object.entries(moviesByGenre).map(([genre, movies]) => (
                          <div key={genre} className="mb-6">
                            <h3 className="text-lg font-semibold text-purple-400 mb-3">
                              {genre}
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                              {movies.map((movie) => (
                                <MovieCard key={movie.id} movie={movie} />
                              ))}
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  )}

                  {/* Séries */}
                  {favorites.filter(m => m.media_type === 'tv' || m.name).length > 0 && (
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                        📺 Séries
                        <span className="text-sm text-gray-400 font-normal">
                          ({favorites.filter(m => m.media_type === 'tv' || m.name).length})
                        </span>
                      </h2>

                      {/* Agrupar por gênero */}
                      {(() => {
                        const seriesByGenre: Record<string, Movie[]> = {};
                        favorites
                          .filter(m => m.media_type === 'tv' || m.name)
                          .forEach(series => {
                            if (series.genre_ids && series.genre_ids.length > 0) {
                              const genreId = series.genre_ids[0];
                              const genreName = getGenreName(genreId);
                              if (!seriesByGenre[genreName]) {
                                seriesByGenre[genreName] = [];
                              }
                              seriesByGenre[genreName].push(series);
                            } else {
                              if (!seriesByGenre['Outros']) {
                                seriesByGenre['Outros'] = [];
                              }
                              seriesByGenre['Outros'].push(series);
                            }
                          });

                        return Object.entries(seriesByGenre).map(([genre, series]) => (
                          <div key={genre} className="mb-6">
                            <h3 className="text-lg font-semibold text-purple-400 mb-3">
                              {genre}
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                              {series.map((s) => (
                                <MovieCard key={s.id} movie={s} />
                              ))}
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 glass-effect rounded-xl">
                  <Heart className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                  <p className="text-gray-400 text-lg">Nenhum favorito ainda</p>
                  <p className="text-gray-500 text-sm mt-2">
                    Adicione filmes e séries aos seus favoritos para vê-los aqui
                  </p>
                </div>
              )}
            </>
          )}

          {activeTab === "history" && (
            <>
              {historyMovies.length > 0 ? (
                <>
                  <div className="flex justify-end">
                    <Button
                      onClick={handleClearHistory}
                      variant="outline"
                      className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Limpar Histórico
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {historyMovies.map((movie) => (
                      <MovieCard key={movie.id} movie={movie} />
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-12 glass-effect rounded-xl">
                  <History className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                  <p className="text-gray-400 text-lg">Nenhum histórico ainda</p>
                  <p className="text-gray-500 text-sm mt-2">
                    Os filmes e séries que você assistir aparecerão aqui
                  </p>
                </div>
              )}
            </>
          )}

          {activeTab === "achievements" && (
            <>
              {achievements ? (
                <div className="space-y-8">
                  {/* Estatísticas */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="glass-effect border border-purple-500/30 rounded-xl p-4 text-center">
                      <div className="text-3xl font-bold text-purple-400">
                        {achievements.stats.moviesWatched}
                      </div>
                      <div className="text-sm text-gray-400 mt-1">Filmes Assistidos</div>
                    </div>
                    <div className="glass-effect border border-purple-500/30 rounded-xl p-4 text-center">
                      <div className="text-3xl font-bold text-purple-400">
                        {achievements.stats.seriesWatched}
                      </div>
                      <div className="text-sm text-gray-400 mt-1">Séries Assistidas</div>
                    </div>
                    <div className="glass-effect border border-purple-500/30 rounded-xl p-4 text-center">
                      <div className="text-3xl font-bold text-purple-400">
                        {achievements.stats.commentsCount}
                      </div>
                      <div className="text-sm text-gray-400 mt-1">Comentários</div>
                    </div>
                    <div className="glass-effect border border-purple-500/30 rounded-xl p-4 text-center">
                      <div className="text-3xl font-bold text-yellow-400">
                        {achievements.achievements.filter((a) => a.unlocked).length}/
                        {achievements.achievements.length}
                      </div>
                      <div className="text-sm text-gray-400 mt-1">Conquistas</div>
                    </div>
                  </div>

                  {/* Progresso Geral */}
                  <div className="glass-effect border border-purple-500/30 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-white">Progresso Geral</h3>
                      <span className="text-2xl font-bold text-yellow-400">
                        {getAchievementPercentage(achievements.achievements)}%
                      </span>
                    </div>
                    <div className="w-full h-4 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-600 to-yellow-400 transition-all duration-500"
                        style={{
                          width: `${getAchievementPercentage(achievements.achievements)}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Árvore de Conquistas Gamificada */}
                  <div className="glass-effect border border-purple-500/30 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                      <Trophy className="w-6 h-6 text-yellow-400" />
                      Árvore de Conquistas
                    </h3>
                    <AchievementTree achievements={achievements.achievements} />
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 glass-effect rounded-xl">
                  <Trophy className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                  <p className="text-gray-400 text-lg">Carregando conquistas...</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
