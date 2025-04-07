import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../Layout/Layout';
import Card from '../UI/Card';
import Button from '../UI/Button';
import { Bible } from '../../types/bible-api.types';
import { bibleApiService } from '../../services/bible-api.service';
import SearchBar from '../UI/SearchBar';

const ExplorePage: React.FC = () => {
  const [bibles, setBibles] = useState<Bible[]>([]);
  const [filteredBibles, setFilteredBibles] = useState<Bible[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [languages, setLanguages] = useState<{ id: string; name: string }[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favoritesDebug, setFavoritesDebug] = useState<string>('');

  useEffect(() => {
    const fetchBibles = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await bibleApiService.getBibles();
        setBibles(data);
        setFilteredBibles(data);
        
        // Extraire les langues uniques
        const uniqueLanguages = Array.from(
          new Set(data.map(bible => bible.language.id))
        ).map(langId => {
          const bible = data.find(b => b.language.id === langId);
          return {
            id: langId,
            name: bible?.language.name || langId
          };
        });
        
        setLanguages(uniqueLanguages);
      } catch (err) {
        setError('Erreur lors du chargement des bibles. Veuillez réessayer.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchBibles();
  }, []);

  // Charger les favoris depuis le localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('bibleFavorites');
    setFavoritesDebug(`Récupéré du localStorage: ${savedFavorites}`);
    
    if (savedFavorites) {
      try {
        const parsedFavorites = JSON.parse(savedFavorites);
        if (Array.isArray(parsedFavorites)) {
          setFavorites(parsedFavorites);
          setFavoritesDebug(prev => `${prev}\nParsé avec succès: ${JSON.stringify(parsedFavorites)}`);
        } else {
          setFavoritesDebug(prev => `${prev}\nFormat incorrect, pas un tableau`);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des favoris:", error);
        setFavoritesDebug(prev => `${prev}\nErreur de parsing: ${error}`);
        localStorage.removeItem('bibleFavorites');
      }
    } else {
      setFavoritesDebug(prev => `${prev}\nAucun favori trouvé dans localStorage`);
    }
  }, []);

  // Sauvegarder les favoris dans le localStorage
  useEffect(() => {
    // Ne pas sauvegarder lors du premier rendu (quand favorites est vide)
    if (favorites.length === 0 && favoritesDebug === '') return;
    
    try {
      const favoritesString = JSON.stringify(favorites);
      localStorage.setItem('bibleFavorites', favoritesString);
      setFavoritesDebug(prev => `${prev}\nSauvegardé dans localStorage: ${favoritesString}`);
      console.log("Favoris sauvegardés:", favorites);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde des favoris:", error);
      setFavoritesDebug(prev => `${prev}\nErreur de sauvegarde: ${error}`);
    }
  }, [favorites]);

  const toggleFavorite = (bibleId: string) => {
    setFavorites(prev => {
      const newFavorites = prev.includes(bibleId)
        ? prev.filter(id => id !== bibleId)
        : [...prev, bibleId];
      
      // Force la sauvegarde immédiate dans localStorage
      try {
        localStorage.setItem('bibleFavorites', JSON.stringify(newFavorites));
        setFavoritesDebug(prev => `${prev}\nToggle et sauvegarde immédiate: ${JSON.stringify(newFavorites)}`);
      } catch (error) {
        console.error("Erreur lors de la sauvegarde immédiate des favoris:", error);
      }
      
      return newFavorites;
    });
  };

  // Filtrer les bibles en fonction de la recherche et de la langue sélectionnée
  useEffect(() => {
    let result = bibles;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        bible => 
          bible.name.toLowerCase().includes(query) ||
          (bible.nameLocal && bible.nameLocal.toLowerCase().includes(query)) ||
          (bible.description && bible.description.toLowerCase().includes(query)) ||
          (bible.language && bible.language.name && bible.language.name.toLowerCase().includes(query))
      );
    }
    
    if (selectedLanguage) {
      result = result.filter(bible => bible.language.id === selectedLanguage);
    }
    
    setFilteredBibles(result);
  }, [searchQuery, selectedLanguage, bibles]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedLanguage(e.target.value);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedLanguage('');
  };

  // Trier les bibles : favoris d'abord, puis les autres
  const sortedBibles = [...filteredBibles].sort((a, b) => {
    const aIsFavorite = favorites.includes(a.id);
    const bIsFavorite = favorites.includes(b.id);
    if (aIsFavorite && !bIsFavorite) return -1;
    if (!aIsFavorite && bIsFavorite) return 1;
    return 0;
  });

  // Filtrer les bibles selon la recherche - exclure les favoris qui sont déjà affichés séparément
  const filteredBiblesSorted = sortedBibles
    .filter(bible => 
      bible.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bible.language.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter(bible => !favorites.includes(bible.id) || (searchQuery !== '' || selectedLanguage !== ''));

  return (
    <Layout>
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
              Explorer les Bibles
            </h1>
            <p className="text-lg text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
              Découvrez des milliers de versions de la Bible dans différentes langues
            </p>
          </div>

          {/* Section Favoris */}
          {favorites.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
                Mes Bibles favorites
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBibles
                  .filter(bible => favorites.includes(bible.id))
                  .map(bible => (
                    <Card key={bible.id} className="relative">
                      <button
                        onClick={() => toggleFavorite(bible.id)}
                        className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6 text-yellow-500 fill-current"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                          />
                        </svg>
                      </button>
                      <Link to={`/bible/${bible.id}`}>
                        <div className="p-6">
                          <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                            {bible.name}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                            {bible.language.name}
                          </p>
                          <p className="text-gray-700 dark:text-gray-300 line-clamp-3">
                            {bible.description || "Version disponible pour la lecture et l'étude."}
                          </p>
                        </div>
                      </Link>
                    </Card>
                  ))}
              </div>
            </div>
          )}

          {/* Filtres de recherche */}
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="relative">
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Rechercher
                </label>
                <input
                  type="text"
                  id="search"
                  placeholder="Nom, description..."
                  value={searchQuery}
                  onChange={handleSearch}
                  className="block w-full p-3 rounded-md bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="language" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Langue
                </label>
                <select
                  id="language"
                  value={selectedLanguage}
                  onChange={handleLanguageChange}
                  className="block w-full p-3 rounded-md bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                >
                  <option value="">Toutes les langues</option>
                  {languages.map(lang => (
                    <option key={lang.id} value={lang.id}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <Button
                  onClick={clearFilters}
                  variant="secondary"
                  className="w-full"
                >
                  Réinitialiser les filtres
                </Button>
              </div>
            </div>
          </div>

          {/* Résultats */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <Card className="p-6 text-center text-red-600 dark:text-red-400">
              {error}
            </Card>
          ) : (
            <div>
              <p className="mb-4 text-gray-700 dark:text-gray-300">
                {filteredBiblesSorted.length} {filteredBiblesSorted.length === 1 ? 'résultat' : 'résultats'} trouvés
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBiblesSorted.map(bible => (
                  <Card key={bible.id} className="relative">
                    <button
                      onClick={() => toggleFavorite(bible.id)}
                      className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`h-6 w-6 ${
                          favorites.includes(bible.id)
                            ? 'text-yellow-500 fill-current'
                            : 'text-gray-400'
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                        />
                      </svg>
                    </button>
                    <Link to={`/bible/${bible.id}`}>
                      <div className="p-6">
                        <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                          {bible.name}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                          {bible.language.name}
                        </p>
                        <p className="text-gray-700 dark:text-gray-300 line-clamp-3">
                          {bible.description || "Version disponible pour la lecture et l'étude."}
                        </p>
                      </div>
                    </Link>
                  </Card>
                ))}
              </div>

              {filteredBiblesSorted.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">📚</div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                    Aucun résultat trouvé
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    Essayez de modifier vos critères de recherche.
                  </p>
                  <Button onClick={clearFilters} className="mt-4">
                    Réinitialiser les filtres
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ExplorePage; 