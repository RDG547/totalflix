import { tmdb, getBackdropUrl, getImageUrl, type MovieDetails } from "@/lib/tmdb";
import Image from "next/image";
import { Star, Calendar, Clock } from "lucide-react";
import { MovieCard } from "@/components/MovieCard";
import { WatchButton } from "@/components/WatchButton";
import { SeasonEpisodeSelector } from "@/components/SeasonEpisodeSelector";
import { CommentsSection } from "@/components/CommentsSection";
import { HistoryTracker } from "@/components/HistoryTracker";
import { TrailerButton } from "@/components/TrailerButton";
import { notFound } from "next/navigation";

interface PageProps {
  params: {
    type: string;
    id: string;
  };
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
      <div className="relative h-[60vh] w-full">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${getBackdropUrl(details.backdrop_path)})`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
        </div>

        <div className="relative h-full container mx-auto px-4 flex items-end pb-12">
          <div className="flex flex-col md:flex-row gap-8 items-end">
            {/* Poster */}
            <div className="relative w-48 h-72 flex-shrink-0 rounded-lg overflow-hidden shadow-2xl glow-effect">
              <Image
                src={getImageUrl(details.poster_path)}
                alt={title}
                fill
                className="object-cover"
              />
            </div>

            {/* Info */}
            <div className="space-y-4 pb-4">
              <h1 className="text-4xl md:text-6xl font-bold text-white drop-shadow-2xl">
                {title}
              </h1>

              {details.tagline && (
                <p className="text-xl text-purple-300 italic">
                  "{details.tagline}"
                </p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center space-x-2 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="text-white font-semibold">
                    {details.vote_average?.toFixed(1)}
                  </span>
                </div>

                {year && (
                  <div className="flex items-center space-x-2 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full">
                    <Calendar className="w-4 h-4 text-purple-400" />
                    <span className="text-white">{year}</span>
                  </div>
                )}

                {runtime && (
                  <div className="flex items-center space-x-2 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full">
                    <Clock className="w-4 h-4 text-purple-400" />
                    <span className="text-white">{runtime} min</span>
                  </div>
                )}

                {seasons && (
                  <div className="bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full">
                    <span className="text-white">{seasons} Temporadas</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {details.genres?.map((genre) => (
                  <span
                    key={genre.id}
                    className="px-3 py-1 bg-purple-600/30 border border-purple-500/50 rounded-full text-sm text-purple-200"
                  >
                    {genre.name}
                  </span>
                ))}
              </div>

              {/* Botões de Ação */}
              <div className="pt-2 flex flex-wrap gap-3">
                <WatchButton
                  type={type}
                  tmdbId={details.id}
                  title={title}
                  numberOfSeasons={details.number_of_seasons}
                />
                <TrailerButton mediaType={type} id={details.id} />
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
        <section>
          <h2 className="text-2xl font-bold text-white mb-6">Títulos Similares</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {/* @ts-ignore */}
            {details.similar?.results?.slice(0, 6).map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
