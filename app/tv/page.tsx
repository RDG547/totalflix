"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { TV_CATEGORIES, type TVChannel } from "@/lib/tv-channels";
import { getMinhaTVChannels, getMinhaTVStream, type MinhaTVMeta } from "@/lib/minhatv";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Radio, Loader2 } from "lucide-react";
import { TVPlayerModal } from "@/components/TVPlayerModal";

// Mapeamento de nomes de canais para categorias (detecta pela palavra-chave no nome)
const CATEGORY_CHANNEL_KEYWORDS: Record<string, string[]> = {
  'Notícias': [
    'globonews', 'band news', 'cnn', 'record news', 'jovem pan', 'jp news',
    'sbt news', 'bloomberg', 'bbc news', 'al jazeera', 'rt', 'france 24',
    'euronews', 'sky news', 'news', 'jornalismo'
  ],
  'Filmes': [
    'telecine', 'hbo', 'max', 'paramount', 'fox', 'universal', 'megapix',
    'cinemax', 'sony', 'studio universal', 'space', 'tnt', 'fx', 'amc', 'a&e',
    'axn', 'film', 'movie', 'cine', 'cinema', 'star channel', 'warner'
  ],
  'Esportes': [
    'sportv', 'espn', 'fox sports', 'premiere', 'combate', 'band sports',
    'dazn', 'nfl', 'nba', 'ufc', 'bjj', 'woohoo', 'esporte', 'sport',
    'futebol', 'golf', 'tennis', 'motorsport', 'racing'
  ],
  'Entretenimento': [
    'multishow', 'comedy', 'humor', 'mtv', 'vh1', 'e!', 'entertainment',
    'tbs', 'comedy central', 'bis', 'trutv', 'variety', 'reality'
  ],
  'Música': [
    'mtv', 'vh1', 'music', 'musica', 'bis', 'arte 1', 'concert', 'live'
  ],
  'Documentários': [
    'discovery', 'natgeo', 'national geographic', 'animal planet', 'history',
    'h2', 'crime', 'investigation', 'id', 'dtx', 'tlc', 'home & health',
    'food network', 'travel', 'nature', 'science', 'documentar', 'curta!'
  ],
  'Internacional': [
    'rai', 'tv5', 'nhk', 'dw', 'deutsche welle', 'france', 'italia', 'spain',
    'portugal', 'rtp', 'tve', 'tv galicia', 'antena 3', 'eurochannel'
  ],
  'Infantil': [
    'cartoon', 'disney', 'nick', 'nickelodeon', 'gloob', 'gloobinho',
    'discovery kids', 'baby tv', 'boomerang', 'junior', 'kids', 'infantil',
    'chaves', 'turma da monica', 'tv ra tim bum', 'zoomoo', 'tooncast'
  ],
};

// Função para detectar categoria pelo nome do canal
const getCategoryFromChannelName = (channelName: string): string | null => {
  const normalizedName = normalizeText(channelName);

  for (const [category, keywords] of Object.entries(CATEGORY_CHANNEL_KEYWORDS)) {
    for (const keyword of keywords) {
      if (normalizedName.includes(normalizeText(keyword))) {
        return category;
      }
    }
  }

  return null;
};

// Função de normalização de texto (remove acentos, converte para minúsculas)
const normalizeText = (str: string): string => {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
};

// Alfabeto para filtro por letra
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export default function TVPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLetter, setSelectedLetter] = useState("all");
  const [selectedChannel, setSelectedChannel] = useState<TVChannel | null>(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [minhaTVChannels, setMinhaTVChannels] = useState<MinhaTVMeta[]>([]);
  const [isLoadingChannels, setIsLoadingChannels] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch canais ao montar o componente
  useEffect(() => {
    const fetchChannels = async () => {
      setIsLoadingChannels(true);
      try {
        const channels = await getMinhaTVChannels();
        if (channels.length > 0) {
          setMinhaTVChannels(channels);
        }
      } catch (error) {
        console.error('Erro ao carregar canais:', error);
      } finally {
        setIsLoadingChannels(false);
      }
    };
    fetchChannels();
  }, []);

  // Filtrar e ordenar canais usando useMemo para performance
  const filteredChannels = useMemo(() => {
    // Filtrar
    let result = minhaTVChannels.filter(channel => {
      const channelName = channel.name || '';
      const normalizedName = normalizeText(channelName);
      const normalizedSearch = normalizeText(searchQuery);

      // A. Filtro de Pesquisa
      if (searchQuery.trim() !== '') {
        if (!normalizedName.includes(normalizedSearch)) {
          return false;
        }
      }

      // B. Filtro por Letra
      if (selectedLetter !== 'all') {
        const firstChar = normalizeText(channelName.charAt(0)).toUpperCase();
        if (firstChar !== selectedLetter) {
          return false;
        }
      }

      // C. Filtro por Categoria - detecta pelo NOME do canal
      if (selectedCategory !== 'all') {
        const channelCategory = getCategoryFromChannelName(channelName);
        if (channelCategory !== selectedCategory) {
          return false;
        }
      }

      return true;
    });

    // Ordenar
    result = [...result].sort((a, b) => {
      const nameA = a.name || '';
      const nameB = b.name || '';

      // Se há pesquisa ativa, priorizar canais que começam com o termo
      if (searchQuery.trim() !== '') {
        const normalizedSearch = normalizeText(searchQuery);
        const aStarts = normalizeText(nameA).startsWith(normalizedSearch);
        const bStarts = normalizeText(nameB).startsWith(normalizedSearch);

        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
      }

      // Ordem alfabética
      return nameA.localeCompare(nameB, 'pt-BR', { sensitivity: 'base' });
    });

    return result;
  }, [minhaTVChannels, searchQuery, selectedCategory, selectedLetter]);

  // Handler para selecionar categoria
  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSelectedLetter('all');
  };

  // Handler para selecionar letra
  const handleLetterSelect = (letter: string) => {
    setSelectedLetter(letter);
    setSelectedCategory('all');
  };

  // Handler para pesquisa
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  // Handler para assistir canal
  const handleWatchChannel = async (channel: MinhaTVMeta) => {
    try {
      const streamUrl = await getMinhaTVStream(channel.id);

      if (!streamUrl) {
        console.error('Stream URL não encontrada');
        return;
      }

      const tvChannel: TVChannel = {
        id: channel.id,
        name: channel.name,
        logo: channel.poster,
        streamUrl: streamUrl,
        category: getCategoryFromChannelName(channel.name) || 'TV',
        country: 'BR',
        language: 'pt'
      };

      setSelectedChannel(tvChannel);
      setIsPlayerOpen(true);
    } catch (error) {
      console.error('Erro ao abrir canal:', error);
    }
  };

  // Handler para limpar todos os filtros
  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedLetter('all');
  };

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gradient mb-4 flex items-center justify-center gap-3">
            <Radio className="w-10 h-10 text-purple-500" />
            TV ao Vivo
          </h1>
          <p className="text-gray-400 text-lg">
            Assista aos principais canais de TV ao vivo
          </p>
        </div>

        {/* Filtros unificados em um único card */}
        <div className="mb-8">
          <div className="border border-purple-500/30 rounded-lg bg-black/40 backdrop-blur-sm overflow-hidden">
            {/* Header com título e badge do filtro ativo */}
            <div className="flex items-center gap-3 p-4 border-b border-purple-500/10">
              <Radio className="w-5 h-5 text-purple-500" />
              <span className="font-semibold text-white">Filtros</span>
              <span className="text-xs bg-purple-500 text-white px-2 py-0.5 rounded-full">
                {searchQuery
                  ? `Pesquisa: "${searchQuery}"`
                  : selectedCategory !== 'all'
                  ? TV_CATEGORIES.find(c => c.id === selectedCategory)?.name
                  : selectedLetter !== 'all'
                  ? `Letra ${selectedLetter}`
                  : 'Todos'}
              </span>
              {(searchQuery || selectedCategory !== 'all' || selectedLetter !== 'all') && (
                <button
                  onClick={handleClearFilters}
                  className="ml-auto text-xs text-purple-400 hover:text-purple-300"
                >
                  Limpar filtros
                </button>
              )}
            </div>

            {/* Grid de filtros */}
            <div className="p-4 space-y-4">
              {/* Seção: Pesquisa */}
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-2">Pesquisar</h3>
                <div className="relative max-w-md">
                  <input
                    type="text"
                    placeholder="Digite o nome do canal..."
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-full px-4 py-3 pl-12 bg-black/60 border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                  <svg className="w-5 h-5 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Divisor */}
              <div className="border-t border-purple-500/10 pt-4">
                <h3 className="text-sm font-medium text-gray-400 mb-2">Categorias</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                  {TV_CATEGORIES.map((category) => {
                    const Icon = category.icon;
                    const isActive = selectedCategory === category.id;
                    return (
                      <Button
                        key={category.id}
                        type="button"
                        onClick={() => handleCategorySelect(category.id)}
                        variant={isActive ? "default" : "ghost"}
                        className={`justify-start w-full transition-all text-left ${
                          isActive
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
              </div>

              {/* Divisor */}
              <div className="border-t border-purple-500/10 pt-4">
                <h3 className="text-sm font-medium text-gray-400 mb-2">Filtrar por Letra</h3>
                <div className="flex flex-wrap gap-2">
                  {ALPHABET.map((letter) => {
                    const isActive = selectedLetter === letter;
                    return (
                      <Button
                        key={letter}
                        type="button"
                        onClick={() => handleLetterSelect(letter)}
                        variant={isActive ? "default" : "ghost"}
                        className={`w-10 h-10 p-0 transition-all ${
                          isActive
                            ? "bg-purple-600 text-white shadow-lg shadow-purple-900/50"
                            : "text-gray-300 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        {letter}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contador de resultados */}
        <div className="mb-4 text-gray-400 text-sm">
          {filteredChannels.length} {filteredChannels.length === 1 ? 'canal encontrado' : 'canais encontrados'}
        </div>

        {/* Channels Grid */}
        {isLoadingChannels ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-4" />
            <p className="text-gray-400">Carregando canais...</p>
          </div>
        ) : filteredChannels.length === 0 ? (
          <div className="text-center py-20">
            <Radio className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">
              Nenhum canal encontrado
            </h3>
            <p className="text-gray-500">
              {searchQuery ? `Nenhum canal encontrado para "${searchQuery}"` :
               selectedCategory !== 'all' ? `Nenhum canal na categoria "${TV_CATEGORIES.find(c => c.id === selectedCategory)?.name}"` :
               selectedLetter !== 'all' ? `Nenhum canal com a letra "${selectedLetter}"` :
               'Não foi possível carregar os canais'}
            </p>
            {(searchQuery || selectedCategory !== 'all' || selectedLetter !== 'all') && (
              <button
                onClick={handleClearFilters}
                className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                Limpar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredChannels.map((channel, index) => (
              <Card
                key={`${channel.id}-${index}`}
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
                      {getCategoryFromChannelName(channel.name) || 'TV'}
                    </span>
                    <span className="text-gray-400">🇧🇷 BR</span>
                  </div>
                </div>
              </Card>
            ))}
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
