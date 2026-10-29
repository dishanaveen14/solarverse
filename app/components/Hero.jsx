'use client';

import React from 'react';
import { Camera, Compass, Smartphone, Globe, ShieldCheck, ArrowRight } from 'lucide-react';

export default function Hero({ onStartAR, onStartSpace, onScrollToQR }) {
  return (
    <section style={{
      padding: '140px 1.5rem 60px',
      maxWidth: '1200px',
      margin: '0 auto',
      textAlign: 'center'
    }}>
      {/* Top Tagline Badge */}
      <div style={{ display: 'inline-flex', marginBottom: '1.25rem' }}>
        <div className="badge pulse-badge" style={{ gap: '0.5rem', padding: '0.35rem 0.95rem' }}>
          <Smartphone size={13} />
          <span>Web Augmented Reality &amp; 3D Observatory</span>
        </div>
      </div>

      {/* Main Headline */}
      <h1 style={{
        fontSize: 'clamp(2.4rem, 6vw, 4.2rem)',
        fontWeight: 800,
        lineHeight: 1.1,
        letterSpacing: '-0.03em',
        maxWidth: '900px',
        margin: '0 auto 1.25rem',
        color: '#f8fafc'
      }}>
        Explore the Solar System in <span style={{
          background: 'linear-gradient(135deg, #38bdf8 0%, #818cf8 50%, #f472b6 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>Augmented Reality</span>
      </h1>

      {/* Short, clear, intentional explanation */}
      <p style={{
        fontSize: 'clamp(1rem, 2.2vw, 1.25rem)',
        color: '#94a3b8',
        maxWidth: '720px',
        margin: '0 auto 2.25rem',
        lineHeight: 1.6
      }}>
        A scientifically grounded, phone-friendly space observatory. Study planets up-close in photorealistic 3D, or place planetary orbits directly onto your tabletop and room with your phone’s camera.
      </p>

      {/* Action Buttons: 1 Prominent Primary "Start AR Experience" */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        marginBottom: '3rem'
      }}>
        <button
          onClick={onStartAR}
          className="btn-primary"
          style={{
            fontSize: '1.1rem',
            padding: '1rem 2.25rem',
            borderRadius: '14px'
          }}
        >
          <Camera size={22} />
          <span>Start AR Experience</span>
        </button>

        <button
          onClick={onStartSpace}
          className="btn-secondary"
          style={{
            fontSize: '1.05rem',
            padding: '1rem 2rem',
            borderRadius: '14px'
          }}
        >
          <Compass size={20} />
          <span>Explore 3D Space View</span>
        </button>

        <button
          onClick={onScrollToQR}
          className="btn-outline"
          style={{
            fontSize: '0.95rem',
            padding: '0.95rem 1.5rem',
            borderRadius: '14px'
          }}
        >
          <span>Scan Phone QR Code</span>
          <ArrowRight size={16} />
        </button>
      </div>

      {/* Key Guarantees & Features */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.25rem',
        maxWidth: '960px',
        margin: '0 auto',
        textAlign: 'left'
      }}>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', color: '#38bdf8' }}>
            <Camera size={18} />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f8fafc' }}>Zero App Install</h3>
          </div>
          <p style={{ fontSize: '0.825rem', color: '#94a3b8', lineHeight: 1.5 }}>
            Runs natively inside iOS Safari and Android Chrome over HTTPS with standard WebRTC camera access.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', color: '#818cf8' }}>
            <Globe size={18} />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f8fafc' }}>Precision 3D Orbit Controls</h3>
          </div>
          <p style={{ fontSize: '0.825rem', color: '#94a3b8', lineHeight: 1.5 }}>
            Full 360° touch and cursor interaction to rotate, zoom, and inspect individual planetary features.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', color: '#10b981' }}>
            <ShieldCheck size={18} />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f8fafc' }}>Active Cosmic Lighting</h3>
          </div>
          <p style={{ fontSize: '0.825rem', color: '#94a3b8', lineHeight: 1.5 }}>
            Multi-light rig ensures planet surfaces are brightly illuminated and never obscured in pitch-black shadows.
          </p>
        </div>
      </div>
    </section>
  );
}
