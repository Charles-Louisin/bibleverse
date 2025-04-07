import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Layout from '../Layout/Layout';
import Button from '../UI/Button';
import Card from '../UI/Card';
import { Bible, Chapter, Book } from '../../types/bible-api.types';
import { bibleApiService } from '../../services/bible-api.service';

// Définition du type pour les surlignages
interface Highlight {
  id: string;
  bibleId: string;
  chapterId: string;
  text: string;
  startOffset?: number;
  endOffset?: number;
  color: string;
  timestamp: number;
}

const ChapterPage: React.FC = () => {
  const { bibleId, chapterId } = useParams<{ bibleId: string; chapterId: string }>();
  const navigate = useNavigate();
  
  const [bible, setBible] = useState<Bible | null>(null);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [book, setBook] = useState<Book | null>(null);
  const [fontSize, setFontSize] = useState<number>(18);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [selectedColor, setSelectedColor] = useState('#FFEB3B'); // Jaune par défaut
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Couleurs disponibles pour le surlignage
  const highlightColors = [
    '#FFEB3B', // Jaune
    '#FFA726', // Orange
    '#66BB6A', // Vert
    '#42A5F5', // Bleu
    '#EC407A', // Rose
    '#AB47BC'  // Violet
  ];

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
  
  // Charger les surlignages depuis le localStorage
  useEffect(() => {
    if (bibleId && chapterId) {
      try {
        const savedHighlights = localStorage.getItem('bibleHighlights');
        if (savedHighlights) {
          const allHighlights: Highlight[] = JSON.parse(savedHighlights);
          // Filtrer pour n'obtenir que les surlignages de ce chapitre
          const chapterHighlights = allHighlights.filter(
            h => h.bibleId === bibleId && h.chapterId === chapterId
          );
          setHighlights(chapterHighlights);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des surlignages:', error);
      }
    }
  }, [bibleId, chapterId]);
  
  // Sauvegarder les surlignages dans localStorage
  const saveHighlights = (newHighlights: Highlight[]) => {
    try {
      const savedHighlights = localStorage.getItem('bibleHighlights');
      let allHighlights: Highlight[] = [];
      
      if (savedHighlights) {
        allHighlights = JSON.parse(savedHighlights);
        // Supprimer les anciens surlignages de ce chapitre
        allHighlights = allHighlights.filter(
          h => !(h.bibleId === bibleId && h.chapterId === chapterId)
        );
      }
      
      // Ajouter les nouveaux surlignages
      allHighlights = [...allHighlights, ...newHighlights];
      
      // Sauvegarder dans localStorage
      localStorage.setItem('bibleHighlights', JSON.stringify(allHighlights));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des surlignages:', error);
    }
  };
  
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
  
  // Gérer la sélection de texte - maintenant toujours actif
  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) {
      const selectedText = selection.toString().trim();
      if (selectedText) {
        setSelectedText(selectedText);
        // Afficher le sélecteur de couleur dès qu'un texte est sélectionné
        setShowColorPicker(true);
      }
    }
  };
  
  // Appliquer le surlignage au texte sélectionné
  const applyHighlight = () => {
    if (!selectedText || !bibleId || !chapterId) return;
    
    const newHighlight: Highlight = {
      id: `highlight_${Date.now()}`,
      bibleId: bibleId,
      chapterId: chapterId,
      text: selectedText,
      color: selectedColor,
      timestamp: Date.now()
    };
    
    const updatedHighlights = [...highlights, newHighlight];
    setHighlights(updatedHighlights);
    saveHighlights(updatedHighlights);
    
    // Réinitialiser la sélection
    setSelectedText('');
    window.getSelection()?.removeAllRanges();
    
    // Masquer le sélecteur de couleur après le surlignage
    setShowColorPicker(false);
  };
  
  // Choisir une couleur pour le surlignage ET appliquer directement
  const selectHighlightColor = (color: string) => {
    setSelectedColor(color);
    // Appliquer immédiatement le surlignage avec la couleur sélectionnée
    const tempSelectedColor = color;
    
    if (!selectedText || !bibleId || !chapterId) return;
    
    const newHighlight: Highlight = {
      id: `highlight_${Date.now()}`,
      bibleId: bibleId,
      chapterId: chapterId,
      text: selectedText,
      color: tempSelectedColor,
      timestamp: Date.now()
    };
    
    const updatedHighlights = [...highlights, newHighlight];
    setHighlights(updatedHighlights);
    saveHighlights(updatedHighlights);
    
    // Réinitialiser la sélection
    setSelectedText('');
    window.getSelection()?.removeAllRanges();
    
    // Masquer le sélecteur de couleur après le surlignage
    setShowColorPicker(false);
  };
  
  // Supprimer un surlignage
  const removeHighlight = (highlightId: string) => {
    const updatedHighlights = highlights.filter(h => h.id !== highlightId);
    setHighlights(updatedHighlights);
    saveHighlights(updatedHighlights);
  };
  
  // Activer/désactiver le mode plein écran
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Fonction pour déterminer la couleur du texte en fonction du fond
  const getContrastTextColor = (backgroundColor: string): string => {
    // Convertir la couleur hex en RGB
    const hex = backgroundColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Calculer la luminosité (formule standard)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    
    // Si la couleur est claire, retourner du texte foncé, sinon du texte clair
    return brightness > 128 ? '#000000' : '#FFFFFF';
  };

  // Sécuriser le rendu HTML du contenu de la Bible
  // Note: normalement il faudrait utiliser une bibliothèque de purification comme DOMPurify
  const renderBibleContent = () => {
    if (!chapter?.content) return null;
    
    // Appliquer les surlignages
    let contentWithHighlights = chapter.content;
    
    // Fonction pour échapper les caractères spéciaux en RegExp
    const escapeRegExp = (string: string) => {
      return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };
    
    // Appliquer chaque surlignage au contenu
    // Trier les surlignages du plus long au plus court pour éviter les conflits
    const sortedHighlights = [...highlights].sort((a, b) => b.text.length - a.text.length);
    
    sortedHighlights.forEach(highlight => {
      const escapedText = escapeRegExp(highlight.text);
      const regex = new RegExp(`(${escapedText})`, 'g'); // Suppression du flag 'i' pour correspondance exacte
      
      // Améliorer la lisibilité en mode sombre avec un texte contrasté pour chaque couleur
      const textColor = getContrastTextColor(highlight.color);
      
      contentWithHighlights = contentWithHighlights.replace(
        regex, 
        `<span class="highlighted" style="background-color: ${highlight.color}; color: ${textColor}; padding: 2px 4px; border-radius: 2px; box-shadow: 0 1px 2px rgba(0,0,0,0.2); font-weight: 500;">${'$1'}</span>`
      );
    });
    
    // Créer un conteneur pour le contenu
    return (
      <div 
        ref={contentRef}
        className={`prose prose-lg max-w-none dark:prose-invert transition-all duration-300 ${showColorPicker ? 'selecting-text' : ''}`}
        style={{ fontSize: `${fontSize}px` }}
        onMouseUp={handleTextSelection}
        dangerouslySetInnerHTML={{ __html: contentWithHighlights }}
      />
    );
  };
  
  // Composant pour le sélecteur de couleur
  const ColorPicker = () => (
    <div className="fixed bottom-20 right-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg z-50 border border-gray-200 dark:border-gray-700 animate-fade-in">
      <div className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
        Choisissez une couleur:
      </div>
      <div className="flex flex-wrap gap-2">
        {highlightColors.map(color => (
          <button
            key={color}
            className={`w-10 h-10 rounded-full border-2 ${
              selectedColor === color ? 'border-blue-500 scale-110' : 'border-transparent'
            } transition-transform hover:scale-105`}
            style={{ backgroundColor: color }}
            onClick={() => selectHighlightColor(color)}
            title={`Appliquer cette couleur`}
          />
        ))}
      </div>
    </div>
  );
  
  // Composant pour afficher la liste des surlignages
  const HighlightsList = () => {
    if (highlights.length === 0) return null;
    
    return (
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
          Vos surlignages ({highlights.length})
        </h3>
        <div className="space-y-2">
          {highlights.map(highlight => (
            <div 
              key={highlight.id} 
              className="flex items-start p-2 rounded-md bg-white dark:bg-gray-800 shadow-sm"
            >
              <div 
                className="w-3 h-3 mt-1 mr-2 rounded-full" 
                style={{ backgroundColor: highlight.color }}
              />
              <div className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                {highlight.text.substring(0, 100)}
                {highlight.text.length > 100 ? '...' : ''}
              </div>
              <button
                onClick={() => removeHighlight(highlight.id)}
                className="text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
                title="Supprimer ce surlignage"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Si en mode plein écran, rendre directement sans le Layout
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-[9999] bg-white dark:bg-gray-900 overflow-y-auto flex flex-col">
        {/* Barre d'outils en plein écran */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700 py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button 
                    onClick={toggleFullscreen}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <h1 className="text-xl font-semibold text-gray-900 dark:text-white truncate">
                    {book?.name} {chapter?.number}
                  </h1>
                </div>
              
                <div className="flex md:hidden items-center">
                  <button
                    onClick={goToPreviousChapter}
                    disabled={!chapter?.previous}
                    className="mr-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
                    title="Chapitre précédent"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  
                  <button
                    onClick={goToNextChapter}
                    disabled={!chapter?.next}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
                    title="Chapitre suivant"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-between md:justify-end space-x-2">
                <button
                  onClick={decreaseFontSize}
                  className="flex-1 md:flex-none flex items-center justify-center space-x-1 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
                  title="Réduire la taille du texte"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm">Réduire</span>
                </button>
                
                <button
                  onClick={increaseFontSize}
                  className="flex-1 md:flex-none flex items-center justify-center space-x-1 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
                  title="Agrandir la taille du texte"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm">Agrandir</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Contenu principal en plein écran */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-8 max-w-5xl mx-auto">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="p-6 text-center text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg">
              {error}
            </div>
          ) : (
            <div className="relative">
              {renderBibleContent()}
              
              {/* Liste des surlignages */}
              <HighlightsList />
            </div>
          )}
          
          {/* Afficher le sélecteur de couleur quand un texte est sélectionné */}
          {showColorPicker && <ColorPicker />}
        </div>
        
        {/* Contrôles de navigation en bas de l'écran */}
        <div className="sticky bottom-0 z-10 bg-white dark:bg-gray-900 shadow-sm border-t border-gray-200 dark:border-gray-700 py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <button
                onClick={goToPreviousChapter}
                disabled={!chapter?.previous}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                  chapter?.previous
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="hidden sm:inline">Chapitre précédent</span>
              </button>
              
              <button
                onClick={goToNextChapter}
                disabled={!chapter?.next}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                  chapter?.next
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                }`}
              >
                <span className="hidden sm:inline">Chapitre suivant</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Mode normal avec Layout
  return (
    <Layout>
      <div className="py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Barre de navigation */}
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

          {/* Barre d'outils flottante */}
          <div className="sticky top-[76px] z-20 mb-6">
            <Card className="p-4 border border-gray-200 dark:border-gray-700 shadow-lg backdrop-blur-lg bg-white/80 dark:bg-gray-800/80">
              <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap justify-center sm:justify-start gap-2">
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
                  
                  <div className="text-gray-700 dark:text-gray-300 px-2 py-1">
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
                
                <div className="flex flex-wrap justify-center sm:justify-end gap-2">
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
              
              {/* Liste des surlignages */}
              <HighlightsList />
              
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
          
          {/* Afficher le sélecteur de couleur quand un texte est sélectionné */}
          {showColorPicker && <ColorPicker />}
        </div>
      </div>
    </Layout>
  );
};

export default ChapterPage; 