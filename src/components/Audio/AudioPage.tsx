import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Layout from '../Layout/Layout';
import Button from '../UI/Button';
import Card from '../UI/Card';
import { Bible, AudioBible, Book, Chapter, AudioData } from '../../types/bible-api.types';
import { bibleApiService, clearCache } from '../../services/bible-api.service';

const AudioPage: React.FC = () => {
  const { bibleId, bookId, chapterId } = useParams<{ bibleId: string; bookId?: string; chapterId?: string }>();
  const navigate = useNavigate();
  
  const [bibles, setBibles] = useState<Bible[]>([]);
  const [audioBibles, setAudioBibles] = useState<AudioBible[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedBibleId, setSelectedBibleId] = useState<string>(bibleId || '');
  const [selectedAudioBibleId, setSelectedAudioBibleId] = useState<string>('');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  // Nouvel état pour stocker les informations sur la disponibilité audio des chapitres
  const [chaptersWithAudio, setChaptersWithAudio] = useState<Record<string, boolean>>({});
  const [checkingAudioAvailability, setCheckingAudioAvailability] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [audioUrl, setAudioUrl] = useState<string>('');
  
  // État pour suivre le statut du chargement (nouveau chargement vs depuis le cache)
  const [loadingStatus, setLoadingStatus] = useState<{
    fromCache: boolean;
    message: string;
  } | null>(null);
  
  // État pour afficher les détails techniques pour le débogage
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  
  // Effacer le cache
  const handleClearCache = () => {
    try {
      clearCache();
      setError('Cache vidé avec succès. Rechargement des données...');
      setTimeout(() => {
        setRetryCount(prevCount => prevCount + 1);
      }, 1000);
    } catch (err) {
      setError('Erreur lors du vidage du cache');
      console.error('Erreur lors du vidage du cache:', err);
    }
  };
  
  // Charger les bibles audio disponibles
  useEffect(() => {
    const fetchAudioBibles = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Récupérer uniquement les bibles avec des versions audio
        const biblesData = await bibleApiService.getBiblesWithAudio().catch(err => {
          console.error('Erreur lors de la récupération des bibles avec audio:', err);
          throw new Error('Erreur lors du chargement des bibles audio. Veuillez réessayer.');
        });
        
        if (biblesData.length === 0) {
          throw new Error('Aucune bible avec audio disponible. Veuillez réessayer plus tard.');
        }
        
        setBibles(biblesData);
        
        if (bibleId) {
          // Si un bibleId est fourni dans l'URL, l'utiliser s'il a de l'audio
          const hasAudio = await bibleApiService.hasBibleAudio(bibleId);
          
          if (hasAudio) {
            setSelectedBibleId(bibleId);
            
            // Récupérer les détails de cette bible
            const bibleDetails = await bibleApiService.getBible(bibleId).catch(err => {
              console.error(`Erreur lors de la récupération de la bible ${bibleId}:`, err);
              throw new Error(`Erreur lors du chargement de la bible ${bibleId}. Veuillez réessayer.`);
            });
            
            if (bibleDetails.audioBibles && bibleDetails.audioBibles.length > 0) {
              setAudioBibles(bibleDetails.audioBibles);
              
              // Charger les livres de cette bible
              const booksData = await bibleApiService.getBooks(bibleId).catch(err => {
                console.error(`Erreur lors de la récupération des livres pour ${bibleId}:`, err);
                throw new Error('Erreur lors du chargement des livres. Veuillez réessayer.');
              });
              
              // Nous allons stocker tous les livres mais afficher seulement ceux avec audio
              setBooks(booksData);
              
              // Si un bookId est spécifié, vérifier s'il a de l'audio
              if (bookId) {
                const book = booksData.find(b => b.id === bookId) || null;
                if (book) {
                  setSelectedBook(book);
                  
                  // Charger les chapitres de ce livre
                  const chaptersData = await bibleApiService.getChapters(bibleId, book.id).catch(err => {
                    console.error(`Erreur lors de la récupération des chapitres pour ${bibleId}/${book.id}:`, err);
                    throw new Error('Erreur lors du chargement des chapitres. Veuillez réessayer.');
                  });
                  
                  setChapters(chaptersData);
                  
                  // Si un chapterId est spécifié, vérifier s'il a de l'audio
                  if (chapterId) {
                    const chapter = chaptersData.find(c => c.id === chapterId) || null;
                    if (chapter && selectedAudioBibleId) {
                      const hasChapterAudio = await bibleApiService.hasChapterAudio(bibleId, selectedAudioBibleId, chapter.id);
                      if (hasChapterAudio) {
                        setSelectedChapter(chapter);
                      }
                    }
                  }
                }
              }
            } else {
              throw new Error(`La bible ${bibleId} ne contient pas de versions audio.`);
            }
          } else {
            // Si la Bible de l'URL n'a pas d'audio, prendre la première Bible qui en a
            setSelectedBibleId(biblesData[0].id);
            
            if (biblesData[0].audioBibles && biblesData[0].audioBibles.length > 0) {
              setAudioBibles(biblesData[0].audioBibles);
              
              // Charger les livres de cette bible
              const booksData = await bibleApiService.getBooks(biblesData[0].id).catch(err => {
                console.error(`Erreur lors de la récupération des livres pour ${biblesData[0].id}:`, err);
                throw new Error('Erreur lors du chargement des livres. Veuillez réessayer.');
              });
              
              setBooks(booksData);
            }
          }
        } else if (biblesData.length > 0) {
          // Si aucun bibleId n'est fourni, utiliser la première bible avec audio
          const firstBible = biblesData[0];
          setSelectedBibleId(firstBible.id);
          
          if (firstBible.audioBibles && firstBible.audioBibles.length > 0) {
            setAudioBibles(firstBible.audioBibles);
            
            // Charger les livres de cette bible
            const booksData = await bibleApiService.getBooks(firstBible.id).catch(err => {
              console.error(`Erreur lors de la récupération des livres pour ${firstBible.id}:`, err);
              throw new Error('Erreur lors du chargement des livres. Veuillez réessayer.');
            });
            
            setBooks(booksData);
          }
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des bibles audio. Veuillez réessayer.';
        console.error('Erreur dans fetchAudioBibles:', err);
        setError(errorMessage);
        
        // Implémentation de la logique de retry
        if (retryCount < 3) {
          console.log(`Tentative de reconnexion (${retryCount + 1}/3) dans 2 secondes...`);
          setTimeout(() => {
            setRetryCount(prevCount => prevCount + 1);
          }, 2000);
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchAudioBibles();
  }, [bibleId, bookId, chapterId, retryCount, selectedAudioBibleId]);
  
  // Mise à jour de l'URL lorsque les sélections changent
  useEffect(() => {
    // Construire l'URL en fonction des sélections
    let url = '/audio';
    
    if (selectedBibleId) {
      url = `/bible/${selectedBibleId}/audio`;
      
      if (selectedBook) {
        url += `/${selectedBook.id}`;
        
        if (selectedChapter) {
          url += `/${selectedChapter.id}`;
        }
      }
    }
    
    // Mettre à jour l'URL sans recharger la page
    if (url !== window.location.pathname) {
      navigate(url, { replace: true });
    }
  }, [selectedBibleId, selectedBook, selectedChapter, navigate]);
  
  // Mettre à jour l'état du lecteur audio lorsque l'audio joue
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      setProgress((audio.currentTime / audio.duration) * 100);
    };
    
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      console.log("Audio metadata chargée, durée:", audio.duration);
    };
    
    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
      audio.currentTime = 0;
    };
    
    const handleError = (e: Event) => {
      console.error("Erreur de lecture audio:", e);
      setError(`Erreur lors de la lecture audio. Essayez de définir manuellement l'URL.`);
      setIsPlaying(false);
    };
    
    const handleCanPlay = () => {
      console.log("Audio prêt à être lu");
      setError(null); // Effacer les messages d'erreur précédents
    };
    
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);
    
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [audioRef.current, audioUrl]);
  
  // Changer de bible
  const handleBibleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newBibleId = e.target.value;
    setSelectedBibleId(newBibleId);
    setSelectedBook(null);
    setSelectedChapter(null);
    setChapters([]);
    setChaptersWithAudio({}); // Réinitialiser les informations d'audio
    
    try {
      setLoading(true);
      setError(null);
      
      // Récupérer les détails de la bible
      const bibleDetails = await bibleApiService.getBible(newBibleId).catch(err => {
        console.error(`Erreur lors de la récupération de la bible ${newBibleId}:`, err);
        throw new Error(`Erreur lors du chargement de la bible ${newBibleId}. Veuillez réessayer.`);
      });
      
      if (bibleDetails.audioBibles && bibleDetails.audioBibles.length > 0) {
        setAudioBibles(bibleDetails.audioBibles);
        
        // Charger les livres de cette bible
        const booksData = await bibleApiService.getBooks(newBibleId).catch(err => {
          console.error(`Erreur lors de la récupération des livres pour ${newBibleId}:`, err);
          throw new Error('Erreur lors du chargement des livres. Veuillez réessayer.');
        });
        
        setBooks(booksData);
      } else {
        throw new Error(`La bible ${newBibleId} ne contient pas de versions audio disponibles.`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du changement de bible. Veuillez réessayer.';
      console.error('Erreur dans handleBibleChange:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  // Changer de version audio
  const handleAudioBibleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newAudioBibleId = e.target.value;
    setSelectedAudioBibleId(newAudioBibleId);
    setChaptersWithAudio({}); // Réinitialiser les informations d'audio
    
    // Si un livre est déjà sélectionné, recharger les informations d'audio pour les chapitres
    if (selectedBook && chapters.length > 0) {
      setCheckingAudioAvailability(true);
      setError(`Vérification des ${chapters.length} chapitres pour la disponibilité audio...`);
      
      const audioAvailability: Record<string, boolean> = {};
      let audioFound = false;
      
      // Vérifier l'audio séquentiellement pour chaque chapitre
      (async () => {
        for (const chapter of chapters) {
          try {
            const hasAudio = await bibleApiService.hasChapterAudio(
              selectedBibleId, 
              newAudioBibleId, 
              chapter.id
            );
            
            audioAvailability[chapter.id] = hasAudio;
            
            if (hasAudio) {
              audioFound = true;
            }
            
            // Mettre à jour l'état avec chaque résultat pour une UX plus réactive
            setChaptersWithAudio(prev => ({
              ...prev,
              [chapter.id]: hasAudio
            }));
          } catch (err) {
            console.error(`Erreur lors de la vérification de l'audio pour le chapitre ${chapter.id}:`, err);
          }
        }
        
        setChaptersWithAudio(audioAvailability);
        setCheckingAudioAvailability(false);
        
        if (!audioFound) {
          setError(`Aucun chapitre avec audio trouvé pour ${selectedBook.name} dans cette version audio.`);
        } else {
          setError(null);
        }
      })().catch(err => {
        console.error('Erreur lors de la vérification de l\'audio des chapitres:', err);
        setCheckingAudioAvailability(false);
        setError('Erreur lors de la vérification de l\'audio des chapitres. Veuillez réessayer.');
      });
    }
  };
  
  // Sélectionner un livre
  const handleBookSelect = async (book: Book) => {
    if (!selectedAudioBibleId) {
      setError('Veuillez sélectionner une version audio avant de choisir un livre');
      return;
    }

    setSelectedBook(book);
    setSelectedChapter(null);
    setChaptersWithAudio({}); // Réinitialiser les informations d'audio
    
    try {
      setLoading(true);
      setError(null);
      
      // Charger les chapitres de ce livre
      const chaptersData = await bibleApiService.getChapters(selectedBibleId, book.id).catch(err => {
        console.error(`Erreur lors de la récupération des chapitres pour ${selectedBibleId}/${book.id}:`, err);
        throw new Error('Erreur lors du chargement des chapitres. Veuillez réessayer.');
      });
      
      if (chaptersData.length === 0) {
        throw new Error(`Aucun chapitre trouvé pour ${book.name}. Veuillez sélectionner un autre livre.`);
      }
      
      setChapters(chaptersData);
      
      // Vérifier la disponibilité audio pour tous les chapitres
      setCheckingAudioAvailability(true);
      setError(`Vérification des ${chaptersData.length} chapitres pour la disponibilité audio...`);
      
      const audioAvailability: Record<string, boolean> = {};
      let audioFound = false;
      
      // Vérifier l'audio pour tous les chapitres (en séquentiel pour être plus fiable)
      for (const chapter of chaptersData) {
        try {
          const hasAudio = await bibleApiService.hasChapterAudio(
            selectedBibleId, 
            selectedAudioBibleId, 
            chapter.id
          );
          
          audioAvailability[chapter.id] = hasAudio;
          
          if (hasAudio) {
            audioFound = true;
          }
          
          // Mettre à jour l'état avec chaque résultat pour une UX plus réactive
          setChaptersWithAudio(prev => ({
            ...prev,
            [chapter.id]: hasAudio
          }));
        } catch (err) {
          console.error(`Erreur lors de la vérification de l'audio pour le chapitre ${chapter.id}:`, err);
        }
      }
      
      setChaptersWithAudio(audioAvailability);
      setCheckingAudioAvailability(false);
      
      if (!audioFound) {
        setError(`Aucun chapitre avec audio trouvé pour ${book.name} dans cette version audio.`);
      } else {
        setError(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des chapitres. Veuillez réessayer.';
      console.error('Erreur dans handleBookSelect:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  // Sélectionner un chapitre
  const handleChapterSelect = async (chapter: Chapter) => {
    setSelectedChapter(chapter);
    setLoading(true);
    setError(null);
    
    try {
      // Réinitialiser le lecteur audio
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
        audioRef.current.currentTime = 0;
        setProgress(0);
        setCurrentTime(0);
      }
      
      // Définir l'URL à vide pendant le chargement
      setAudioUrl('');
      
      // Récupérer l'URL audio du chapitre
      if (selectedBibleId && selectedAudioBibleId && chapter.id) {
        // Utiliser le service API pour récupérer l'URL audio
        const audioData = await bibleApiService.getChapterAudio(selectedBibleId, selectedAudioBibleId, chapter.id)
          .catch(err => {
            console.error(`Erreur lors de la récupération de l'audio pour ${selectedBibleId}/${selectedAudioBibleId}/${chapter.id}:`, err);
            throw new Error(`Erreur lors du chargement de l'audio. Veuillez réessayer.`);
          });
        
        if (audioData && audioData.url) {
          setAudioUrl(audioData.url);
          console.log("URL audio chargée:", audioData.url);
          
          // Vérifier si c'est une URL de secours
          if (audioData._fallback) {
            setError('Aucune source audio disponible pour ce chapitre. Une piste de test est utilisée à la place.');
          }
        } else {
          // Gérer le cas où aucune URL n'est fournie
          setError('Aucune source audio disponible pour ce chapitre.');
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement de l\'audio. Une piste de test est utilisée à la place.';
      console.error('Erreur dans handleChapterSelect:', err);
      setError(errorMessage);
      
      // Utiliser une URL de secours si disponible
      const fallbackUrl = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
      setAudioUrl(fallbackUrl);
    } finally {
      setLoading(false);
    }
  };
  
  // Contrôler la lecture
  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    
    setIsPlaying(!isPlaying);
  };
  
  // Aller à une position spécifique dans l'audio
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const progressBar = progressBarRef.current;
    const audio = audioRef.current;
    if (!progressBar || !audio) return;
    
    const rect = progressBar.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    
    audio.currentTime = pos * audio.duration;
  };
  
  // Formatage du temps
  const formatTime = (time: number): string => {
    if (isNaN(time)) return '00:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Fonction pour vérifier les IDs d'audio disponibles
  const handleCheckAudioBibles = async () => {
    if (!selectedBibleId) {
      setError('Veuillez d\'abord sélectionner une Bible');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setDebugInfo(null);
      
      // Récupérer directement les informations sur les bibles audio disponibles
      const bibleDetails = await bibleApiService.getBible(selectedBibleId);
      
      if (bibleDetails.audioBibles && bibleDetails.audioBibles.length > 0) {
        setDebugInfo({
          message: `Bible ${selectedBibleId} contient ${bibleDetails.audioBibles.length} versions audio`,
          audioBibles: bibleDetails.audioBibles
        });
        setShowDebugInfo(true);
      } else {
        setDebugInfo({
          message: `Aucune version audio trouvée pour la Bible ${selectedBibleId}`,
          bible: bibleDetails
        });
        setShowDebugInfo(true);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la vérification des bibles audio';
      console.error('Erreur dans handleCheckAudioBibles:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  // Fonction pour tester directement l'audio d'un chapitre
  const handleTestChapterAudio = async () => {
    if (!selectedBibleId || !selectedAudioBibleId) {
      setError('Veuillez d\'abord sélectionner une Bible et une version audio');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Demander à l'utilisateur de saisir l'ID du chapitre
      const testChapterId = prompt(
        'Entrez l\'ID du chapitre à tester (exemple: MAT.1, GEN.1, PSA.23, etc.):\n\n' +
        'Format: LIVRE.CHAPITRE\n' +
        'Exemples courants:\n' +
        '- Nouveau Testament: MAT (Matthieu), MRK (Marc), LUK (Luc), JHN (Jean), ACT (Actes), etc.\n' +
        '- Ancien Testament: GEN (Genèse), EXO (Exode), PSA (Psaumes), etc.',
        'MAT.1'
      );
      
      if (!testChapterId) {
        setError('Aucun ID de chapitre saisi');
        setLoading(false);
        return;
      }
      
      // Tester si le chapitre a de l'audio disponible
      setError(`Test de l'audio pour le chapitre ${testChapterId}...`);
      
      const hasAudio = await bibleApiService.hasChapterAudio(
        selectedBibleId,
        selectedAudioBibleId,
        testChapterId
      );
      
      if (hasAudio) {
        setError(`Le chapitre ${testChapterId} a de l'audio disponible. Tentative de récupération...`);
        
        // Essayer de récupérer l'URL audio
        const audioData = await bibleApiService.getChapterAudio(
          selectedBibleId,
          selectedAudioBibleId,
          testChapterId
        );
        
        if (audioData && audioData.url) {
          if (audioData._fallback) {
            setError(`Aucun audio trouvé pour ${testChapterId}. URL de secours utilisée: ${audioData.url}`);
          } else {
            setError(`Audio trouvé pour ${testChapterId}: ${audioData.url}`);
            
            // Créer un élément audio temporaire pour tester la lecture
            const testAudio = new Audio(audioData.url);
            testAudio.addEventListener('canplaythrough', () => {
              setError(`🎵 Audio chargé et prêt à être lu pour ${testChapterId}: ${audioData.url}`);
            });
            testAudio.addEventListener('error', (e) => {
              setError(`❌ Erreur de chargement de l'audio pour ${testChapterId}: ${e}`);
            });
          }
        } else {
          setError(`URL audio non trouvée pour le chapitre ${testChapterId}`);
        }
      } else {
        setError(`Le chapitre ${testChapterId} n'a pas d'audio disponible.`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du test de l\'audio';
      console.error('Erreur dans handleTestChapterAudio:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour définir manuellement l'URL audio
  const handleSetCustomAudioUrl = () => {
    if (!selectedChapter) {
      setError('Veuillez d\'abord sélectionner un chapitre');
      return;
    }
    
    const customUrl = prompt(
      'Entrez l\'URL audio pour ce chapitre:', 
      audioUrl || 'https://example.com/audio.mp3'
    );
    
    if (customUrl) {
      setError(`URL audio définie manuellement: ${customUrl}`);
      setAudioUrl(customUrl);
      
      // Réinitialiser le lecteur audio
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
        audioRef.current.currentTime = 0;
        setProgress(0);
        setCurrentTime(0);
      }
    }
  };

  return (
    <Layout>
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
              Bible Audio
            </h1>
            <p className="text-lg text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
              Écoutez la Parole de Dieu avec des narrations professionnelles
            </p>
            
            {/* Statut de chargement */}
            {loadingStatus && (
              <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {loadingStatus.message}
              </div>
            )}
            
            {/* Actions */}
            <div className="mt-4 flex justify-center space-x-4">
              <Button 
                onClick={handleClearCache}
                variant="secondary"
                className="text-sm"
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-4 w-4 mr-2">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                }
              >
                Vider le cache
              </Button>
              
              <Button 
                onClick={() => setRetryCount(prevCount => prevCount + 1)}
                variant="secondary"
                className="text-sm"
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-4 w-4 mr-2">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                }
              >
                Actualiser
              </Button>
            </div>
          </div>

          {/* Sélecteurs de bible et livre */}
          <Card className="p-6 mb-8 bg-white dark:bg-gray-800">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="bible" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Version de la Bible
                </label>
                <select
                  id="bible"
                  value={selectedBibleId}
                  onChange={handleBibleChange}
                  className="block w-full p-3 rounded-md bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                  disabled={loading}
                >
                  {bibles.map(bible => (
                    <option key={bible.id} value={bible.id}>
                      {bible.name} ({bible.language.name})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="audioBible" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Version Audio
                </label>
                <select
                  id="audioBible"
                  value={selectedAudioBibleId}
                  onChange={handleAudioBibleChange}
                  className="block w-full p-3 rounded-md bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                  disabled={loading || audioBibles.length === 0}
                >
                  <option value="">Sélectionnez une version audio</option>
                  {audioBibles.map(audioBible => (
                    <option key={audioBible.id} value={audioBible.id}>
                      {audioBible.name} ({audioBible.language.name})
                    </option>
                  ))}
                </select>
                {!selectedAudioBibleId && (
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Veuillez sélectionner une version audio pour accéder aux chapitres
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* Bouton pour vérifier les IDs d'audio */}
          <div className="mt-4">
            <Button
              onClick={handleCheckAudioBibles}
              className="w-full"
              disabled={loading || !selectedBibleId}
              variant="secondary"
            >
              Vérifier les versions audio disponibles
            </Button>
          </div>

          {/* Bouton pour tester directement l'audio d'un chapitre */}
          <div className="mt-4">
            <Button
              onClick={handleTestChapterAudio}
              className="w-full"
              disabled={loading || !selectedBibleId || !selectedAudioBibleId}
              variant="secondary"
            >
              Tester l'audio d'un chapitre spécifique
            </Button>
          </div>

          {/* Bouton pour définir manuellement l'URL audio */}
          <div className="mt-4">
            <Button
              onClick={handleSetCustomAudioUrl}
              className="w-full"
              disabled={loading || !selectedChapter}
              variant="secondary"
            >
              Définir manuellement l'URL audio
            </Button>
          </div>

          {/* Affichage des informations de débogage */}
          {showDebugInfo && debugInfo && (
            <div className="mt-4 p-2 bg-gray-100 dark:bg-gray-800 rounded-md text-xs">
              <h3 className="font-semibold mb-1">Informations détaillées:</h3>
              <p>{debugInfo.message}</p>
              {debugInfo.audioBibles && (
                <div className="mt-2">
                  <h4 className="font-medium">Audio Bibles disponibles:</h4>
                  <ul className="list-disc pl-5">
                    {debugInfo.audioBibles.map((ab: any) => (
                      <li key={ab.id} className="mt-1">
                        ID: {ab.id}<br />
                        Nom: {ab.name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <Button
                onClick={() => setShowDebugInfo(false)}
                className="mt-2 text-xs"
                variant="secondary"
                size="sm"
              >
                Fermer
              </Button>
            </div>
          )}

          {/* Contenu principal */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Liste des livres */}
            <div className="lg:col-span-1">
              <Card className="p-6 h-full bg-white dark:bg-gray-800">
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                  Livres avec audio
                </h2>
                {loading && !books.length ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : (
                  <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-1 scrollbar-thin">
                    {books.map(book => {
                      // Vérifier si au moins un chapitre de ce livre a de l'audio disponible
                      // Pour l'instant, nous affichons tous les livres car nous filtrerons les chapitres
                      return (
                        <div
                          key={book.id}
                          onClick={() => handleBookSelect(book)}
                          className={`p-3 rounded-md cursor-pointer transition-all ${
                            selectedBook?.id === book.id 
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' 
                              : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200'
                          }`}
                        >
                          {book.name}
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            </div>

            {/* Liste des chapitres et lecteur audio */}
            <div className="lg:col-span-2">
              {selectedBook ? (
                <Card className="p-6 bg-white dark:bg-gray-800">
                  <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                    {selectedBook.name} - Chapitres avec audio
                  </h2>
                  
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                  ) : checkingAudioAvailability ? (
                    <div className="flex flex-col items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                      <p className="text-gray-600 dark:text-gray-400 mb-2">Vérification de la disponibilité audio...</p>
                      <p className="text-gray-500 dark:text-gray-500 text-sm">
                        {Object.keys(chaptersWithAudio).length} / {chapters.length} chapitres vérifiés
                      </p>
                      <p className="text-gray-500 dark:text-gray-500 text-xs mt-2">
                        Cette opération peut prendre un moment. Merci de patienter.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 mb-4">
                        {chapters.map(chapter => {
                          // Considérer un chapitre comme ayant de l'audio seulement si chaptersWithAudio[chapter.id] est explicitement true
                          const hasAudio = chaptersWithAudio[chapter.id] === true;
                          return (
                            <div
                              key={chapter.id}
                              onClick={async () => {
                                // Vérifier si ce chapitre a de l'audio avant de le sélectionner
                                if (selectedAudioBibleId && (hasAudio || chaptersWithAudio[chapter.id] === undefined)) {
                                  try {
                                    setLoading(true);
                                    // Si nous avons déjà vérifié l'audio pour ce chapitre, utiliser cette information
                                    // Sinon, vérifier à nouveau
                                    let chapterHasAudio = chaptersWithAudio[chapter.id];
                                    
                                    if (chapterHasAudio === undefined) {
                                      chapterHasAudio = await bibleApiService.hasChapterAudio(
                                        selectedBibleId,
                                        selectedAudioBibleId,
                                        chapter.id
                                      );
                                      // Mettre à jour l'état chaptersWithAudio
                                      setChaptersWithAudio(prev => ({
                                        ...prev,
                                        [chapter.id]: chapterHasAudio
                                      }));
                                    }
                                    
                                    if (chapterHasAudio) {
                                      handleChapterSelect(chapter);
                                    } else {
                                      setError(`Le chapitre ${chapter.number} n'a pas d'audio disponible.`);
                                    }
                                  } catch (err) {
                                    console.error(`Erreur lors de la vérification de l'audio pour le chapitre ${chapter.id}:`, err);
                                    setError(`Erreur lors de la vérification de l'audio pour le chapitre ${chapter.number}.`);
                                  } finally {
                                    setLoading(false);
                                  }
                                }
                              }}
                              className={`aspect-square flex items-center justify-center rounded-md transition-all ${
                                // Chapitre sélectionné
                                selectedChapter?.id === chapter.id 
                                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' 
                                  : hasAudio || chaptersWithAudio[chapter.id] === undefined
                                    // Chapitre avec audio disponible ou pas encore vérifié
                                    ? 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 cursor-pointer'
                                    // Chapitre sans audio - plus sombre et non cliquable
                                    : 'bg-gray-200 dark:bg-gray-900 text-gray-400 dark:text-gray-600 opacity-60'
                              }`}
                            >
                              {chapter.number}
                            </div>
                          );
                        })}
                      </div>
                      
                      {/* Légende explicative */}
                      <div className="mb-4 text-sm">
                        <div className="flex items-center mb-2">
                          <div className="w-4 h-4 mr-2 rounded-sm bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600"></div>
                          <span className="text-gray-800 dark:text-gray-200">Chapitres avec audio disponible</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-4 h-4 mr-2 rounded-sm bg-gray-200 dark:bg-gray-900 text-gray-400 dark:text-gray-600 opacity-60 border border-gray-300 dark:border-gray-700"></div>
                          <span className="text-gray-800 dark:text-gray-200">Chapitres sans audio disponible (non cliquables)</span>
                        </div>
                      </div>
                      
                      {/* Bouton pour revérifier l'audio */}
                      <div className="mb-8">
                        <Button 
                          onClick={() => {
                            if (selectedBook) {
                              // Réutiliser la fonction handleBookSelect pour vérifier à nouveau l'audio
                              handleBookSelect(selectedBook);
                            }
                          }}
                          variant="secondary"
                          className="w-full text-sm"
                        >
                          Vérifier à nouveau la disponibilité audio
                        </Button>
                      </div>
                    </>
                  )}
                  
                  {/* Lecteur audio */}
                  {selectedChapter && (
                    <div className="mt-8 bg-gradient-to-br from-blue-500/10 to-purple-600/10 dark:from-indigo-600/20 dark:to-purple-800/20 rounded-xl p-6 backdrop-blur-sm">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          {selectedBook.name} {selectedChapter.number}
                        </h3>
                        <div className="flex items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400 mr-2">
                            {selectedChapter.reference}
                          </span>
                          <button
                            onClick={handleSetCustomAudioUrl}
                            className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                            title="Définir manuellement l'URL audio"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-5 w-5">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      
                      {/* Visualisation audio */}
                      <div className="w-full h-10 mb-4">
                        <div 
                          ref={progressBarRef} 
                          className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full cursor-pointer overflow-hidden"
                          onClick={(e) => {
                            if (progressBarRef.current && audioRef.current) {
                              const rect = progressBarRef.current.getBoundingClientRect();
                              const clickPosition = e.clientX - rect.left;
                              const percentClicked = clickPosition / rect.width;
                              audioRef.current.currentTime = percentClicked * audioRef.current.duration;
                            }
                          }}
                        >
                          <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
                            style={{ width: `${progress}%` }}
                          >
                            <div className="relative w-full h-full">
                              {/* Onde audio simulée */}
                              {isPlaying && (
                                <div className="absolute inset-0 flex items-center justify-center space-x-1">
                                  {[...Array(12)].map((_, i) => (
                                    <div 
                                      key={i} 
                                      className="h-full w-1 bg-white bg-opacity-30 animate-pulse rounded-full"
                                      style={{ 
                                        animationDuration: `${0.8 + (i % 3) * 0.2}s`,
                                        animationDelay: `${i * 0.05}s`
                                      }}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Durée */}
                      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-4">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                      </div>
                      
                      {/* Contrôles audio */}
                      <div className="flex justify-center">
                        <Button
                          onClick={() => {
                            if (audioRef.current) {
                              audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
                            }
                          }}
                          variant="ghost"
                          className="mx-1"
                          icon={
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-6 w-6">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
                            </svg>
                          }
                        >
                          Reculer
                        </Button>
                        
                        <Button
                          onClick={togglePlay}
                          className="mx-1 h-12 w-12 rounded-full"
                          icon={
                            isPlaying ? (
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-6 w-6">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-6 w-6">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )
                          }
                        >
                          {isPlaying ? 'Pause' : 'Lecture'}
                        </Button>
                        
                        <Button
                          onClick={() => {
                            if (audioRef.current) {
                              audioRef.current.currentTime = Math.min(audioRef.current.duration, audioRef.current.currentTime + 10);
                            }
                          }}
                          variant="ghost"
                          className="mx-1"
                          icon={
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-6 w-6">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
                            </svg>
                          }
                        >
                          Avancer
                        </Button>
                      </div>
                      
                      {/* Audio élément (caché) */}
                      {audioUrl ? (
                        <audio ref={audioRef} src={audioUrl} preload="metadata" />
                      ) : null}
                    </div>
                  )}
                </Card>
              ) : (
                <div className="h-full flex items-center justify-center bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
                  <div>
                    <div className="text-6xl mb-4">🎧</div>
                    <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                      Sélectionnez un livre
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300">
                      Choisissez un livre dans la liste à gauche pour commencer l'écoute.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Message d'erreur */}
          {error && (
            <Card className="p-6 mt-8 text-center">
              <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button 
                  onClick={() => setRetryCount(prevCount => prevCount + 1)}
                >
                  Réessayer
                </Button>
                <Button 
                  onClick={handleClearCache}
                  variant="secondary"
                >
                  Vider le cache et réessayer
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AudioPage; 