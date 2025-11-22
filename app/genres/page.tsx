import { tmdb } from "@/lib/tmdb";
import Link from "next/link";

const genres = [
  { id: 28, name: "Ação", emoji: "💥" },
  { id: 12, name: "Aventura", emoji: "🗺️" },
  { id: 16, name: "Animação", emoji: "🎨" },
  { id: 35, name: "Comédia", emoji: "😂" },
  { id: 80, name: "Crime", emoji: "🔪" },
  { id: 99, name: "Documentário", emoji: "📹" },
  { id: 18, name: "Drama", emoji: "🎭" },
  { id: 10751, name: "Família", emoji: "👨‍👩‍👧‍👦" },
  { id: 14, name: "Fantasia", emoji: "🧙" },
  { id: 36, name: "História", emoji: "📜" },
  { id: 27, name: "Terror", emoji: "👻" },
  { id: 10402, name: "Música", emoji: "🎵" },
  { id: 9648, name: "Mistério", emoji: "🔍" },
  { id: 10749, name: "Romance", emoji: "💕" },
  { id: 878, name: "Ficção Científica", emoji: "🚀" },
  { id: 10770, name: "Cinema TV", emoji: "📺" },
  { id: 53, name: "Thriller", emoji: "😱" },
  { id: 10752, name: "Guerra", emoji: "⚔️" },
  { id: 37, name: "Faroeste", emoji: "🤠" },
];

export default function GenresPage() {
  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gradient mb-2">🎭 Gêneros</h1>
          <p className="text-gray-400">Explore conteúdo por categoria</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {genres.map((genre) => (
            <Link
              key={genre.id}
              href={`/genre/${genre.id}`}
              className="group relative overflow-hidden rounded-lg glass-effect border-purple-500/30 hover:border-purple-500 transition-all duration-300 hover:scale-105 p-8"
            >
              <div className="flex flex-col items-center space-y-3">
                <span className="text-5xl">{genre.emoji}</span>
                <h3 className="text-xl font-semibold text-white text-center">
                  {genre.name}
                </h3>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-purple-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
