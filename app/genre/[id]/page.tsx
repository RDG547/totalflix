import { tmdb } from "@/lib/tmdb";
import { MovieCard } from "@/components/MovieCard";
import { Film, Tv, TrendingUp, Calendar } from "lucide-react";
import { GenrePagination } from "@/components/GenrePagination";

interface PageProps {
  params: {
    id: string;
  };
  searchParams: {
    type?: string;
    page?: string;
  };
}

const genreNames: { [key: string]: string } = {
  "28": "Ação",
  "12": "Aventura",
  "16": "Animação",
  "35": "Comédia",
  "80": "Crime",
  "99": "Documentário",
  "18": "Drama",
  "10751": "Família",
  "14": "Fantasia",
  "36": "História",
  "27": "Terror",
  "10402": "Música",
  "9648": "Mistério",
  "10749": "Romance",
  "878": "Ficção Científica",
  "10770": "Cinema TV",
  "53": "Thriller",
  "10752": "Guerra",
  "37": "Faroeste",
  "10759": "Ação",
  "10759-adventure": "Aventura",
  "10762": "Kids",
  "10763": "News",
  "10764": "Reality",
  "10765": "Sci-Fi & Fantasy",
  "10766": "Soap",
  "10767": "Talk",
  "10768": "War & Politics",
};

const genreDescriptions: { [key: string]: string } = {
  "28": "Explosões, perseguições e adrenalina pura",
  "12": "Jornadas épicas e descobertas emocionantes",
  "16": "Mundos animados cheios de imaginação",
  "35": "Risadas garantidas do início ao fim",
  "80": "Mistérios criminais e investigações intensas",
  "99": "Histórias reais que vão mudar sua perspectiva",
  "18": "Emoções profundas e histórias tocantes",
  "10751": "Diversão para toda a família",
  "14": "Magia, fantasia e mundos imaginários",
  "36": "Reviva grandes momentos da história",
  "27": "Prepare-se para sustos e suspense",
  "10402": "Ritmo, melodias e performances incríveis",
  "9648": "Enigmas intrigantes esperando para serem resolvidos",
  "10749": "Histórias de amor que vão aquecer seu coração",
  "878": "Futurismo, tecnologia e universos distantes",
  "53": "Tensão e reviravoltas de tirar o fôlego",
  "10752": "Conflitos épicos e batalhas históricas",
  "37": "Cowboys, duelos e o velho oeste",
  "10759": "Séries repletas de ação e perseguições eletrizantes",
  "10759-adventure": "Aventuras épicas e jornadas inesquecíveis",
  "10762": "Conteúdo divertido e educativo para crianças",
  "10763": "Notícias e informação em tempo real",
  "10764": "Reality shows e competições empolgantes",
  "10765": "Ficção científica e fantasia para expandir sua mente",
  "10766": "Novelas e dramas envolventes",
  "10767": "Programas de entrevistas e conversas inspiradoras",
  "10768": "Política, guerra e conflitos que mudaram o mundo",
};

export default async function GenrePage({ params, searchParams }: PageProps) {
  // Tratar Aventura separadamente (10759-adventure)
  const isAdventure = params.id === "10759-adventure";
  const genreId = isAdventure ? 10759 : parseInt(params.id);
  const genreName = genreNames[params.id] || "Gênero";
  const genreDescription = genreDescriptions[params.id] || `Explore o melhor do gênero ${genreName}`;
  const type = searchParams.type || "both";
  const currentPage = parseInt(searchParams.page || "1");

  const movieData = type === "tv" ? { results: [], total_pages: 0, total_results: 0, page: 1 } : await tmdb.getByGenre("movie", genreId, currentPage);
  const seriesData = type === "movie" ? { results: [], total_pages: 0, total_results: 0, page: 1 } : await tmdb.getByGenre("tv", genreId, currentPage);

  const movies = movieData.results;
  const series = seriesData.results;

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4 space-y-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl p-8 md:p-12 glass-effect border border-purple-500/30">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-transparent" />
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-600 rounded-lg glow-effect">
                {type === "movie" ? <Film className="w-6 h-6" /> : type === "tv" ? <Tv className="w-6 h-6" /> : <TrendingUp className="w-6 h-6" />}
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-gradient">{genreName}</h1>
            </div>
            <p className="text-lg text-gray-300 max-w-2xl">{genreDescription}</p>
            <div className="flex items-center gap-6 text-sm text-gray-400">
              {type !== "tv" && movieData.total_results > 0 && (
                <div className="flex items-center gap-2">
                  <Film className="w-4 h-4 text-purple-400" />
                  <span>{movieData.total_results.toLocaleString('pt-BR')} filmes</span>
                </div>
              )}
              {type !== "movie" && seriesData.total_results > 0 && (
                <div className="flex items-center gap-2">
                  <Tv className="w-4 h-4 text-purple-400" />
                  <span>{seriesData.total_results.toLocaleString('pt-BR')} séries</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-400" />
                <span>Atualizado diariamente</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          <a
            href={`/genre/${params.id}`}
            className={`px-4 py-2 rounded-lg transition-all active:scale-95 ${
              type === "both"
                ? "bg-purple-600 text-white shadow-lg shadow-purple-500/50"
                : "bg-black/60 text-gray-300 border border-purple-500/30 hover:bg-purple-500/20"
            }`}
          >
            Todos
          </a>
          <a
            href={`/genre/${params.id}?type=movie`}
            className={`px-4 py-2 rounded-lg transition-all active:scale-95 ${
              type === "movie"
                ? "bg-purple-600 text-white shadow-lg shadow-purple-500/50"
                : "bg-black/60 text-gray-300 border border-purple-500/30 hover:bg-purple-500/20"
            }`}
          >
            <Film className="w-4 h-4 inline mr-2" />
            Filmes
          </a>
          <a
            href={`/genre/${params.id}?type=tv`}
            className={`px-4 py-2 rounded-lg transition-all active:scale-95 ${
              type === "tv"
                ? "bg-purple-600 text-white shadow-lg shadow-purple-500/50"
                : "bg-black/60 text-gray-300 border border-purple-500/30 hover:bg-purple-500/20"
            }`}
          >
            <Tv className="w-4 h-4 inline mr-2" />
            Séries
          </a>
        </div>

        {/* Movies Section */}
        {type !== "tv" && movies.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Film className="w-6 h-6 text-purple-400" />
              Filmes de {genreName}
            </h2>
            <GenrePagination
              initialMovies={movies}
              initialSeries={[]}
              genreId={genreId}
              type="movie"
              initialMoviePage={movieData.page}
              initialSeriesPage={1}
              totalMoviePages={movieData.total_pages}
              totalSeriesPages={0}
            />
          </section>
        )}

        {/* Series Section */}
        {type !== "movie" && series.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Tv className="w-6 h-6 text-purple-400" />
              Séries de {genreName}
            </h2>
            <GenrePagination
              initialMovies={[]}
              initialSeries={series}
              genreId={genreId}
              type="tv"
              initialMoviePage={1}
              initialSeriesPage={seriesData.page}
              totalMoviePages={0}
              totalSeriesPages={seriesData.total_pages}
            />
          </section>
        )}

        {/* Empty State */}
        {((type === "movie" && movies.length === 0) || (type === "tv" && series.length === 0)) && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">Nenhum conteúdo encontrado nesta categoria.</p>
          </div>
        )}
      </div>
    </div>
  );
}
