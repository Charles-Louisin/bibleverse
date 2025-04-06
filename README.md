# BibleVerse - L'application Bible Futuriste

BibleVerse est une application web futuriste pour explorer, lire et écouter la Bible. Avec son design moderne et ses animations fluides, BibleVerse offre une expérience immersive pour découvrir les textes sacrés.

## Fonctionnalités

- 🔎 **Navigation intuitive** à travers les différentes versions de la Bible, livres et chapitres
- 🔄 **Mode clair/sombre** automatique avec système de thème personnalisé
- 🌐 **Support multilingue** pour explorer la Bible dans différentes langues
- 🔍 **Recherche avancée** pour trouver rapidement des passages ou versets spécifiques
- 🎧 **Lecteur audio** pour écouter la Bible avec des narrations professionnelles
- 📱 **Design responsive** s'adaptant à tous les appareils (mobile, tablette, desktop)
- ✏️ **Mode surlignage** pour mettre en évidence des passages importants
- 🖥️ **Mode plein écran** pour une lecture sans distraction

## Technologies utilisées

- **React** avec TypeScript pour le développement frontend
- **React Router** pour la navigation
- **Tailwind CSS** pour le styling
- **API.Bible** pour accéder aux données bibliques
- **Context API** pour la gestion d'état
- **Express** pour le serveur backend proxy

## Installation et démarrage

### Frontend

1. Clonez ce dépôt
   ```bash
   git clone https://github.com/votre-utilisateur/bible-verse.git
   cd bible-verse
   ```

2. Installez les dépendances
   ```bash
   npm install
   ```

3. Créez un fichier `.env.local` à la racine du projet en utilisant `.env.sample` comme modèle
   ```
   REACT_APP_BIBLE_API_KEY=votre_api_key_ici
   ```
   > Pour obtenir une clé API, visitez [API.Bible](https://scripture.api.bible/)

4. Lancez l'application en mode développement
   ```bash
   npm start
   ```

### Backend (nécessaire pour l'API)

Le backend sert de proxy pour l'API Bible afin de résoudre les problèmes CORS.

1. Accédez au dossier backend
   ```bash
   cd backend
   ```

2. Installez les dépendances
   ```bash
   npm install
   ```

3. Créez un fichier `.env` à partir du modèle
   ```bash
   cp .env.example .env
   ```

4. Modifiez le fichier `.env` pour ajouter votre clé API Bible
   ```
   PORT=5000
   BIBLE_API_KEY=votre_cle_api_ici
   ```

5. Démarrez le serveur backend
   ```bash
   npm run dev
   ```

## Résolution des problèmes CORS

Cette application utilise un serveur backend proxy pour communiquer avec l'API Bible et éviter les problèmes CORS. Le serveur backend doit être démarré avant l'application frontend.

Si vous rencontrez des problèmes d'accès à l'API, assurez-vous que :

1. Le serveur backend est bien en cours d'exécution sur le port 5000
2. Votre clé API est correctement configurée dans le fichier `.env` du backend
3. Le frontend est configuré pour communiquer avec le backend (BASE_URL dans bible-api.service.ts)

## Structure du projet

```
/
├── backend/              # Serveur proxy pour l'API Bible
│   ├── server.js         # Serveur Express
│   └── package.json      # Dépendances du backend
│
├── src/
│   ├── components/       # Composants React
│   │   ├── Audio/        # Composants pour la partie audio
│   │   ├── Bible/        # Composants pour l'affichage de la Bible
│   │   ├── Explore/      # Composants d'exploration des versions
│   │   ├── Home/         # Page d'accueil
│   │   ├── Layout/       # Mise en page globale
│   │   ├── Navigation/   # Composants de navigation
│   │   ├── Search/       # Composants de recherche
│   │   └── UI/           # Composants UI réutilisables
│   ├── contexts/         # Contextes React pour la gestion d'état
│   ├── services/         # Services d'API
│   └── types/            # Types TypeScript
└── package.json          # Dépendances du frontend
```

## Captures d'écran

*Des captures d'écran seront ajoutées ici.*

## Contribuer

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou à soumettre une pull request pour améliorer cette application.

## Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.
