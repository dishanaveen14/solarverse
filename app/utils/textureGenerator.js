/**
 * Procedural Planet Texture Generator
 * Generates lightweight, photorealistic spherical textures on HTML5 2D canvases.
 */

import * as THREE from 'three';

const textureCache = new Map();

function createNoise(w, h, octaves = 4) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  const imgData = ctx.createImageData(w, h);
  const data = imgData.data;

  // Simple deterministic value noise
  const rand = (x, y) => {
    const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return n - Math.floor(n);
  };

  const smooth = (x, y) => {
    const i = Math.floor(x);
    const j = Math.floor(y);
    const fx = x - i;
    const fy = y - j;
    const sfx = fx * fx * (3 - 2 * fx);
    const sfy = fy * fy * (3 - 2 * fy);

    const a = rand(i, j);
    const b = rand(i + 1, j);
    const c = rand(i, j + 1);
    const d = rand(i + 1, j + 1);

    return a * (1 - sfx) * (1 - sfy) + b * sfx * (1 - sfy) + c * (1 - sfx) * sfy + d * sfx * sfy;
  };

  return { smooth, width: w, height: h };
}

export function generatePlanetTexture(planetId, isMobile = false) {
  if (typeof window === 'undefined') return null;
  if (textureCache.has(planetId)) return textureCache.get(planetId);

  const w = isMobile ? 512 : 1024;
  const h = isMobile ? 256 : 512;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  switch (planetId) {
    case 'sun': {
      // Dynamic solar photosphere with convective granules and coronal glow
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#fef08a');
      grad.addColorStop(0.3, '#f59e0b');
      grad.addColorStop(0.7, '#d97706');
      grad.addColorStop(1, '#b45309');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Flare granulation
      for (let i = 0; i < 400; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        const rad = 2 + Math.random() * 8;
        ctx.fillStyle = Math.random() > 0.4 ? 'rgba(254, 240, 138, 0.45)' : 'rgba(180, 83, 9, 0.35)';
        ctx.beginPath();
        ctx.arc(x, y, rad, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case 'mercury': {
      // Cratered iron-gray surface
      ctx.fillStyle = '#64748b';
      ctx.fillRect(0, 0, w, h);

      // Varied topography bands
      for (let y = 0; y < h; y += 4) {
        const shade = 90 + Math.sin(y * 0.05) * 25 + (Math.random() * 20 - 10);
        ctx.fillStyle = `rgb(${shade}, ${shade + 4}, ${shade + 8})`;
        ctx.fillRect(0, y, w, 4);
      }

      // Craters
      for (let i = 0; i < 280; i++) {
        const cx = Math.random() * w;
        const cy = Math.random() * h;
        const cr = 1 + Math.random() * 9;
        ctx.fillStyle = 'rgba(30, 41, 59, 0.6)';
        ctx.beginPath();
        ctx.arc(cx, cy, cr, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(203, 213, 225, 0.4)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      break;
    }

    case 'venus': {
      // Thick swirling sulfuric acid clouds
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#fef9c3');
      grad.addColorStop(0.3, '#fde047');
      grad.addColorStop(0.6, '#eab308');
      grad.addColorStop(1, '#ca8a04');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = 'rgba(254, 240, 138, 0.35)';
      for (let i = 0; i < 40; i++) {
        const y = (h / 40) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        for (let x = 0; x <= w; x += 20) {
          ctx.lineTo(x, y + Math.sin((x + i * 20) * 0.02) * 12);
        }
        ctx.lineTo(w, y + 20);
        ctx.lineTo(0, y + 20);
        ctx.fill();
      }
      break;
    }

    case 'earth': {
      // Oceans
      ctx.fillStyle = '#0369a1';
      ctx.fillRect(0, 0, w, h);

      // Continents
      ctx.fillStyle = '#15803d';
      const continents = [
        { x: w * 0.22, y: h * 0.35, r: w * 0.14 },
        { x: w * 0.3, y: h * 0.65, r: w * 0.11 },
        { x: w * 0.55, y: h * 0.32, r: w * 0.16 },
        { x: w * 0.6, y: h * 0.58, r: w * 0.13 },
        { x: w * 0.82, y: h * 0.7, r: w * 0.08 }
      ];

      continents.forEach(c => {
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
        ctx.fill();
        // Landmass internal terrain variation
        ctx.fillStyle = '#ca8a04';
        ctx.beginPath();
        ctx.arc(c.x - c.r * 0.2, c.y + c.r * 0.1, c.r * 0.45, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#15803d';
      });

      // Polar ice caps
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, w, h * 0.08);
      ctx.fillRect(0, h * 0.92, w, h * 0.08);

      // Atmospheric cloud swirls
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      for (let i = 0; i < 35; i++) {
        const cy = h * 0.15 + Math.random() * (h * 0.7);
        ctx.beginPath();
        ctx.ellipse(Math.random() * w, cy, 40 + Math.random() * 90, 8 + Math.random() * 16, Math.PI / 12, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case 'mars': {
      // Iron oxide rust desert
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#f87171');
      grad.addColorStop(0.5, '#dc2626');
      grad.addColorStop(1, '#991b1b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Dark basalt plains (Syrtis Major)
      ctx.fillStyle = 'rgba(69, 10, 10, 0.45)';
      for (let i = 0; i < 60; i++) {
        ctx.beginPath();
        ctx.arc(Math.random() * w, Math.random() * h, 10 + Math.random() * 45, 0, Math.PI * 2);
        ctx.fill();
      }

      // Polar ice caps
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(w * 0.5, h * 0.03, w * 0.25, h * 0.04, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(w * 0.5, h * 0.97, w * 0.2, h * 0.035, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'jupiter': {
      // Atmospheric belts & Great Red Spot
      const bands = ['#c2410c', '#ea580c', '#fed7aa', '#f97316', '#fdba74', '#c2410c', '#ea580c', '#fed7aa'];
      const bandH = h / bands.length;
      bands.forEach((bColor, idx) => {
        ctx.fillStyle = bColor;
        ctx.fillRect(0, idx * bandH, w, bandH);
      });

      // Zonal wind streaks
      for (let y = 0; y < h; y += 8) {
        ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255, 255, 255, 0.18)' : 'rgba(124, 45, 18, 0.25)';
        ctx.beginPath();
        ctx.moveTo(0, y);
        for (let x = 0; x <= w; x += 30) {
          ctx.lineTo(x, y + Math.sin(x * 0.04 + y) * 4);
        }
        ctx.lineTo(w, y + 4);
        ctx.lineTo(0, y + 4);
        ctx.fill();
      }

      // Great Red Spot
      const spotX = w * 0.62;
      const spotY = h * 0.65;
      ctx.fillStyle = '#991b1b';
      ctx.beginPath();
      ctx.ellipse(spotX, spotY, w * 0.07, h * 0.065, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 3;
      ctx.stroke();
      break;
    }

    case 'saturn': {
      // Golden atmospheric gas layers
      for (let y = 0; y < h; y += 4) {
        const factor = Math.sin(y * 0.03) * 0.5 + 0.5;
        const r = Math.floor(245 + factor * 10);
        const g = Math.floor(215 + factor * 25);
        const b = Math.floor(130 + factor * 40);
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(0, y, w, 4);
      }
      break;
    }

    case 'uranus': {
      // Cyan-teal smooth ice giant haze
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#a5f3fc');
      grad.addColorStop(0.5, '#22d3ee');
      grad.addColorStop(1, '#0891b2');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      break;
    }

    case 'neptune': {
      // Deep azure with dynamic white cirrus storms
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#3b82f6');
      grad.addColorStop(0.5, '#1d4ed8');
      grad.addColorStop(1, '#1e3a8a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // High-speed white methane cloud streaks
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      for (let i = 0; i < 18; i++) {
        const y = h * 0.2 + (h * 0.6 * i) / 18;
        ctx.beginPath();
        ctx.ellipse(w * ((i * 0.17) % 1), y, 35 + Math.random() * 50, 4, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    default:
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(0, 0, w, h);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(planetId, texture);
  return texture;
}

export function generateRingTexture() {
  if (typeof window === 'undefined') return null;
  if (textureCache.has('saturn_rings')) return textureCache.get('saturn_rings');

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');

  // Concentric ring transparency and particle density variations
  const grad = ctx.createLinearGradient(0, 0, 512, 0);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
  grad.addColorStop(0.08, 'rgba(217, 119, 6, 0.2)');
  grad.addColorStop(0.25, 'rgba(253, 230, 138, 0.7)');
  grad.addColorStop(0.48, 'rgba(251, 191, 36, 0.85)');
  grad.addColorStop(0.52, 'rgba(15, 23, 42, 0.05)'); // Cassini Division
  grad.addColorStop(0.65, 'rgba(253, 230, 138, 0.65)');
  grad.addColorStop(0.9, 'rgba(217, 119, 6, 0.3)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 32);

  const texture = new THREE.CanvasTexture(canvas);
  textureCache.set('saturn_rings', texture);
  return texture;
}
