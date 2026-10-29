'use client';

import React from 'react';
import { Sparkles, Camera, Compass, Github } from 'lucide-react';
import { APP_CONFIG } from '../data/planets';

export default function Navbar({ onStartAR, onStartSpace }) {
  return (
    <header style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 50,
      height: '68px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 1.5rem',
      backgroundColor: 'rgba(7, 10, 19, 0.85)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 14px rgba(56, 189, 248, 0.35)'
        }}>
          <Sparkles size={20} color="#070a13" />
        </div>
        <div>
          <span style={{ fontSize: '1.2rem', fontWeight: 700, letterSpacing: '-0.02em', color: '#f8fafc' }}>
            Solar<span style={{ color: '#38bdf8' }}>Verse</span>
          </span>
          <span style={{ display: 'none', marginLeft: '8px', fontSize: '0.75rem', color: '#94a3b8' }}>
            v3.0 WebAR
          </span>
        </div>
      </div>

      <nav style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button
          onClick={onStartSpace}
          className="btn-secondary"
          style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
          title="Explore in 3D Space View"
        >
          <Compass size={16} />
          <span className="hidden sm:inline">3D Space View</span>
        </button>

        <button
          onClick={onStartAR}
          className="btn-primary"
          style={{ padding: '0.5rem 1.15rem', fontSize: '0.875rem' }}
          title="Launch Live Augmented Reality Camera"
        >
          <Camera size={16} />
          <span>Start AR</span>
        </button>

        <a
          href={APP_CONFIG.githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            color: '#94a3b8',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            backgroundColor: 'rgba(30, 41, 59, 0.5)',
            transition: 'all 0.2s ease'
          }}
          title="View GitHub Repository"
        >
          <Github size={18} />
        </a>
      </nav>
    </header>
  );
}
