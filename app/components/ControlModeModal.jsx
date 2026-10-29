'use client';

import React from 'react';
import { Smartphone, Hand, Sparkles, X, Check, ShieldCheck } from 'lucide-react';

export default function ControlModeModal({ onSelectMode, onClose }) {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 110,
      backgroundColor: 'rgba(7, 10, 19, 0.88)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div className="glass-panel" style={{
        maxWidth: '680px',
        width: '100%',
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        border: '1px solid rgba(56, 189, 248, 0.35)',
        padding: 'clamp(1.5rem, 4vw, 2.25rem)',
        borderRadius: '20px',
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.85)',
        position: 'relative'
      }}>
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: '4px'
          }}
          title="Close"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div className="badge" style={{ marginBottom: '0.625rem' }}>
            <Sparkles size={12} />
            <span>Select Interaction Experience</span>
          </div>
          <h2 style={{ fontSize: 'clamp(1.4rem, 3vw, 1.85rem)', fontWeight: 700, color: '#f8fafc', marginBottom: '0.5rem' }}>
            How would you like to explore?
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#94a3b8', maxWidth: '480px', margin: '0 auto' }}>
            Choose your preferred control method. You can switch between Touch and Hand Gestures at any time inside the AR experience.
          </p>
        </div>

        {/* 2 Options Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1.25rem',
          marginBottom: '1.75rem'
        }}>
          {/* Option 1: Touch Controls */}
          <div
            onClick={() => onSelectMode('touch')}
            className="glass-panel"
            style={{
              padding: '1.5rem',
              cursor: 'pointer',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'all 0.2s ease',
              backgroundColor: 'rgba(30, 41, 59, 0.5)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#38bdf8';
              e.currentTarget.style.transform = 'translateY(-3px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem'
              }}>
                <Smartphone size={24} />
              </div>

              <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#f8fafc', marginBottom: '0.4rem' }}>
                Touch Controls
              </h3>
              <p style={{ fontSize: '0.825rem', color: '#94a3b8', lineHeight: 1.5, marginBottom: '1rem' }}>
                Classic, intuitive controls. Drag with your finger or mouse to orbit, pinch to zoom, and tap any planet to inspect.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Check size={14} /> Ready on All Devices
              </span>
              <span style={{ fontSize: '0.825rem', color: '#38bdf8', fontWeight: 600 }}>Select →</span>
            </div>
          </div>

          {/* Option 2: Hand Gesture Controls */}
          <div
            onClick={() => onSelectMode('gesture')}
            className="glass-panel"
            style={{
              padding: '1.5rem',
              cursor: 'pointer',
              border: '1px solid rgba(129, 140, 248, 0.35)',
              borderRadius: '16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'all 0.2s ease',
              backgroundColor: 'rgba(129, 140, 248, 0.08)',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#818cf8';
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = '0 12px 30px rgba(129, 140, 248, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(129, 140, 248, 0.35)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              fontSize: '0.65rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(129, 140, 248, 0.25)',
              color: '#c7d2fe',
              border: '1px solid rgba(129, 140, 248, 0.4)'
            }}>
              AI VISION
            </div>

            <div>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                backgroundColor: 'rgba(129, 140, 248, 0.2)',
                color: '#818cf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem'
              }}>
                <Hand size={24} />
              </div>

              <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#f8fafc', marginBottom: '0.4rem' }}>
                Hand Gesture Controls
              </h3>
              <p style={{ fontSize: '0.825rem', color: '#94a3b8', lineHeight: 1.5, marginBottom: '1rem' }}>
                Touchless experience powered by camera AI vision. Move your palm to navigate, point at planets to highlight, and pinch to inspect.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: '0.75rem', color: '#818cf8', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Sparkles size={14} /> Touchless WebAR
              </span>
              <span style={{ fontSize: '0.825rem', color: '#818cf8', fontWeight: 600 }}>Select →</span>
            </div>
          </div>
        </div>

        {/* Security / Privacy reassurance */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.625rem',
          backgroundColor: 'rgba(7, 10, 19, 0.5)',
          padding: '0.75rem 1rem',
          borderRadius: '10px',
          fontSize: '0.775rem',
          color: '#64748b'
        }}>
          <ShieldCheck size={16} color="#10b981" style={{ flexShrink: 0 }} />
          <span>Camera stream is analyzed 100% on-device in your browser memory. No video or images are stored or transmitted.</span>
        </div>
      </div>
    </div>
  );
}
