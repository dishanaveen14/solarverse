'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ArrowLeft, Camera, Compass, RefreshCw, Play, Pause, AlertCircle, Eye } from 'lucide-react';
import { PLANETS } from '../data/planets';
import { generatePlanetTexture, generateRingTexture } from '../utils/textureGenerator';

export default function SolarSystemViewer({ initialMode = 'AR', onClose, onSelectPlanet }) {
  const containerRef = useRef(null);
  const videoRef = useRef(null);

  const [mode, setMode] = useState(initialMode); // 'AR' | 'SPACE'
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' | 'user'
  const [isPaused, setIsPaused] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [selectedPlanetName, setSelectedPlanetName] = useState(null);

  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const streamRef = useRef(null);
  const planetsMeshRef = useRef([]);
  const starfieldRef = useRef(null);

  // 1. Initialize WebRTC Camera for AR Mode
  const startCamera = async (facing = facingMode) => {
    setCameraError(null);
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera API is not supported in this browser context.');
      setMode('SPACE');
      return;
    }

    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: facing }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false
        });
      } catch (inner) {
        // Fallback to any generic camera
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', '');
        videoRef.current.muted = true;
        await videoRef.current.play().catch(() => {});
      }
      setCameraActive(true);
      if (rendererRef.current) rendererRef.current.setClearColor(0x000000, 0);
      if (starfieldRef.current) starfieldRef.current.visible = false;
    } catch (err) {
      console.warn('AR Camera access issue:', err);
      setCameraError('Camera access was denied or is unavailable. Switched to 3D Space View.');
      setCameraActive(false);
      setMode('SPACE');
      if (rendererRef.current) rendererRef.current.setClearColor(0x070a13, 1);
      if (starfieldRef.current) starfieldRef.current.visible = true;
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  // 2. Initialize Three.js Full Solar System Scene
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 1000);
    camera.position.set(0, 38, 64);
    cameraRef.current = camera;

    // Renderer (Alpha enabled for AR Camera transparency)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    rendererRef.current = renderer;
    container.replaceChildren(renderer.domElement);

    // Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 6;
    controls.maxDistance = 160;
    controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };
    controlsRef.current = controls;

    // Cosmic Lighting: Sun Light + Headlight + Ambient
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const headlight = new THREE.DirectionalLight(0xffffff, 1.4);
    headlight.position.set(0, 20, 40);
    scene.add(headlight);

    const sunPointLight = new THREE.PointLight(0xfffbeb, 2.5, 300, 0.2);
    sunPointLight.position.set(0, 0, 0);
    scene.add(sunPointLight);

    // Starfield Points (used in 3D Space Mode)
    const starGeo = new THREE.BufferGeometry();
    const starCount = 1200;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 600;
      starPositions[i + 1] = (Math.random() - 0.5) * 600;
      starPositions[i + 2] = (Math.random() - 0.5) * 600;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.8, transparent: true, opacity: 0.7 });
    const starfield = new THREE.Points(starGeo, starMat);
    scene.add(starfield);
    starfieldRef.current = starfield;

    // Build Planets & Orbits
    const planetMeshes = [];
    PLANETS.forEach((pData) => {
      const isSun = pData.id === 'sun';
      const texture = generatePlanetTexture(pData.id, window.innerWidth <= 768);

      const geometry = new THREE.SphereGeometry(pData.radius, 32, 32);
      const material = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: isSun ? 0.1 : 0.65,
        metalness: 0.1,
        emissive: isSun ? new THREE.Color(0xf59e0b) : new THREE.Color(0x000000),
        emissiveIntensity: isSun ? 0.9 : 0
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.userData = { planet: pData, angle: Math.random() * Math.PI * 2 };

      // Optional Ring for Saturn / Uranus
      if (pData.hasRings) {
        const ringGeo = new THREE.RingGeometry(pData.ringInnerRadius, pData.ringOuterRadius, 64);
        const uvs = ringGeo.attributes.uv;
        const pos = ringGeo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          const x = pos.getX(i);
          const y = pos.getY(i);
          const d = Math.sqrt(x * x + y * y);
          uvs.setXY(i, (d - pData.ringInnerRadius) / (pData.ringOuterRadius - pData.ringInnerRadius), 0.5);
        }
        ringGeo.attributes.uv.needsUpdate = true;

        const ringMat = new THREE.MeshBasicMaterial({
          map: generateRingTexture(),
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.85
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2.3;
        mesh.add(ring);
      }

      scene.add(mesh);
      planetMeshes.push(mesh);

      // Draw Orbit Ring Line
      if (pData.orbitRadius > 0) {
        const orbitPoints = [];
        const segments = 128;
        for (let i = 0; i <= segments; i++) {
          const theta = (i / segments) * Math.PI * 2;
          orbitPoints.push(new THREE.Vector3(Math.cos(theta) * pData.orbitRadius, 0, Math.sin(theta) * pData.orbitRadius));
        }
        const orbitLineGeo = new THREE.BufferGeometry().setFromPoints(orbitPoints);
        const orbitLineMat = new THREE.LineBasicMaterial({
          color: new THREE.Color(pData.color),
          transparent: true,
          opacity: 0.22
        });
        const orbitLine = new THREE.LineLoop(orbitLineGeo, orbitLineMat);
        scene.add(orbitLine);
      }
    });
    planetsMeshRef.current = planetMeshes;

    // Raycaster for Planet Clicking
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(planetMeshes, true);
      if (intersects.length > 0) {
        let hit = intersects[0].object;
        while (hit && !hit.userData?.planet && hit.parent) {
          hit = hit.parent;
        }
        if (hit?.userData?.planet) {
          setSelectedPlanetName(hit.userData.planet.name);
          onSelectPlanet(hit.userData.planet);
        }
      }
    };
    renderer.domElement.addEventListener('pointerdown', handlePointerDown);

    // Animation Loop
    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Orbit mechanics
      if (!isPaused) {
        planetMeshes.forEach((mesh) => {
          const p = mesh.userData.planet;
          if (p.orbitRadius > 0) {
            mesh.userData.angle += p.orbitSpeed * 0.25 * speedMultiplier;
            mesh.position.x = Math.cos(mesh.userData.angle) * p.orbitRadius;
            mesh.position.z = Math.sin(mesh.userData.angle) * p.orbitRadius;
          }
          mesh.rotation.y += p.rotationSpeed * speedMultiplier;
        });
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      renderer.dispose();
      stopCamera();
    };
  }, [isPaused, speedMultiplier]);

  // Mode Effect: AR vs SPACE
  useEffect(() => {
    if (mode === 'AR') {
      startCamera(facingMode);
    } else {
      stopCamera();
      if (rendererRef.current) rendererRef.current.setClearColor(0x070a13, 1);
      if (starfieldRef.current) starfieldRef.current.visible = true;
    }
  }, [mode, facingMode]);

  const toggleFacingMode = () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacing);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 80,
      backgroundColor: mode === 'AR' ? 'transparent' : '#070a13',
      overflow: 'hidden'
    }}>
      {/* Live Camera Video Background for AR Mode */}
      <video
        ref={videoRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: mode === 'AR' && cameraActive ? 'block' : 'none',
          zIndex: 1
        }}
      />

      {/* Three.js Canvas Container */}
      <div
        ref={containerRef}
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 2,
          touchAction: 'none'
        }}
      />

      {/* Top Floating HUD Controls */}
      <div style={{
        position: 'absolute',
        top: '16px',
        left: '16px',
        right: '16px',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        pointerEvents: 'none'
      }}>
        {/* Back Button */}
        <button
          onClick={onClose}
          className="btn-secondary"
          style={{
            pointerEvents: 'auto',
            padding: '0.625rem 1.15rem',
            fontSize: '0.875rem',
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(12px)',
            borderColor: 'rgba(255, 255, 255, 0.15)'
          }}
        >
          <ArrowLeft size={16} />
          <span>Exit to Overview</span>
        </button>

        {/* Mode Toggle & Camera Flipping */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', pointerEvents: 'auto' }}>
          <button
            onClick={() => setMode(mode === 'AR' ? 'SPACE' : 'AR')}
            className={mode === 'AR' ? 'btn-primary' : 'btn-secondary'}
            style={{
              padding: '0.625rem 1.15rem',
              fontSize: '0.875rem',
              backdropFilter: 'blur(12px)'
            }}
          >
            {mode === 'AR' ? <Camera size={16} /> : <Compass size={16} />}
            <span>{mode === 'AR' ? 'AR Camera Active' : '3D Space Mode'}</span>
          </button>

          {mode === 'AR' && (
            <button
              onClick={toggleFacingMode}
              className="btn-secondary"
              style={{
                padding: '0.625rem',
                backgroundColor: 'rgba(15, 23, 42, 0.85)',
                backdropFilter: 'blur(12px)'
              }}
              title="Flip Camera (Front / Rear)"
            >
              <RefreshCw size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Camera Fallback Banner (if permission denied or unavailable) */}
      {cameraError && (
        <div style={{
          position: 'absolute',
          top: '76px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 15,
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid rgba(245, 158, 11, 0.5)',
          borderRadius: '10px',
          padding: '0.75rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          maxWidth: '90%',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
        }}>
          <AlertCircle size={18} color="#f59e0b" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: '0.825rem', color: '#f8fafc' }}>
            {cameraError}
          </span>
          <button
            onClick={() => startCamera(facingMode)}
            className="btn-outline"
            style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
          >
            Retry Camera
          </button>
        </div>
      )}

      {/* Bottom Floating Control Bar */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10,
        backgroundColor: 'rgba(15, 23, 42, 0.88)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '16px',
        padding: '0.5rem 1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        maxWidth: '92%'
      }}>
        {/* Play / Pause Orbit */}
        <button
          onClick={() => setIsPaused(!isPaused)}
          style={{
            background: 'none',
            border: 'none',
            color: '#f8fafc',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            fontSize: '0.8rem',
            padding: '4px'
          }}
          title={isPaused ? 'Resume Orbits' : 'Pause Orbits'}
        >
          {isPaused ? <Play size={16} color="#10b981" /> : <Pause size={16} color="#38bdf8" />}
          <span>{isPaused ? 'Paused' : 'Orbiting'}</span>
        </button>

        <div style={{ width: '1px', height: '18px', backgroundColor: 'rgba(255,255,255,0.15)' }} />

        {/* Speed multiplier selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          {[0.5, 1, 2].map((s) => (
            <button
              key={s}
              onClick={() => setSpeedMultiplier(s)}
              style={{
                background: speedMultiplier === s ? 'rgba(56, 189, 248, 0.25)' : 'none',
                border: speedMultiplier === s ? '1px solid rgba(56, 189, 248, 0.5)' : '1px solid transparent',
                color: speedMultiplier === s ? '#38bdf8' : '#94a3b8',
                borderRadius: '6px',
                padding: '3px 7px',
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}
            >
              {s}x
            </button>
          ))}
        </div>

        <div style={{ width: '1px', height: '18px', backgroundColor: 'rgba(255,255,255,0.15)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#94a3b8' }}>
          <Eye size={13} />
          <span>Tap planet to inspect</span>
        </div>
      </div>
    </div>
  );
}
