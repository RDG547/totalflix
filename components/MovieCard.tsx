"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { getImageUrl, type Movie } from "@/lib/tmdb";
import { Card } from "@/components/ui/card";
import { Star, Heart, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { addToFavorites, removeFromFavorites, getUserProfile } from "@/lib/userProfile";
import { updateAchievementProgress, initializeAchievements } from "@/lib/achievements";
import toast from "react-hot-toast";

interface MovieCardProps {
  movie: Movie & { runtime?: number };
}

export function MovieCard({ movie }: MovieCardProps) {
  const { user } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const title = movie.title || movie.name || "";
  const mediaType = movie.media_type || (movie.title ? "movie" : "tv");
  const year = movie.release_date?.split("-")[0] || movie.first_air_date?.split("-")[0];

  // Formatar duração
  const formatRuntime = (minutes?: number) => {
    if (!minutes) return null;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  };

  useEffect(() => {
    if (user) {
      checkFavoriteStatus();
    }
  }, [user, movie.id]);

  const checkFavoriteStatus = async () => {
    if (!user) return;

    try {
      const profile = await getUserProfile(user.uid);
      if (profile) {
        setIsFavorite(profile.favorites.includes(movie.id));
      }
    } catch (error) {
      console.error("Erro ao verificar favorito:", error);
    }
  };

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user || isLoading) return;

    setIsLoading(true);
    try {
      if (isFavorite) {
        await removeFromFavorites(user.uid, movie.id);
        setIsFavorite(false);
        toast.success("Removido dos favoritos");

        // Disparar evento customizado para atualizar outras páginas
        window.dispatchEvent(new CustomEvent('favoriteRemoved', {
          detail: { movieId: movie.id }
        }));
      } else {
        await addToFavorites(user.uid, movie.id);
        setIsFavorite(true);
        toast.success("Adicionado aos favoritos");

        // Disparar evento customizado para atualizar outras páginas
        window.dispatchEvent(new CustomEvent('favoriteAdded', {
          detail: { movieId: movie.id }
        }));

        // Atualizar conquistas de favoritos (sem bloquear a UI)
        initializeAchievements(user.uid)
          .then(() => updateAchievementProgress(user.uid, 'favorite'))
          .catch((err) => console.error("Erro ao atualizar conquistas:", err));
      }
    } catch (error) {
      console.error("Erro ao atualizar favorito:", error);
      // Reverter estado em caso de erro
      setIsFavorite(!isFavorite);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Link href={`/details/${mediaType}/${movie.id}`}>
      <Card className="group relative overflow-hidden bg-transparent border-0 cursor-pointer transition-all duration-300 hover:scale-105 active:scale-100">
        <div className="relative aspect-[2/3] overflow-hidden rounded-lg">
          <Image
            src={getImageUrl(movie.poster_path)}
            alt={title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-110"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />

          {/* Overlay on Hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
              <h3 className="text-white font-semibold line-clamp-2 text-sm">
                {title}
              </h3>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-gray-300">{year}</span>
                  {movie.runtime && (
                    <>
                      <span className="text-gray-500">•</span>
                      <div className="flex items-center gap-1 text-purple-400">
                        <Clock className="w-3 h-3" />
                        <span>{formatRuntime(movie.runtime)}</span>
                      </div>
                    </>
                  )}
                </div>
                <div className="flex items-center space-x-1 text-yellow-400">
                  <Star className="w-3 h-3 fill-current" />
                  <span>{movie.vote_average?.toFixed(1)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Media Type Tag */}
          <div className={`absolute top-2 left-2 backdrop-blur-sm px-3 py-1.5 rounded-full ${
            mediaType === "movie"
              ? "bg-blue-500/90 shadow-lg shadow-blue-500/50"
              : "bg-purple-500/90 shadow-lg shadow-purple-500/50"
          }`}>
            <span className="text-white text-xs font-bold uppercase tracking-wide">
              {mediaType === "movie" ? "Filme" : "Série"}
            </span>
          </div>

          {/* Favorite Button */}
          {user && (
            <button
              onClick={toggleFavorite}
              disabled={isLoading}
              className="absolute top-2 right-2 bg-black/80 backdrop-blur-sm p-2 rounded-full transition-all hover:scale-110 active:scale-95 disabled:opacity-50"
              aria-label={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
            >
              <Heart
                className={`w-4 h-4 transition-colors ${
                  isFavorite ? "text-red-500 fill-red-500" : "text-white"
                }`}
              />
            </button>
          )}
        </div>
      </Card>
    </Link>
  );
}
