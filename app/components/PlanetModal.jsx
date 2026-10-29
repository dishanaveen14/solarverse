'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ArrowLeft, X, Sparkles, Compass, CheckCircle2, Info } from 'lucide-react';
import { generatePlanetTexture, generateRingTexture } from '../utils/textureGenerator';

export default function PlanetModal({ planet, onClose }) {
  const mountRef = useRef(null);

  useEffect(() => {
    if (!planet || !mountRef.current) return;

    const container = mountRef.current;
    const width = container.clientWidth || 340;
    const height = container.clientHeight || 340;

    // Scene, Camera & Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 4.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.replaceChildren(renderer.domElement);

    // OrbitControls for cursor & touch rotation
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.minDistance = 2.0;
    controls.maxDistance = 7.5;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.8;

    // Bright Cosmic Lighting Rig (prevents dark shadows)
    scene.add(new THREE.AmbientLight(0xffffff, 1.2));
    const headlight = new THREE.DirectionalLight(0xffffff, 2.0);
    headlight.position.set(5, 4, 6);
    scene.add(headlight);

    const fillLight = new THREE.DirectionalLight(0x818cf8, 0.8);
    fillLight.position.set(-6, -3, -4);
    scene.add(fillLight);

    // 3D Planet Mesh
    const texture = generatePlanetTexture(planet.id, false);
    const geometry = new THREE.SphereGeometry(1.4, 64, 64);
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: planet.id === 'sun' ? 0.2 : 0.65,
      metalness: 0.1,
      emissive: planet.id === 'sun' ? new THREE.Color(0xf59e0b) : new THREE.Color(0x000000),
      emissiveIntensity: planet.id === 'sun' ? 0.6 : 0
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Optional Rings (Saturn, Uranus)
    let ringMesh = null;
    if (planet.hasRings) {
      const ringGeo = new THREE.RingGeometry(1.8, 3.2, 64);
      // Align ring UV mapping
      const pos = ringGeo.attributes.position;
      const uvs = ringGeo.attributes.uv;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const d = Math.sqrt(x * x + y * y);
        uvs.setXY(i, (d - 1.8) / (3.2 - 1.8), 0.5);
      }
      ringGeo.attributes.uv.needsUpdate = true;

      const ringMat = new THREE.MeshBasicMaterial({
        map: generateRingTexture(),
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.88
      });

      ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 2.3;
      scene.add(ringMesh);
    }

    // Animation Loop
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      mesh.rotation.y += 0.003;
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      if (ringMesh) {
        ringMesh.geometry.dispose();
        ringMesh.material.dispose();
      }
    };
  }, [planet]);

  if (!planet) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      backgroundColor: 'rgba(7, 10, 19, 0.88)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      overflowY: 'auto'
    }}>
      <div className="glass-panel" style={{
        maxWidth: '920px',
        width: '100%',
        maxHeight: '92vh',
        overflowY: 'auto',
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        border: '1px solid rgba(56, 189, 248, 0.3)',
        padding: 'clamp(1.25rem, 3vw, 2.25rem)',
        position: 'relative',
        boxShadow: '0 25px 70px -15px rgba(0, 0, 0, 0.8)'
      }}>
        {/* Top Navigation & Return Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          {/* Unmistakable "Back to Solar System" Button */}
          <button
            onClick={onClose}
            className="btn-secondary"
            style={{
              padding: '0.625rem 1.25rem',
              fontSize: '0.9rem',
              color: '#38bdf8',
              backgroundColor: 'rgba(56, 189, 248, 0.1)',
              borderColor: 'rgba(56, 189, 248, 0.3)'
            }}
          >
            <ArrowLeft size={16} />
            <span>Back to Solar System</span>
          </button>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px'
            }}
            title="Close"
          >
            <X size={22} />
          </button>
        </div>

        {/* Content Layout: 3D View (Left) + Data (Right) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem',
          alignItems: 'start'
        }}>
          {/* Left Column: Interactive 3D Sphere */}
          <div>
            <div style={{
              width: '100%',
              height: '340px',
              backgroundColor: 'rgba(7, 10, 19, 0.7)',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              overflow: 'hidden',
              position: 'relative'
            }}>
              <div ref={mountRef} style={{ width: '100%', height: '100%' }} />

              {/* Cursor / Touch Rotation Hint */}
              <div style={{
                position: 'absolute',
                bottom: '12px',
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: '0.725rem',
                color: '#94a3b8',
                backgroundColor: 'rgba(7, 10, 19, 0.75)',
                padding: '4px 10px',
                borderRadius: '6px',
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                whiteSpace: 'nowrap'
              }}>
                <Compass size={12} />
                <span>Drag to rotate &bull; Scroll to zoom</span>
              </div>
            </div>

            <div style={{ marginTop: '0.75rem', textAlign: 'center' }}>
              <span className="badge" style={{ fontSize: '0.7rem' }}>
                Real-Time Three.js WebGL Render
              </span>
            </div>
          </div>

          {/* Right Column: Key Facts & Scientific Stats */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.35rem' }}>
              <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#f8fafc' }}>
                {planet.name}
              </h2>
              <div style={{
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                backgroundColor: planet.color,
                boxShadow: `0 0 10px ${planet.color}`
              }} />
            </div>

            <span style={{ fontSize: '0.85rem', color: '#38bdf8', fontWeight: 500, display: 'block', marginBottom: '1rem' }}>
              {planet.type}
            </span>

            <p style={{ fontSize: '0.925rem', color: '#cbd5e1', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              {planet.summary}
            </p>

            {/* Key Physical Stats Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '0.75rem',
              backgroundColor: 'rgba(7, 10, 19, 0.5)',
              padding: '1rem',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              marginBottom: '1.5rem'
            }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>Diameter</span>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f8fafc' }}>{planet.diameter}</p>
              </div>

              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>Distance from Sun</span>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f8fafc' }}>{planet.distanceFromSun}</p>
              </div>

              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>Orbital Period (Year)</span>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f8fafc' }}>{planet.orbitalPeriod}</p>
              </div>

              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>Day Length</span>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f8fafc' }}>{planet.dayLength}</p>
              </div>

              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>Known Moons</span>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f8fafc' }}>{planet.moons}</p>
              </div>

              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>Temperature</span>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f8fafc' }}>{planet.temperature}</p>
              </div>
            </div>

            {/* Verified Facts */}
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>
                Key Astronomical Facts
              </h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {planet.facts.map((fact, idx) => (
                  <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', fontSize: '0.85rem', color: '#e2e8f0', lineHeight: 1.5 }}>
                    <CheckCircle2 size={16} color="#38bdf8" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span>{fact}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Return Button */}
        <div style={{ marginTop: '2rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'right' }}>
          <button
            onClick={onClose}
            className="btn-primary"
            style={{ padding: '0.75rem 1.75rem', fontSize: '0.95rem' }}
          >
            <ArrowLeft size={16} />
            <span>Return to Solar System</span>
          </button>
        </div>
      </div>
    </div>
  );
}
