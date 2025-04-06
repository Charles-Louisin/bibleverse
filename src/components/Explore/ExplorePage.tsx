import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../Layout/Layout';
import Card from '../UI/Card';
import Button from '../UI/Button';
import { Bible } from '../../types/bible-api.types';
import { bibleApiService } from '../../services/bible-api.service';

const ExplorePage: React.FC = () => {
  const [bibles, setBibles] = useState<Bible[]>([]);
  const [filteredBibles, setFilteredBibles] = useState<Bible[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [languages, setLanguages] = useState<{ id: string; name: string }[]>([]);

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

          {/* Filtres de recherche */}
          <div className="mb-10 p-6 rounded-xl bg-white dark:bg-gray-800 shadow-md">
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
                {filteredBibles.length} {filteredBibles.length === 1 ? 'résultat' : 'résultats'} trouvés
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBibles.map(bible => (
                  <Link to={`/bible/${bible.id}`} key={bible.id}>
                    <Card hoverable className="h-full p-6 flex flex-col">
                      <div className="flex items-center mb-4">
                        <span className="text-sm bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 py-1 px-2 rounded-full">
                          {bible.language.name}
                        </span>
                        {bible.audioBibles && bible.audioBibles.length > 0 && (
                          <span className="ml-2 text-sm bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300 py-1 px-2 rounded-full flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-3 w-3 mr-1">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.465a5 5 0 001.06-7.072m-2.11 9.9a9 9 0 010-12.728" />
                            </svg>
                            Audio
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                        {bible.name}
                      </h3>
                      {bible.nameLocal !== bible.name && (
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                          {bible.nameLocal}
                        </p>
                      )}
                      <p className="text-gray-700 dark:text-gray-300 text-sm flex-grow line-clamp-3">
                        {bible.description || "Pas de description disponible."}
                      </p>
                      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {bible.abbreviation}
                        </span>
                        <span className="inline-flex items-center text-sm text-blue-600 dark:text-blue-400">
                          Explorer
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="ml-1 h-4 w-4">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </span>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>

              {filteredBibles.length === 0 && (
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