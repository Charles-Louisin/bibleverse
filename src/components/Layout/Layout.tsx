import React from 'react';
import Navbar from '../Navigation/Navbar';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      {/* Particules décoratives */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 bg-blue-400/5 dark:bg-indigo-600/10 rounded-full filter blur-3xl"></div>
        <div className="absolute top-1/3 right-1/4 w-1/3 h-1/3 bg-purple-400/5 dark:bg-purple-700/10 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-1/4 left-1/3 w-1/4 h-1/4 bg-pink-400/5 dark:bg-pink-700/10 rounded-full filter blur-3xl"></div>
      </div>

      {/* Lignes de grille */}
      <div className="fixed inset-0 opacity-[0.015] dark:opacity-[0.03] pointer-events-none">
        <div className="h-full w-full grid grid-cols-12 gap-4">
          {Array.from({ length: 12 }).map((_, index) => (
            <div key={index} className="border-r border-black dark:border-white"></div>
          ))}
        </div>
        <div className="h-full w-full grid grid-rows-12 gap-4">
          {Array.from({ length: 12 }).map((_, index) => (
            <div key={index} className="border-b border-black dark:border-white"></div>
          ))}
        </div>
      </div>

      {/* Contenu principal */}
      <Navbar />
      
      <main className="flex-grow mt-16 w-full px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
      
      <footer className="py-6 px-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 text-center text-sm text-gray-600 dark:text-gray-400 relative z-10">
        <div className="max-w-7xl mx-auto">
          <p>© {new Date().getFullYear()} BibleVerse. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout; 