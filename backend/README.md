# BibleVerse Backend

Serveur proxy pour l'API Bible Scripture (api.bible) qui résout les problèmes CORS et fournit une interface API simplifiée pour l'application frontend BibleVerse.

## Installation

1. Clonez ce dépôt
2. Installez les dépendances
   ```bash
   cd backend
   npm install
   ```
3. Créez un fichier `.env` à partir du modèle `.env.example`
   ```bash
   cp .env.example .env
   ```
4. Modifiez le fichier `.env` pour ajouter votre clé API Bible
   ```
   PORT=5000
   BIBLE_API_KEY=votre_cle_api_ici
   ```
   > Vous pouvez obtenir une clé API sur [API.Bible](https://scripture.api.bible/)

## Démarrage du serveur

### Mode développement
```bash
npm run dev
```

### Mode production
```bash
npm start
```

## Endpoints API

Le serveur expose les mêmes endpoints que l'API Bible originale, mais avec un préfixe `/api` et sans les problèmes CORS.

### Exemples d'endpoints

- `GET /api/bibles` - Liste toutes les bibles disponibles
- `GET /api/bibles/:bibleId` - Obtient les détails d'une bible spécifique
- `GET /api/bibles/:bibleId/books` - Liste tous les livres d'une bible
- `GET /api/bibles/:bibleId/books/:bookId/chapters` - Liste tous les chapitres d'un livre
- `GET /api/bibles/:bibleId/chapters/:chapterId` - Obtient le contenu d'un chapitre
- `GET /api/bibles/:bibleId/search?query=terme` - Recherche un terme dans la bible
- `GET /api/bibles/:bibleId/audio-bibles/:audioBibleId/chapters/:chapterId` - Obtient les informations audio d'un chapitre

## Notes

- Ce serveur est conçu pour être utilisé avec l'application frontend BibleVerse
- Il résout les problèmes CORS qui empêchent l'accès direct à l'API Bible depuis le navigateur
- Toutes les requêtes sont transmises à l'API originale avec les en-têtes d'authentification appropriés 