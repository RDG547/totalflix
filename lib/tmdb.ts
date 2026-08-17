import axios from "axios";

const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
const TMDB_BASE_URL = process.env.NEXT_PUBLIC_TMDB_BASE_URL;
export const TMDB_IMAGE_BASE_URL = process.env.NEXT_PUBLIC_TMDB_IMAGE_BASE_URL;

const tmdbApi = axios.create({
  baseURL: TMDB_BASE_URL,
  params: {
    api_key: TMDB_API_KEY,
    language: "pt-BR",
  },
});

export interface Movie {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  genre_ids: number[];
  media_type?: string;
  runtime?: number;
  number_of_seasons?: number;
}

export interface MovieDetails extends Movie {
  genres: { id: number; name: string }[];
  runtime?: number;
  number_of_seasons?: number;
  number_of_episodes?: number;
  tagline: string;
  homepage: string;
  status: string;
  videos?: {
    results: {
      id: string;
      key: string;
      name: string;
      site: string;
      type: string;
      official: boolean;
    }[];
  };
  similar?: {
    results: Movie[];
  };
}

export interface TVSeasonEpisode {
  id: number;
  episode_number: number;
  name: string;
  overview?: string;
  air_date?: string;
  still_path?: string | null;
}

export interface TVSeasonDetails {
  id: number;
  name: string;
  season_number: number;
  episodes: TVSeasonEpisode[];
}

export const tmdb = {
  getTrending: async (mediaType: "all" | "movie" | "tv" = "all", timeWindow: "day" | "week" = "week") => {
    const response = await tmdbApi.get(`/trending/${mediaType}/${timeWindow}`);
    return response.data.results;
  },

  getPopular: async (mediaType: "movie" | "tv", page: number = 1) => {
    const response = await tmdbApi.get(`/${mediaType}/popular`, {
      params: { page },
    });
    return response.data.results;
  },

  getTopRated: async (mediaType: "movie" | "tv", page: number = 1) => {
    const response = await tmdbApi.get(`/${mediaType}/top_rated`, {
      params: { page },
    });
    return response.data.results;
  },

  getByGenre: async (mediaType: "movie" | "tv", genreId: number, page: number = 1) => {
    const response = await tmdbApi.get(`/discover/${mediaType}`, {
      params: {
        with_genres: genreId,
        page,
      },
    });
    return {
      results: response.data.results,
      total_pages: response.data.total_pages,
      total_results: response.data.total_results,
      page: response.data.page,
    };
  },

  getDetails: async (mediaType: "movie" | "tv", id: number): Promise<MovieDetails> => {
    const response = await tmdbApi.get(`/${mediaType}/${id}`, {
      params: {
        append_to_response: "videos,credits,similar",
      },
    });
    return response.data;
  },

  getSeasonDetails: async (id: number, season: number): Promise<TVSeasonDetails> => {
    const response = await tmdbApi.get(`/tv/${id}/season/${season}`);
    return response.data;
  },

  search: async (query: string) => {
    const response = await tmdbApi.get("/search/multi", {
      params: { query },
    });
    return response.data.results;
  },

  getGenres: async (mediaType: "movie" | "tv") => {
    const response = await tmdbApi.get(`/genre/${mediaType}/list`);
    return response.data.genres;
  },

  getGenreCount: async (mediaType: "movie" | "tv", genreId: number): Promise<number> => {
    const response = await tmdbApi.get(`/discover/${mediaType}`, {
      params: { with_genres: genreId },
    });
    return response.data.total_results;
  },

  getVideos: async (mediaType: "movie" | "tv", id: number) => {
    const response = await tmdbApi.get(`/${mediaType}/${id}/videos`);
    return response.data.results;
  },
};

export const getImageUrl = (path: string, size: "w300" | "w500" | "original" = "w500") => {
  if (!path) return "data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" width=\"500\" height=\"750\" viewBox=\"0 0 500 750\"%3E%3Crect width=\"500\" height=\"750\" fill=\"%23111\"/%3E%3Ctext x=\"50%25\" y=\"50%25\" dominant-baseline=\"middle\" text-anchor=\"middle\" font-family=\"sans-serif\" font-size=\"24\" fill=\"%23666\"%3ESem Imagem%3C/text%3E%3C/svg%3E";
  return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
};

export const getBackdropUrl = (path: string, size: "w780" | "w1280" | "original" = "original") => {
  if (!path) return "data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" width=\"1280\" height=\"720\" viewBox=\"0 0 1280 720\"%3E%3Crect width=\"1280\" height=\"720\" fill=\"%23111\"/%3E%3Ctext x=\"50%25\" y=\"50%25\" dominant-baseline=\"middle\" text-anchor=\"middle\" font-family=\"sans-serif\" font-size=\"32\" fill=\"%23666\"%3ESem Imagem%3C/text%3E%3C/svg%3E";
  return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
};

export type VideoPlayer = "megaembed" | "embedplay" | "superflixapi" | "vidsrcsbs" | "vidsrcmeRu" | "vidsrcmeSu" | "vidsrcMeRu" | "vidsrcMeSu" | "vidsrcEmbedRu" | "vidsrcEmbedSu" | "vsrcSu" | "vidsrcTo" | "vidapi" | "2embed" | "superembed" | "smashystream" | "embedmovies" | "warezcdn" | "primevicio" | "webtorrent";

/** Gera a URL do player para o conteúdo e episódio selecionados. */
export const getPlayerUrl = (
  player: VideoPlayer,
  mediaType: "movie" | "tv",
  tmdbId: number,
  season?: number,
  episode?: number,
): string => {
  if (player === "megaembed") {
    const baseUrl = process.env.NEXT_PUBLIC_MEGA_EMBED_URL || "https://megaembed.com";
    return mediaType === "movie"
      ? `${baseUrl}/embed/${tmdbId}`
      : `${baseUrl}/embed/${tmdbId}/${season || 1}/${episode || 1}`;
  }

  if (player === "superflixapi") {
    return mediaType === "movie"
      ? `https://superflixapi.pro/filme/${tmdbId}`
      : `https://superflixapi.pro/serie/${tmdbId}/${season || 1}/${episode || 1}`;
  }

  if (player === "embedplay") {
    const baseUrl = "https://embedplayapi.top/embed";
    return mediaType === "movie"
      ? `${baseUrl}/${tmdbId}`
      : `${baseUrl}/${tmdbId}/${season || 1}/${episode || 1}`;
  }

  if (player === "vidsrcsbs") {
    const baseUrl = "https://vidsrc.sbs/embed";
    return mediaType === "movie"
      ? `${baseUrl}/movie/${tmdbId}`
      : `${baseUrl}/tv/${tmdbId}/${season || 1}/${episode || 1}`;
  }

  if (["vidsrcmeRu", "vidsrcmeSu", "vidsrcMeRu", "vidsrcMeSu", "vidsrcEmbedRu", "vidsrcEmbedSu", "vsrcSu"].includes(player)) {
    const domains: Record<string, string> = {
      vidsrcmeRu: "https://vidsrcme.ru",
      vidsrcmeSu: "https://vidsrcme.su",
      vidsrcMeRu: "https://vidsrc-me.ru",
      vidsrcMeSu: "https://vidsrc-me.su",
      vidsrcEmbedRu: "https://vidsrc-embed.ru",
      vidsrcEmbedSu: "https://vidsrc-embed.su",
      vsrcSu: "https://vsrc.su",
    };
    const baseUrl = `${domains[player]}/embed`;
    return mediaType === "movie"
      ? `${baseUrl}/movie/${tmdbId}`
      : `${baseUrl}/tv/${tmdbId}/${season || 1}-${episode || 1}`;
  }

  if (player === "vidsrcTo") {
    return mediaType === "movie"
      ? `https://vidsrc.to/embed/movie/${tmdbId}`
      : `https://vidsrc.to/embed/tv/${tmdbId}/${season || 1}/${episode || 1}`;
  }

  if (player === "vidapi") {
    return mediaType === "movie"
      ? `https://vidapi.qzz.io/movie/${tmdbId}`
      : `https://vidapi.qzz.io/tv/${tmdbId}/${season || 1}/${episode || 1}`;
  }

  if (player === "2embed") {
    const baseUrl = process.env.NEXT_PUBLIC_2EMBED_URL || "https://www.2embed.cc/embed";
    return mediaType === "movie"
      ? `${baseUrl}/${tmdbId}`
      : `${baseUrl}/${tmdbId}&s=${season || 1}&e=${episode || 1}`;
  }

  if (player === "superembed") {
    const baseUrl = "https://multiembed.mov";
    return mediaType === "movie"
      ? `${baseUrl}/?video_id=${tmdbId}&tmdb=1`
      : `${baseUrl}/?video_id=${tmdbId}&tmdb=1&s=${season || 1}&e=${episode || 1}`;
  }

  if (player === "smashystream") {
    const baseUrl = "https://player.smashy.stream";
    return mediaType === "movie"
      ? `${baseUrl}/movie/${tmdbId}`
      : `${baseUrl}/tv/${tmdbId}?s=${season || 1}&e=${episode || 1}`;
  }

  if (player === "embedmovies") {
    const baseUrl = "https://myembed.biz";
    return mediaType === "movie"
      ? `${baseUrl}/filme/${tmdbId}`
      : `${baseUrl}/serie/${tmdbId}/${season || 1}/${episode || 1}`;
  }

  if (player === "warezcdn") {
    const baseUrl = "https://warezcdn.lat";
    return mediaType === "movie"
      ? `${baseUrl}/filme/${tmdbId}#noLink`
      : `${baseUrl}/serie/${tmdbId}/${season || 1}/${episode || 1}#noEpList`;
  }

  if (player === "primevicio") {
    const baseUrl = "https://primevicio.netlify.app";
    return mediaType === "movie"
      ? `${baseUrl}/movie/${tmdbId}`
      : `${baseUrl}/tv/${tmdbId}/${season || 1}/${episode || 1}`;
  }

  return "";
};

export const getMegaEmbedUrl = (mediaType: "movie" | "tv", tmdbId: number, season?: number, episode?: number) => (
  getPlayerUrl("megaembed", mediaType, tmdbId, season, episode)
);
