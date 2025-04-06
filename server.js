// Endpoint pour obtenir toutes les audio bibles disponibles
app.get('/api/audio-bibles', async (req, res) => {
  try {
    console.log('[AUDIO API] Demande de liste des audio bibles reçue');
    const response = await bibleApi.get('/audio-bibles');
    console.log(`[AUDIO API] Réponse: ${response.status} - ${response.statusText}`);
    res.json(response.data);
  } catch (error) {
    console.error('Erreur lors de la récupération des audio bibles:', error.message);
    res.status(error.response?.status || 500).json({
      error: 'Erreur lors de la récupération des audio bibles',
      details: error.response?.data || error.message
    });
  }
});

// Endpoint pour obtenir une audio bible spécifique
app.get('/api/audio-bibles/:audioBibleId', async (req, res) => {
  try {
    const { audioBibleId } = req.params;
    console.log(`[AUDIO API] Demande d'information pour l'audio bible ${audioBibleId}`);
    const response = await bibleApi.get(`/audio-bibles/${audioBibleId}`);
    console.log(`[AUDIO API] Réponse: ${response.status} - ${response.statusText}`);
    res.json(response.data);
  } catch (error) {
    console.error(`Erreur lors de la récupération de l'audio bible ${req.params.audioBibleId}:`, error.message);
    res.status(error.response?.status || 500).json({
      error: `Erreur lors de la récupération de l'audio bible ${req.params.audioBibleId}`,
      details: error.response?.data || error.message
    });
  }
});

// Endpoint pour obtenir la liste des audio bibles disponibles pour une bible
app.get('/api/bibles/:bibleId/audio-bibles', async (req, res) => {
  try {
    const { bibleId } = req.params;
    console.log(`[AUDIO API] Demande des audio bibles pour la bible ${bibleId}`);
    const response = await bibleApi.get(`/bibles/${bibleId}/audio-bibles`);
    console.log(`[AUDIO API] Réponse: ${response.status} - ${response.statusText}`);
    res.json(response.data);
  } catch (error) {
    console.error(`Erreur lors de la récupération des audio bibles pour ${bibleId}:`, error.message);
    res.status(error.response?.status || 500).json({
      error: 'Erreur lors de la récupération des audio bibles',
      details: error.response?.data || error.message
    });
  }
});

// Endpoint pour obtenir les livres disponibles pour une audio bible
app.get('/api/audio-bibles/:audioBibleId/books', async (req, res) => {
  try {
    const { audioBibleId } = req.params;
    console.log(`[AUDIO API] Demande des livres pour l'audio bible ${audioBibleId}`);
    const response = await bibleApi.get(`/audio-bibles/${audioBibleId}/books`);
    console.log(`[AUDIO API] Réponse: ${response.status} - ${response.statusText}`);
    res.json(response.data);
  } catch (error) {
    console.error(`Erreur lors de la récupération des livres audio:`, error.message);
    res.status(error.response?.status || 500).json({
      error: 'Erreur lors de la récupération des livres audio',
      details: error.response?.data || error.message
    });
  }
});

// Endpoint pour obtenir les chapitres audio disponibles pour un livre
app.get('/api/audio-bibles/:audioBibleId/books/:bookId/chapters', async (req, res) => {
  try {
    const { audioBibleId, bookId } = req.params;
    console.log(`[AUDIO API] Demande des chapitres audio pour le livre ${bookId} de l'audio bible ${audioBibleId}`);
    const response = await bibleApi.get(`/audio-bibles/${audioBibleId}/books/${bookId}/chapters`);
    console.log(`[AUDIO API] Réponse: ${response.status} - ${response.statusText}`);
    res.json(response.data);
  } catch (error) {
    console.error(`Erreur lors de la récupération des chapitres audio:`, error.message);
    res.status(error.response?.status || 500).json({
      error: 'Erreur lors de la récupération des chapitres audio',
      details: error.response?.data || error.message
    });
  }
});

// Endpoint pour obtenir un chapitre audio spécifique
app.get('/api/audio-bibles/:audioBibleId/chapters/:chapterId', async (req, res) => {
  try {
    const { audioBibleId, chapterId } = req.params;
    console.log(`[AUDIO API] Demande du chapitre audio ${chapterId} pour l'audio bible ${audioBibleId}`);
    const response = await bibleApi.get(`/audio-bibles/${audioBibleId}/chapters/${chapterId}`);
    console.log(`[AUDIO API] Réponse: ${response.status} - ${response.statusText}`);
    
    // Vérifier que l'URL audio est présente dans la réponse
    if (response.data && response.data.data && response.data.data.resourceUrl) {
      console.log(`[AUDIO API] URL audio trouvée: ${response.data.data.resourceUrl}`);
      return res.json(response.data);
    } else {
      console.log(`[AUDIO API] Pas d'URL audio disponible dans la réponse`);
      return res.status(404).json({
        error: "Audio non disponible",
        message: "Aucune URL audio n'a été trouvée pour ce chapitre"
      });
    }
  } catch (error) {
    console.error(`Erreur lors de la récupération du chapitre audio:`, error.message);
    res.status(error.response?.status || 500).json({
      error: 'Erreur lors de la récupération du chapitre audio',
      details: error.response?.data || error.message
    });
  }
}); 