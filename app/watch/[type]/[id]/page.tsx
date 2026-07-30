"use client";

import { useEffect, useState } from "react";
import { tmdb, getPlayerUrl, getImageUrl, type MovieDetails } from "@/lib/tmdb";
import { useRouter } from "next/navigation";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LinkGate } from "@/components/LinkGate";
import { buildMovieGateKey, buildSeriesGateKey } from "@/lib/linkGate";
import { ConsumptionTracker } from "@/components/ConsumptionTracker";

interface PageProps {
  params: {
    type: string;
    id: string;
  };
}

type PlayerType = 'vidsrcsbs' | 'vidsrcEmbedRu' | 'vidsrcEmbedSu' | 'vidsrcTo' | 'vidapi' | 'megaembed' | 'superflixapi' | '2embed' | 'superembed' | 'embedmovies' | 'warezcdn' | 'primevicio';

export default function WatchPage({ params }: PageProps) {
  const { type, id } = params;
  const router = useRouter();
  const [details, setDetails] = useState<MovieDetails | null>(null);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPlayer, setCurrentPlayer] = useState<PlayerType>('vidsrcsbs');
  const [playerError, setPlayerError] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const data = await tmdb.getDetails(type as "movie" | "tv", parseInt(id));
        setDetails(data);
      } catch (error) {
        console.error("Error fetching details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetails();
  }, [type, id]);

  if (isLoading) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <div className="text-white text-xl">Conteúdo não encontrado</div>
      </div>
    );
  }

  const title = details.title || details.name || "";
  const embedUrl = getPlayerUrl(
    currentPlayer,
    type as "movie" | "tv",
    parseInt(id),
    type === "tv" ? selectedSeason : undefined,
    type === "tv" ? selectedEpisode : undefined
  );

  const handlePlayerChange = (player: PlayerType) => {
    setCurrentPlayer(player);
    setPlayerError(false);
  };

  const gateKey = type === "movie"
    ? buildMovieGateKey(parseInt(id))
    : buildSeriesGateKey(parseInt(id), selectedSeason, selectedEpisode);
  const gateLabel = type === "movie"
    ? "este filme"
    : `o episódio ${selectedEpisode} da temporada ${selectedSeason}`;

  const players: { id: PlayerType; name: string }[] = [
    { id: 'megaembed', name: 'MegaEmbed' },
    { id: 'embedmovies', name: 'EmbedMovies' },
    { id: 'warezcdn', name: 'WarezCDN' },
    { id: 'superflixapi', name: 'SuperFlix API' },
    { id: 'vidsrcsbs', name: 'VidSrc SBS' },
    { id: 'vidsrcEmbedRu', name: 'VidSrc Embed RU' },
    { id: 'vidsrcEmbedSu', name: 'VidSrc Embed SU' },
    { id: 'vidsrcTo', name: 'VidSrc.to' },
    { id: 'vidapi', name: 'VidAPI' },
    { id: '2embed', name: '2Embed' },
    { id: 'superembed', name: 'SuperEmbed' },
    { id: 'primevicio', name: 'PrimeVicio' },
  ];

  return (
    <div className="min-h-screen pt-16 bg-black">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="mb-6 glass-effect border-purple-500/50"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        {/* Title */}
        <h1 className="text-3xl font-bold text-white mb-6">
          {title}
          {type === "tv" && ` - T${selectedSeason}:E${selectedEpisode}`}
        </h1>

        {/* Player Selector */}
        <div className="mb-4 flex flex-wrap gap-2">
          {players.map((player) => (
            <Button
              key={player.id}
              onClick={() => handlePlayerChange(player.id)}
              variant={currentPlayer === player.id ? "default" : "outline"}
              className={`${currentPlayer === player.id
                ? "bg-purple-600 hover:bg-purple-700"
                : "border-purple-500/50 hover:bg-purple-500/10"
                }`}
            >
              {player.name}
            </Button>
          ))}
        </div>

        {/* Language Info Message */}
        <div className="mb-4 p-4 glass-effect border border-blue-500/50 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />
          <div className="text-sm text-gray-300">
            <p className="font-semibold text-blue-400 mb-1">💡 Dica sobre Idioma</p>
            <p>Para assistir em <strong>português/dublado</strong>, clique no ícone de configurações (⚙️) ou CC no player e selecione &quot;Português&quot; ou &quot;Portuguese&quot; nas opções de áudio/legendas.</p>
          </div>
        </div>

        {/* Player Error Message */}
        {playerError && (
          <div className="mb-4 p-4 glass-effect border border-yellow-500/50 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
            <div className="text-sm text-gray-300">
              <p className="font-semibold text-yellow-400 mb-1">Vídeo não disponível</p>
              <p>Tente selecionar outro player acima. Alguns conteúdos podem não estar disponíveis em todos os players.</p>
            </div>
          </div>
        )}

        {/* Player */}
        <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden shadow-2xl glow-effect mb-8">
          <LinkGate contentKey={gateKey} label={gateLabel}>
          <ConsumptionTracker
            type={type === "tv" ? "tv" : "movie"}
            contentId={id}
            itemKey={type === "tv" ? `${id}:s${selectedSeason}e${selectedEpisode}` : id}
            title={title}
          />
          {embedUrl ? (
            <iframe
              key={`${currentPlayer}-${embedUrl}`}
              src={embedUrl}
              className="w-full h-full"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              title={title}
              onError={() => setPlayerError(true)}
              onLoad={(e) => {
                const iframe = e.currentTarget;
                try {
                  iframe.contentWindow?.postMessage({ type: 'setLanguage', language: 'pt' }, '*');
                  iframe.contentWindow?.postMessage({ type: 'setLanguage', language: 'pt-BR' }, '*');
                  iframe.contentWindow?.postMessage({ type: 'changeLanguage', language: 'pt' }, '*');
                  iframe.contentWindow?.postMessage({ type: 'changeLanguage', language: 'pt-BR' }, '*');
                  iframe.contentWindow?.postMessage({ type: 'setAudio', audio: 'pt' }, '*');
                  iframe.contentWindow?.postMessage({ type: 'setAudio', audio: 'por' }, '*');
                  iframe.contentWindow?.postMessage({ type: 'setAudio', audio: 'portuguese' }, '*');
                } catch (err) {
                  console.log('Não foi possível configurar idioma automaticamente');
                }
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center text-gray-400">
                <AlertCircle className="w-16 h-16 mx-auto mb-4" />
                <p className="text-lg">Player não disponível</p>
                <p className="text-sm mt-2">Tente selecionar outro player</p>
              </div>
            </div>
          )}
          </LinkGate>
        </div>

        {/* Episode Selector for TV Shows */}
        {type === "tv" && details.number_of_seasons && (
          <div className="glass-effect rounded-lg p-6 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white mb-4">Selecionar Episódio</h2>

              {/* Season Selector */}
              <div className="mb-4">
                <label className="text-sm text-gray-400 mb-2 block">Temporada</label>
                <select
                  value={selectedSeason}
                  onChange={(e) => {
                    setSelectedSeason(parseInt(e.target.value));
                    setSelectedEpisode(1);
                  }}
                  className="w-full md:w-64 bg-black/50 border border-purple-500/30 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                >
                  {Array.from({ length: details.number_of_seasons || 1 }, (_, i) => i + 1).map(
                    (season) => (
                      <option key={season} value={season}>
                        Temporada {season}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* Episode Selector */}
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Episódio</label>
                <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                  {Array.from({ length: 20 }, (_, i) => i + 1).map((episode) => (
                    <button
                      key={episode}
                      onClick={() => setSelectedEpisode(episode)}
                      className={`px-4 py-2 rounded-lg transition-all ${selectedEpisode === episode
                        ? "bg-purple-600 text-white glow-effect"
                        : "bg-black/50 text-gray-300 border border-purple-500/30 hover:border-purple-500 hover:bg-purple-900/20"
                        }`}
                    >
                      {episode}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Overview */}
        <div className="mt-8 glass-effect rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Sobre</h2>
          <p className="text-gray-300 leading-relaxed">
            {details.overview || "Sem descrição disponível."}
          </p>
        </div>
      </div>
    </div>
  );
}
