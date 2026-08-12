"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { Search, Menu, X, Film, ChevronDown, Radio, User, LogOut, LogIn, UserPlus, Home, Clapperboard, Tv, Download, Heart, LayoutDashboard, Crown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { tmdb, type Movie, getImageUrl } from "@/lib/tmdb";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationsDropdown } from "@/components/NotificationsDropdown";
import { useScrollLock } from "@/hooks/useScrollLock";
import {
  addToFavorites,
  favoriteKey,
  getUserProfile,
  parseFavorite,
  removeFromFavorites,
  type FavoriteType,
} from "@/lib/userProfile";
import { initializeAchievements, updateAchievementProgress } from "@/lib/achievements";
import { getGenreIcon } from "@/lib/genre-icons";
import toast from "react-hot-toast";

interface Genre {
  id: number;
  name: string;
}

function GenreIcon({ genreId }: { genreId: number }) {
  const Icon = getGenreIcon(genreId);
  return <Icon className="w-4 h-4 shrink-0 text-purple-400" />;
}

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [movieGenres, setMovieGenres] = useState<Genre[]>([]);
  const [tvGenres, setTvGenres] = useState<Genre[]>([]);
  const [showMovieDropdown, setShowMovieDropdown] = useState(false);
  const [showTvDropdown, setShowTvDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [genreCounts, setGenreCounts] = useState<Record<number, number>>({});
  const [canInstallApp, setCanInstallApp] = useState(false);
  const [favoriteKeys, setFavoriteKeys] = useState<Set<string>>(new Set());
  const [favoriteLoadingKey, setFavoriteLoadingKey] = useState<string | null>(null);
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);
  const movieDropdownRef = useRef<HTMLDivElement>(null);
  const tvDropdownRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const { user, logout, isAdmin, isVip } = useAuth();

  useEffect(() => {
    if (!user) {
      setFavoriteKeys(new Set());
      return;
    }

    let active = true;
    void getUserProfile(user.uid).then((profile) => {
      if (!active) return;
      const keys = new Set<string>();
      (profile?.favorites || []).forEach((value) => {
        if (typeof value === "number") {
          keys.add(`legacy:${value}`);
          return;
        }
        const favorite = parseFavorite(value);
        if (favorite) keys.add(favoriteKey(favorite.id, favorite.type));
      });
      setFavoriteKeys(keys);
    }).catch((error) => console.error("Não foi possível carregar os favoritos da busca:", error));

    return () => {
      active = false;
    };
  }, [user]);

  useEffect(() => {
    const handleInstallAvailability = (event: Event) => {
      setCanInstallApp((event as CustomEvent<boolean>).detail);
    };
    window.addEventListener("pwa-install-available", handleInstallAvailability);
    return () => window.removeEventListener("pwa-install-available", handleInstallAvailability);
  }, []);

  const handleInstallApp = () => {
    window.dispatchEvent(new Event("pwa-install-request"));
    setIsMenuOpen(false);
  };

  const toggleMovieDropdown = () => {
    setShowMovieDropdown(!showMovieDropdown);
    setShowTvDropdown(false);
  };

  const toggleTvDropdown = () => {
    setShowTvDropdown(!showTvDropdown);
    setShowMovieDropdown(false);
  };

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const [movieGenresData, tvGenresData] = await Promise.all([
          tmdb.getGenres("movie"),
          tmdb.getGenres("tv")
        ]);
        setMovieGenres(movieGenresData);
        setTvGenres(tvGenresData);

        // Buscar contagens para cada gênero
        const counts: Record<number, number> = {};
        const allGenres = [...movieGenresData, ...tvGenresData];

        for (const genre of allGenres) {
          try {
            // Determinar o tipo baseado no ID do gênero
            const type = movieGenresData.some((g: Genre) => g.id === genre.id) ? 'movie' : 'tv';
            const count = await tmdb.getGenreCount(type, genre.id);
            counts[genre.id] = count;
          } catch (error) {
            console.error(`Error fetching count for genre ${genre.id}:`, error);
            counts[genre.id] = 999;
          }
        }

        setGenreCounts(counts);
      } catch (error) {
        console.error("Error fetching genres:", error);
      }
    };

    fetchGenres();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Don't handle outside clicks when mobile menu is open
      if (isMenuOpen) return;

      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
      if (movieDropdownRef.current && !movieDropdownRef.current.contains(event.target as Node)) {
        setShowMovieDropdown(false);
      }
      if (tvDropdownRef.current && !tvDropdownRef.current.contains(event.target as Node)) {
        setShowTvDropdown(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  useEffect(() => {
    const searchContent = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        setShowResults(false);
        return;
      }

      setIsSearching(true);
      try {
        const results = await tmdb.search(searchQuery);
        setSearchResults(results.filter((item: Movie) => (
          item.media_type === "movie"
          || item.media_type === "tv"
          || (!item.media_type && Boolean(item.title || item.name))
        )).slice(0, 5));
        setShowResults(true);
      } catch (error) {
        console.error("Error searching:", error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(searchContent, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowResults(false);
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleResultClick = (movie: Movie) => {
    setShowResults(false);
    setSearchQuery("");
    const type = movie.media_type || (movie.title ? "movie" : "tv");
    router.push(`/details/${type}/${movie.id}`);
  };

  const toggleSearchFavorite = async (item: Movie, type: FavoriteType) => {
    if (!user) {
      toast.error("Faça login para adicionar aos favoritos");
      return;
    }

    const key = favoriteKey(item.id, type);
    const legacyKey = `legacy:${item.id}`;
    const isFavorite = favoriteKeys.has(key) || favoriteKeys.has(legacyKey);
    setFavoriteLoadingKey(key);
    try {
      if (isFavorite) {
        await removeFromFavorites(user.uid, item.id, type);
        setFavoriteKeys((current) => {
          const next = new Set(current);
          next.delete(key);
          next.delete(legacyKey);
          return next;
        });
        toast.success("Removido dos favoritos");
        window.dispatchEvent(new CustomEvent("favoriteRemoved", {
          detail: { contentId: item.id, type },
        }));
      } else {
        await addToFavorites(user.uid, item.id, type);
        setFavoriteKeys((current) => new Set(current).add(key));
        toast.success("Adicionado aos favoritos");
        window.dispatchEvent(new CustomEvent("favoriteAdded", {
          detail: { contentId: item.id, type },
        }));
        await initializeAchievements(user.uid);
        await updateAchievementProgress(user.uid, "favorite", key);
      }
    } catch (error) {
      console.error("Não foi possível atualizar o favorito pela busca:", error);
      toast.error("Não foi possível atualizar o favorito");
    } finally {
      setFavoriteLoadingKey(null);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setShowUserDropdown(false);
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  // ... inside component ...
  useScrollLock(isMenuOpen);

  return (
    <nav className="fixed top-0 w-full z-[100] bg-black/80 backdrop-blur-xl border-b border-white/10 transition-all duration-300">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="bg-gradient-to-r from-purple-600 to-purple-800 p-2 rounded-lg glow-effect">
              <Film className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold">
              <span className="text-white">Total</span>
              <span className="text-gradient">Flix</span>
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/" className="text-gray-300 hover:text-purple-400 transition-colors flex items-center gap-1.5">
              <Home className="w-4 h-4" />
              Início
            </Link>

            {/* Movies Dropdown */}
            <div
              className="relative"
              ref={movieDropdownRef}
            >
              <button
                onClick={toggleMovieDropdown}
                className="text-gray-300 hover:text-purple-400 transition-colors flex items-center gap-1"
              >
                <Clapperboard className="w-4 h-4" />
                Filmes
                <ChevronDown className={`w-4 h-4 transition-transform ${showMovieDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showMovieDropdown && (
                <div className="absolute top-full mt-2 w-56 bg-black/95 backdrop-blur-xl border border-purple-500/30 rounded-lg overflow-hidden shadow-2xl max-h-96 overflow-y-auto">
                  <Link
                    href="/movies"
                    className="flex items-center gap-2 px-4 py-2 text-white hover:bg-purple-500/20 transition-colors border-b border-purple-500/30 font-medium"
                    onClick={() => setShowMovieDropdown(false)}
                  >
                    <Clapperboard className="w-4 h-4 text-purple-400" /> Todos os Filmes
                  </Link>
                  {movieGenres.map((genre) => (
                    <Link
                      key={genre.id}
                      href={`/genre/${genre.id}?type=movie`}
                      className="flex items-center justify-between px-4 py-2 text-gray-300 hover:bg-purple-500/20 hover:text-white transition-colors"
                      onClick={() => setShowMovieDropdown(false)}
                    >
                      <span className="flex items-center gap-2"><GenreIcon genreId={genre.id} />{genre.name}</span>
                      <span className="text-xs text-gray-500 ml-4">
                        {genreCounts[genre.id] ? genreCounts[genre.id].toLocaleString('pt-BR') : '...'}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* TV Shows Dropdown */}
            <div
              className="relative"
              ref={tvDropdownRef}
            >
              <button
                onClick={toggleTvDropdown}
                className="text-gray-300 hover:text-purple-400 transition-colors flex items-center gap-1"
              >
                <Tv className="w-4 h-4" />
                Séries
                <ChevronDown className={`w-4 h-4 transition-transform ${showTvDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showTvDropdown && (
                <div className="absolute top-full mt-2 w-56 bg-black/95 backdrop-blur-xl border border-purple-500/30 rounded-lg overflow-hidden shadow-2xl max-h-96 overflow-y-auto">
                  <Link
                    href="/series"
                    className="flex items-center gap-2 px-4 py-2 text-white hover:bg-purple-500/20 transition-colors border-b border-purple-500/30 font-medium"
                    onClick={() => setShowTvDropdown(false)}
                  >
                    <Tv className="w-4 h-4 text-purple-400" /> Todas as Séries
                  </Link>
                  <Link
                    href="/genre/10759?type=tv"
                    className="flex items-center justify-between px-4 py-2 text-gray-300 hover:bg-purple-500/20 hover:text-white transition-colors"
                    onClick={() => setShowTvDropdown(false)}
                  >
                    <span className="flex items-center gap-2"><GenreIcon genreId={10759} />Ação &amp; Aventura</span>
                    <span className="text-xs text-gray-500 ml-4">
                      {genreCounts[10759] ? genreCounts[10759].toLocaleString('pt-BR') : '...'}
                    </span>
                  </Link>
                  {tvGenres
                    .filter((genre) => genre.id !== 10759)
                    .map((genre) => (
                      <Link
                        key={genre.id}
                        href={`/genre/${genre.id}?type=tv`}
                        className="flex items-center justify-between px-4 py-2 text-gray-300 hover:bg-purple-500/20 hover:text-white transition-colors"
                        onClick={() => setShowTvDropdown(false)}
                      >
                        <span className="flex items-center gap-2"><GenreIcon genreId={genre.id} />{genre.name}</span>
                        <span className="text-xs text-gray-500 ml-4">
                          {genreCounts[genre.id] ? genreCounts[genre.id].toLocaleString('pt-BR') : '...'}
                        </span>
                      </Link>
                    ))}
                </div>
              )}
            </div>

            <Link href="/tv" className="text-gray-300 hover:text-purple-400 transition-colors flex items-center gap-1">
              <Radio className="w-4 h-4" />
              TV ao Vivo
            </Link>
          </div>

          {/* Search */}
          <div className="hidden md:block" ref={searchRef}>
            <form onSubmit={handleSearch} className="relative">
              <Input
                type="text"
                placeholder="Buscar filmes, séries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchResults.length > 0 && setShowResults(true)}
                className="w-64 pl-10 bg-black/50 border-purple-500/30 focus:border-purple-500"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

              {/* Search Results Dropdown */}
              {showResults && searchResults.length > 0 && (
                <div className="absolute top-full mt-2 w-96 bg-black/95 backdrop-blur-xl border border-purple-500/30 rounded-lg overflow-hidden shadow-2xl">
                  {searchResults.map((item) => {
                    const title = item.title || item.name || "Sem título";
                    const year = item.release_date?.split("-")[0] || item.first_air_date?.split("-")[0];
                    const type = (item.media_type === "movie" || item.media_type === "tv"
                      ? item.media_type
                      : item.title ? "movie" : "tv") as FavoriteType;
                    const key = favoriteKey(item.id, type);
                    const isFavorite = favoriteKeys.has(key) || favoriteKeys.has(`legacy:${item.id}`);

                    return (
                      <div
                        key={key}
                        className="flex w-full items-center gap-2 p-2 transition-colors hover:bg-purple-500/20"
                      >
                        <button
                          type="button"
                          onClick={() => handleResultClick(item)}
                          className="flex min-w-0 flex-1 items-center gap-3 p-1 text-left"
                        >
                          <div className="relative w-12 h-16 flex-shrink-0 rounded overflow-hidden bg-gray-800">
                            {item.poster_path ? (
                              <Image
                                src={getImageUrl(item.poster_path)}
                                alt={title}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Film className="w-6 h-6 text-gray-600" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium truncate">{title}</p>
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                              <span className="capitalize">{type === "movie" ? "Filme" : "Série"}</span>
                              {year && <span>• {year}</span>}
                            </div>
                          </div>
                        </button>
                        {user && (
                          <button
                            type="button"
                            onClick={() => void toggleSearchFavorite(item, type)}
                            disabled={favoriteLoadingKey === key}
                            className={`mr-1 rounded-full border p-2.5 transition hover:scale-105 disabled:opacity-50 ${
                              isFavorite
                                ? "border-red-500/40 bg-red-500/15 text-red-400"
                                : "border-purple-500/30 bg-black/40 text-zinc-300 hover:text-purple-300"
                            }`}
                            aria-label={isFavorite ? `Remover ${title} dos favoritos` : `Adicionar ${title} aos favoritos`}
                            title={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                          >
                            <Heart className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                  {searchQuery.trim() && (
                    <Link
                      href={`/search?q=${encodeURIComponent(searchQuery)}`}
                      className="block w-full p-3 text-center text-purple-400 hover:bg-purple-500/20 transition-colors border-t border-purple-500/30"
                      onClick={() => setShowResults(false)}
                    >
                      Ver todos os resultados
                    </Link>
                  )}
                </div>
              )}
            </form>
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center gap-2">
            {canInstallApp && (
              <Button
                type="button"
                onClick={handleInstallApp}
                variant="ghost"
                className="text-purple-300 hover:text-white hover:bg-purple-500/20"
                aria-label="Instalar aplicativo"
                title="Instalar aplicativo"
              >
                <Download className="w-4 h-4 xl:mr-2" />
                <span className="hidden xl:inline">Instalar</span>
              </Button>
            )}
            {user && <NotificationsDropdown />}

            <div className="relative" ref={userDropdownRef}>
              {user ? (
                <>
                  <Button
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                    variant="ghost"
                    size="icon"
                    className="rounded-full hover:bg-purple-500/20 transition-all overflow-hidden p-0"
                  >
                    {user.photoURL && user.photoURL.trim() !== '' ? (
                      <div className="relative w-8 h-8 rounded-full">
                        <div className="h-full w-full overflow-hidden rounded-full">
                        <Image
                          src={user.photoURL}
                          alt="Avatar"
                          width={32}
                          height={32}
                          className="rounded-full object-cover"
                          unoptimized={!user.photoURL.includes('googleusercontent.com') && !user.photoURL.includes('firebasestorage.googleapis.com')}
                          onError={(e) => {
                            // Fallback para o ícone se a imagem falhar
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        </div>
                        {isVip && (
                          <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full border border-black bg-amber-400">
                            <Crown className="h-2.5 w-2.5 text-black" />
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-purple-800 flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </Button>

                  {showUserDropdown && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-black/95 backdrop-blur-xl border border-purple-500/30 rounded-lg overflow-hidden shadow-2xl">
                      <div className="px-4 py-3 border-b border-purple-500/30">
                        <p className="text-sm text-gray-400">Conectado como</p>
                        <div className="mt-0.5 flex items-center gap-2">
                          <p className="text-white font-medium truncate">{user.displayName || user.email}</p>
                          {isVip && (
                            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                              <Crown className="h-3 w-3" /> VIP
                            </span>
                          )}
                        </div>
                        {user.displayName && <p className="truncate text-xs text-gray-500">{user.email}</p>}
                      </div>
                      {isAdmin && (
                        <a
                          href="/admin"
                          className="w-full flex items-center gap-2 px-4 py-3 text-purple-300 hover:bg-purple-500/20 hover:text-purple-200 transition-colors"
                          onClick={() => setShowUserDropdown(false)}
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          Painel administrativo
                        </a>
                      )}
                      <Link
                        href="/profile"
                        className="w-full flex items-center gap-2 px-4 py-3 text-gray-300 hover:bg-purple-500/20 hover:text-white transition-colors"
                        onClick={() => setShowUserDropdown(false)}
                      >
                        <User className="w-4 h-4" />
                        Meu Perfil
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-3 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sair
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/login">
                    <Button
                      variant="ghost"
                      className="text-gray-300 hover:text-white hover:bg-purple-500/20 transition-all"
                    >
                      <LogIn className="w-4 h-4 mr-1" />
                      Entrar
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button
                      className="glow-effect transition-all active:scale-95"
                    >
                      <UserPlus className="w-4 h-4 mr-1" />
                      Cadastrar
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="fixed top-16 left-0 right-0 bottom-0 z-50 bg-black/95 backdrop-blur-xl overflow-y-auto px-4 pb-8 md:hidden h-[calc(100dvh-4rem)] animate-in fade-in">
            <div className="py-4 space-y-4">
              <form onSubmit={handleSearch} className="relative mb-4">
                <Input
                  type="text"
                  placeholder="Buscar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 bg-black/50 border-purple-500/30"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </form>
              <Link
                href="/"
                className="flex items-center gap-2 text-gray-300 hover:text-purple-400 transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                <Home className="w-4 h-4 text-purple-400" /> Início
              </Link>

              {/* Mobile Movies Dropdown */}
              <div className="space-y-2">
                <button
                  onClick={toggleMovieDropdown}
                  className="w-full flex items-center justify-between text-gray-300 hover:text-purple-400 transition-colors py-2"
                >
                  <span className="flex items-center gap-2"><Clapperboard className="w-4 h-4 text-purple-400" />Filmes</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showMovieDropdown ? 'rotate-180' : ''}`} />
                </button>
                {showMovieDropdown && (
                  <div className="pl-4 space-y-2 overflow-hidden origin-top animate-in fade-in slide-in-from-top-2 duration-200">
                    <Link
                      href="/movies"
                      className="flex items-center gap-2 text-white hover:text-purple-400 transition-colors py-2 font-medium"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Clapperboard className="w-4 h-4 text-purple-400" /> Todos os Filmes
                    </Link>
                    {movieGenres.map((genre) => (
                      <Link
                        key={genre.id}
                        href={`/genre/${genre.id}?type=movie`}
                        className="flex items-center justify-between text-gray-300 hover:text-purple-400 transition-colors py-2"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <span className="flex items-center gap-2"><GenreIcon genreId={genre.id} />{genre.name}</span>
                        <span className="text-xs text-gray-500">
                          {genreCounts[genre.id] ? genreCounts[genre.id].toLocaleString('pt-BR') : '...'}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Mobile TV Shows Dropdown */}
              <div className="space-y-2">
                <button
                  onClick={toggleTvDropdown}
                  className="w-full flex items-center justify-between text-gray-300 hover:text-purple-400 transition-colors py-2"
                >
                  <span className="flex items-center gap-2"><Tv className="w-4 h-4 text-purple-400" />Séries</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showTvDropdown ? 'rotate-180' : ''}`} />
                </button>
                {showTvDropdown && (
                  <div className="pl-4 space-y-2 overflow-hidden origin-top animate-in fade-in slide-in-from-top-2 duration-200">
                    <Link
                      href="/series"
                      className="flex items-center gap-2 text-white hover:text-purple-400 transition-colors py-2 font-medium"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Tv className="w-4 h-4 text-purple-400" /> Todas as Séries
                    </Link>
                    <Link
                      href="/genre/10759?type=tv"
                      className="flex items-center justify-between text-gray-300 hover:text-purple-400 transition-colors py-2"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span className="flex items-center gap-2"><GenreIcon genreId={10759} />Ação &amp; Aventura</span>
                      <span className="text-xs text-gray-500">
                        {genreCounts[10759] ? genreCounts[10759].toLocaleString('pt-BR') : '...'}
                      </span>
                    </Link>
                    {tvGenres
                      .filter((genre) => genre.id !== 10759)
                      .map((genre) => (
                        <Link
                          key={genre.id}
                          href={`/genre/${genre.id}?type=tv`}
                          className="flex items-center justify-between text-gray-300 hover:text-purple-400 transition-colors py-2"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <span className="flex items-center gap-2"><GenreIcon genreId={genre.id} />{genre.name}</span>
                          <span className="text-xs text-gray-500">
                            {genreCounts[genre.id] ? genreCounts[genre.id].toLocaleString('pt-BR') : '...'}
                          </span>
                        </Link>
                      ))}
                  </div>
                )}
              </div>

              <Link
                href="/tv"
                className="flex items-center gap-2 text-gray-300 hover:text-purple-400 transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                <Radio className="w-4 h-4" />
                TV ao Vivo
              </Link>

              {canInstallApp && (
                <button
                  type="button"
                  onClick={handleInstallApp}
                  className="flex w-full items-center gap-2 rounded-lg bg-purple-600/20 px-3 py-3 font-semibold text-purple-300 transition-colors hover:bg-purple-600/30 hover:text-white"
                >
                  <Download className="w-4 h-4" />
                  Instalar aplicativo
                </button>
              )}

              {user ? (
                <>
                  {isAdmin && (
                    <a
                      href="/admin"
                      className="flex items-center gap-2 text-purple-300 hover:text-purple-200 transition-colors py-2"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <LayoutDashboard className="w-4 h-4" /> Painel administrativo
                    </a>
                  )}
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 text-gray-300 hover:text-purple-400 transition-colors py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User className="w-4 h-4 text-purple-400" /> Meu Perfil
                    {isVip && (
                      <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                        <Crown className="h-3 w-3" /> VIP
                      </span>
                    )}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors py-2 w-full"
                  >
                    <LogOut className="w-4 h-4" />
                    Sair
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                    <Button
                      variant="ghost"
                      className="w-full text-gray-300 hover:text-white hover:bg-purple-500/20"
                    >
                      <LogIn className="w-4 h-4 mr-1" />
                      Entrar
                    </Button>
                  </Link>
                  <Link href="/register" onClick={() => setIsMenuOpen(false)}>
                    <Button
                      className="w-full glow-effect"
                    >
                      <UserPlus className="w-4 h-4 mr-1" />
                      Cadastrar
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
