# 🎬 APIs de Streaming e Filmes Recomendadas

## 📊 APIs Já Integradas no TotalFlix
- ✅ **TMDB** (The Movie Database)
- ✅ **OMDB** (Open Movie Database)
- ✅ **5 Players**: Mega Embed, WarezCDN, VidSrc, 2Embed, MoviesAPI

---

## 🎯 APIs Recomendadas para Adicionar

### 1. **JustWatch API** 🔥
- **O que faz**: Informa onde assistir filmes/séries (Netflix, Prime, Disney+, etc.)
- **Endpoint**: `https://apis.justwatch.com`
- **Dados**: Disponibilidade por país, preços, plataformas de streaming
- **Uso**: Mostrar em qual plataforma o conteúdo está disponível
- **Gratuita**: Não oficial, mas funcional

### 2. **Trakt.tv API** ⭐
- **O que faz**: Tracking de filmes/séries assistidos, ratings, listas
- **Website**: `https://trakt.tv/oauth/applications`
- **Dados**: Histórico, checkins, ratings, trending, calendários
- **Uso**: Sistema de "já assisti", listas personalizadas, recomendações
- **Gratuita**: Sim, requer registro

### 3. **Fanart.tv API** 🎨
- **O que faz**: Artes de alta qualidade (posters, logos, backgrounds)
- **Website**: `https://fanart.tv/get-an-api-key/`
- **Dados**: Logos HD, clearart, banners, character art
- **Uso**: Melhorar a apresentação visual do site
- **Gratuita**: Sim, com limite de requests

### 4. **Rotten Tomatoes API** 🍅
- **O que faz**: Críticas de filmes, Tomatometer, Audience Score
- **Website**: Via Mashape/RapidAPI
- **Dados**: Ratings profissionais, consenso crítico
- **Uso**: Mostrar avaliações de críticos e audiência
- **Gratuita**: Via RapidAPI com limite

### 5. **YouTube Data API** 📺
- **O que faz**: Trailers, making-of, entrevistas
- **Website**: `https://console.cloud.google.com`
- **Dados**: Vídeos relacionados, trailers oficiais
- **Uso**: Integrar trailers nos detalhes dos filmes
- **Gratuita**: Sim, 10.000 requests/dia

### 6. **TVMaze API** 📡
- **O que faz**: Dados completos de séries de TV
- **Website**: `https://www.tvmaze.com/api`
- **Dados**: Episódios detalhados, elenco, schedule
- **Uso**: Informações complementares de séries
- **Gratuita**: Sim, sem limite

### 7. **Utelly API** 🎬
- **O que faz**: Onde assistir conteúdo (similar ao JustWatch)
- **Website**: Via RapidAPI
- **Dados**: Disponibilidade em streamings por país
- **Uso**: Mostrar plataformas disponíveis
- **Gratuita**: Limitada via RapidAPI

### 8. **Watchmode API** 👀
- **O que faz**: Agregador de disponibilidade de streaming
- **Website**: `https://api.watchmode.com`
- **Dados**: Preços, plataformas, fontes de streaming
- **Uso**: Indicar onde assistir legalmente
- **Gratuita**: 1000 requests/mês

### 9. **MovieGlu API** 🎟️
- **O que faz**: Horários de cinema, ingressos
- **Website**: `https://movieglu.com`
- **Dados**: Sessões de cinema próximas, venda de ingressos
- **Uso**: Integrar compra de ingressos de cinema
- **Gratuita**: Trial disponível

### 10. **Subtitle APIs** 📝
#### **OpenSubtitles API**
- **Website**: `https://www.opensubtitles.com/api`
- **Dados**: Legendas em múltiplos idiomas
- **Uso**: Download de legendas
- **Gratuita**: Sim, com registro

#### **Addic7ed Scraper**
- Legendas de séries atualizadas rapidamente
- Requer scraping

### 11. **Metacritic API** 📊
- **O que faz**: Pontuações agregadas de críticas
- **Website**: Via scraping ou RapidAPI
- **Dados**: Metascore, user score
- **Uso**: Mostrar consenso crítico
- **Gratuita**: Via scraping

### 12. **IMDb API (não oficial)** 🎭
- **Website**: `https://imdb-api.com`
- **Dados**: Ratings, cast, reviews do IMDb
- **Uso**: Complementar dados do OMDB
- **Gratuita**: 100 requests/dia

### 13. **Letterboxd API (não oficial)** 📽️
- **O que faz**: Reviews e ratings de cinéfilos
- **Dados**: Listas, reviews, diary entries
- **Uso**: Mostrar reviews da comunidade
- **Gratuita**: Via scraping

### 15. **Streamable/Vidyard APIs** 🎥
- **O que faz**: Hospedagem e embed de vídeos
- **Dados**: Upload e reprodução de trailers/clips
- **Uso**: Hospedar conteúdo próprio
- **Gratuita**: Planos free disponíveis

---

## 🚀 Players de Vídeo Alternativos

### **Já Integrados** ✅
1. Mega Embed
2. WarezCDN
3. VidSrc
4. 2Embed
5. MoviesAPI Club

### **Sugestões Adicionais** 💡
6. **SuperEmbed** - `https://www.superembed.stream`
7. **EmbedSu** - `https://embed.su`
8. **Vidsrc.me** - `https://vidsrc.me`
9. **NontonGo** - `https://www.nontongo.win`
11. **Smashystream** - `https://player.smashy.stream`

---

## 📋 Prioridades de Implementação

### **Alta Prioridade** 🔥
1. **YouTube Data API** - Trailers oficiais
2. **JustWatch/Watchmode** - Onde assistir
3. **Trakt.tv** - Sistema de tracking e listas

### **Média Prioridade** ⭐
4. **Fanart.tv** - Melhorar visual
5. **TVMaze** - Dados de séries
6. **OpenSubtitles** - Legendas

### **Baixa Prioridade** 💡
7. **Rotten Tomatoes** - Reviews
8. **Metacritic** - Scores
9. **MovieGlu** - Ingressos de cinema

---

## 💡 Implementação Recomendada

### **Exemplo: YouTube Data API**
```typescript
// /lib/youtube.ts
const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;

export const youtube = {
  searchTrailer: async (movieTitle: string, year?: string) => {
    const query = `${movieTitle} ${year} official trailer`;
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&key=${YOUTUBE_API_KEY}`
    );
    return response.json();
  }
};
```

### **Exemplo: JustWatch**
```typescript
// /lib/justwatch.ts
export const justwatch = {
  getStreamingInfo: async (tmdbId: number, country = 'BR') => {
    const response = await fetch(
      `https://apis.justwatch.com/content/titles/movie/${tmdbId}/locale/${country}`
    );
    return response.json();
  }
};
```

---

## 🔑 Próximos Passos

1. Criar conta nas APIs escolhidas
2. Adicionar keys no `.env.local`
3. Criar arquivos `/lib/[api-name].ts`
4. Integrar nos componentes de detalhes
5. Testar funcionalidades

Essas APIs transformarão o TotalFlix em uma plataforma completa! 🎉
