import axios from 'axios';
import { ApiResponse, Bible, Book, Chapter, SearchResult, Verse, AudioData, AudioBible } from '../types/bible-api.types';

// URL de base de l'API Bible publique
const BASE_URL = 'https://api.scripture.api.bible/v1';

// Clé API (à remplacer par votre clé API)
const API_KEY = '20404f407724ee8a764e31a9146f4dfd';

// Configuration d'axios avec gestion des erreurs et retry
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'api-key': API_KEY,
  },
  timeout: 10000, // 10 secondes de timeout
});

// Intercepteur pour gérer les erreurs
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') {
      console.error('Erreur de connexion à l\'API Bible. Veuillez vérifier votre connexion internet.');
      throw new Error('Impossible de se connecter à l\'API Bible. Veuillez vérifier votre connexion internet.');
    }
    if (error.response?.status === 401) {
      console.error('Erreur d\'authentification. La clé API est invalide ou a expiré.');
      throw new Error('La clé API est invalide ou a expiré. Veuillez contacter l\'administrateur.');
    }
    throw error;
  }
);

// Implémentation d'un cache simple en mémoire
interface CacheItem<T> {
  data: T;
  timestamp: number;
}

interface Cache {
  [key: string]: CacheItem<any>;
}

const cache: Cache = {};

// Fonction pour effacer le cache
export const clearCache = (): void => {
  // Vider le cache en mémoire
  Object.keys(cache).forEach(key => {
    delete cache[key];
  });
  
  // Vider les entrées du localStorage liées à l'API Bible
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('bibleApi_')) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
    
    console.log(`${keysToRemove.length} entrées de cache supprimées`);
  } catch (error) {
    console.error('Erreur lors du nettoyage du cache:', error);
  }
};

// Service pour interagir avec l'API Bible
export const bibleApiService = {
  // Récupérer la liste de toutes les bibles disponibles
  getBibles: async (): Promise<Bible[]> => {
    try {
      const response = await apiClient.get<ApiResponse<Bible[]>>('/bibles');
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des bibles:', error);
      throw new Error('Impossible de charger les bibles. Veuillez vérifier votre connexion internet.');
    }
  },

  // Récupérer uniquement les bibles qui ont des versions audio
  getBiblesWithAudio: async (): Promise<Bible[]> => {
    const allBibles = await bibleApiService.getBibles();
    return allBibles.filter(bible => bible.audioBibles && bible.audioBibles.length > 0);
  },

  // Récupérer une bible spécifique par ID
  getBible: async (bibleId: string): Promise<Bible> => {
    try {
      const response = await apiClient.get<ApiResponse<Bible>>(`/bibles/${bibleId}`);
      return response.data.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération de la bible ${bibleId}:`, error);
      throw new Error(`Impossible de charger la bible ${bibleId}. Veuillez réessayer.`);
    }
  },

  // Récupérer tous les livres d'une bible
  getBooks: async (bibleId: string): Promise<Book[]> => {
    try {
      const response = await apiClient.get<ApiResponse<Book[]>>(`/bibles/${bibleId}/books`);
      return response.data.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération des livres pour ${bibleId}:`, error);
      throw new Error('Impossible de charger les livres. Veuillez réessayer.');
    }
  },

  // Récupérer un livre spécifique
  getBook: async (bibleId: string, bookId: string): Promise<Book> => {
    try {
      const response = await apiClient.get<ApiResponse<Book>>(`/bibles/${bibleId}/books/${bookId}`);
      return response.data.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération du livre ${bookId}:`, error);
      throw new Error('Impossible de charger le livre. Veuillez réessayer.');
    }
  },

  // Récupérer les chapitres d'un livre
  getChapters: async (bibleId: string, bookId: string): Promise<Chapter[]> => {
    try {
      const response = await apiClient.get<ApiResponse<Chapter[]>>(`/bibles/${bibleId}/books/${bookId}/chapters`);
      return response.data.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération des chapitres pour ${bookId}:`, error);
      throw new Error('Impossible de charger les chapitres. Veuillez réessayer.');
    }
  },

  // Récupérer un chapitre spécifique
  getChapter: async (bibleId: string, chapterId: string): Promise<Chapter> => {
    try {
      const response = await apiClient.get<ApiResponse<Chapter>>(`/bibles/${bibleId}/chapters/${chapterId}`);
      return response.data.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération du chapitre ${chapterId}:`, error);
      throw new Error('Impossible de charger le chapitre. Veuillez réessayer.');
    }
  },

  // Récupérer le contenu d'un verset spécifique
  getVerse: async (bibleId: string, verseId: string): Promise<Verse> => {
    const response = await apiClient.get<ApiResponse<Verse>>(`/bibles/${bibleId}/verses/${verseId}`);
    return response.data.data;
  },

  // Récupérer un passage de la bible (plusieurs versets)
  getPassage: async (bibleId: string, passageId: string): Promise<Chapter> => {
    const response = await apiClient.get<ApiResponse<Chapter>>(`/bibles/${bibleId}/passages/${passageId}`);
    return response.data.data;
  },

  // Rechercher dans la bible
  search: async (bibleId: string, query: string, limit = 20, offset = 0): Promise<SearchResult> => {
    try {
      const response = await apiClient.get<ApiResponse<SearchResult>>(
        `/bibles/${bibleId}/search`,
        { params: { query, limit, offset } }
      );
      return response.data.data;
    } catch (error) {
      console.error(`Erreur lors de la recherche pour ${bibleId}:`, error);
      throw new Error('Impossible d\'effectuer la recherche. Veuillez réessayer.');
    }
  },

  // Récupérer les audio bibles disponibles pour une bible spécifique
  getAudioBibles: async (bibleId: string): Promise<AudioBible[]> => {
    try {
      const response = await apiClient.get<ApiResponse<AudioBible[]>>(`/bibles/${bibleId}/audio-bibles`);
      return response.data.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération des audio-bibles pour ${bibleId}:`, error);
      return [];
    }
  },

  // Vérifier si une bible a des versions audio disponibles
  hasBibleAudio: async (bibleId: string): Promise<boolean> => {
    try {
      const audioBibles = await bibleApiService.getAudioBibles(bibleId);
      return audioBibles.length > 0;
    } catch (error) {
      console.error(`Erreur lors de la vérification de l'audio pour la Bible ${bibleId}:`, error);
      return false;
    }
  },

  // Vérifier si un chapitre spécifique a de l'audio disponible
  hasChapterAudio: async (bibleId: string, audioBibleId: string, chapterId: string): Promise<boolean> => {
    try {
      console.log(`Vérification de l'audio pour: bibleId=${bibleId}, audioBibleId=${audioBibleId}, chapterId=${chapterId}`);
      
      // Première méthode: utiliser l'endpoint de vérification
      try {
        const response = await apiClient.get<{available: boolean, url?: string}>(`/bibles/${bibleId}/audio-bibles/${audioBibleId}/chapters/${chapterId}/check`);
        console.log(`Résultat de la vérification pour ${chapterId}:`, response.data);
        
        if (response.data.available) {
          return true;
        }
      } catch (checkError) {
        console.warn(`Erreur lors de la vérification par l'endpoint /check:`, checkError);
        // Si l'endpoint de vérification échoue, on continue avec la deuxième méthode
      }
      
      // Deuxième méthode: essayer de récupérer directement l'audio
      try {
        console.log(`Tentative de récupération directe de l'audio pour ${chapterId}`);
        const audioData = await bibleApiService.getChapterAudio(bibleId, audioBibleId, chapterId);
        
        // Si l'URL n'est pas celle de secours (fallback), alors l'audio est disponible
        if (audioData && audioData.url && !audioData._fallback) {
          console.log(`Audio trouvé directement pour ${chapterId}:`, audioData.url);
          return true;
        }
      } catch (getError) {
        console.warn(`Échec de la récupération directe de l'audio:`, getError);
      }
      
      // Si aucune des méthodes n'a réussi, l'audio n'est pas disponible
      console.log(`Aucun audio disponible pour ${chapterId}`);
      return false;
    } catch (error) {
      console.error(`Erreur lors de la vérification de l'audio pour le chapitre ${chapterId}:`, error);
      return false;
    }
  },

  // Récupérer l'URL audio d'un chapitre spécifique
  getChapterAudio: async (bibleId: string, audioBibleId: string, chapterId: string): Promise<AudioData> => {
    try {
      console.log(`Tentative de récupération de l'audio pour: bibleId=${bibleId}, audioBibleId=${audioBibleId}, chapterId=${chapterId}`);
      
      const response = await apiClient.get<ApiResponse<AudioData>>(
        `/bibles/${bibleId}/audio-bibles/${audioBibleId}/chapters/${chapterId}`
      );
      
      if (response.data && response.data.data && response.data.data.url) {
        console.log(`Audio URL trouvée: ${response.data.data.url}`);
        return response.data.data;
      } else {
        throw new Error('Aucune URL audio disponible dans la réponse');
      }
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'audio:', error);
      throw error;
    }
  },
};