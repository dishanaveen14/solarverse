'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  ArrowLeft, Camera, Compass, RefreshCw, Play, Pause, AlertCircle,
  Eye, Hand, Smartphone, HelpCircle, Sliders, RotateCcw, Target
} from 'lucide-react';
import { PLANETS } from '../data/planets';
import { generatePlanetTexture, generateRingTexture } from '../utils/textureGenerator';
import GestureGuideModal from './GestureGuideModal';

export default function SolarSystemViewer({
  initialMode = 'AR',
  initialControl = 'touch', // 'touch' | 'gesture'
  onClose,
  onSelectPlanet
}) {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const reticleCanvasRef = useRef(null);

  // General App Modes
  const [viewMode, setViewMode] = useState(initialMode); // 'AR' | 'SPACE'
  const [controlMode, setControlMode] = useState(initialControl); // 'touch' | 'gesture'
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' | 'user'
  const [isPaused, setIsPaused] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);

  // Gesture Tracking States
  const [trackingActive, setTrackingActive] = useState(false);
  const [trackingPaused, setTrackingPaused] = useState(false);
  const [handStatusText, setHandStatusText] = useState('Initializing vision tracking...');
  const [handStatusColor, setHandStatusColor] = useState('#f59e0b'); // amber / emerald
  const [hoveredPlanet, setHoveredPlanet] = useState(null);
  const [pinchProgress, setPinchProgress] = useState(0); // 0 to 1
  const [sensitivity, setSensitivity] = useState('normal'); // 'low' | 'normal' | 'high'
  const [showGestureGuide, setShowGestureGuide] = useState(false);

  // Three.js & Vision Refs
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const solarGroupRef = useRef(null);
  const streamRef = useRef(null);
  const planetsMeshRef = useRef([]);
  const starfieldRef = useRef(null);

  // Gesture math smoothing refs
  const smoothedHandPos = useRef({ x: 0.5, y: 0.5, size: 0.2, angle: 0 });
  const prevHandPos = useRef({ x: 0.5, y: 0.5, size: 0.2, angle: 0 });
  const pinchStartTime = useRef(null);
  const hasDetectedHand = useRef(false);
  const lastDetectionTimestamp = useRef(0);
  const handsWorkerRef = useRef(null);

  // 1. Camera Lifecycle Management
  const startCamera = async (facing = facingMode) => {
    setCameraError(null);
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera API is not supported in this browser context.');
      setViewMode('SPACE');
      setControlMode('touch');
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
      console.warn('Camera access issue:', err);
      setCameraError('Camera access denied or unavailable. Switched to 3D Space View & Touch Controls.');
      setCameraActive(false);
      setViewMode('SPACE');
      setControlMode('touch');
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

    // Cosmic Lighting: Sun Light + Headlight + Ambient Fill
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const headlight = new THREE.DirectionalLight(0xffffff, 1.4);
    headlight.position.set(0, 20, 40);
    scene.add(headlight);

    const sunPointLight = new THREE.PointLight(0xfffbeb, 2.5, 300, 0.2);
    sunPointLight.position.set(0, 0, 0);
    scene.add(sunPointLight);

    // Starfield Points (for 3D Space Mode)
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

    // Solar System Group (Allows full translation/rotation via gestures)
    const solarGroup = new THREE.Group();
    scene.add(solarGroup);
    solarGroupRef.current = solarGroup;

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

      solarGroup.add(mesh);
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
        solarGroup.add(orbitLine);
      }
    });
    planetsMeshRef.current = planetMeshes;

    // Raycaster for Pointer/Touch selection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (event) => {
      // In touch mode, clicking a planet opens its info modal
      if (controlMode === 'gesture') return;

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
  }, [isPaused, speedMultiplier, controlMode]);

  // Mode Effect: AR vs SPACE
  useEffect(() => {
    if (viewMode === 'AR') {
      startCamera(facingMode);
    } else {
      stopCamera();
      if (rendererRef.current) rendererRef.current.setClearColor(0x070a13, 1);
      if (starfieldRef.current) starfieldRef.current.visible = true;
    }
  }, [viewMode, facingMode]);

  // 3. MediaPipe Hand Tracking Setup (Only runs in gesture control mode)
  useEffect(() => {
    if (controlMode !== 'gesture') {
      setTrackingActive(false);
      return;
    }

    let isMounted = true;
    let cameraInstance = null;
    let handsInstance = null;

    // Load MediaPipe scripts dynamically
    const loadMediaPipe = async () => {
      try {
        if (!window.Hands) {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/hands.js';
            script.async = true;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }

        if (!isMounted) return;

        handsInstance = new window.Hands({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`
        });

        handsInstance.setOptions({
          maxNumHands: 1,
          modelComplexity: 0, // Lite for mobile efficiency & zero lag
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        handsInstance.onResults(onHandResults);
        handsWorkerRef.current = handsInstance;
        setTrackingActive(true);
        setHandStatusText('Move your hand into camera view');
        setHandStatusColor('#f59e0b');

        // Vision frame loop
        let frameAnimId;
        const processVideoFrame = async () => {
          if (!isMounted || controlMode !== 'gesture') return;
          if (videoRef.current && videoRef.current.readyState >= 2 && !trackingPaused) {
            try {
              await handsInstance.send({ image: videoRef.current });
            } catch (e) { /* ignore dropped frames */ }
          }
          frameAnimId = requestAnimationFrame(processVideoFrame);
        };
        processVideoFrame();

        return () => {
          cancelAnimationFrame(frameAnimId);
          if (handsInstance) handsInstance.close();
        };
      } catch (err) {
        console.warn('MediaPipe Hand tracking could not load:', err);
        setHandStatusText('Hand tracking unavailable on this device. Use Touch Controls.');
        setHandStatusColor('#ef4444');
        setTimeout(() => setControlMode('touch'), 2500);
      }
    };

    loadMediaPipe();

    return () => {
      isMounted = false;
      if (handsWorkerRef.current) {
        try { handsWorkerRef.current.close(); } catch (e) {}
      }
    };
  }, [controlMode, trackingPaused]);

  // 4. Hand Gesture Recognition & Math Processing
  const onHandResults = (results) => {
    const canvas = reticleCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
      // Hand lost from view
      if (Date.now() - lastDetectionTimestamp.current > 600) {
        hasDetectedHand.current = false;
        setHandStatusText('Move your hand into camera view');
        setHandStatusColor('#f59e0b');
        setHoveredPlanet(null);
        setPinchProgress(0);
        pinchStartTime.current = null;
      }
      return;
    }

    lastDetectionTimestamp.current = Date.now();
    hasDetectedHand.current = true;
    const lm = results.multiHandLandmarks[0];

    // Sensitivity factor
    const alpha = sensitivity === 'high' ? 0.45 : sensitivity === 'low' ? 0.15 : 0.28;

    // Landmark references: 0=wrist, 4=thumb, 8=index, 12=middle, 16=ring, 20=pinky
    const indexTip = lm[8];
    const thumbTip = lm[4];
    const wrist = lm[0];
    const middleKnuckle = lm[9];

    // Mirror X for natural webcam mirror orientation
    const rawX = 1 - indexTip.x;
    const rawY = indexTip.y;

    // Smoothed fingertip coordinates
    smoothedHandPos.current.x = smoothedHandPos.current.x * (1 - alpha) + rawX * alpha;
    smoothedHandPos.current.y = smoothedHandPos.current.y * (1 - alpha) + rawY * alpha;

    const screenX = smoothedHandPos.current.x * canvas.width;
    const screenY = smoothedHandPos.current.y * canvas.height;

    // Detect Gestures:
    // 1. Pinch: Distance between thumb tip and index tip
    const pinchDist = Math.hypot(lm[4].x - lm[8].x, lm[4].y - lm[8].y);
    const isPinching = pinchDist < 0.075;

    // 2. Open Palm: All 4 fingers extended
    const isOpenPalm =
      lm[8].y < lm[6].y &&
      lm[12].y < lm[10].y &&
      lm[16].y < lm[14].y &&
      lm[20].y < lm[18].y &&
      !isPinching;

    // 3. Palm Center
    const palmRawX = 1 - (lm[0].x + lm[5].x + lm[9].x + lm[13].x + lm[17].x) / 5;
    const palmRawY = (lm[0].y + lm[5].y + lm[9].y + lm[13].y + lm[17].y) / 5;
    const handSize = Math.hypot(lm[0].x - lm[9].x, lm[0].y - lm[9].y);

    // Three.js Raycast from Index Finger Tip
    let targetPlanet = null;
    if (cameraRef.current && rendererRef.current && solarGroupRef.current) {
      const raycaster = new THREE.Raycaster();
      const normMouse = new THREE.Vector2(
        (screenX / canvas.width) * 2 - 1,
        -(screenY / canvas.height) * 2 + 1
      );
      raycaster.setFromCamera(normMouse, cameraRef.current);
      const intersects = raycaster.intersectObjects(planetsMeshRef.current, true);

      if (intersects.length > 0) {
        let hit = intersects[0].object;
        while (hit && !hit.userData?.planet && hit.parent) {
          hit = hit.parent;
        }
        if (hit?.userData?.planet) {
          targetPlanet = hit.userData.planet;
        }
      }
    }

    setHoveredPlanet(targetPlanet);

    // Apply Actions:
    // A. Palm Pan & Move Solar System
    if (isOpenPalm && solarGroupRef.current && !trackingPaused) {
      const dx = (palmRawX - prevHandPos.current.x) * (sensitivity === 'high' ? 80 : 40);
      const dy = (palmRawY - prevHandPos.current.y) * (sensitivity === 'high' ? 80 : 40);

      solarGroupRef.current.position.x += dx * 0.4;
      solarGroupRef.current.position.y -= dy * 0.4;

      // Zoom via hand distance (move closer/farther)
      const sizeDelta = (handSize - prevHandPos.current.size) * (sensitivity === 'high' ? 120 : 60);
      if (Math.abs(sizeDelta) > 0.4 && cameraRef.current) {
        cameraRef.current.position.z = Math.max(12, Math.min(130, cameraRef.current.position.z - sizeDelta * 0.8));
      }

      setHandStatusText('Moving Solar System (Open Palm)');
      setHandStatusColor('#38bdf8');
    } else if (targetPlanet) {
      setHandStatusText(`Pointing at ${targetPlanet.name} (Pinch to inspect)`);
      setHandStatusColor('#10b981');
    } else {
      setHandStatusText('Hand detected &bull; Point at a planet');
      setHandStatusColor('#10b981');
    }

    prevHandPos.current = { x: palmRawX, y: palmRawY, size: handSize };

    // B. Pinch & Hold to Select Planet
    if (isPinching && targetPlanet && !trackingPaused) {
      if (!pinchStartTime.current) {
        pinchStartTime.current = Date.now();
      }
      const elapsed = Date.now() - pinchStartTime.current;
      const progress = Math.min(elapsed / 400, 1);
      setPinchProgress(progress);

      if (progress >= 1) {
        // Selection confirmed!
        onSelectPlanet(targetPlanet);
        pinchStartTime.current = null;
        setPinchProgress(0);
      }
    } else {
      pinchStartTime.current = null;
      setPinchProgress(0);
    }

    // Render Futuristic Targeting Reticle on Canvas
    drawReticle(ctx, screenX, screenY, isPinching, targetPlanet, pinchProgress);
  };

  // Draw Reticle on 2D Overlay Canvas
  const drawReticle = (ctx, x, y, isPinching, planet, progress) => {
    ctx.save();
    ctx.translate(x, y);

    // Reticle Center Glow Dot
    ctx.fillStyle = isPinching ? '#10b981' : '#38bdf8';
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();

    // Outer Crosshair Ring
    ctx.strokeStyle = isPinching ? 'rgba(16, 185, 129, 0.7)' : 'rgba(56, 189, 248, 0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.stroke();

    // Crosshair Lines
    ctx.beginPath();
    ctx.moveTo(-24, 0); ctx.lineTo(-12, 0);
    ctx.moveTo(12, 0); ctx.lineTo(24, 0);
    ctx.moveTo(0, -24); ctx.lineTo(0, -12);
    ctx.moveTo(0, 12); ctx.lineTo(0, 24);
    ctx.stroke();

    // Progress Confirmation Ring when pinching
    if (progress > 0) {
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, 26, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
      ctx.stroke();
    }

    // Planet Hover Badge
    if (planet) {
      const labelText = `🪐 ${planet.name}`;
      ctx.font = 'bold 13px sans-serif';
      const textWidth = ctx.measureText(labelText).width;

      ctx.fillStyle = 'rgba(7, 10, 19, 0.85)';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(14, -34, textWidth + 18, 26, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#f8fafc';
      ctx.fillText(labelText, 22, -17);
    }

    ctx.restore();
  };

  // Reset Solar System View
  const handleResetView = () => {
    if (cameraRef.current && controlsRef.current && solarGroupRef.current) {
      solarGroupRef.current.position.set(0, 0, 0);
      solarGroupRef.current.rotation.set(0, 0, 0);
      cameraRef.current.position.set(0, 38, 64);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  };

  const toggleFacingMode = () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacing);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 80,
      backgroundColor: viewMode === 'AR' ? 'transparent' : '#070a13',
      overflow: 'hidden'
    }}>
      {/* Live Camera Video Background */}
      <video
        ref={videoRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: viewMode === 'AR' && cameraActive ? 'block' : 'none',
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

      {/* 2D Canvas for Hand Gesture Reticle & Targeting (in Gesture Mode) */}
      {controlMode === 'gesture' && (
        <canvas
          ref={reticleCanvasRef}
          width={typeof window !== 'undefined' ? window.innerWidth : 1280}
          height={typeof window !== 'undefined' ? window.innerHeight : 720}
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 3,
            pointerEvents: 'none'
          }}
        />
      )}

      {/* TOP FLOATING HUD */}
      <div style={{
        position: 'absolute',
        top: '16px',
        left: '16px',
        right: '16px',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        pointerEvents: 'none',
        flexWrap: 'wrap',
        gap: '0.5rem'
      }}>
        {/* Left: Exit button */}
        <button
          onClick={onClose}
          className="btn-secondary"
          style={{
            pointerEvents: 'auto',
            padding: '0.55rem 1.15rem',
            fontSize: '0.875rem',
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(12px)',
            borderColor: 'rgba(255, 255, 255, 0.15)'
          }}
        >
          <ArrowLeft size={16} />
          <span>Exit Overview</span>
        </button>

        {/* Center: Live Hand Tracking Status Pill (In Gesture Mode) */}
        {controlMode === 'gesture' && (
          <div style={{
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: 'rgba(7, 10, 19, 0.88)',
            backdropFilter: 'blur(14px)',
            padding: '0.45rem 1rem',
            borderRadius: '9999px',
            border: `1px solid ${handStatusColor}`,
            boxShadow: `0 0 15px ${handStatusColor}33`,
            fontSize: '0.8rem',
            color: '#f8fafc'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: handStatusColor,
              boxShadow: `0 0 8px ${handStatusColor}`
            }} />
            <span>{trackingPaused ? 'Tracking Paused' : handStatusText}</span>
          </div>
        )}

        {/* Right: Mode Switchers (Touch ⇄ Gesture) & AR ⇄ Space */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', pointerEvents: 'auto' }}>
          {/* Toggle Control Mode: Touch vs Gesture */}
          <button
            onClick={() => setControlMode(controlMode === 'touch' ? 'gesture' : 'touch')}
            className={controlMode === 'gesture' ? 'btn-primary' : 'btn-secondary'}
            style={{
              padding: '0.55rem 1rem',
              fontSize: '0.85rem',
              backdropFilter: 'blur(12px)'
            }}
            title="Switch between Touch and Hand Gesture controls"
          >
            {controlMode === 'gesture' ? <Hand size={16} /> : <Smartphone size={16} />}
            <span>{controlMode === 'gesture' ? 'Gestures Active' : 'Touch Controls'}</span>
          </button>

          {/* Toggle View: AR Camera vs 3D Space */}
          <button
            onClick={() => setViewMode(viewMode === 'AR' ? 'SPACE' : 'AR')}
            className="btn-secondary"
            style={{
              padding: '0.55rem 1rem',
              fontSize: '0.85rem',
              backdropFilter: 'blur(12px)',
              backgroundColor: 'rgba(15, 23, 42, 0.85)'
            }}
          >
            {viewMode === 'AR' ? <Camera size={16} /> : <Compass size={16} />}
            <span className="hidden sm:inline">{viewMode === 'AR' ? 'AR View' : '3D Space'}</span>
          </button>

          {/* Flip Camera in AR mode */}
          {viewMode === 'AR' && (
            <button
              onClick={toggleFacingMode}
              className="btn-secondary"
              style={{
                padding: '0.55rem',
                backgroundColor: 'rgba(15, 23, 42, 0.85)',
                backdropFilter: 'blur(12px)'
              }}
              title="Flip Camera (Front / Rear)"
            >
              <RefreshCw size={15} />
            </button>
          )}

          {/* Gesture Guide Help Button */}
          {controlMode === 'gesture' && (
            <button
              onClick={() => setShowGestureGuide(true)}
              className="btn-secondary"
              style={{
                padding: '0.55rem',
                backgroundColor: 'rgba(15, 23, 42, 0.85)',
                color: '#38bdf8'
              }}
              title="Open Gesture Guide"
            >
              <HelpCircle size={16} />
            </button>
          )}
        </div>
      </div>

      {/* CAMERA / PERMISSION ERROR BANNER */}
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

      {/* BOTTOM FLOATING CONTROL DOCK */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10,
        backgroundColor: 'rgba(15, 23, 42, 0.92)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '16px',
        padding: '0.5rem 1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.875rem',
        maxWidth: '95%',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        {/* Reset View Button */}
        <button
          onClick={handleResetView}
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            fontSize: '0.8rem',
            padding: '4px'
          }}
          title="Reset Solar System Position & Orbit Angle"
        >
          <RotateCcw size={15} />
          <span>Reset View</span>
        </button>

        <div style={{ width: '1px', height: '18px', backgroundColor: 'rgba(255,255,255,0.15)' }} />

        {/* Orbit Pause/Play */}
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
          {isPaused ? <Play size={15} color="#10b981" /> : <Pause size={15} color="#38bdf8" />}
          <span>{isPaused ? 'Paused' : 'Orbiting'}</span>
        </button>

        {/* Orbit Speed Multiplier */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          {[0.5, 1, 2].map((s) => (
            <button
              key={s}
              onClick={() => setSpeedMultiplier(s)}
              style={{
                background: speedMultiplier === s ? 'rgba(56, 189, 248, 0.25)' : 'none',
                border: speedMultiplier === s ? '1px solid rgba(56, 189, 248, 0.5)' : '1px solid transparent',
                color: speedMultiplier === s ? '#38bdf8' : '#94a3b8',
                borderRadius: '6px',
                padding: '2px 6px',
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}
            >
              {s}x
            </button>
          ))}
        </div>

        {/* Hand Gesture Specific Controls (in Gesture Mode) */}
        {controlMode === 'gesture' && (
          <>
            <div style={{ width: '1px', height: '18px', backgroundColor: 'rgba(255,255,255,0.15)' }} />

            {/* Pause Tracking Button */}
            <button
              onClick={() => setTrackingPaused(!trackingPaused)}
              style={{
                background: trackingPaused ? 'rgba(245, 158, 11, 0.2)' : 'none',
                border: trackingPaused ? '1px solid #f59e0b' : '1px solid transparent',
                color: trackingPaused ? '#fcd34d' : '#94a3b8',
                borderRadius: '6px',
                padding: '3px 7px',
                fontSize: '0.75rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title="Pause hand tracking without exiting"
            >
              <span>{trackingPaused ? '▶ Resume Tracking' : '⏸ Pause Tracking'}</span>
            </button>

            {/* Sensitivity Cycle Button */}
            <button
              onClick={() => {
                const next = sensitivity === 'low' ? 'normal' : sensitivity === 'normal' ? 'high' : 'low';
                setSensitivity(next);
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#cbd5e1',
                borderRadius: '6px',
                padding: '3px 8px',
                fontSize: '0.75rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                textTransform: 'capitalize'
              }}
              title="Adjust gesture sensitivity"
            >
              <Sliders size={12} />
              <span>Sensitivity: {sensitivity}</span>
            </button>
          </>
        )}
      </div>

      {/* Visual Gesture Guide Modal */}
      <GestureGuideModal
        isOpen={showGestureGuide}
        onClose={() => setShowGestureGuide(false)}
      />
    </div>
  );
}
