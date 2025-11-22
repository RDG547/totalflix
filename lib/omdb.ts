import axios from 'axios';

const OMDB_API_KEY = process.env.NEXT_PUBLIC_OMDB_API_KEY;
const OMDB_BASE_URL = process.env.NEXT_PUBLIC_OMDB_BASE_URL || 'https://www.omdbapi.com';

const omdbApi = axios.create({
  baseURL: OMDB_BASE_URL,
  params: {
    apikey: OMDB_API_KEY,
  },
});

export interface OMDBMovie {
  Title: string;
  Year: string;
  Rated: string;
  Released: string;
  Runtime: string;
  Genre: string;
  Director: string;
  Writer: string;
  Actors: string;
  Plot: string;
  Language: string;
  Country: string;
  Awards: string;
  Poster: string;
  Ratings: Array<{
    Source: string;
    Value: string;
  }>;
  Metascore: string;
  imdbRating: string;
  imdbVotes: string;
  imdbID: string;
  Type: string;
  DVD: string;
  BoxOffice: string;
  Production: string;
  Website: string;
  Response: string;
}

export interface OMDBSearchResult {
  Title: string;
  Year: string;
  imdbID: string;
  Type: string;
  Poster: string;
}

export interface OMDBSearchResponse {
  Search: OMDBSearchResult[];
  totalResults: string;
  Response: string;
}

export const omdb = {
  // Buscar filme/série por ID do IMDb
  getById: async (imdbId: string): Promise<OMDBMovie> => {
    const response = await omdbApi.get('/', {
      params: {
        i: imdbId,
        plot: 'full',
      },
    });
    return response.data;
  },

  // Buscar filme/série por título
  getByTitle: async (title: string, year?: string): Promise<OMDBMovie> => {
    const response = await omdbApi.get('/', {
      params: {
        t: title,
        y: year,
        plot: 'full',
      },
    });
    return response.data;
  },

  // Buscar múltiplos resultados
  search: async (query: string, page: number = 1, type?: 'movie' | 'series' | 'episode'): Promise<OMDBSearchResponse> => {
    const response = await omdbApi.get('/', {
      params: {
        s: query,
        page,
        type,
      },
    });
    return response.data;
  },
};

// Função auxiliar para converter TMDB ID para IMDb ID (requer uma consulta TMDB primeiro)
export const getImdbIdFromTMDB = async (tmdbId: number, mediaType: 'movie' | 'tv'): Promise<string | null> => {
  try {
    const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
    const response = await axios.get(
      `https://api.themoviedb.org/3/${mediaType}/${tmdbId}/external_ids`,
      {
        params: {
          api_key: TMDB_API_KEY,
        },
      }
    );
    return response.data.imdb_id || null;
  } catch (error) {
    console.error('Error fetching IMDb ID from TMDB:', error);
    return null;
  }
};
