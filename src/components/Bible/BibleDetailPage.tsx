import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Layout from '../Layout/Layout';
import Button from '../UI/Button';
import Card from '../UI/Card';
import { Bible, Book, Chapter } from '../../types/bible-api.types';
import { bibleApiService } from '../../services/bible-api.service';

const BibleDetailPage: React.FC = () => {
  const { bibleId } = useParams<{ bibleId: string }>();
  const navigate = useNavigate();
  
  const [bible, setBible] = useState<Bible | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Charger les détails de la Bible
  useEffect(() => {
    const fetchBibleDetails = async () => {
      if (!bibleId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Récupérer les détails de la Bible
        const bibleData = await bibleApiService.getBible(bibleId);
        setBible(bibleData);
        
        // Récupérer les livres de cette Bible
        const booksData = await bibleApiService.getBooks(bibleId);
        setBooks(booksData);
      } catch (err) {
        setError('Erreur lors du chargement des détails. Veuillez réessayer.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBibleDetails();
  }, [bibleId]);
  
  // Charger les chapitres pour un livre sélectionné
  const handleBookSelect = async (book: Book) => {
    setSelectedBook(book);
    
    try {
      setLoading(true);
      
      // Récupérer les chapitres du livre
      const chaptersData = await bibleApiService.getChapters(bibleId!, book.id);
      setChapters(chaptersData);
    } catch (err) {
      setError('Erreur lors du chargement des chapitres. Veuillez réessayer.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Naviguer vers un chapitre spécifique
  const navigateToChapter = (chapterId: string) => {
    navigate(`/bible/${bibleId}/chapter/${chapterId}`);
  };
  
  // Gérer le retour vers la liste des livres
  const handleBackToBooks = () => {
    setSelectedBook(null);
    setChapters([]);
  };

  // Grouper les livres par type (Ancien Testament, Nouveau Testament, etc.)
  const groupedBooks = books.reduce<{ [key: string]: Book[] }>((groups, book) => {
    // Déterminer le groupe en fonction des conventions bibliques
    let group = 'Autres';
    
    // Les livres 1-39 sont généralement l'Ancien Testament
    if (books.indexOf(book) < 39) {
      group = 'Ancien Testament';
    }
    // Les livres 40-66 sont généralement le Nouveau Testament
    else if (books.indexOf(book) < 66) {
      group = 'Nouveau Testament';
    }
    
    if (!groups[group]) {
      groups[group] = [];
    }
    
    groups[group].push(book);
    return groups;
  }, {});

  return (
    <Layout>
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Navigation */}
          <nav className="mb-8 flex items-center space-x-2 text-sm">
            <Link to="/explore" className="text-blue-600 dark:text-blue-400 hover:underline">
              Explorer
            </Link>
            <span className="text-gray-500 dark:text-gray-400">/</span>
            <span className="text-gray-700 dark:text-gray-300">
              {bible?.name || 'Chargement...'}
            </span>
            {selectedBook && (
              <>
                <span className="text-gray-500 dark:text-gray-400">/</span>
                <span className="text-gray-700 dark:text-gray-300">{selectedBook.name}</span>
              </>
            )}
          </nav>

          {loading && !bible ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <Card className="p-6 text-center text-red-600 dark:text-red-400">
              {error}
            </Card>
          ) : bible ? (
            <>
              {/* En-tête des détails de la Bible */}
              <div className="mb-10">
                <div className="flex items-center mb-4">
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mr-4">
                    {bible.name}
                  </h1>
                  <span className="text-sm bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 py-1 px-2 rounded-full">
                    {bible.language.name}
                  </span>
                </div>
                
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {bible.nameLocal !== bible.name && <span className="block">{bible.nameLocal}</span>}
                  <span className="text-sm">{bible.abbreviation}</span>
                </p>
                
                <p className="text-gray-700 dark:text-gray-300 mb-6">
                  {bible.description || "Pas de description disponible."}
                </p>
                
                <div className="flex flex-wrap gap-3">
                  {bible.audioBibles && bible.audioBibles.length > 0 ? (
                    <Link to={`/bible/${bible.id}/audio`}>
                      <Button
                        variant="secondary"
                        icon={
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-5 w-5">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.465a5 5 0 001.06-7.072m-2.11 9.9a9 9 0 010-12.728" />
                          </svg>
                        }
                      >
                        Écouter en audio
                      </Button>
                    </Link>
                  ) : null}
                  
                  <Link to={`/search?bible=${bible.id}`}>
                    <Button
                      variant="ghost"
                      icon={
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-5 w-5">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      }
                    >
                      Rechercher dans cette Bible
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Afficher les livres ou les chapitres */}
              {!selectedBook ? (
                // Liste des livres groupés
                <div>
                  <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
                    Livres
                  </h2>
                  
                  {Object.entries(groupedBooks).map(([group, groupBooks]) => (
                    <div key={group} className="mb-10">
                      <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                        {group}
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {groupBooks.map(book => (
                          <Card
                            key={book.id}
                            hoverable
                            className="p-4 cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-gray-700"
                            onClick={() => handleBookSelect(book)}
                          >
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {book.name}
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {book.nameLong !== book.name ? book.nameLong : ''}
                            </p>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // Liste des chapitres pour le livre sélectionné
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {selectedBook.name} - Chapitres
                    </h2>
                    <Button
                      variant="ghost"
                      onClick={handleBackToBooks}
                      icon={
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-5 w-5">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                        </svg>
                      }
                    >
                      Retour aux livres
                    </Button>
                  </div>
                  
                  {loading ? (
                    <div className="flex justify-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-4">
                      {chapters.map(chapter => (
                        <Card
                          key={chapter.id}
                          hoverable
                          className="aspect-square flex items-center justify-center cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-gray-700 text-center p-4"
                          onClick={() => navigateToChapter(chapter.id)}
                        >
                          <div>
                            <span className="text-xl font-semibold text-gray-900 dark:text-white">
                              {chapter.number}
                            </span>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Bible non trouvée
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-8">
                La Bible que vous recherchez n'existe pas ou n'est pas disponible.
              </p>
              <Link to="/explore">
                <Button>Retour à l'exploration</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default BibleDetailPage; 