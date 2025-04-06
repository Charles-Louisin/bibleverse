import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { BibleProvider } from './contexts/BibleContext';
import Home from './components/Home/Home';
import ExplorePage from './components/Explore/ExplorePage';
import BibleDetailPage from './components/Bible/BibleDetailPage';
import ChapterPage from './components/Bible/ChapterPage';
import SearchPage from './components/Search/SearchPage';
import AudioPage from './components/Audio/AudioPage';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <BibleProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/audio" element={<AudioPage />} />
            <Route path="/bible/:bibleId" element={<BibleDetailPage />} />
            <Route path="/bible/:bibleId/chapter/:chapterId" element={<ChapterPage />} />
            <Route path="/bible/:bibleId/audio" element={<AudioPage />} />
            <Route path="/bible/:bibleId/audio/:bookId" element={<AudioPage />} />
            <Route path="/bible/:bibleId/audio/:bookId/:chapterId" element={<AudioPage />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </BrowserRouter>
      </BibleProvider>
    </ThemeProvider>
  );
};

export default App;
