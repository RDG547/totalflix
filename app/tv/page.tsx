"use client";

import { useState } from "react";
import Image from "next/image";
import { TV_CHANNELS, TV_CATEGORIES, getChannelsByCategory, type TVChannel } from "@/lib/tv-channels";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Radio } from "lucide-react";
import { TVPlayerModal } from "@/components/TVPlayerModal";

export default function TVPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedChannel, setSelectedChannel] = useState<TVChannel | null>(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);

  const channels = getChannelsByCategory(selectedCategory);

  const handleWatchChannel = (channel: TVChannel) => {
    console.log('Opening channel:', channel.name);
    setSelectedChannel(channel);
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

        {/* Category Filter */}
        <div className="flex flex-wrap gap-3 mb-8">
          {TV_CATEGORIES.map((category) => {
            const Icon = category.icon;
            return (
              <Button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                variant={selectedCategory === category.id ? "default" : "outline"}
                className={`transition-all active:scale-95 ${
                  selectedCategory === category.id
                    ? "glow-effect"
                    : "glass-effect border-purple-500/30"
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {category.name}
              </Button>
            );
          })}
        </div>

        {/* Channels Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {channels.map((channel) => (
            <Card
              key={channel.id}
              className="group relative overflow-hidden bg-black/40 border-purple-500/30 hover:border-purple-500 transition-all duration-300 hover:scale-105 active:scale-100 cursor-pointer"
              onClick={() => handleWatchChannel(channel)}
            >
              <div className="aspect-video relative bg-gradient-to-br from-purple-900/20 to-black flex items-center justify-center p-6">
                {channel.logo ? (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <Image
                      src={channel.logo}
                      alt={channel.name}
                      width={150}
                      height={80}
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
                  <span className="text-purple-400 font-medium">{channel.category}</span>
                  <span className="text-gray-400">{channel.country}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {channels.length === 0 && (
          <div className="text-center py-20">
            <Radio className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">
              Nenhum canal encontrado
            </h3>
            <p className="text-gray-500">
              Tente selecionar outra categoria
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
