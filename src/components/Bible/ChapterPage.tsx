import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Layout from '../Layout/Layout';
import Button from '../UI/Button';
import Card from '../UI/Card';
import { Bible, Chapter, Book } from '../../types/bible-api.types';
import { bibleApiService } from '../../services/bible-api.service';

const ChapterPage: React.FC = () => {
  const { bibleId, chapterId } = useParams<{ bibleId: string; chapterId: string }>();
  const navigate = useNavigate();
  
  const [bible, setBible] = useState<Bible | null>(null);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [book, setBook] = useState<Book | null>(null);
  const [fontSize, setFontSize] = useState<number>(18);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isHighlightingActive, setIsHighlightingActive] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Charger les données du chapitre
  useEffect(() => {
    const fetchChapterDetails = async () => {
      if (!bibleId || !chapterId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Récupérer les détails de la Bible
        const bibleData = await bibleApiService.getBible(bibleId);
        setBible(bibleData);
        
        // Récupérer le chapitre avec son contenu
        const chapterData = await bibleApiService.getChapter(bibleId, chapterId);
        setChapter(chapterData);
        
        // Récupérer les détails du livre auquel appartient le chapitre
        if (chapterData.bookId) {
          const bookData = await bibleApiService.getBook(bibleId, chapterData.bookId);
          setBook(bookData);
        }
      } catch (err) {
        setError('Erreur lors du chargement du chapitre. Veuillez réessayer.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchChapterDetails();
  }, [bibleId, chapterId]);
  
  // Naviguer au chapitre suivant
  const goToNextChapter = () => {
    if (chapter?.next) {
      navigate(`/bible/${bibleId}/chapter/${chapter.next.id}`);
    }
  };
  
  // Naviguer au chapitre précédent
  const goToPreviousChapter = () => {
    if (chapter?.previous) {
      navigate(`/bible/${bibleId}/chapter/${chapter.previous.id}`);
    }
  };
  
  // Augmenter la taille de police
  const increaseFontSize = () => {
    setFontSize(prev => Math.min(prev + 2, 32));
  };
  
  // Diminuer la taille de police
  const decreaseFontSize = () => {
    setFontSize(prev => Math.max(prev - 2, 14));
  };
  
  // Activer/désactiver le mode de surlignage
  const toggleHighlighting = () => {
    setIsHighlightingActive(!isHighlightingActive);
  };
  
  // Activer/désactiver le mode plein écran
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Sécuriser le rendu HTML du contenu de la Bible
  // Note: normalement il faudrait utiliser une bibliothèque de purification comme DOMPurify
  const renderBibleContent = () => {
    if (!chapter?.content) return null;
    
    return (
      <div 
        ref={contentRef}
        className={`prose prose-lg max-w-none dark:prose-invert transition-all duration-300 ${isHighlightingActive ? 'selecting-text' : ''}`}
        style={{ fontSize: `${fontSize}px` }}
        dangerouslySetInnerHTML={{ __html: chapter.content }}
      />
    );
  };

  return (
    <Layout>
      <div className={`py-8 transition-all duration-500 ${isFullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-gray-900 overflow-y-auto pt-20' : ''}`}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Barre de navigation */}
          {!isFullscreen && (
            <nav className="mb-8 flex flex-wrap items-center gap-2 text-sm">
              <Link to="/explore" className="text-blue-600 dark:text-blue-400 hover:underline">
                Explorer
              </Link>
              <span className="text-gray-500 dark:text-gray-400">/</span>
              <Link to={`/bible/${bibleId}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                {bible?.name || 'Bible'}
              </Link>
              <span className="text-gray-500 dark:text-gray-400">/</span>
              <Link to={`/bible/${bibleId}?book=${book?.id}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                {book?.name || 'Livre'}
              </Link>
              <span className="text-gray-500 dark:text-gray-400">/</span>
              <span className="text-gray-700 dark:text-gray-300">
                Chapitre {chapter?.number || ''}
              </span>
            </nav>
          )}

          {/* Barre d'outils flottante */}
          <div className={`sticky top-[76px] z-20 mb-6 ${isFullscreen ? 'hidden' : ''}`}>
            <Card className="p-4 border border-gray-200 dark:border-gray-700 shadow-lg backdrop-blur-lg bg-white/80 dark:bg-gray-800/80">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={goToPreviousChapter}
                    disabled={!chapter?.previous}
                    icon={
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-5 w-5">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    }
                  >
                    Précédent
                  </Button>
                  
                  <div className="text-gray-700 dark:text-gray-300">
                    {book?.name} {chapter?.number}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={goToNextChapter}
                    disabled={!chapter?.next}
                    icon={
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-5 w-5">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    }
                  >
                    Suivant
                  </Button>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={decreaseFontSize}
                    icon={
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-5 w-5">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    }
                  >
                    Réduire
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={increaseFontSize}
                    icon={
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-5 w-5">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    }
                  >
                    Agrandir
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleHighlighting}
                    className={isHighlightingActive ? 'bg-blue-100 dark:bg-blue-900/30' : ''}
                    icon={
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-5 w-5">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    }
                  >
                    Surligner
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleFullscreen}
                    icon={
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-5 w-5">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 1v4m0 0h-4m4 0l-5-5" />
                      </svg>
                    }
                  >
                    Plein écran
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Contenu du chapitre */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <Card className="p-6 text-center text-red-600 dark:text-red-400">
              {error}
            </Card>
          ) : chapter ? (
            <div className="relative">
              {/* Effet de particules luminescentes */}
              <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div 
                    key={index}
                    className="absolute w-32 h-32 bg-blue-400/5 dark:bg-blue-500/10 rounded-full filter blur-3xl animate-float"
                    style={{ 
                      top: `${Math.random() * 100}%`, 
                      left: `${Math.random() * 100}%`,
                      animationDelay: `${index * 0.5}s`,
                      animationDuration: `${8 + Math.random() * 7}s`
                    }}
                  />
                ))}
              </div>

              {/* En-tête du chapitre */}
              <div className="mb-8">
                <h1 className="text-3xl md:text-4xl font-bold mb-2 text-gray-900 dark:text-white">
                  {book?.name} - Chapitre {chapter.number}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {chapter.reference}
                </p>
              </div>
              
              {/* Contenu avec effets de transition */}
              <div className="relative mb-12 animation-fade-in">
                {renderBibleContent()}
                
                {/* Overlay de gradient au bas pour un effet de fondu */}
                <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white/80 to-transparent dark:from-gray-900/80 pointer-events-none"></div>
              </div>
              
              {/* Navigation entre chapitres */}
              <div className="flex justify-between mt-12 pt-6 border-t border-gray-200 dark:border-gray-700">
                {chapter.previous ? (
                  <Button
                    onClick={goToPreviousChapter}
                    variant="secondary"
                    icon={
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-5 w-5">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    }
                  >
                    {book?.name} {chapter.previous.number}
                  </Button>
                ) : (
                  <div></div>
                )}
                
                {chapter.next ? (
                  <Button
                    onClick={goToNextChapter}
                    icon={
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-5 w-5">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    }
                  >
                    {book?.name} {chapter.next.number}
                  </Button>
                ) : (
                  <div></div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Chapitre non trouvé
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-8">
                Le chapitre que vous recherchez n'existe pas ou n'est pas disponible.
              </p>
              <Link to={`/bible/${bibleId}`}>
                <Button>Retour à la Bible</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
      
      {/* Bouton pour quitter le mode plein écran */}
      {isFullscreen && (
        <button
          onClick={toggleFullscreen}
          className="fixed top-4 right-4 z-50 p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          aria-label="Quitter le plein écran"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-6 w-6">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </Layout>
  );
};

export default ChapterPage; 