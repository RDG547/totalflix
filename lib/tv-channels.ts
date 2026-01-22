import { Film, Tv, Newspaper, Music, Gamepad2, Trophy, BookOpen, Globe, Sparkles } from "lucide-react";

export interface TVChannel {
  id: string;
  name: string;
  logo?: string;
  streamUrl: string;
  category: string;
  country: string;
  language: string;
}

// Lista de canais de TV populares do Brasil e internacionais
export const TV_CHANNELS: TVChannel[] = [
  // Canais Brasileiros
  {
    id: "globo",
    name: "Globo",
    logo: "https://logo.clearbit.com/globo.com",
    streamUrl: "https://www.youtube.com/embed/live_stream?channel=UCRgT0OZ4lMwNrG8IIWHMlWQ",
    category: "Notícias",
    country: "BR",
    language: "pt"
  },
  {
    id: "sbt",
    name: "SBT",
    logo: "https://logo.clearbit.com/sbt.com.br",
    streamUrl: "https://www.youtube.com/embed/live_stream?channel=UCmFvPlqo46vFNqxPMIudAlw",
    category: "Entretenimento",
    country: "BR",
    language: "pt"
  },
  {
    id: "record",
    name: "Record",
    logo: "https://logo.clearbit.com/recordtv.com.br",
    streamUrl: "https://www.youtube.com/embed/live_stream?channel=UCrGaNfcnmZ3FTn3jECz9Qyg",
    category: "Notícias",
    country: "BR",
    language: "pt"
  },
  {
    id: "band",
    name: "Band",
    logo: "https://logo.clearbit.com/band.com.br",
    streamUrl: "https://www.youtube.com/embed/live_stream?channel=UCO8IVA-EqL60FjEq_akqXgg",
    category: "Notícias",
    country: "BR",
    language: "pt"
  },
  {
    id: "cnn-brasil",
    name: "CNN Brasil",
    logo: "https://logo.clearbit.com/cnnbrasil.com.br",
    streamUrl: "https://www.youtube.com/embed/live_stream?channel=UCvdwhh_fDyWccR42-rReZLw",
    category: "Notícias",
    country: "BR",
    language: "pt"
  },
  {
    id: "jovem-pan",
    name: "Jovem Pan News",
    logo: "https://logo.clearbit.com/jovempan.com.br",
    streamUrl: "https://www.youtube.com/embed/live_stream?channel=UCVQd7igvtp8P4FZJpjsj0Mg",
    category: "Notícias",
    country: "BR",
    language: "pt"
  },

  // Canais Internacionais
  {
    id: "cnn",
    name: "CNN International",
    logo: "https://logo.clearbit.com/cnn.com",
    streamUrl: "https://www.youtube.com/embed/live_stream?channel=UCupvZG-5ko_eiXAupbDfxWw",
    category: "Notícias",
    country: "US",
    language: "en"
  },
  {
    id: "bbc",
    name: "BBC News",
    logo: "https://logo.clearbit.com/bbc.com",
    streamUrl: "https://www.youtube.com/embed/live_stream?channel=UC16niRr50-MSBwiO3YDb3RA",
    category: "Notícias",
    country: "UK",
    language: "en"
  },
  {
    id: "sky-news",
    name: "Sky News",
    logo: "https://logo.clearbit.com/news.sky.com",
    streamUrl: "https://www.youtube.com/embed/live_stream?channel=UCoMdktPbSTixAyNGwb-UYkQ",
    category: "Notícias",
    country: "UK",
    language: "en"
  },
  {
    id: "euronews",
    name: "Euronews",
    logo: "https://logo.clearbit.com/euronews.com",
    streamUrl: "https://www.youtube.com/embed/live_stream?channel=UCSrZ3UV4jOidv8ppoKl5yfw",
    category: "Notícias",
    country: "EU",
    language: "en"
  },
  {
    id: "france24",
    name: "France 24",
    logo: "https://logo.clearbit.com/france24.com",
    streamUrl: "https://www.youtube.com/embed/live_stream?channel=UCQfwfsi5VrQ8yKZ-UWmAEFg",
    category: "Notícias",
    country: "FR",
    language: "en"
  },
  {
    id: "dw",
    name: "DW News",
    logo: "https://logo.clearbit.com/dw.com",
    streamUrl: "https://www.youtube.com/embed/live_stream?channel=UCknLrEdhRCp1aegoMqRaCZg",
    category: "Notícias",
    country: "DE",
    language: "en"
  },
];

export const TV_CATEGORIES = [
  { id: "all", name: "Todos", icon: Tv },
  { id: "Notícias", name: "Notícias", icon: Newspaper },
  { id: "Filmes", name: "Filmes", icon: Film },
  { id: "Esportes", name: "Esportes", icon: Trophy },
  { id: "Entretenimento", name: "Entretenimento", icon: Sparkles },
  { id: "Música", name: "Música", icon: Music },
  { id: "Documentários", name: "Documentários", icon: BookOpen },
  { id: "Internacional", name: "Internacional", icon: Globe },
  { id: "Infantil", name: "Infantil", icon: Gamepad2 },
];

export const getChannelsByCategory = (category: string): TVChannel[] => {
  if (category === "all") return TV_CHANNELS;
  return TV_CHANNELS.filter(channel => channel.category === category);
};

export const getChannelsByCountry = (country: string): TVChannel[] => {
  return TV_CHANNELS.filter(channel => channel.country === country);
};
