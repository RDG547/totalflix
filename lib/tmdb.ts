import axios from 'axios';

const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
const TMDB_BASE_URL = process.env.NEXT_PUBLIC_TMDB_BASE_URL;
export const TMDB_IMAGE_BASE_URL = process.env.NEXT_PUBLIC_TMDB_IMAGE_BASE_URL;

const tmdbApi = axios.create({
  baseURL: TMDB_BASE_URL,
  params: {
    api_key: TMDB_API_KEY,
    language: 'pt-BR',
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

export const tmdb = {
  getTrending: async (mediaType: 'all' | 'movie' | 'tv' = 'all', timeWindow: 'day' | 'week' = 'week') => {
    const response = await tmdbApi.get(`/trending/${mediaType}/${timeWindow}`);
    return response.data.results;
  },

  getPopular: async (mediaType: 'movie' | 'tv', page: number = 1) => {
    const response = await tmdbApi.get(`/${mediaType}/popular`, {
      params: { page }
    });
    return response.data.results;
  },

  getTopRated: async (mediaType: 'movie' | 'tv', page: number = 1) => {
    const response = await tmdbApi.get(`/${mediaType}/top_rated`, {
      params: { page }
    });
    return response.data.results;
  },

  getByGenre: async (mediaType: 'movie' | 'tv', genreId: number, page: number = 1) => {
    const response = await tmdbApi.get(`/discover/${mediaType}`, {
      params: {
        with_genres: genreId,
        page: page,
      },
    });
    return {
      results: response.data.results,
      total_pages: response.data.total_pages,
      total_results: response.data.total_results,
      page: response.data.page,
    };
  },

  getDetails: async (mediaType: 'movie' | 'tv', id: number): Promise<MovieDetails> => {
    const response = await tmdbApi.get(`/${mediaType}/${id}`, {
      params: {
        append_to_response: 'videos,credits,similar',
      },
    });
    return response.data;
  },

  search: async (query: string) => {
    const response = await tmdbApi.get('/search/multi', {
      params: {
        query,
      },
    });
    return response.data.results;
  },

  getGenres: async (mediaType: 'movie' | 'tv') => {
    const response = await tmdbApi.get(`/genre/${mediaType}/list`);
    return response.data.genres;
  },

  getGenreCount: async (mediaType: 'movie' | 'tv', genreId: number): Promise<number> => {
    const response = await tmdbApi.get(`/discover/${mediaType}`, {
      params: {
        with_genres: genreId,
      },
    });
    return response.data.total_results;
  },

  getVideos: async (mediaType: 'movie' | 'tv', id: number) => {
    const response = await tmdbApi.get(`/${mediaType}/${id}/videos`);
    return response.data.results;
  },
};

export const getImageUrl = (path: string, size: 'w300' | 'w500' | 'original' = 'w500') => {
  if (!path) return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="500" height="750" viewBox="0 0 500 750"%3E%3Crect width="500" height="750" fill="%23111"/>%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="24" fill="%23666"%3ESem Imagem%3C/text%3E%3C/svg%3E';
  return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
};

export const getBackdropUrl = (path: string, size: 'w780' | 'w1280' | 'original' = 'original') => {
  if (!path) return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720"%3E%3Crect width="1280" height="720" fill="%23111"/>%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="32" fill="%23666"%3ESem Imagem%3C/text%3E%3C/svg%3E';
  return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
};

export type VideoPlayer = 'megaembed' | 'vidsrc' | '2embed' | 'moviesapi' | 'superembed' | 'smashystream' | 'embedmovies' | 'warezcdn' | 'primevicio' | 'webtorrent';

/**
 * Gera URL do player com parâmetros de idioma PT-BR
 * Os players que suportam configuração de idioma são automaticamente configurados para português/dublado
 */
export const getPlayerUrl = (
  player: VideoPlayer,
  mediaType: 'movie' | 'tv',
  tmdbId: number,
  season?: number,
  episode?: number
): string => {
  if (player === 'megaembed') {
    const baseUrl = process.env.NEXT_PUBLIC_MEGA_EMBED_URL || 'https://megaembed.com';
    if (mediaType === 'movie') {
      return `${baseUrl}/embed/${tmdbId}`;
    } else {
      return `${baseUrl}/embed/${tmdbId}/${season || 1}/${episode || 1}`;
    }
  } else if (player === 'vidsrc') {
    const baseUrl = 'https://vidsrc.xyz/embed';
    if (mediaType === 'movie') {
      return `${baseUrl}/movie/${tmdbId}`;
    } else {
      return `${baseUrl}/tv/${tmdbId}/${season || 1}/${episode || 1}`;
    }
  } else if (player === '2embed') {
    const baseUrl = process.env.NEXT_PUBLIC_2EMBED_URL || 'https://www.2embed.cc/embed';
    if (mediaType === 'movie') {
      return `${baseUrl}/${tmdbId}`;
    } else {
      return `${baseUrl}/${tmdbId}&s=${season || 1}&e=${episode || 1}`;
    }
  } else if (player === 'moviesapi') {
    const baseUrl = process.env.NEXT_PUBLIC_MOVIESAPI_URL || 'https://moviesapi.club';
    if (mediaType === 'movie') {
      return `${baseUrl}/movie/${tmdbId}`;
    } else {
      return `${baseUrl}/tv/${tmdbId}-${season || 1}-${episode || 1}`;
    }
  } else if (player === 'superembed') {
    const baseUrl = 'https://multiembed.mov';
    if (mediaType === 'movie') {
      return `${baseUrl}/?video_id=${tmdbId}&tmdb=1`;
    } else {
      return `${baseUrl}/?video_id=${tmdbId}&tmdb=1&s=${season || 1}&e=${episode || 1}`;
    }
  } else if (player === 'smashystream') {
    const baseUrl = 'https://player.smashy.stream';
    if (mediaType === 'movie') {
      return `${baseUrl}/movie/${tmdbId}`;
    } else {
      return `${baseUrl}/tv/${tmdbId}?s=${season || 1}&e=${episode || 1}`;
    }
  } else if (player === 'embedmovies') {
    const baseUrl = 'https://myembed.biz';
    if (mediaType === 'movie') {
      return `${baseUrl}/filme/${tmdbId}`;
    } else {
      return `${baseUrl}/serie/${tmdbId}/${season || 1}/${episode || 1}`;
    }
  } else if (player === 'warezcdn') {
    const baseUrl = 'https://warezcdn.lat';
    if (mediaType === 'movie') {
      return `${baseUrl}/filme/${tmdbId}#noLink`;
    } else {
      return `${baseUrl}/serie/${tmdbId}/${season || 1}/${episode || 1}#noEpList`;
    }
  } else if (player === 'primevicio') {
    const baseUrl = 'https://primevicio.netlify.app';
    if (mediaType === 'movie') {
      return `${baseUrl}/movie/${tmdbId}`;
    } else {
      return `${baseUrl}/tv/${tmdbId}/${season || 1}/${episode || 1}`;
    }
  }
  return '';
};

// Mantém compatibilidade com código antigo
export const getMegaEmbedUrl = (mediaType: 'movie' | 'tv', tmdbId: number, season?: number, episode?: number) => {
  return getPlayerUrl('megaembed', mediaType, tmdbId, season, episode);
};
