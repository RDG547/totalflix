"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { TV_CATEGORIES, type TVChannel } from "@/lib/tv-channels";
import { getMinhaTVChannels, getMinhaTVStream, type MinhaTVMeta } from "@/lib/minhatv";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Radio, Loader2 } from "lucide-react";
import { TVPlayerModal } from "@/components/TVPlayerModal";

export default function TVPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedChannel, setSelectedChannel] = useState<TVChannel | null>(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [minhaTVChannels, setMinhaTVChannels] = useState<MinhaTVMeta[]>([]);
  const [isLoadingChannels, setIsLoadingChannels] = useState(true);

  // Fetch Minha TV channels on mount
  useEffect(() => {
    const fetchChannels = async () => {
      setIsLoadingChannels(true);
      const channels = await getMinhaTVChannels();
      setMinhaTVChannels(channels);
      setIsLoadingChannels(false);
    };
    fetchChannels();
  }, []);

  const handleWatchChannel = async (channel: MinhaTVMeta) => {
    console.log('Opening channel:', channel.name);

    // Fetch stream URL for the channel
    const streamUrl = await getMinhaTVStream(channel.id);

    if (!streamUrl) {
      console.error('No stream URL found for channel:', channel.name);
      return;
    }

    // Convert MinhaTVMeta to TVChannel format
    const tvChannel: TVChannel = {
      id: channel.id,
      name: channel.name,
      logo: channel.poster,
      streamUrl: streamUrl,
      category: channel.genres?.[0] || 'Geral',
      country: 'BR',
      language: 'pt'
    };

    setSelectedChannel(tvChannel);
    setIsPlayerOpen(true);
  };

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gradient mb-4 flex items-center gap-3">
            <Radio className="w-10 h-10 text-purple-500" />
            TV ao Vivo
          </h1>
          <p className="text-gray-400 text-lg">
            Assista aos principais canais de TV ao vivo
          </p>
        </div>

        {/* Collapsible Category Filter */}
        <div className="mb-8">
          <details className="group border border-purple-500/30 rounded-lg bg-black/40 backdrop-blur-sm overflow-hidden transition-all duration-300 open:bg-black/60">
            <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors select-none">
              <div className="flex items-center gap-3">
                <Radio className="w-5 h-5 text-purple-500" />
                <span className="font-semibold text-white">Filtrar por Categoria</span>
                <span className="text-xs bg-purple-500 text-white px-2 py-0.5 rounded-full">
                  {selectedCategory === 'all' ? 'Todos' : TV_CATEGORIES.find(c => c.id === selectedCategory)?.name}
                </span>
              </div>
              <div className="transform group-open:rotate-180 transition-transform duration-300">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </summary>

            <div className="p-4 pt-0 border-t border-purple-500/10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 animate-fade-in-down">
              {TV_CATEGORIES.map((category) => {
                const Icon = category.icon;
                return (
                  <Button
                    key={category.id}
                    onClick={() => {
                      setSelectedCategory(category.id);
                      // Opcional: fechar detalhes ao selecionar
                    }}
                    variant={selectedCategory === category.id ? "default" : "ghost"}
                    className={`justify-start w-full transition-all text-left ${selectedCategory === category.id
                        ? "bg-purple-600 text-white shadow-lg shadow-purple-900/50"
                        : "text-gray-300 hover:text-white hover:bg-white/10"
                      }`}
                  >
                    <Icon className="w-4 h-4 mr-2 shrink-0" />
                    <span className="truncate">{category.name}</span>
                  </Button>
                );
              })}
            </div>
          </details>
        </div>

        {/* Channels Grid */}
        {isLoadingChannels ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-4" />
            <p className="text-gray-400">Carregando canais...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {minhaTVChannels
              .sort((a, b) => a.name.localeCompare(b.name)) // Sort Alphabetically
              .filter(channel =>
                selectedCategory === 'all'
                  ? true
                  // Mapeamento simples de categorias baseado no nome ou gênero se disponível
                  : selectedCategory === 'variety' ? true // Fallback para "Variedades" mostrar tudo por enquanto se não tiver genero especifico
                    : true // TODO: Implementar filtro real se a API retornar generos consistentes
              )
              // Filtro básico provisório para demonstrar funcionalidade se categorias existissem nos dados
              // Na prática, a API 'minhatv' retorna lista plana, então o filtro por categoria precisa de lógica customizada
              // ou assumir 'all' para todos. Mantendo ordenação como principal feature solicitada.
              .map((channel) => (
                <Card
                  key={channel.id}
                  className="group relative overflow-hidden bg-black/40 border-purple-500/30 hover:border-purple-500 transition-all duration-300 hover:scale-105 active:scale-100 cursor-pointer"
                  onClick={() => handleWatchChannel(channel)}
                >
                  <div className="aspect-video relative bg-gradient-to-br from-purple-900/20 to-black flex items-center justify-center p-6">
                    {channel.poster ? (
                      <div className="relative w-full h-full flex items-center justify-center">
                        <Image
                          src={channel.poster}
                          alt={channel.name}
                          fill
                          className="object-contain filter brightness-90 group-hover:brightness-110 transition-all"
                        />
                      </div>
                    ) : (
                      <div className="text-4xl font-bold text-purple-500 group-hover:text-purple-400 transition-colors">
                        {channel.name.charAt(0)}
                      </div>
                    )}

                    {/* Overlay on Hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <div className="flex items-center gap-2 text-white">
                        <Play className="w-8 h-8 group-hover:scale-110 transition-transform" />
                        <span className="font-semibold">Assistir ao Vivo</span>
                      </div>
                    </div>

                    {/* Live Badge */}
                    <div className="absolute top-3 right-3 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 animate-pulse">
                      <span className="w-2 h-2 bg-white rounded-full"></span>
                      AO VIVO
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="text-white font-bold text-lg mb-2 truncate">
                      {channel.name}
                    </h3>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-purple-400 font-medium">
                        {channel.genres?.[0] || 'TV'}
                      </span>
                      <span className="text-gray-400">🇧🇷 BR</span>
                    </div>
                  </div>
                </Card>
              ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoadingChannels && minhaTVChannels.length === 0 && (
          <div className="text-center py-20">
            <Radio className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">
              Nenhum canal encontrado
            </h3>
            <p className="text-gray-500">
              Não foi possível carregar os canais do Minha TV
            </p>
          </div>
        )}
      </div>

      {/* TV Player Modal */}
      {selectedChannel && (
        <TVPlayerModal
          isOpen={isPlayerOpen}
          onClose={() => setIsPlayerOpen(false)}
          channel={selectedChannel}
        />
      )}
    </div>
  );
}
