'use client';

import React from 'react';
import { X, Hand, Compass, ZoomIn, Target, CheckCircle2 } from 'lucide-react';

export default function GestureGuideModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const gestures = [
    {
      icon: <Hand size={24} color="#38bdf8" />,
      title: 'Move & Pan Solar System',
      gesture: 'Open Palm',
      instruction: 'Hold your open palm facing the camera. Move your hand left, right, up, or down to translate the solar system in 3D space.'
    },
    {
      icon: <Target size={24} color="#818cf8" />,
      title: 'Point & Hover Planet',
      gesture: 'Extend Index Finger',
      instruction: 'Point your index finger toward any planet. A targeting reticle will track your fingertip, highlighting the planet and displaying its name.'
    },
    {
      icon: <CheckCircle2 size={24} color="#10b981" />,
      title: 'Select & Inspect Planet',
      gesture: 'Pinch & Hold (0.4s)',
      instruction: 'Bring your thumb and index finger together while hovering over a planet. A confirmation circle will fill, opening the detailed 3D inspection view.'
    },
    {
      icon: <ZoomIn size={24} color="#f59e0b" />,
      title: 'Zoom In & Out',
      gesture: 'Move Hand Closer / Farther',
      instruction: 'Move your hand closer to the camera to zoom in on planets, or move your hand further back to zoom out to the full system.'
    },
    {
      icon: <Compass size={24} color="#ec4899" />,
      title: 'Rotate Solar System',
      gesture: 'Tilt Palm',
      instruction: 'Rotate your wrist/palm slightly left or right to smoothly orbit and tilt the solar system plane.'
    }
  ];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 120,
      backgroundColor: 'rgba(7, 10, 19, 0.85)',
      backdropFilter: 'blur(16px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div className="glass-panel" style={{
        maxWidth: '640px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        backgroundColor: 'rgba(15, 23, 42, 0.96)',
        border: '1px solid rgba(56, 189, 248, 0.35)',
        padding: 'clamp(1.25rem, 3vw, 2rem)',
        borderRadius: '20px',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.25rem',
          paddingBottom: '0.75rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.25rem' }}>
              Hand Gesture Control Guide
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Hold your hand roughly 1 to 2 feet in front of your camera for optimal tracking.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Gestures List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
          {gestures.map((item, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                gap: '1rem',
                alignItems: 'flex-start',
                backgroundColor: 'rgba(7, 10, 19, 0.6)',
                padding: '0.875rem 1rem',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }}
            >
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                backgroundColor: 'rgba(30, 41, 59, 0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {item.icon}
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                  <h4 style={{ fontSize: '0.925rem', fontWeight: 600, color: '#f8fafc' }}>
                    {item.title}
                  </h4>
                  <span style={{
                    fontSize: '0.7rem',
                    padding: '1px 6px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(56, 189, 248, 0.15)',
                    color: '#38bdf8',
                    fontWeight: 600
                  }}>
                    {item.gesture}
                  </span>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.45 }}>
                  {item.instruction}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Close Button */}
        <div style={{ textAlign: 'right' }}>
          <button
            onClick={onClose}
            className="btn-primary"
            style={{ padding: '0.625rem 1.5rem', fontSize: '0.875rem' }}
          >
            Got It &bull; Resume AR
          </button>
        </div>
      </div>
    </div>
  );
}
