"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  clearHistory,
  getUserProfile,
  isLegacyFavorite,
  migrateLegacyFavorite,
  parseFavorite,
  updateUserProfile,
  uploadProfilePhoto,
  type HistoryEntry,
  type UserProfile,
} from "@/lib/userProfile";
import { tmdb, Movie } from "@/lib/tmdb";
import { MovieCard } from "@/components/MovieCard";
import { AchievementTree } from "@/components/AchievementTree";
import {
  getUserAchievements,
  getAchievementPercentage,
  synchronizeAchievementsFromProfile,
  type UserAchievements,
} from "@/lib/achievements";
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
  Trophy,
  Crown,
  Film,
  Tv,
  Radio,
  Mail,
  KeyRound,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import toast from "react-hot-toast";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { AccountSettingsModal, type AccountSettingsModalType } from "@/components/AccountSettingsModal";
import { PlatformDropdown, type PlatformDropdownOption } from "@/components/PlatformDropdown";
import { getGenreName } from "@/lib/genres";

type ProfileMovie = Movie & { media_type: "movie" | "tv" };

function favoriteGenreOptions(items: ProfileMovie[]): PlatformDropdownOption[] {
  const genres = new Map<number, string>();
  items.forEach((item) => {
    (item.genre_ids || []).forEach((genreId) => genres.set(genreId, getGenreName(genreId)));
  });
  return [
    { value: "all", label: "Todos os gêneros" },
    ...Array.from(genres.entries())
      .sort((first, second) => first[1].localeCompare(second[1], "pt-BR"))
      .map(([genreId, label]) => ({ value: String(genreId), label })),
  ];
}

export default function ProfilePage() {
  const { user, isVip, access, updateAccountEmail, updateAccountPassword } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [favorites, setFavorites] = useState<ProfileMovie[]>([]);
  const [historyContent, setHistoryContent] = useState<ProfileMovie[]>([]);
  const [liveTvHistory, setLiveTvHistory] = useState<HistoryEntry[]>([]);
  const [achievements, setAchievements] = useState<UserAchievements | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [activeTab, setActiveTab] = useState<"favorites" | "history" | "achievements" | "settings">("favorites");
  const [isEditing, setIsEditing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [savingAccount, setSavingAccount] = useState<"email" | "password" | null>(null);
  const [accountModal, setAccountModal] = useState<AccountSettingsModalType>(null);
  const [movieGenreFilter, setMovieGenreFilter] = useState("all");
  const [seriesGenreFilter, setSeriesGenreFilter] = useState("all");
  const [editForm, setEditForm] = useState({
    displayName: "",
    bio: "",
  });
  const [accountForm, setAccountForm] = useState({
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const movieFavorites = useMemo(
    () => favorites.filter((item) => item.media_type === "movie"),
    [favorites],
  );
  const seriesFavorites = useMemo(
    () => favorites.filter((item) => item.media_type === "tv"),
    [favorites],
  );
  const movieGenreOptions = useMemo(() => favoriteGenreOptions(movieFavorites), [movieFavorites]);
  const seriesGenreOptions = useMemo(() => favoriteGenreOptions(seriesFavorites), [seriesFavorites]);
  const selectedMovieGenre = movieGenreOptions.some((option) => option.value === movieGenreFilter)
    ? movieGenreFilter
    : "all";
  const selectedSeriesGenre = seriesGenreOptions.some((option) => option.value === seriesGenreFilter)
    ? seriesGenreFilter
    : "all";
  const visibleMovieFavorites = useMemo(() => {
    if (selectedMovieGenre === "all") return movieFavorites;
    const genreId = Number(selectedMovieGenre);
    return movieFavorites.filter((item) => item.genre_ids?.includes(genreId));
  }, [movieFavorites, selectedMovieGenre]);
  const visibleSeriesFavorites = useMemo(() => {
    if (selectedSeriesGenre === "all") return seriesFavorites;
    const genreId = Number(selectedSeriesGenre);
    return seriesFavorites.filter((item) => item.genre_ids?.includes(genreId));
  }, [seriesFavorites, selectedSeriesGenre]);

  const closeAccountModal = useCallback(() => {
    setAccountModal(null);
    setAccountForm((current) => ({
      ...current,
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    }));
  }, []);
  const openAccountModal = useCallback((type: Exclude<AccountSettingsModalType, null>) => {
    setAccountForm((current) => ({
      ...current,
      email: type === "email" ? user?.email || profile?.email || current.email : current.email,
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    }));
    setAccountModal(type);
  }, [profile?.email, user?.email]);

  useEffect(() => {
    if (!user) {
      router.push("/");
      return;
    }

    loadProfile();

    // Listener para atualização em tempo real dos favoritos
    const handleFavoriteRemoved = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { contentId, type } = customEvent.detail;

      setFavorites(prev => prev.filter(movie => (
        movie.id !== contentId || movie.media_type !== type
      )));
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

        setAccountForm((current) => ({
          ...current,
          email: user.email || userProfile.email || "",
        }));

        // Carregar favoritos. Entradas novas possuem tipo; entradas antigas são
        // inferidas uma vez e migradas para impedir colisões entre IDs do TMDB.
        if (userProfile.favorites.length > 0) {
          const favPromises = userProfile.favorites.map(async (stored) => {
            if (!isLegacyFavorite(stored)) {
              const favorite = parseFavorite(stored);
              if (!favorite) return null;
              const details = await tmdb.getDetails(favorite.type, favorite.id).catch(() => null);
              return details ? {
                ...details,
                genre_ids: details.genre_ids?.length ? details.genre_ids : details.genres?.map((genre) => genre.id) || [],
                media_type: favorite.type,
              } as ProfileMovie : null;
            }

            const id = Number(stored);
            const historyMatch = userProfile.history.find((item) => (
              Number(item.id) === id && (item.type === "movie" || item.type === "tv")
            ));
            const [movieResult, tvResult] = await Promise.allSettled([
              tmdb.getDetails("movie", id),
              tmdb.getDetails("tv", id),
            ]);
            const movie = movieResult.status === "fulfilled" ? movieResult.value : null;
            const series = tvResult.status === "fulfilled" ? tvResult.value : null;
            let inferredType: "movie" | "tv";
            if (historyMatch?.type === "movie" || historyMatch?.type === "tv") {
              inferredType = historyMatch.type;
            } else if (!movie && series) {
              inferredType = "tv";
            } else if (movie && !series) {
              inferredType = "movie";
            } else {
              const movieScore = Number((movie as Movie & { popularity?: number })?.popularity || 0);
              const seriesScore = Number((series as Movie & { popularity?: number })?.popularity || 0);
              inferredType = seriesScore > movieScore ? "tv" : "movie";
            }
            const details = inferredType === "tv" ? series : movie;
            if (!details) return null;
            await migrateLegacyFavorite(user.uid, id, inferredType).catch(() => undefined);
            return {
              ...details,
              genre_ids: details.genre_ids?.length ? details.genre_ids : details.genres?.map((genre) => genre.id) || [],
              media_type: inferredType,
            } as ProfileMovie;
          });
          const favResults = await Promise.all(favPromises);
          setFavorites(favResults.filter(Boolean) as ProfileMovie[]);
        } else {
          setFavorites([]);
        }

        const tmdbHistory = userProfile.history.filter((item) => item.type !== "live_tv");
        if (tmdbHistory.length > 0) {
          const histPromises = tmdbHistory.map(async (item) => {
            const details = await tmdb.getDetails(item.type as "movie" | "tv", Number(item.id)).catch(() => null);
            return details ? {
              ...details,
              genre_ids: details.genre_ids?.length ? details.genre_ids : details.genres?.map((genre) => genre.id) || [],
              media_type: item.type,
            } as ProfileMovie : null;
          }
          );
          const histResults = await Promise.all(histPromises);
          setHistoryContent(histResults.filter(Boolean) as ProfileMovie[]);
        } else {
          setHistoryContent([]);
        }
        setLiveTvHistory(userProfile.history.filter((item) => item.type === "live_tv"));

        // Recalcula a partir dos dados reais do perfil para reparar progresso
        // antigo que não foi registrado pelos players.
        await synchronizeAchievementsFromProfile(user.uid);
        const userAchievements = await getUserAchievements(user.uid);
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
    if (!user) return;

    try {
      await clearHistory(user.uid);
      setHistoryContent([]);
      setLiveTvHistory([]);
      setProfile(prev => prev ? { ...prev, history: [] } : null);
      setShowClearConfirm(false);
      toast.success("Histórico limpo com sucesso!");
    } catch (error) {
      console.error("Erro ao limpar histórico:", error);
      toast.error("Erro ao limpar histórico");
    }
  };

  const handleUpdateEmail = async () => {
    const nextEmail = accountForm.email.trim().toLowerCase();
    if (!nextEmail || nextEmail === user?.email?.toLowerCase()) {
      toast.error("Informe um e-mail diferente do atual.");
      return;
    }
    setSavingAccount("email");
    try {
      await updateAccountEmail(nextEmail, accountForm.currentPassword);
      setProfile((current) => current ? { ...current, email: nextEmail } : current);
      closeAccountModal();
      toast.success("E-mail atualizado com sucesso.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível alterar o e-mail.");
    } finally {
      setSavingAccount(null);
    }
  };

  const handleUpdatePassword = async () => {
    if (accountForm.newPassword.length < 8) {
      toast.error("A nova senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (accountForm.newPassword !== accountForm.confirmPassword) {
      toast.error("A confirmação da senha não confere.");
      return;
    }
    setSavingAccount("password");
    try {
      await updateAccountPassword(accountForm.newPassword, accountForm.currentPassword);
      closeAccountModal();
      toast.success("Senha atualizada com sucesso.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível alterar a senha.");
    } finally {
      setSavingAccount(null);
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
                    <div className="flex flex-wrap items-center gap-3">
                      <h1 className="text-3xl font-bold text-gradient">
                        {profile.displayName || "Usuário"}
                      </h1>
                      {isVip && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-300">
                          <Crown className="h-3.5 w-3.5" />
                          VIP
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400">{profile.email}</p>
                    {isVip && (
                      <p className="mt-1 text-xs text-amber-300/70">
                        {access.vipExpiresAt
                          ? `Acesso VIP até ${new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(access.vipExpiresAt < 10_000_000_000 ? access.vipExpiresAt * 1000 : access.vipExpiresAt))}`
                          : "Acesso VIP por tempo indeterminado"}
                      </p>
                    )}
                  </div>
                  {profile.bio && (
                    <p className="text-gray-300">{profile.bio}</p>
                  )}

                  <div className="flex gap-4 text-sm text-gray-400">
                    <span>{favorites.length} favoritos</span>
                    <span>•</span>
                    <span>{historyContent.length + liveTvHistory.length} visualizações</span>
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
        <div className="flex gap-2 overflow-x-auto border-b border-purple-500/30">
          <button
            onClick={() => setActiveTab("favorites")}
            className={`px-6 py-3 font-medium transition-all ${activeTab === "favorites"
              ? "text-purple-400 border-b-2 border-purple-400"
              : "text-gray-400 hover:text-gray-300"
              }`}
          >
            <Heart className="w-5 h-5 inline mr-2" />
            Favoritos
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-6 py-3 font-medium transition-all ${activeTab === "history"
              ? "text-purple-400 border-b-2 border-purple-400"
              : "text-gray-400 hover:text-gray-300"
              }`}
          >
            <History className="w-5 h-5 inline mr-2" />
            Histórico
          </button>
          <button
            onClick={() => setActiveTab("achievements")}
            className={`px-6 py-3 font-medium transition-all ${activeTab === "achievements"
              ? "text-purple-400 border-b-2 border-purple-400"
              : "text-gray-400 hover:text-gray-300"
              }`}
          >
            <Trophy className="w-5 h-5 inline mr-2" />
            Conquistas
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`px-6 py-3 font-medium transition-all ${activeTab === "settings"
              ? "text-purple-400 border-b-2 border-purple-400"
              : "text-gray-400 hover:text-gray-300"
              }`}
          >
            <Settings className="w-5 h-5 inline mr-2" />
            Conta
          </button>
        </div>

        {/* Conteúdo das Tabs */}
        <div className="space-y-6">
          {activeTab === "favorites" && (
            <>
              {favorites.length > 0 ? (
                <div className="grid items-start gap-10 xl:grid-cols-2">
                  {movieFavorites.length > 0 ? (
                    <section className={seriesFavorites.length === 0 ? "xl:col-span-2" : ""}>
                      <div className="mb-4 flex flex-wrap items-center gap-3">
                        <h2 className="flex items-center gap-2 text-2xl font-bold text-white">
                          <Film className="h-6 w-6 text-blue-400" />
                          Filmes
                          <span className="text-sm font-normal text-gray-400">({visibleMovieFavorites.length})</span>
                        </h2>
                        <PlatformDropdown
                          value={selectedMovieGenre}
                          options={movieGenreOptions}
                          onChange={setMovieGenreFilter}
                          ariaLabel="Filtrar filmes favoritos por gênero"
                          size="sm"
                          className="sm:ml-auto"
                        />
                      </div>
                      {visibleMovieFavorites.length > 0 ? (
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                          {visibleMovieFavorites.map((movie) => (
                            <MovieCard key={`${movie.media_type}:${movie.id}`} movie={movie} />
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-xl border border-purple-500/20 bg-black/30 p-8 text-center text-sm text-zinc-500">
                          Nenhum filme favorito neste gênero.
                        </div>
                      )}
                    </section>
                  ) : null}

                  {seriesFavorites.length > 0 ? (
                    <section className={movieFavorites.length === 0 ? "xl:col-span-2" : ""}>
                      <div className="mb-4 flex flex-wrap items-center gap-3">
                        <h2 className="flex items-center gap-2 text-2xl font-bold text-white">
                          <Tv className="h-6 w-6 text-red-400" />
                          Séries
                          <span className="text-sm font-normal text-gray-400">({visibleSeriesFavorites.length})</span>
                        </h2>
                        <PlatformDropdown
                          value={selectedSeriesGenre}
                          options={seriesGenreOptions}
                          onChange={setSeriesGenreFilter}
                          ariaLabel="Filtrar séries favoritas por gênero"
                          size="sm"
                          className="sm:ml-auto"
                        />
                      </div>
                      {visibleSeriesFavorites.length > 0 ? (
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                          {visibleSeriesFavorites.map((series) => (
                            <MovieCard key={`${series.media_type}:${series.id}`} movie={series} />
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-xl border border-purple-500/20 bg-black/30 p-8 text-center text-sm text-zinc-500">
                          Nenhuma série favorita neste gênero.
                        </div>
                      )}
                    </section>
                  ) : null}
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
              {historyContent.length + liveTvHistory.length > 0 ? (
                <>
                  <div className="flex justify-end">
                    <Button
                      onClick={() => setShowClearConfirm(true)}
                      variant="outline"
                      className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Limpar Histórico
                    </Button>
                  </div>
                  <div className="space-y-10">
                    {historyContent.some((item) => item.media_type === "movie") && (
                      <section>
                        <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-white">
                          <Film className="h-6 w-6 text-blue-400" />
                          Filmes
                          <span className="text-sm font-normal text-gray-400">
                            ({historyContent.filter((item) => item.media_type === "movie").length})
                          </span>
                        </h2>
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
                          {historyContent.filter((item) => item.media_type === "movie").map((movie) => (
                            <MovieCard key={`history-movie:${movie.id}`} movie={movie} />
                          ))}
                        </div>
                      </section>
                    )}

                    {historyContent.some((item) => item.media_type === "tv") && (
                      <section>
                        <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-white">
                          <Tv className="h-6 w-6 text-red-400" />
                          Séries
                          <span className="text-sm font-normal text-gray-400">
                            ({historyContent.filter((item) => item.media_type === "tv").length})
                          </span>
                        </h2>
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
                          {historyContent.filter((item) => item.media_type === "tv").map((series) => (
                            <MovieCard key={`history-tv:${series.id}`} movie={series} />
                          ))}
                        </div>
                      </section>
                    )}

                    {liveTvHistory.length > 0 && (
                      <section>
                        <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-white">
                          <Radio className="h-6 w-6 text-purple-400" />
                          TV ao Vivo
                          <span className="text-sm font-normal text-gray-400">({liveTvHistory.length})</span>
                        </h2>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          {liveTvHistory.map((channel) => (
                            <div
                              key={`history-live:${channel.id}`}
                              className="flex items-center gap-4 rounded-xl border border-purple-500/20 bg-black/40 p-4"
                            >
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-500/15">
                                <Radio className="h-6 w-6 text-red-400" />
                              </div>
                              <div className="min-w-0">
                                <p className="truncate font-semibold text-white">{channel.title || `Canal ${channel.id}`}</p>
                                <p className="mt-1 text-xs text-gray-500">
                                  {new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(channel.timestamp))}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-12 glass-effect rounded-xl">
                  <History className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                  <p className="text-gray-400 text-lg">Nenhum histórico ainda</p>
                  <p className="text-gray-500 text-sm mt-2">
                    Filmes, séries e canais que você assistir aparecerão aqui
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

          {activeTab === "settings" && (
            <div className="grid gap-6 lg:grid-cols-2">
              <section className="glass-effect rounded-xl border border-purple-500/30 p-6">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-purple-500/15 p-2.5">
                    <Mail className="h-5 w-5 text-purple-300" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-bold text-white">E-mail da conta</h2>
                    <p className="mt-1 truncate text-sm text-gray-400">{user?.email || profile.email}</p>
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={() => openAccountModal("email")}
                  variant="outline"
                  className="mt-6 w-full justify-between border-purple-500/30 bg-purple-500/10 text-purple-200 hover:bg-purple-500/20"
                >
                  Alterar e-mail
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </section>

              <section className="glass-effect rounded-xl border border-purple-500/30 p-6">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-purple-500/15 p-2.5">
                    <KeyRound className="h-5 w-5 text-purple-300" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-bold text-white">Senha</h2>
                    <p className="mt-1 text-sm text-gray-400">Mantenha sua conta protegida com uma senha segura.</p>
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={() => openAccountModal("password")}
                  variant="outline"
                  className="mt-6 w-full justify-between border-purple-500/30 bg-purple-500/10 text-purple-200 hover:bg-purple-500/20"
                >
                  Alterar senha
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </section>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog for Clear History */}
      <ConfirmDialog
        isOpen={showClearConfirm}
        title="Limpar Histórico"
        message="Deseja realmente limpar todo o histórico? Esta ação não pode ser desfeita."
        confirmText="Limpar"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={handleClearHistory}
        onCancel={() => setShowClearConfirm(false)}
      />
      <AccountSettingsModal
        type={accountModal}
        values={accountForm}
        saving={savingAccount === accountModal}
        onChange={(field, value) => setAccountForm((current) => ({ ...current, [field]: value }))}
        onSubmit={() => {
          if (accountModal === "email") void handleUpdateEmail();
          if (accountModal === "password") void handleUpdatePassword();
        }}
        onClose={closeAccountModal}
      />
    </div>
  );
}
