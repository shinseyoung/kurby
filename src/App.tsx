import React, { useState } from 'react';
import LandingPage from './components/LandingPage';
import MainPage from './components/MainPage';
import type { PageType } from './types';

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('landing');

  return (
    <>
      {currentPage === 'landing' && (
        <LandingPage onStart={() => setCurrentPage('main')} />
      )}
      
      {currentPage === 'main' && (
        <MainPage />
      )}
    </>
  );
}