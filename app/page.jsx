'use client';

import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import QRCodeCard from './components/QRCodeCard';
import PlanetGrid from './components/PlanetGrid';
import PlanetModal from './components/PlanetModal';
import SolarSystemViewer from './components/SolarSystemViewer';
import QuizSection from './components/QuizSection';
import { PLANETS } from './data/planets';

export default function SolarVerseApp() {
  const [activeViewerMode, setActiveViewerMode] = useState(null); // null | 'AR' | 'SPACE'
  const [selectedPlanet, setSelectedPlanet] = useState(null);

  // Auto-launch AR experience if URL contains ?ar=1 or #ar (e.g. from phone QR scan)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const hasArParam = searchParams.get('ar') === '1' || window.location.hash.toLowerCase().includes('ar');
      if (hasArParam) {
        setActiveViewerMode('AR');
      }
    }
  }, []);

  const handleStartAR = () => {
    setActiveViewerMode('AR');
  };

  const handleStartSpace = () => {
    setActiveViewerMode('SPACE');
  };

  const handleCloseViewer = () => {
    setActiveViewerMode(null);
  };

  const handleScrollToQR = () => {
    const el = document.getElementById('phone-qr-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#070a13', color: '#f8fafc', position: 'relative' }}>
      {/* Top Navbar */}
      <Navbar
        onStartAR={handleStartAR}
        onStartSpace={handleStartSpace}
      />

      {/* Hero Landing Section */}
      <Hero
        onStartAR={handleStartAR}
        onStartSpace={handleStartSpace}
        onScrollToQR={handleScrollToQR}
      />

      {/* Prominent High-Contrast Phone QR Code Section with On-Device Option */}
      <QRCodeCard
        onOpenAROnPhone={handleStartAR}
        onSelectTargetImage={() => setActiveViewerMode('AR')}
      />

      {/* Interactive Planet Catalog */}
      <PlanetGrid
        onSelectPlanet={(planet) => setSelectedPlanet(planet)}
      />

      {/* Solar Quiz Module */}
      <QuizSection />

      {/* Isolated 3D Planet Inspection Modal */}
      {selectedPlanet && (
        <PlanetModal
          planet={selectedPlanet}
          onClose={() => setSelectedPlanet(null)}
        />
      )}

      {/* Full-Screen 3D & WebAR Solar System Viewer */}
      {activeViewerMode && (
        <SolarSystemViewer
          initialMode={activeViewerMode}
          onClose={handleCloseViewer}
          onSelectPlanet={(planet) => setSelectedPlanet(planet)}
        />
      )}

      {/* Clean Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '3rem 1.5rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        fontSize: '0.85rem',
        color: '#64748b'
      }}>
        <p style={{ marginBottom: '0.5rem' }}>
          SolarVerse &bull; Built with Next.js, Three.js &amp; WebAR &bull; Deployed on Vercel HTTPS
        </p>
        <p style={{ fontSize: '0.75rem', color: '#475569' }}>
          Real-time astronomical simulation. Camera feed runs securely on-device without recording or cloud storage.
        </p>
      </footer>
    </main>
  );
}
