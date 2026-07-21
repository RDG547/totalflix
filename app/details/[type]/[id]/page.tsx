import { tmdb, getBackdropUrl, getImageUrl, type MovieDetails, type Movie } from "@/lib/tmdb";
import Image from "next/image";
import { Star, Calendar, Clock } from "lucide-react";
import { MovieCard } from "@/components/MovieCard";
import { WatchButton } from "@/components/WatchButton";
import { SeasonEpisodeSelector } from "@/components/SeasonEpisodeSelector";
import { CommentsSection } from "@/components/CommentsSection";
import { HistoryTracker } from "@/components/HistoryTracker";
import { TrailerButton } from "@/components/TrailerButton";
import { FavoriteButton } from "@/components/FavoriteButton";
import { notFound } from "next/navigation";

interface PageProps {
  params: {
    type: string;
    id: string;
  };
}

// Componente separado para buscar detalhes dos títulos similares
async function SimilarContentSection({ type, similar }: { type: "movie" | "tv"; similar: Movie[] }) {
  if (!similar || similar.length === 0) return null;

  // Buscar detalhes para cada título similar (incluindo runtime)
  const similarWithDetails = await Promise.all(
    similar.map(async (item) => {
      try {
        const details = await tmdb.getDetails(type, item.id);
        return {
          ...item,
          runtime: details.runtime,
          number_of_seasons: details.number_of_seasons,
        };
      } catch (error) {
        // Se falhar, retorna o item sem os detalhes extras
        return item;
      }
    })
  );

  return (
    <section>
      <h2 className="text-2xl font-bold text-white mb-6">Títulos Similares</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {similarWithDetails.map((movie) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>
    </section>
  );
}

export default async function DetailsPage({ params }: PageProps) {
  const { type, id } = params;

  if (type !== "movie" && type !== "tv") {
    notFound();
  }

  let details: MovieDetails;

  try {
    details = await tmdb.getDetails(type, parseInt(id));
  } catch (error) {
    console.error("Error fetching details:", error);
    notFound();
  }

  const title = details.title || details.name || "";
  const year = details.release_date?.split("-")[0] || details.first_air_date?.split("-")[0];
  const runtime = type === "movie" ? details.runtime : null;
  const seasons = type === "tv" ? details.number_of_seasons : null;

  return (
    <div className="min-h-screen pt-16">
      {/* Tracker de histórico */}
      <HistoryTracker contentId={details.id} type={type} />

      {/* Hero Section */}
      <div className="relative min-h-[500px] sm:min-h-[520px] md:h-[60vh] md:min-h-[460px] w-full pt-6 pb-8 md:py-12">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${getBackdropUrl(details.backdrop_path)})`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
        </div>

        <div className="relative h-full container mx-auto px-4 flex items-end">
          <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-end w-full text-center md:text-left">
            {/* Poster */}
            <div className="relative w-36 h-52 sm:w-44 sm:h-64 md:w-48 md:h-72 shrink-0 rounded-lg overflow-hidden shadow-2xl glow-effect mx-auto md:mx-0">
              <Image
                src={getImageUrl(details.poster_path)}
                alt={title}
                fill
                className="object-cover"
              />
            </div>

            {/* Info */}
            <div className="space-y-3 sm:space-y-4 pb-2 md:pb-4 w-full">
              <h1 className="text-2xl sm:text-4xl md:text-6xl font-bold text-white drop-shadow-2xl">
                {title}
              </h1>

              {details.tagline && (
                <p className="text-base sm:text-xl text-purple-300 italic">
                  &quot;{details.tagline}&quot;
                </p>
              )}

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 sm:gap-4 text-xs sm:text-sm">
                <div className="flex items-center space-x-2 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="text-white font-semibold">
                    {details.vote_average?.toFixed(1)}
                  </span>
                </div>

                {year && (
                  <div className="flex items-center space-x-2 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10">
                    <Calendar className="w-4 h-4 text-purple-400" />
                    <span className="text-white">{year}</span>
                  </div>
                )}

                {runtime && (
                  <div className="flex items-center space-x-2 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10">
                    <Clock className="w-4 h-4 text-purple-400" />
                    <span className="text-white">{runtime} min</span>
                  </div>
                )}

                {seasons && (
                  <div className="bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10">
                    <span className="text-white">{seasons} Temporadas</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                {details.genres?.map((genre) => (
                  <span
                    key={genre.id}
                    className="px-3 py-1 bg-purple-600/30 border border-purple-500/50 rounded-full text-xs sm:text-sm text-purple-200"
                  >
                    {genre.name}
                  </span>
                ))}
              </div>

              {/* Botões de Ação */}
              <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3">
                <WatchButton
                  type={type}
                  tmdbId={details.id}
                  title={title}
                  numberOfSeasons={details.number_of_seasons}
                  posterPath={details.poster_path}
                />
                <TrailerButton mediaType={type} id={details.id} />
                <FavoriteButton
                  contentId={details.id}
                  contentTitle={title}
                  size="lg"
                  showText={false}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl">
          <h2 className="text-2xl font-bold text-white mb-4">Sinopse</h2>
          <p className="text-gray-300 leading-relaxed">
            {details.overview || "Sem sinopse disponível."}
          </p>

          <SeasonEpisodeSelector
            type={type}
            tmdbId={details.id}
            title={title}
            numberOfSeasons={details.number_of_seasons}
            posterPath={details.poster_path}
          />
        </div>
      </div>

      {/* Content Section */}
      <div className="container mx-auto px-4 py-12 space-y-12">
        {/* Comments Section */}
        <section className="max-w-4xl">
          <CommentsSection
            contentId={details.id}
            contentType={type}
          />
        </section>

        {/* Similar Content */}
        <SimilarContentSection type={type} similar={details.similar?.results?.slice(0, 6) || []} />
      </div>
    </div>
  );
}
