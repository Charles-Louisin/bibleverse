import React, { createContext, useContext, useState, useEffect } from 'react';
import { Bible, Book, Chapter, Verse } from '../types/bible-api.types';
import { bibleApiService } from '../services/bible-api.service';

interface BibleContextType {
  loading: boolean;
  error: string | null;
  bibles: Bible[];
  selectedBible: Bible | null;
  books: Book[];
  selectedBook: Book | null;
  chapters: Chapter[];
  selectedChapter: Chapter | null;
  searchResults: Verse[];
  
  selectBible: (bibleId: string) => Promise<void>;
  selectBook: (bookId: string) => Promise<void>;
  selectChapter: (chapterId: string) => Promise<void>;
  search: (query: string) => Promise<void>;
}

const BibleContext = createContext<BibleContextType | undefined>(undefined);

export const BibleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bibles, setBibles] = useState<Bible[]>([]);
  const [selectedBible, setSelectedBible] = useState<Bible | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [searchResults, setSearchResults] = useState<Verse[]>([]);

  // Charger la liste des bibles au démarrage
  useEffect(() => {
    const fetchBibles = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await bibleApiService.getBibles();
        setBibles(data);
      } catch (err) {
        setError('Erreur lors du chargement des bibles');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchBibles();
  }, []);

  // Sélectionner une bible
  const selectBible = async (bibleId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Réinitialiser les sélections précédentes
      setSelectedBook(null);
      setSelectedChapter(null);
      setChapters([]);
      
      const bible = await bibleApiService.getBible(bibleId);
      setSelectedBible(bible);
      
      // Charger les livres de cette bible
      const booksData = await bibleApiService.getBooks(bibleId);
      setBooks(booksData);
    } catch (err) {
      setError('Erreur lors de la sélection de la bible');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Sélectionner un livre
  const selectBook = async (bookId: string) => {
    if (!selectedBible) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Réinitialiser le chapitre sélectionné
      setSelectedChapter(null);
      
      const book = await bibleApiService.getBook(selectedBible.id, bookId);
      setSelectedBook(book);
      
      // Charger les chapitres de ce livre
      const chaptersData = await bibleApiService.getChapters(selectedBible.id, bookId);
      setChapters(chaptersData);
    } catch (err) {
      setError('Erreur lors de la sélection du livre');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Sélectionner un chapitre
  const selectChapter = async (chapterId: string) => {
    if (!selectedBible) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const chapter = await bibleApiService.getChapter(selectedBible.id, chapterId);
      setSelectedChapter(chapter);
    } catch (err) {
      setError('Erreur lors de la sélection du chapitre');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Rechercher dans la bible
  const search = async (query: string) => {
    if (!selectedBible || !query.trim()) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const results = await bibleApiService.search(selectedBible.id, query);
      setSearchResults(results.verses);
    } catch (err) {
      setError('Erreur lors de la recherche');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <BibleContext.Provider
      value={{
        loading,
        error,
        bibles,
        selectedBible,
        books,
        selectedBook,
        chapters,
        selectedChapter,
        searchResults,
        selectBible,
        selectBook,
        selectChapter,
        search,
      }}
    >
      {children}
    </BibleContext.Provider>
  );
};

export const useBible = (): BibleContextType => {
  const context = useContext(BibleContext);
  if (context === undefined) {
    throw new Error('useBible doit être utilisé à l\'intérieur d\'un BibleProvider');
  }
  return context;
}; 