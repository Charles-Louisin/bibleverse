import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../Layout/Layout';
import Button from '../UI/Button';
import Card from '../UI/Card';
import { bibleApiService } from '../../services/bible-api.service';
import { Bible } from '../../types/bible-api.types';

const Home = () => {
  const [featuredBibles, setFeaturedBibles] = useState<Bible[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBibles = async () => {
      try {
        setLoading(true);
        const bibles = await bibleApiService.getBibles();
        setFeaturedBibles(bibles.slice(0, 4)); // Prendre seulement 4 bibles pour la présentation
      } catch (err) {
        setError("Impossible de se connecter à l'API Bible. Veuillez vérifier votre connexion internet et votre clé API.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchBibles();
  }, []);

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center">
            {/* Texte */}
            <div className="lg:w-1/2 lg:pr-12 mb-10 lg:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-violet-700 dark:from-indigo-400 dark:to-purple-500">
                Découvrez la Bible <br />
                <span className="text-gray-900 dark:text-white">d'une nouvelle façon</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 mb-8 max-w-2xl">
                Une expérience de lecture et d'écoute immersive, conçue pour rendre votre parcours spirituel plus enrichissant que jamais.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/explore">
                  <Button size="lg">
                    Explorer maintenant
                  </Button>
                </Link>
                <Link to="/audio">
                  <Button variant="secondary" size="lg">
                    Écouter les audio
                  </Button>
                </Link>
              </div>
            </div>
            
            {/* Image/Illustration */}
            <div className="lg:w-1/2 relative w-full">
              <div className="relative overflow-hidden w-full h-96 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-600/10 dark:from-indigo-600/20 dark:to-purple-800/20 backdrop-blur-sm p-1">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-6xl md:text-8xl font-serif opacity-30 dark:opacity-40 text-blue-700 dark:text-indigo-500">
                    א ב ג
                  </div>
                </div>
                <div className="absolute left-10 top-20 w-32 h-32 bg-blue-500/30 dark:bg-blue-500/30 rounded-full filter blur-3xl animate-pulse"></div>
                <div className="absolute right-10 bottom-20 w-24 h-24 bg-purple-500/30 dark:bg-purple-500/30 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                
                <div className="absolute inset-0 border border-white/20 dark:border-white/10 rounded-xl"></div>
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-white/10 to-transparent dark:from-gray-900/40 dark:to-transparent"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section des fonctionnalités */}
      <section className="py-16 relative w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
              Fonctionnalités
            </h2>
            <p className="text-lg text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
              Une expérience de lecture biblique conçue pour le monde moderne.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Fonctionnalité 1 */}
            <Card className="p-6">
              <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-6 w-6">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Multiple versions</h3>
              <p className="text-gray-700 dark:text-gray-300">
                Accédez à différentes versions de la Bible dans de nombreuses langues, toutes au même endroit.
              </p>
            </Card>

            {/* Fonctionnalité 2 */}
            <Card className="p-6">
              <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center text-purple-600 dark:text-purple-400 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-6 w-6">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.465a5 5 0 001.06-7.072m-2.11 9.9a9 9 0 010-12.728" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Contenu audio</h3>
              <p className="text-gray-700 dark:text-gray-300">
                Écoutez la Bible avec des narrations professionnelles disponibles dans plusieurs langues.
              </p>
            </Card>

            {/* Fonctionnalité 3 */}
            <Card className="p-6">
              <div className="h-12 w-12 bg-pink-100 dark:bg-pink-900/30 rounded-lg flex items-center justify-center text-pink-600 dark:text-pink-400 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-6 w-6">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Recherche avancée</h3>
              <p className="text-gray-700 dark:text-gray-300">
                Trouvez rapidement des passages, des versets ou des mots spécifiques dans toute la Bible.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Section des bibles populaires */}
      <section className="py-16 relative w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                Bibles populaires
              </h2>
              <p className="text-lg text-gray-700 dark:text-gray-300">
                Commencez votre lecture avec ces versions populaires
              </p>
            </div>
            <Link to="/explore" className="mt-4 md:mt-0">
              <Button variant="ghost">
                Voir toutes les versions
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <Card className="p-6 text-center text-red-600 dark:text-red-400">
              {error}
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredBibles.map((bible) => (
                <Link to={`/bible/${bible.id}`} key={bible.id}>
                  <Card hoverable className="h-full p-6 flex flex-col">
                    <div className="flex-1">
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
                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                      <span className="inline-flex items-center text-sm text-blue-600 dark:text-blue-400">
                        Commencer la lecture
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="ml-1 h-4 w-4">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </span>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Call-to-Action */}
      <section className="py-16 relative w-full">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card variant="glass" className="p-10 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900 dark:text-white">
              Prêt à explorer la Bible en profondeur ?
            </h2>
            <p className="text-lg text-gray-700 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Découvrez de nouvelles perspectives et approfondissez votre compréhension des textes sacrés.
            </p>
            <div className="flex justify-center w-full">
              <Link to="/explore" className="w-full md:w-auto">
                <Button size="lg" className="w-full md:w-auto">
                  Commencer l'aventure
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>
    </Layout>
  );
};

export default Home;