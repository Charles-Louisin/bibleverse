import axios from 'axios';
import { ApiResponse, Bible, Book, Chapter, SearchResult, Verse, AudioData, AudioBible } from '../types/bible-api.types';

// URL de base de notre backend proxy
const BASE_URL = 'http://localhost:5000/api';

// Créer une instance axios avec configuration par défaut
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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

// Service pour interagir avec l'API Bible via notre backend
export const bibleApiService = {
  // Récupérer la liste de toutes les bibles disponibles
  getBibles: async (): Promise<Bible[]> => {
    const response = await apiClient.get<ApiResponse<Bible[]>>('/bibles');
    return response.data.data;
  },

  // Récupérer uniquement les bibles qui ont des versions audio
  getBiblesWithAudio: async (): Promise<Bible[]> => {
    const allBibles = await bibleApiService.getBibles();
    return allBibles.filter(bible => bible.audioBibles && bible.audioBibles.length > 0);
  },

  // Récupérer une bible spécifique par ID
  getBible: async (bibleId: string): Promise<Bible> => {
    const response = await apiClient.get<ApiResponse<Bible>>(`/bibles/${bibleId}`);
    return response.data.data;
  },

  // Récupérer tous les livres d'une bible
  getBooks: async (bibleId: string): Promise<Book[]> => {
    const response = await apiClient.get<ApiResponse<Book[]>>(`/bibles/${bibleId}/books`);
    return response.data.data;
  },

  // Récupérer un livre spécifique
  getBook: async (bibleId: string, bookId: string): Promise<Book> => {
    const response = await apiClient.get<ApiResponse<Book>>(`/bibles/${bibleId}/books/${bookId}`);
    return response.data.data;
  },

  // Récupérer les chapitres d'un livre
  getChapters: async (bibleId: string, bookId: string): Promise<Chapter[]> => {
    const response = await apiClient.get<ApiResponse<Chapter[]>>(`/bibles/${bibleId}/books/${bookId}/chapters`);
    return response.data.data;
  },

  // Récupérer un chapitre spécifique
  getChapter: async (bibleId: string, chapterId: string): Promise<Chapter> => {
    const response = await apiClient.get<ApiResponse<Chapter>>(`/bibles/${bibleId}/chapters/${chapterId}`);
    return response.data.data;
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
    const response = await apiClient.get<ApiResponse<SearchResult>>(
      `/bibles/${bibleId}/search`,
      { params: { query, limit, offset } }
    );
    return response.data.data;
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
        console.error('Réponse valide mais sans URL audio', response.data);
        throw new Error('Aucune URL audio disponible dans la réponse');
      }
    } catch (error: any) {
      console.error('Erreur lors de la récupération de l\'audio:', error);
      console.error('Détails de l\'erreur:', error.response?.data || error.message);
      
      // Si le code d'erreur est 404, cela signifie que l'audio n'existe pas pour ce chapitre
      if (error.response && error.response.status === 404) {
        console.log(`Audio non trouvé (404) pour ce chapitre`);
      }
      
      // Retourner une URL de secours pour éviter les erreurs
      return { 
        id: `fallback-${bibleId}-${chapterId}`,
        url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        mimeType: 'audio/mpeg',
        _fallback: true
      };
    }
  },

  clearCache
}; 