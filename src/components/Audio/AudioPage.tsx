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
  
  const [showMessage, setShowMessage] = useState(false);
  
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

  React.useEffect(() => {
    setShowMessage(true);
    const timer = setTimeout(() => {
      setShowMessage(false);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Layout>
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
              Bible Audio
            </h1>
            <p className="text-lg text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
              La fonctionnalité audio sera bientôt disponible
            </p>
          </div>
        </div>
      </div>
      {showMessage && (
        <div className="fixed top-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-md shadow-lg z-50">
          Fonctionnalité audio à venir 🎧
        </div>
      )}
    </Layout>
  );
};

export default AudioPage; 