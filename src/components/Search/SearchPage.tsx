import React, { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import Layout from '../Layout/Layout';
import Button from '../UI/Button';
import Card from '../UI/Card';
import { Bible, Verse } from '../../types/bible-api.types';
import { bibleApiService } from '../../services/bible-api.service';

const SearchPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [bibles, setBibles] = useState<Bible[]>([]);
  const [selectedBibleId, setSelectedBibleId] = useState<string>('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  
  // Charger les bibles disponibles
  useEffect(() => {
    const fetchBibles = async () => {
      try {
        setInitialLoading(true);
        const data = await bibleApiService.getBibles();
        setBibles(data);
        
        // Si un bibleId est spécifié dans l'URL, l'utiliser
        const urlBibleId = searchParams.get('bible');
        if (urlBibleId) {
          setSelectedBibleId(urlBibleId);
        } else if (data.length > 0) {
          setSelectedBibleId(data[0].id);
        }
        
        // Si une requête est spécifiée dans l'URL, l'utiliser
        const urlQuery = searchParams.get('q');
        if (urlQuery) {
          setQuery(urlQuery);
          // Effectuer la recherche automatiquement
          if (urlBibleId || data.length > 0) {
            const bibleId = urlBibleId || (data.length > 0 ? data[0].id : '');
            searchBible(bibleId, urlQuery);
          }
        }
      } catch (err) {
        setError('Erreur lors du chargement des bibles. Veuillez réessayer.');
        console.error(err);
      } finally {
        setInitialLoading(false);
      }
    };
    
    fetchBibles();
  }, [searchParams]);
  
  // Effectuer la recherche
  const searchBible = async (bibleId: string, searchQuery: string) => {
    if (!bibleId || !searchQuery.trim()) return;
    
    try {
      setLoading(true);
      setError(null);
      setHasSearched(true);
      
      const data = await bibleApiService.search(bibleId, searchQuery);
      setResults(data.verses);
      
      // Mettre à jour l'URL avec les paramètres de recherche
      navigate(`/search?bible=${bibleId}&q=${encodeURIComponent(searchQuery)}`, { replace: true });
    } catch (err) {
      setError('Erreur lors de la recherche. Veuillez réessayer.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Gérer la soumission du formulaire
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    searchBible(selectedBibleId, query);
  };
  
  // Changer la bible sélectionnée
  const handleBibleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedBibleId(e.target.value);
  };

  // Mettre en évidence les termes de recherche dans le contenu
  const highlightSearchTerms = (content: string) => {
    if (!query.trim() || !content) return content;
    
    // Échapper les caractères spéciaux pour regex
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    
    return content.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">$1</mark>');
  };

  return (
    <Layout>
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
              Rechercher dans la Bible
            </h1>
            <p className="text-lg text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
              Trouvez des passages, des versets ou des mots spécifiques dans la Bible
            </p>
          </div>

          {/* Formulaire de recherche */}
          <Card className="p-6 mb-10 shadow-lg bg-white dark:bg-gray-800">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-1">
                  <label htmlFor="bible" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Version de la Bible
                  </label>
                  <select
                    id="bible"
                    value={selectedBibleId}
                    onChange={handleBibleChange}
                    className="block w-full p-3 rounded-md bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                    disabled={initialLoading}
                  >
                    {initialLoading ? (
                      <option>Chargement...</option>
                    ) : (
                      bibles.map(bible => (
                        <option key={bible.id} value={bible.id}>
                          {bible.name} ({bible.language.name})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div className="md:col-span-3">
                  <label htmlFor="query" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Terme de recherche
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="query"
                      placeholder="Entrez un mot, une phrase ou une référence..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="block w-full p-3 pr-32 rounded-md bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                      disabled={initialLoading}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                      <Button
                        type="submit"
                        disabled={initialLoading || !query.trim() || !selectedBibleId}
                        className="h-10"
                        icon={
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-5 w-5">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        }
                      >
                        Rechercher
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </Card>

          {/* Résultats de recherche */}
          {initialLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : loading ? (
            <div className="relative py-12">
              <div className="flex justify-center items-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
              </div>
              <div className="mt-4 text-center text-gray-600 dark:text-gray-400">
                Recherche en cours...
              </div>
              
              {/* Effet de vague */}
              <div className="absolute inset-0 -z-10 overflow-hidden">
                <div className="absolute inset-0 bg-blue-500/5 dark:bg-blue-600/10 rounded-full filter blur-3xl animate-pulse"></div>
              </div>
            </div>
          ) : error ? (
            <Card className="p-6 text-center text-red-600 dark:text-red-400">
              {error}
            </Card>
          ) : hasSearched ? (
            <div>
              <div className="mb-6 text-gray-700 dark:text-gray-300">
                {results.length === 0 ? (
                  <p>Aucun résultat trouvé pour "{query}"</p>
                ) : (
                  <p>{results.length} résultat(s) trouvé(s) pour "{query}"</p>
                )}
              </div>
              
              {results.length > 0 && (
                <div className="space-y-6">
                  {results.map((verse, index) => (
                    <Card key={index} className="p-6 hover:shadow-lg transition-all">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {verse.reference}
                        </h3>
                        <Link to={`/bible/${selectedBibleId}/chapter/${verse.chapterId}`}>
                          <Button variant="ghost" size="sm">
                            Voir le chapitre
                          </Button>
                        </Link>
                      </div>
                      <div 
                        className="prose prose-sm dark:prose-invert"
                        dangerouslySetInnerHTML={{ __html: highlightSearchTerms(verse.content) }}
                      />
                    </Card>
                  ))}
                </div>
              )}
              
              {results.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">🔍</div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                    Aucun résultat trouvé
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 mb-6">
                    Essayez de modifier vos termes de recherche ou de sélectionner une autre version de la Bible.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                Commencez votre recherche
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                Entrez un mot, une phrase ou une référence biblique pour trouver des passages correspondants.
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default SearchPage; 