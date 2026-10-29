'use client';

import React from 'react';
import { Eye, ArrowUpRight, Globe2, Compass } from 'lucide-react';
import { PLANETS } from '../data/planets';

export default function PlanetGrid({ onSelectPlanet }) {
  return (
    <section id="planets-section" style={{
      maxWidth: '1200px',
      margin: '0 auto 100px',
      padding: '0 1.5rem'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <div className="badge" style={{ marginBottom: '0.75rem' }}>
          <Globe2 size={12} />
          <span>Interactive Catalog</span>
        </div>
        <h2 style={{
          fontSize: 'clamp(1.8rem, 4vw, 2.75rem)',
          fontWeight: 700,
          letterSpacing: '-0.02em',
          color: '#f8fafc',
          marginBottom: '0.75rem'
        }}>
          Planetary Exploration
        </h2>
        <p style={{
          fontSize: '1rem',
          color: '#94a3b8',
          maxWidth: '640px',
          margin: '0 auto',
          lineHeight: 1.6
        }}>
          Select any celestial body to open an isolated 3D inspection view with 360° rotation controls and verified astronomical data.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '1.5rem'
      }}>
        {PLANETS.map((planet) => (
          <div
            key={planet.id}
            onClick={() => onSelectPlanet(planet)}
            className="glass-panel"
            style={{
              padding: '1.5rem',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Ambient Corner Glow Accent */}
            <div style={{
              position: 'absolute',
              top: '-30px',
              right: '-30px',
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              backgroundColor: planet.glowColor,
              filter: 'blur(35px)',
              pointerEvents: 'none',
              opacity: 0.6
            }} />

            {/* Top Bar: Planet Name & Type */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <div style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    backgroundColor: planet.color,
                    boxShadow: `0 0 12px ${planet.color}`
                  }} />
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#f8fafc' }}>
                    {planet.name}
                  </h3>
                </div>

                <span style={{
                  fontSize: '0.75rem',
                  padding: '0.2rem 0.55rem',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  color: '#cbd5e1'
                }}>
                  {planet.type}
                </span>
              </div>

              {/* Summary */}
              <p style={{
                fontSize: '0.85rem',
                color: '#94a3b8',
                lineHeight: 1.5,
                marginBottom: '1.25rem',
                minHeight: '2.6rem'
              }}>
                {planet.summary}
              </p>

              {/* Quick Specs Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.75rem',
                backgroundColor: 'rgba(7, 10, 19, 0.6)',
                padding: '0.875rem',
                borderRadius: '10px',
                marginBottom: '1.25rem'
              }}>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', display: 'block' }}>
                    Diameter
                  </span>
                  <span style={{ fontSize: '0.825rem', color: '#e2e8f0', fontWeight: 500 }}>
                    {planet.diameter}
                  </span>
                </div>

                <div>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', display: 'block' }}>
                    Distance
                  </span>
                  <span style={{ fontSize: '0.825rem', color: '#e2e8f0', fontWeight: 500 }}>
                    {planet.distanceFromSun}
                  </span>
                </div>

                <div>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', display: 'block' }}>
                    Moons
                  </span>
                  <span style={{ fontSize: '0.825rem', color: '#e2e8f0', fontWeight: 500 }}>
                    {planet.moons}
                  </span>
                </div>

                <div>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', display: 'block' }}>
                    Avg Temp
                  </span>
                  <span style={{ fontSize: '0.825rem', color: '#e2e8f0', fontWeight: 500 }}>
                    {planet.temperature.split(' ')[0]}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Footer */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '0.75rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.06)'
            }}>
              <span style={{ fontSize: '0.825rem', color: '#38bdf8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Eye size={14} />
                <span>Inspect in 3D</span>
              </span>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                backgroundColor: 'rgba(56, 189, 248, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38bdf8'
              }}>
                <ArrowUpRight size={15} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
