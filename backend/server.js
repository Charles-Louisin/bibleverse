const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const BIBLE_API_KEY = process.env.BIBLE_API_KEY;
const BIBLE_API_BASE_URL = 'https://api.scripture.api.bible/v1';

// Middleware
app.use(cors());
app.use(express.json());

// Vérifier si la clé API est configurée
if (!BIBLE_API_KEY) {
  console.error('ERREUR: Clé API Bible non configurée. Ajoutez-la dans le fichier .env');
  process.exit(1);
} else {
  console.log('Clé API Bible configurée avec succès');
  console.log('Clé utilisée (premiers caractères): ' + BIBLE_API_KEY.substring(0, 5) + '...');
}

// Configuration de l'instance axios pour les appels à l'API Bible
const bibleApi = axios.create({
  baseURL: BIBLE_API_BASE_URL,
  headers: {
    'api-key': BIBLE_API_KEY,
    'Content-Type': 'application/json',
  },
});

// Ajouter un intercepteur pour loguer les requêtes
bibleApi.interceptors.request.use(request => {
  console.log('Requête API Bible:', request.method.toUpperCase(), request.url);
  console.log('En-têtes:', JSON.stringify(request.headers));
  return request;
});

// Ajouter un intercepteur pour loguer les réponses
bibleApi.interceptors.response.use(
  response => {
    console.log('Réponse API Bible:', response.status, response.statusText);
    return response;
  },
  error => {
    console.error('Erreur API Bible:', error.message);
    if (error.response) {
      console.error('Détails:', error.response.status, error.response.statusText);
      console.error('Données:', JSON.stringify(error.response.data));
    }
    return Promise.reject(error);
  }
);

// Endpoint pour obtenir toutes les bibles
app.get('/api/bibles', async (req, res) => {
  try {
    const response = await bibleApi.get('/bibles');
    res.json(response.data);
  } catch (error) {
    console.error('Erreur lors de la récupération des bibles:', error.message);
    res.status(error.response?.status || 500).json({
      error: 'Erreur lors de la récupération des bibles',
      details: error.response?.data || error.message
    });
  }
});

// Endpoint pour obtenir une bible spécifique
app.get('/api/bibles/:bibleId', async (req, res) => {
  try {
    const { bibleId } = req.params;
    const response = await bibleApi.get(`/bibles/${bibleId}`);
    res.json(response.data);
  } catch (error) {
    console.error(`Erreur lors de la récupération de la bible ${req.params.bibleId}:`, error.message);
    res.status(error.response?.status || 500).json({
      error: `Erreur lors de la récupération de la bible ${req.params.bibleId}`,
      details: error.response?.data || error.message
    });
  }
});

// Endpoint pour obtenir les livres d'une bible
app.get('/api/bibles/:bibleId/books', async (req, res) => {
  try {
    const { bibleId } = req.params;
    const response = await bibleApi.get(`/bibles/${bibleId}/books`);
    res.json(response.data);
  } catch (error) {
    console.error(`Erreur lors de la récupération des livres:`, error.message);
    res.status(error.response?.status || 500).json({
      error: 'Erreur lors de la récupération des livres',
      details: error.response?.data || error.message
    });
  }
});

// Endpoint pour obtenir un livre spécifique
app.get('/api/bibles/:bibleId/books/:bookId', async (req, res) => {
  try {
    const { bibleId, bookId } = req.params;
    const response = await bibleApi.get(`/bibles/${bibleId}/books/${bookId}`);
    res.json(response.data);
  } catch (error) {
    console.error(`Erreur lors de la récupération du livre:`, error.message);
    res.status(error.response?.status || 500).json({
      error: 'Erreur lors de la récupération du livre',
      details: error.response?.data || error.message
    });
  }
});

// Endpoint pour obtenir les chapitres d'un livre
app.get('/api/bibles/:bibleId/books/:bookId/chapters', async (req, res) => {
  try {
    const { bibleId, bookId } = req.params;
    const response = await bibleApi.get(`/bibles/${bibleId}/books/${bookId}/chapters`);
    res.json(response.data);
  } catch (error) {
    console.error(`Erreur lors de la récupération des chapitres:`, error.message);
    res.status(error.response?.status || 500).json({
      error: 'Erreur lors de la récupération des chapitres',
      details: error.response?.data || error.message
    });
  }
});

// Endpoint pour obtenir un chapitre spécifique
app.get('/api/bibles/:bibleId/chapters/:chapterId', async (req, res) => {
  try {
    const { bibleId, chapterId } = req.params;
    const response = await bibleApi.get(`/bibles/${bibleId}/chapters/${chapterId}`);
    res.json(response.data);
  } catch (error) {
    console.error(`Erreur lors de la récupération du chapitre:`, error.message);
    res.status(error.response?.status || 500).json({
      error: 'Erreur lors de la récupération du chapitre',
      details: error.response?.data || error.message
    });
  }
});

// Endpoint pour obtenir un verset spécifique
app.get('/api/bibles/:bibleId/verses/:verseId', async (req, res) => {
  try {
    const { bibleId, verseId } = req.params;
    const response = await bibleApi.get(`/bibles/${bibleId}/verses/${verseId}`);
    res.json(response.data);
  } catch (error) {
    console.error(`Erreur lors de la récupération du verset:`, error.message);
    res.status(error.response?.status || 500).json({
      error: 'Erreur lors de la récupération du verset',
      details: error.response?.data || error.message
    });
  }
});

// Endpoint pour recherche dans la bible
app.get('/api/bibles/:bibleId/search', async (req, res) => {
  try {
    const { bibleId } = req.params;
    const { query, limit, offset } = req.query;
    const response = await bibleApi.get(`/bibles/${bibleId}/search`, {
      params: { query, limit, offset }
    });
    res.json(response.data);
  } catch (error) {
    console.error(`Erreur lors de la recherche:`, error.message);
    res.status(error.response?.status || 500).json({
      error: 'Erreur lors de la recherche',
      details: error.response?.data || error.message
    });
  }
});

// Endpoint pour récupérer l'audio d'un chapitre
app.get('/api/bibles/:bibleId/audio-bibles/:audioBibleId/chapters/:chapterId', async (req, res) => {
  try {
    const { bibleId, audioBibleId, chapterId } = req.params;
    console.log(`[AUDIO API] Demande reçue avec: bibleId=${bibleId}, audioBibleId=${audioBibleId}, chapterId=${chapterId}`);
    
    // Vérifier d'abord si la bible audio existe
    console.log(`[AUDIO API] Vérification de l'existence de la bible audio: ${audioBibleId}`);
    try {
      const audioBibleUrl = `${BIBLE_API_BASE_URL}/audio-bibles/${audioBibleId}`;
      const headers = {
        'api-key': BIBLE_API_KEY,
        'Content-Type': 'application/json'
      };
      
      const audioBibleResponse = await axios.get(audioBibleUrl, { headers });
      console.log(`[AUDIO API] Vérification de la bible audio: ${audioBibleResponse.status} - ${audioBibleResponse.statusText}`);
      console.log(`[AUDIO API] Détails bible audio: ${JSON.stringify(audioBibleResponse.data, null, 2)}`);
    } catch (audioBibleError) {
      console.error(`[AUDIO API] La bible audio ${audioBibleId} n'existe pas ou n'est pas accessible:`, audioBibleError.message);
      console.error(`[AUDIO API] Statut: ${audioBibleError.response?.status}, Détails: ${JSON.stringify(audioBibleError.response?.data, null, 2)}`);
    }
    
    // Procéder avec la requête de chapitre audio
    const url = `${BIBLE_API_BASE_URL}/bibles/${bibleId}/audio-bibles/${audioBibleId}/chapters/${chapterId}`;
    const headers = {
      'api-key': BIBLE_API_KEY,
      'Content-Type': 'application/json'
    };
    
    console.log(`[AUDIO API] Requête vers: ${url}`);
    console.log(`[AUDIO API] En-têtes: ${JSON.stringify(headers, null, 2)}`);
    
    // Vérifier directement avec l'API externe
    try {
      const directResponse = await axios.get(`https://api.scripture.api.bible/v1/bibles/${bibleId}/audio-bibles`, { 
        headers: { 'api-key': BIBLE_API_KEY }
      });
      console.log(`[AUDIO API] Vérification des audio-bibles disponibles pour ${bibleId}:`, directResponse.status);
      console.log(`[AUDIO API] Audio-bibles disponibles: ${JSON.stringify(directResponse.data, null, 2)}`);
    } catch (directError) {
      console.error(`[AUDIO API] Erreur lors de la vérification directe des audio-bibles:`, directError.message);
      console.error(`[AUDIO API] Statut: ${directError.response?.status}, Détails: ${JSON.stringify(directError.response?.data, null, 2)}`);
    }
    
    // Effectuer la requête principale
    const response = await axios.get(url, { headers });
    console.log(`[AUDIO API] Réponse: ${response.status} - ${response.statusText}`);
    console.log(`[AUDIO API] Contenu de la réponse: ${JSON.stringify(response.data, null, 2)}`);
    
    // Vérifier si une URL audio valide existe
    if (response.data && response.data.data && response.data.data.url) {
      console.log(`[AUDIO API] URL audio trouvée: ${response.data.data.url}`);
      return res.json(response.data);
    } else {
      // Pas d'URL audio trouvée, fournir une URL de secours
      console.log(`[AUDIO API] Pas d'URL audio disponible dans la réponse: ${JSON.stringify(response.data)}`);
      return res.json({
        data: {
          id: `fallback-${bibleId}-${chapterId}`,
          url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
          mimeType: 'audio/mpeg',
          _fallback: true
        }
      });
    }
  } catch (error) {
    console.error(`[AUDIO API] Erreur lors de la récupération de l'audio:`, error.message);
    if (error.response) {
      console.error(`[AUDIO API] Statut de l'erreur: ${error.response.status}`);
      console.error(`[AUDIO API] Données de l'erreur: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    
    // Renvoyer une erreur avec URL de secours
    res.status(error.response?.status || 500).json({
      error: "Erreur lors de la récupération de l'audio",
      details: error.response?.data || error.message,
      fallback: {
        id: `fallback-${req.params.bibleId}-${req.params.chapterId}`,
        url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        mimeType: 'audio/mpeg',
        _fallback: true
      }
    });
  }
});

// Endpoint pour vérifier si un chapitre a de l'audio disponible
app.get('/api/bibles/:bibleId/audio-bibles/:audioBibleId/chapters/:chapterId/check', async (req, res) => {
  try {
    const { bibleId, audioBibleId, chapterId } = req.params;
    console.log(`[AUDIO CHECK API] Vérification d'audio pour: bibleId=${bibleId}, audioBibleId=${audioBibleId}, chapterId=${chapterId}`);
    
    const url = `${BIBLE_API_BASE_URL}/bibles/${bibleId}/audio-bibles/${audioBibleId}/chapters/${chapterId}`;
    const headers = {
      'api-key': BIBLE_API_KEY,
      'Content-Type': 'application/json'
    };
    
    console.log(`[AUDIO CHECK API] Requête vers: ${url}`);
    
    try {
      const response = await axios.get(url, { headers });
      console.log(`[AUDIO CHECK API] Réponse: ${response.status} - ${response.statusText}`);
      console.log(`[AUDIO CHECK API] Données brutes: ${JSON.stringify(response.data, null, 2)}`);
      
      // Vérifier si une URL audio valide existe
      if (response.data && response.data.data && response.data.data.url) {
        console.log(`[AUDIO CHECK API] URL audio trouvée: ${response.data.data.url}`);
        
        // Essayer de vérifier si l'URL est accessible
        try {
          const audioResponse = await axios.head(response.data.data.url, { timeout: 5000 });
          console.log(`[AUDIO CHECK API] Vérification de l'URL audio: ${audioResponse.status}`);
          return res.json({ 
            available: true,
            url: response.data.data.url,
            status: audioResponse.status
          });
        } catch (audioError) {
          console.error(`[AUDIO CHECK API] Erreur lors de la vérification de l'URL audio: ${audioError.message}`);
          // Même si on ne peut pas vérifier l'URL, on considère qu'elle est disponible si elle existe
          return res.json({ 
            available: true,
            url: response.data.data.url,
            note: "URL existe mais n'a pas pu être vérifiée"
          });
        }
      } else {
        console.log(`[AUDIO CHECK API] Pas d'URL audio disponible dans la réponse`);
        return res.json({ available: false });
      }
    } catch (apiError) {
      // Si le code d'erreur est 404, cela signifie que l'audio n'existe pas pour ce chapitre
      if (apiError.response && apiError.response.status === 404) {
        console.log(`[AUDIO CHECK API] Audio non trouvé (404) pour ce chapitre`);
        return res.json({ available: false, reason: "404_NOT_FOUND" });
      }
      
      console.error(`[AUDIO CHECK API] Erreur API: ${apiError.message}`);
      console.error(`[AUDIO CHECK API] Statut: ${apiError.response?.status}, Détails: ${JSON.stringify(apiError.response?.data, null, 2)}`);
      
      // Si l'erreur est autre que 404, on peut quand même considérer que le chapitre n'a pas d'audio
      return res.json({ available: false, error: apiError.message });
    }
  } catch (error) {
    console.error(`[AUDIO CHECK API] Erreur lors de la vérification de l'audio:`, error.message);
    res.status(error.response?.status || 500).json({
      available: false,
      error: "Erreur lors de la vérification de l'audio",
      details: error.response?.data || error.message
    });
  }
});

// Endpoint pour récupérer les audio bibles d'une bible
app.get('/api/bibles/:bibleId/audio-bibles', async (req, res) => {
  try {
    const { bibleId } = req.params;
    console.log(`[AUDIO BIBLES API] Récupération des audio bibles pour: bibleId=${bibleId}`);
    
    const url = `${BIBLE_API_BASE_URL}/bibles/${bibleId}/audio-bibles`;
    const headers = {
      'api-key': BIBLE_API_KEY,
      'Content-Type': 'application/json'
    };
    
    const response = await axios.get(url, { headers });
    console.log(`[AUDIO BIBLES API] Réponse: ${response.status} - ${response.statusText}`);
    
    return res.json(response.data);
  } catch (error) {
    console.error(`[AUDIO BIBLES API] Erreur lors de la récupération des audio bibles:`, error.message);
    
    // Si l'erreur est un 404, renvoyer un tableau vide plutôt qu'une erreur
    if (error.response && error.response.status === 404) {
      return res.json({ data: [] });
    }
    
    res.status(error.response?.status || 500).json({
      error: "Erreur lors de la récupération des audio bibles",
      details: error.response?.data || error.message
    });
  }
});

// Route de fallback pour les autres endpoints de l'API Bible
app.all('/api/bibles/*', async (req, res) => {
  try {
    const path = req.path.replace('/api', '');
    const method = req.method.toLowerCase();
    const response = await bibleApi({
      method,
      url: path,
      data: method !== 'get' ? req.body : undefined,
      params: method === 'get' ? req.query : undefined
    });
    res.json(response.data);
  } catch (error) {
    console.error(`Erreur lors de l'appel à l'API:`, error.message);
    res.status(error.response?.status || 500).json({
      error: "Erreur lors de l'appel à l'API",
      details: error.response?.data || error.message
    });
  }
});

// Route pour la page d'accueil
app.get('/', (req, res) => {
  res.send('API Backend BibleVerse fonctionne !');
});

// Route pour vérifier si le serveur est en ligne
app.get('/api/status', (req, res) => {
  console.log('Requête de vérification du statut reçue');
  res.json({ status: 'ok', message: 'Le serveur est en ligne' });
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
}); 