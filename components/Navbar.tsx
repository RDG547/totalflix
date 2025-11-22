"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { Search, Menu, X, Film, ChevronDown, Radio, User, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { tmdb, type Movie, getImageUrl } from "@/lib/tmdb";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { AuthModal } from "@/components/AuthModal";
import { NotificationsDropdown } from "@/components/NotificationsDropdown";

interface Genre {
  id: number;
  name: string;
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
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [genreCounts, setGenreCounts] = useState<Record<number, number>>({});
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);
  const movieDropdownRef = useRef<HTMLDivElement>(null);
  const tvDropdownRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();

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
  }, []);

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
        setSearchResults(results.slice(0, 5));
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

  const handleLogout = async () => {
    try {
      await logout();
      setShowUserDropdown(false);
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <nav className="fixed top-0 w-full z-50 glass-effect">
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
            <Link href="/" className="text-gray-300 hover:text-purple-400 transition-colors">
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
                Filmes
                <ChevronDown className={`w-4 h-4 transition-transform ${showMovieDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showMovieDropdown && (
                <div className="absolute top-full mt-2 w-56 bg-black/95 backdrop-blur-xl border border-purple-500/30 rounded-lg overflow-hidden shadow-2xl max-h-96 overflow-y-auto">
                  <Link
                    href="/movies"
                    className="block px-4 py-2 text-white hover:bg-purple-500/20 transition-colors border-b border-purple-500/30 font-medium"
                    onClick={() => setShowMovieDropdown(false)}
                  >
                    Todos os Filmes
                  </Link>
                  {movieGenres.map((genre) => (
                    <Link
                      key={genre.id}
                      href={`/genre/${genre.id}?type=movie`}
                      className="flex items-center justify-between px-4 py-2 text-gray-300 hover:bg-purple-500/20 hover:text-white transition-colors"
                      onClick={() => setShowMovieDropdown(false)}
                    >
                      <span>{genre.name}</span>
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
                Séries
                <ChevronDown className={`w-4 h-4 transition-transform ${showTvDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showTvDropdown && (
                <div className="absolute top-full mt-2 w-56 bg-black/95 backdrop-blur-xl border border-purple-500/30 rounded-lg overflow-hidden shadow-2xl max-h-96 overflow-y-auto">
                  <Link
                    href="/series"
                    className="block px-4 py-2 text-white hover:bg-purple-500/20 transition-colors border-b border-purple-500/30 font-medium"
                    onClick={() => setShowTvDropdown(false)}
                  >
                    Todas as Séries
                  </Link>
                  <Link
                    href="/genre/10759?type=tv"
                    className="flex items-center justify-between px-4 py-2 text-gray-300 hover:bg-purple-500/20 hover:text-white transition-colors"
                    onClick={() => setShowTvDropdown(false)}
                  >
                    <span>Ação & Aventura</span>
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
                        <span>{genre.name}</span>
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
                    const type = item.media_type || (item.title ? "movie" : "tv");

                    return (
                      <button
                        key={item.id}
                        onClick={() => handleResultClick(item)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-purple-500/20 transition-colors text-left"
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
            {user && <NotificationsDropdown />}

            <div className="relative" ref={userDropdownRef}>
              {user ? (
                <>
                  <Button
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                    variant="ghost"
                    size="icon"
                    className="rounded-full hover:bg-purple-500/20 transition-all overflow-hidden"
                  >
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt="Avatar"
                        className="w-8 h-8 rounded-full object-cover"
                      />
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
                      <p className="text-white font-medium truncate">{user.email}</p>
                    </div>
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
                <Button
                  onClick={() => {
                    setAuthModalMode('login');
                    setShowAuthModal(true);
                  }}
                  variant="ghost"
                  className="text-gray-300 hover:text-white hover:bg-purple-500/20 transition-all"
                >
                  Entrar
                </Button>
                <Button
                  onClick={() => {
                    setAuthModalMode('register');
                    setShowAuthModal(true);
                  }}
                  className="glow-effect transition-all active:scale-95"
                >
                  Cadastrar
                </Button>
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
          <div className="md:hidden py-4 space-y-4 animate-slide-in">
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
              className="block text-gray-300 hover:text-purple-400 transition-colors py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Início
            </Link>
            <Link
              href="/movies"
              className="block text-gray-300 hover:text-purple-400 transition-colors py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Filmes
            </Link>
            <Link
              href="/series"
              className="block text-gray-300 hover:text-purple-400 transition-colors py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Séries
            </Link>
            <Link
              href="/tv"
              className="flex items-center gap-2 text-gray-300 hover:text-purple-400 transition-colors py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              <Radio className="w-4 h-4" />
              TV ao Vivo
            </Link>

            {user ? (
              <>
                <Link
                  href="/profile"
                  className="block text-gray-300 hover:text-purple-400 transition-colors py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Meu Perfil
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
                <Button
                  onClick={() => {
                    setAuthModalMode('login');
                    setShowAuthModal(true);
                    setIsMenuOpen(false);
                  }}
                  variant="ghost"
                  className="w-full text-gray-300 hover:text-white hover:bg-purple-500/20"
                >
                  Entrar
                </Button>
                <Button
                  onClick={() => {
                    setAuthModalMode('register');
                    setShowAuthModal(true);
                    setIsMenuOpen(false);
                  }}
                  className="w-full glow-effect"
                >
                  Cadastrar
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authModalMode}
      />
    </nav>
  );
}
