/* ============================================================
   SolarVerse – script.js  (v2)
   3D planet previews, hand gesture control, 90-question quiz
   ============================================================ */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/* ============================================================
   PROCEDURAL PLANET TEXTURE GENERATOR
   Creates realistic canvas-based textures for each planet.
   ============================================================ */

/** Simple seeded pseudo-random for reproducibility */
function seededRandom(seed) {
  let s = seed;
  return function () {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** Simplex-like 2D noise approximation using canvas */
function generateNoise(w, h, scale, seed) {
  const rand = seededRandom(seed);
  const grid = [];
  const gs = Math.ceil(w / scale) + 2;
  for (let i = 0; i < (gs + 1) * (gs + 1); i++) grid.push(rand());
  const result = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const gx = x / scale, gy = y / scale;
      const ix = Math.floor(gx), iy = Math.floor(gy);
      const fx = gx - ix, fy = gy - iy;
      const sfx = fx * fx * (3 - 2 * fx), sfy = fy * fy * (3 - 2 * fy);
      const i00 = (iy % gs) * gs + (ix % gs);
      const i10 = (iy % gs) * gs + ((ix + 1) % gs);
      const i01 = ((iy + 1) % gs) * gs + (ix % gs);
      const i11 = ((iy + 1) % gs) * gs + ((ix + 1) % gs);
      const v = (grid[i00] * (1 - sfx) + grid[i10] * sfx) * (1 - sfy) +
                (grid[i01] * (1 - sfx) + grid[i11] * sfx) * sfy;
      result[y * w + x] = v;
    }
  }
  return result;
}

/** Fractal noise by layering multiple octaves */
function fractalNoise(w, h, baseScale, octaves, seed) {
  const result = new Float32Array(w * h);
  let amp = 1, totalAmp = 0;
  for (let o = 0; o < octaves; o++) {
    const scale = baseScale / Math.pow(2, o);
    const noise = generateNoise(w, h, Math.max(scale, 2), seed + o * 1000);
    for (let i = 0; i < w * h; i++) result[i] += noise[i] * amp;
    totalAmp += amp;
    amp *= 0.5;
  }
  for (let i = 0; i < w * h; i++) result[i] /= totalAmp;
  return result;
}

/** Lerp between two [r,g,b] colours */
function lerpColor(c1, c2, t) {
  return [
    c1[0] + (c2[0] - c1[0]) * t,
    c1[1] + (c2[1] - c1[1]) * t,
    c1[2] + (c2[2] - c1[2]) * t
  ];
}

/**
 * Generate a complete procedural texture + bump map for a planet.
 * Returns { map: THREE.CanvasTexture, bumpMap: THREE.CanvasTexture | null }
 */
function generatePlanetTextures(planetName, texW = (window.innerWidth <= 800 ? 256 : 512), texH = (window.innerWidth <= 800 ? 128 : 256)) {
  const canvas = document.createElement('canvas');
  canvas.width = texW; canvas.height = texH;
  const ctx = canvas.getContext('2d');
  const imgData = ctx.createImageData(texW, texH);
  const px = imgData.data;

  // Bump canvas
  const bCanvas = document.createElement('canvas');
  bCanvas.width = texW; bCanvas.height = texH;
  const bCtx = bCanvas.getContext('2d');
  const bData = bCtx.createImageData(texW, texH);
  const bp = bData.data;
  let hasBump = true;

  const scaleFactor = texW / 1024;
  const n1 = fractalNoise(texW, texH, Math.max(8, Math.round(80 * scaleFactor)), 4, 42);
  const n2 = fractalNoise(texW, texH, Math.max(4, Math.round(40 * scaleFactor)), 3, 137);
  const n3 = fractalNoise(texW, texH, Math.max(12, Math.round(160 * scaleFactor)), 3, 999);

  switch (planetName) {
    case 'Sun': {
      hasBump = false;
      const n = fractalNoise(texW, texH, 60, 5, 7);
      for (let i = 0; i < texW * texH; i++) {
        const v = n[i];
        const bright = 0.5 + v * 0.5;
        const r = Math.min(255, 255 * bright);
        const g = Math.min(255, 180 * bright + v * 60);
        const b = Math.min(255, 40 * bright);
        px[i * 4] = r; px[i * 4 + 1] = g; px[i * 4 + 2] = b; px[i * 4 + 3] = 255;
      }
      break;
    }
    case 'Mercury': {
      for (let i = 0; i < texW * texH; i++) {
        const v = n1[i]; const v2 = n2[i];
        const base = 0.35 + v * 0.3;
        const craters = v2 < 0.3 ? (0.3 - v2) * 1.5 : 0;
        const bright = Math.max(0, Math.min(1, base - craters * 0.3));
        const g = Math.floor(140 * bright + 20);
        px[i * 4] = g + 10; px[i * 4 + 1] = g; px[i * 4 + 2] = g - 5; px[i * 4 + 3] = 255;
        const bv = Math.floor(bright * 255);
        bp[i * 4] = bv; bp[i * 4 + 1] = bv; bp[i * 4 + 2] = bv; bp[i * 4 + 3] = 255;
      }
      break;
    }
    case 'Venus': {
      for (let i = 0; i < texW * texH; i++) {
        const y = Math.floor(i / texW);
        const band = Math.sin(y / texH * Math.PI * 6) * 0.1;
        const v = n1[i] * 0.6 + n3[i] * 0.4 + band;
        const c = lerpColor([220, 190, 130], [240, 210, 160], v);
        px[i * 4] = c[0]; px[i * 4 + 1] = c[1]; px[i * 4 + 2] = c[2]; px[i * 4 + 3] = 255;
        const bv = Math.floor(v * 180 + 40);
        bp[i * 4] = bv; bp[i * 4 + 1] = bv; bp[i * 4 + 2] = bv; bp[i * 4 + 3] = 255;
      }
      break;
    }
    case 'Earth': {
      const n4 = fractalNoise(texW, texH, 30, 4, 555); // fine detail
      for (let i = 0; i < texW * texH; i++) {
        const x = i % texW, y = Math.floor(i / texW);
        const lat = (y / texH - 0.5) * Math.PI;
        const lon = (x / texW - 0.5) * Math.PI * 2;
        const v = n1[i]; const v2 = n2[i]; const v3 = n3[i]; const v4 = n4[i];

        // More varied land threshold using multiple noise layers
        const landThresh = 0.46 + Math.sin(lat * 2.5 + lon * 0.3) * 0.06 + n3[i] * 0.04;
        const isLand = v > landThresh;
        const isIce = Math.abs(lat) > 1.25;

        let c;
        if (isIce) {
          const iceMix = (Math.abs(lat) - 1.25) * 4;
          c = lerpColor([200, 220, 240], [245, 250, 255], Math.min(iceMix, 1));
        } else if (isLand) {
          const elevation = (v - landThresh) * 5;
          if (elevation > 1.0) {
            // Mountains — snowy peaks
            c = lerpColor([160, 140, 100], [220, 215, 200], Math.min((elevation - 1.0) * 2, 1));
          } else if (elevation > 0.5) {
            // Highlands — brownish
            c = lerpColor([80, 120, 40], [140, 120, 70], (elevation - 0.5) * 2);
          } else if (Math.abs(lat) < 0.4 && v2 > 0.55) {
            // Tropical forests — deep green
            c = lerpColor([25, 80, 20], [50, 110, 35], v4);
          } else {
            // Temperate land — green to tan
            c = lerpColor([50, 100, 35], [120, 130, 60], v2);
          }
          // Add fine texture
          c[0] += (v4 - 0.5) * 15; c[1] += (v4 - 0.5) * 12; c[2] += (v4 - 0.5) * 8;
        } else {
          // Ocean — depth gradient
          const depth = (landThresh - v) * 4;
          if (depth < 0.3) {
            c = lerpColor([40, 130, 200], [30, 100, 180], depth * 3); // shallow
          } else {
            c = lerpColor([20, 60, 140], [10, 30, 90], Math.min((depth - 0.3) * 1.5, 1)); // deep
          }
        }

        // Cloud layers (two layers for realism)
        const cloud1 = n3[i], cloud2 = n4[i] * 0.5 + n3[i] * 0.5;
        if (cloud1 > 0.52 || cloud2 > 0.6) {
          const cloudAlpha = Math.max(
            cloud1 > 0.52 ? (cloud1 - 0.52) * 4 : 0,
            cloud2 > 0.6 ? (cloud2 - 0.6) * 5 : 0
          );
          c = lerpColor(c, [255, 255, 255], Math.min(cloudAlpha, 0.8));
        }

        px[i * 4] = Math.max(0, Math.min(255, c[0]));
        px[i * 4 + 1] = Math.max(0, Math.min(255, c[1]));
        px[i * 4 + 2] = Math.max(0, Math.min(255, c[2]));
        px[i * 4 + 3] = 255;
        const bv = isLand ? Math.floor(v * 200 + 55) : 25;
        bp[i * 4] = bv; bp[i * 4 + 1] = bv; bp[i * 4 + 2] = bv; bp[i * 4 + 3] = 255;
      }
      break;
    }
    case 'Mars': {
      for (let i = 0; i < texW * texH; i++) {
        const y = Math.floor(i / texW);
        const lat = Math.abs(y / texH - 0.5) * 2;
        const v = n1[i]; const v2 = n2[i];
        const isIce = lat > 0.92;
        let c;
        if (isIce) {
          c = lerpColor([200, 200, 210], [240, 240, 245], v2);
        } else {
          const dark = v2 < 0.35 ? 0.7 : 1.0; // dark regions
          c = lerpColor([160 * dark, 70 * dark, 30 * dark], [200 * dark, 110 * dark, 60 * dark], v);
        }
        px[i * 4] = c[0]; px[i * 4 + 1] = c[1]; px[i * 4 + 2] = c[2]; px[i * 4 + 3] = 255;
        const bv = Math.floor(v * 200 + 30);
        bp[i * 4] = bv; bp[i * 4 + 1] = bv; bp[i * 4 + 2] = bv; bp[i * 4 + 3] = 255;
      }
      break;
    }
    case 'Jupiter': {
      hasBump = false;
      const n4 = fractalNoise(texW, texH, 20, 4, 333); // fine turbulence
      for (let i = 0; i < texW * texH; i++) {
        const x = i % texW, y = Math.floor(i / texW);
        // Stronger horizontal bands with turbulent edges
        const bandBase = y / texH * Math.PI * 20;
        const turbulence = n2[i] * 0.8 + n4[i] * 0.4;
        const band = Math.sin(bandBase + turbulence * 2) * 0.5 + 0.5;
        const band2 = Math.sin(bandBase * 0.7 + turbulence) * 0.3 + 0.5;
        const v = n1[i] * 0.2;

        const t = band * 0.6 + band2 * 0.2 + v + n4[i] * 0.08;
        const colors = [
          [180, 120, 60],   // dark brown
          [210, 170, 100],  // tan
          [240, 210, 155],  // cream
          [200, 150, 80],   // amber
          [170, 110, 55],   // dark amber
          [230, 195, 140],  // light gold
          [190, 130, 70],   // brown
        ];
        const ci = Math.floor(t * (colors.length - 1));
        const cf = t * (colors.length - 1) - ci;
        const c = lerpColor(
          colors[Math.max(0, Math.min(ci, colors.length - 1))],
          colors[Math.max(0, Math.min(ci + 1, colors.length - 1))],
          cf
        );

        // Great Red Spot — larger and more visible
        const sx = texW * 0.62, sy = texH * 0.54;
        const spotW = texW * 0.045, spotH = texH * 0.055;
        const dx = (x - sx), dy = (y - sy);
        const spotDist = (dx * dx) / (spotW * spotW) + (dy * dy) / (spotH * spotH);
        if (spotDist < 1.0) {
          const spot = Math.max(0, 1 - Math.sqrt(spotDist));
          const swirl = Math.sin(Math.atan2(dy, dx) * 3 + n4[i] * 6) * 0.15;
          c[0] = c[0] * (1 - spot * 0.8) + (200 + swirl * 100) * (spot * 0.8);
          c[1] = c[1] * (1 - spot * 0.8) + (75 + swirl * 40) * (spot * 0.8);
          c[2] = c[2] * (1 - spot * 0.8) + (45 + swirl * 20) * (spot * 0.8);
        }

        px[i * 4] = Math.max(0, Math.min(255, c[0]));
        px[i * 4 + 1] = Math.max(0, Math.min(255, c[1]));
        px[i * 4 + 2] = Math.max(0, Math.min(255, c[2]));
        px[i * 4 + 3] = 255;
      }
      break;
    }
    case 'Saturn': {
      hasBump = false;
      for (let i = 0; i < texW * texH; i++) {
        const y = Math.floor(i / texW);
        const band = Math.sin(y / texH * Math.PI * 22) * 0.5 + 0.5;
        const v = n1[i] * 0.2;
        const t = band + v;
        const c = lerpColor([210, 190, 130], [240, 220, 160], t);
        px[i * 4] = c[0]; px[i * 4 + 1] = c[1]; px[i * 4 + 2] = c[2]; px[i * 4 + 3] = 255;
      }
      break;
    }
    case 'Uranus': {
      hasBump = false;
      for (let i = 0; i < texW * texH; i++) {
        const y = Math.floor(i / texW);
        const band = Math.sin(y / texH * Math.PI * 10) * 0.08;
        const v = n1[i] * 0.15 + band;
        const c = lerpColor([120, 210, 210], [160, 230, 230], v + 0.5);
        px[i * 4] = c[0]; px[i * 4 + 1] = c[1]; px[i * 4 + 2] = c[2]; px[i * 4 + 3] = 255;
      }
      break;
    }
    case 'Neptune': {
      hasBump = false;
      for (let i = 0; i < texW * texH; i++) {
        const y = Math.floor(i / texW);
        const band = Math.sin(y / texH * Math.PI * 12) * 0.1;
        const v = n1[i] * 0.2 + band;
        const c = lerpColor([40, 60, 180], [70, 100, 220], v + 0.5);
        // Dark spot
        const x = i % texW;
        const sx = texW * 0.4, sy = texH * 0.45, sr = 20;
        const d = Math.sqrt((x - sx) ** 2 / (sr * 2) + (y - sy) ** 2 / sr);
        if (d < sr * 0.8) {
          const s = Math.max(0, 1 - d / (sr * 0.8));
          c[0] -= 20 * s; c[1] -= 20 * s; c[2] -= 10 * s;
        }
        px[i * 4] = Math.max(0, c[0]); px[i * 4 + 1] = Math.max(0, c[1]); px[i * 4 + 2] = Math.max(0, c[2]); px[i * 4 + 3] = 255;
      }
      break;
    }
    default: {
      // Generic grey
      for (let i = 0; i < texW * texH; i++) {
        const v = Math.floor(n1[i] * 200 + 28);
        px[i * 4] = v; px[i * 4 + 1] = v; px[i * 4 + 2] = v; px[i * 4 + 3] = 255;
        bp[i * 4] = v; bp[i * 4 + 1] = v; bp[i * 4 + 2] = v; bp[i * 4 + 3] = 255;
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.ClampToEdgeWrapping;

  let bumpMap = null;
  if (hasBump) {
    bCtx.putImageData(bData, 0, 0);
    bumpMap = new THREE.CanvasTexture(bCanvas);
    bumpMap.wrapS = THREE.RepeatWrapping;
    bumpMap.wrapT = THREE.ClampToEdgeWrapping;
  }

  return { map, bumpMap };
}

/** Generate a procedural ring texture for Saturn / Uranus */
function generateRingTexture(width = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = 64;
  const ctx = canvas.getContext('2d');
  const rand = seededRandom(777);
  for (let x = 0; x < width; x++) {
    const t = x / width;
    const ringBright = (Math.sin(t * 80) * 0.2 + 0.6 + rand() * 0.15);
    const alpha = t < 0.1 || t > 0.95 ? 0 : (0.6 + Math.sin(t * 30) * 0.2);
    const r = Math.floor(210 * ringBright);
    const g = Math.floor(195 * ringBright);
    const b = Math.floor(150 * ringBright);
    ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
    ctx.fillRect(x, 0, 1, 64);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  return tex;
}

// Pre-generate all textures (done once)
const PLANET_TEXTURES = {};
function preloadTextures() {
  for (const p of PLANET_DATA) {
    PLANET_TEXTURES[p.name] = generatePlanetTextures(p.name);
  }
}

/* ============================================================
   1. PLANET DATA  (Sun + 8 planets)
   ============================================================ */
const PLANET_DATA = [
  {
    name: 'Sun', type: 'Star',
    color: 0xffaa00, emissive: 0xff8800, radius: 4, distance: 0,
    orbitSpeed: 0, rotationSpeed: 0.002, moons: 0,
    dayLength: '25.4 Earth days', yearLength: '—',
    distanceFromSun: '0 km (center)', diameter: '1,392,700 km',
    description: 'The star at the center of our Solar System, a nearly perfect sphere of hot plasma.',
    facts: [
      'The Sun contains 99.86% of the mass in the Solar System.',
      'Light from the Sun takes about 8 minutes to reach Earth.',
      'The Sun\'s surface temperature is about 5,500 °C (9,932 °F).'
    ]
  },
  {
    name: 'Mercury', type: 'Terrestrial Planet',
    color: 0xa0a0a0, emissive: 0x333333, radius: 0.5, distance: 8,
    orbitSpeed: 0.04, rotationSpeed: 0.005, moons: 0,
    dayLength: '58.6 Earth days', yearLength: '88 Earth days',
    distanceFromSun: '57.9 million km', diameter: '4,879 km',
    description: 'The smallest planet and closest to the Sun, with extreme temperature swings.',
    facts: [
      'Mercury has no atmosphere, causing temps from −180 °C to 430 °C.',
      'A day on Mercury is longer than its year.',
      'Mercury has been visited by only two spacecraft.'
    ]
  },
  {
    name: 'Venus', type: 'Terrestrial Planet',
    color: 0xe8cda0, emissive: 0x5c4a2a, radius: 0.9, distance: 11,
    orbitSpeed: 0.03, rotationSpeed: -0.003, moons: 0,
    dayLength: '243 Earth days', yearLength: '225 Earth days',
    distanceFromSun: '108.2 million km', diameter: '12,104 km',
    description: 'Earth\'s "twin" in size, but with a runaway greenhouse atmosphere.',
    facts: [
      'Venus rotates backwards (retrograde rotation).',
      'Venus is the hottest planet — surface temps reach 465 °C.',
      'A day on Venus is longer than its year.'
    ]
  },
  {
    name: 'Earth', type: 'Terrestrial Planet',
    color: 0x2277cc, emissive: 0x113355, radius: 1.0, distance: 14,
    orbitSpeed: 0.025, rotationSpeed: 0.01, moons: 1,
    dayLength: '24 hours', yearLength: '365.25 days',
    distanceFromSun: '149.6 million km', diameter: '12,756 km',
    description: 'Our home — the only known planet to harbour life.',
    facts: [
      'Earth is the densest planet in the Solar System.',
      '71 % of Earth\'s surface is covered by water.',
      'Earth\'s magnetic field shields us from solar wind.'
    ]
  },
  {
    name: 'Mars', type: 'Terrestrial Planet',
    color: 0xcc4422, emissive: 0x551111, radius: 0.7, distance: 18,
    orbitSpeed: 0.02, rotationSpeed: 0.009, moons: 2,
    dayLength: '24.6 hours', yearLength: '687 Earth days',
    distanceFromSun: '227.9 million km', diameter: '6,792 km',
    description: 'The Red Planet — a prime candidate for future human exploration.',
    facts: [
      'Olympus Mons on Mars is the tallest volcano in the Solar System (21 km).',
      'Mars has two small moons: Phobos and Deimos.',
      'A Martian day (sol) is only 37 minutes longer than an Earth day.'
    ]
  },
  {
    name: 'Jupiter', type: 'Gas Giant',
    color: 0xd4a46a, emissive: 0x553311, radius: 2.5, distance: 24,
    orbitSpeed: 0.012, rotationSpeed: 0.02, moons: 95,
    dayLength: '9.9 hours', yearLength: '11.86 Earth years',
    distanceFromSun: '778.6 million km', diameter: '142,984 km',
    description: 'The largest planet — a massive gas giant with the Great Red Spot.',
    facts: [
      'Jupiter\'s Great Red Spot is a storm larger than Earth.',
      'Jupiter has at least 95 known moons.',
      'Jupiter has the shortest day of all planets.'
    ]
  },
  {
    name: 'Saturn', type: 'Gas Giant',
    color: 0xe8d088, emissive: 0x554422, radius: 2.1, distance: 30,
    orbitSpeed: 0.009, rotationSpeed: 0.018, hasRing: true, moons: 146,
    dayLength: '10.7 hours', yearLength: '29.46 Earth years',
    distanceFromSun: '1,433.5 million km', diameter: '120,536 km',
    description: 'Famous for its stunning ring system made of ice and rock particles.',
    facts: [
      'Saturn\'s rings span 282,000 km but are only ~10 m thick.',
      'Saturn would float in water — it\'s less dense than water.',
      'Saturn\'s moon Titan has liquid methane lakes.'
    ]
  },
  {
    name: 'Uranus', type: 'Ice Giant',
    color: 0x66cccc, emissive: 0x224444, radius: 1.5, distance: 36,
    orbitSpeed: 0.006, rotationSpeed: 0.012, hasRing: true, moons: 28,
    dayLength: '17.2 hours', yearLength: '84.01 Earth years',
    distanceFromSun: '2,872.5 million km', diameter: '51,118 km',
    description: 'The ice giant that rotates on its side, giving it extreme seasons.',
    facts: [
      'Uranus has an axial tilt of 98° — it rolls around the Sun.',
      'Uranus was discovered with a telescope in 1781.',
      'Uranus has faint rings discovered in 1977.'
    ]
  },
  {
    name: 'Neptune', type: 'Ice Giant',
    color: 0x3355cc, emissive: 0x112255, radius: 1.4, distance: 42,
    orbitSpeed: 0.004, rotationSpeed: 0.011, moons: 16,
    dayLength: '16.1 hours', yearLength: '164.8 Earth years',
    distanceFromSun: '4,495.1 million km', diameter: '49,528 km',
    description: 'The most distant planet — a deep-blue world with the fastest winds.',
    facts: [
      'Neptune\'s winds reach 2,100 km/h — the fastest in the Solar System.',
      'Neptune was first located through mathematical prediction.',
      'Triton, its largest moon, orbits in the opposite direction.'
    ]
  }
];

/* ============================================================
   2. QUIZ DATA — 30 EASY + 30 MEDIUM + 30 HARD
   ============================================================ */
const QUIZ_DATA = {
  /* ── EASY (30) ───────────────────────────── */
  easy: [
    { q: 'Which is the largest planet in our Solar System?', o: ['Earth','Mars','Jupiter','Venus'], a: 2 },
    { q: 'Which planet is known as the Red Planet?', o: ['Venus','Mars','Mercury','Saturn'], a: 1 },
    { q: 'How many planets are in our Solar System?', o: ['7','8','9','10'], a: 1 },
    { q: 'Which planet is closest to the Sun?', o: ['Venus','Earth','Mercury','Mars'], a: 2 },
    { q: 'Which planet has a famous ring system?', o: ['Jupiter','Uranus','Neptune','Saturn'], a: 3 },
    { q: 'What is the name of our star?', o: ['Polaris','Sun','Sirius','Alpha Centauri'], a: 1 },
    { q: 'Which planet do we live on?', o: ['Mars','Venus','Earth','Mercury'], a: 2 },
    { q: 'Which planet is the hottest?', o: ['Mercury','Venus','Mars','Jupiter'], a: 1 },
    { q: 'How many moons does Earth have?', o: ['0','1','2','3'], a: 1 },
    { q: 'Which planet is known as Earth\'s "twin"?', o: ['Mars','Mercury','Venus','Neptune'], a: 2 },
    { q: 'What colour does Mars appear from space?', o: ['Blue','Green','Red','Yellow'], a: 2 },
    { q: 'Which planet is smallest?', o: ['Mars','Mercury','Pluto','Venus'], a: 1 },
    { q: 'Which planet is farthest from the Sun?', o: ['Uranus','Saturn','Neptune','Pluto'], a: 2 },
    { q: 'What type of celestial body is the Sun?', o: ['Planet','Star','Comet','Asteroid'], a: 1 },
    { q: 'Which planet has the Great Red Spot?', o: ['Saturn','Jupiter','Mars','Neptune'], a: 1 },
    { q: 'What does the Solar System orbit around?', o: ['The Moon','The Sun','The Earth','The Milky Way centre'], a: 3 },
    { q: 'Which planet has the most moons?', o: ['Jupiter','Saturn','Uranus','Neptune'], a: 1 },
    { q: 'What separates the inner and outer planets?', o: ['The Sun','Asteroid Belt','Kuiper Belt','Oort Cloud'], a: 1 },
    { q: 'Which planet rotates on its side?', o: ['Neptune','Uranus','Saturn','Jupiter'], a: 1 },
    { q: 'Is Pluto currently classified as a planet?', o: ['Yes','No — it is a dwarf planet','Yes — a gas giant','Yes — a star'], a: 1 },
    { q: 'What is the approximate distance from Earth to the Sun?', o: ['50 million km','100 million km','150 million km','200 million km'], a: 2 },
    { q: 'Which planets are called Gas Giants?', o: ['Mars & Venus','Jupiter & Saturn','Earth & Mars','Mercury & Venus'], a: 1 },
    { q: 'Which planet is famous for its blue colour?', o: ['Uranus','Venus','Neptune','Mars'], a: 2 },
    { q: 'What is the name of Mars\' largest moon?', o: ['Titan','Phobos','Europa','Ganymede'], a: 1 },
    { q: 'Which planet has the shortest day?', o: ['Earth','Jupiter','Mercury','Saturn'], a: 1 },
    { q: 'What keeps planets in orbit around the Sun?', o: ['Magnetism','Gravity','Solar wind','Light'], a: 1 },
    { q: 'How long does Earth take to orbit the Sun?', o: ['30 days','365 days','24 hours','7 days'], a: 1 },
    { q: 'Which inner planet has no moons at all?', o: ['Earth','Mars','Mercury','Jupiter'], a: 2 },
    { q: 'What is Saturn\'s ring system made of?', o: ['Gas','Fire','Ice and rock','Liquid metal'], a: 2 },
    { q: 'Which planet was named after the Roman god of the sea?', o: ['Mercury','Mars','Neptune','Saturn'], a: 2 }
  ],

  /* ── MEDIUM (30) ─────────────────────────── */
  medium: [
    { q: 'What is the Great Red Spot on Jupiter?', o: ['A volcano','A giant storm','An ocean','A crater'], a: 1 },
    { q: 'Which planet\'s day is longer than its year?', o: ['Mercury','Venus','Mars','Jupiter'], a: 1 },
    { q: 'Which moon of Saturn has a thick atmosphere?', o: ['Enceladus','Rhea','Titan','Mimas'], a: 2 },
    { q: 'What is the Kuiper Belt?', o: ['A ring around Saturn','A region beyond Neptune with icy bodies','An asteroid field near Mars','A cloud of gas near the Sun'], a: 1 },
    { q: 'How many Earth-days does Mercury take to orbit the Sun?', o: ['88','365','225','687'], a: 0 },
    { q: 'Which planet has the strongest magnetic field?', o: ['Earth','Saturn','Jupiter','Uranus'], a: 2 },
    { q: 'What causes the seasons on Earth?', o: ['Distance from the Sun','Axial tilt of 23.5°','The Moon\'s gravity','Solar flares'], a: 1 },
    { q: 'Which moon is the largest in the Solar System?', o: ['Titan','Europa','Ganymede','Callisto'], a: 2 },
    { q: 'What is the surface gravity of Mars compared to Earth?', o: ['About 38%','About 50%','About 90%','About 10%'], a: 0 },
    { q: 'Which planet was the first discovered with a telescope?', o: ['Neptune','Saturn','Uranus','Pluto'], a: 2 },
    { q: 'Olympus Mons, the tallest volcano, is on which planet?', o: ['Venus','Earth','Mars','Jupiter'], a: 2 },
    { q: 'How long does it take sunlight to reach Earth?', o: ['About 1 minute','About 8 minutes','About 30 minutes','About 1 hour'], a: 1 },
    { q: 'Which planet has the fastest winds?', o: ['Jupiter','Saturn','Uranus','Neptune'], a: 3 },
    { q: 'What is the Asteroid Belt located between?', o: ['Earth and Mars','Mars and Jupiter','Jupiter and Saturn','Saturn and Uranus'], a: 1 },
    { q: 'Which of Jupiter\'s moons has a subsurface ocean?', o: ['Io','Callisto','Europa','Amalthea'], a: 2 },
    { q: 'Venus rotates in which direction compared to most planets?', o: ['The same direction','Opposite (retrograde)','It doesn\'t rotate','Sideways'], a: 1 },
    { q: 'What percentage of the Solar System\'s mass does the Sun hold?', o: ['50%','75%','90%','99.86%'], a: 3 },
    { q: 'Which planet has a hexagonal storm at its north pole?', o: ['Jupiter','Saturn','Neptune','Uranus'], a: 1 },
    { q: 'What type of planet is Neptune classified as?', o: ['Terrestrial','Gas Giant','Ice Giant','Dwarf Planet'], a: 2 },
    { q: 'How many rings does Saturn have (main groups)?', o: ['3','5','7','9'], a: 2 },
    { q: 'Which of Mars\'s moons is larger?', o: ['Deimos','Phobos','They are equal','Mars has no moons'], a: 1 },
    { q: 'What gas makes up most of Jupiter\'s atmosphere?', o: ['Oxygen','Nitrogen','Hydrogen','Carbon dioxide'], a: 2 },
    { q: 'Which spacecraft first visited all four outer planets?', o: ['Pioneer 10','Cassini','New Horizons','Voyager 2'], a: 3 },
    { q: 'What is the average surface temperature on Venus?', o: ['150 °C','465 °C','250 °C','600 °C'], a: 1 },
    { q: 'How old is the Solar System approximately?', o: ['1 billion years','4.6 billion years','10 billion years','100 million years'], a: 1 },
    { q: 'Which planet\'s atmosphere is mostly carbon dioxide?', o: ['Earth','Jupiter','Venus','Saturn'], a: 2 },
    { q: 'What is the Oort Cloud?', o: ['A cloud on Jupiter','A spherical shell of icy bodies surrounding the Solar System','A nebula','Saturn\'s outermost ring'], a: 1 },
    { q: 'Which moon has active volcanoes?', o: ['Europa','Titan','Io','Triton'], a: 2 },
    { q: 'Neptune\'s moon Triton orbits in which unusual way?', o: ['It doesn\'t orbit','Retrograde (opposite direction)','In a figure-8','Perpendicular to the equator'], a: 1 },
    { q: 'What phenomenon on the Sun can disrupt electronics on Earth?', o: ['Sunspots','Solar flares / CMEs','Solar eclipses','Prominences'], a: 1 }
  ],

  /* ── HARD (30) ───────────────────────────── */
  hard: [
    { q: 'What is the Roche limit?', o: ['Max orbital speed','Distance within which tidal forces break apart a body','Minimum mass for a star','Max size of a comet'], a: 1 },
    { q: 'Which spacecraft is farthest from Earth as of 2026?', o: ['New Horizons','Voyager 2','Pioneer 10','Voyager 1'], a: 3 },
    { q: 'What resonance are Pluto and Neptune in?', o: ['1:1','2:3','3:5','1:2'], a: 1 },
    { q: 'The Huygens probe landed on which moon?', o: ['Europa','Ganymede','Titan','Enceladus'], a: 2 },
    { q: 'What causes Jupiter\'s intense radiation belts?', o: ['Solar wind alone','Its rapid rotation and strong magnetic field','Volcanic activity on Io','Its proximity to the Sun'], a: 1 },
    { q: 'Which dwarf planet is in the Asteroid Belt?', o: ['Pluto','Eris','Ceres','Haumea'], a: 2 },
    { q: 'What is the Kirkwood Gap?', o: ['A gap in Saturn\'s rings','Gaps in the Asteroid Belt caused by Jupiter\'s resonance','Space between binary stars','A gap in Neptune\'s atmosphere'], a: 1 },
    { q: 'Mercury\'s core makes up approximately what fraction of its radius?', o: ['25%','50%','75%','85%'], a: 3 },
    { q: 'Which gas giant has the lowest density of all planets?', o: ['Jupiter','Saturn','Uranus','Neptune'], a: 1 },
    { q: 'What is the Jeans escape mechanism?', o: ['A way planets lose atmosphere via thermal energy','A type of rocket propulsion','How stars form','A theory of moon creation'], a: 0 },
    { q: 'What creates the blue colour of Uranus and Neptune?', o: ['Oxygen','Methane absorbing red light','Water','Hydrogen'], a: 1 },
    { q: 'What evidence suggests a subsurface ocean on Enceladus?', o: ['Visible lakes','Geysers of water vapour from its south pole','Magnetic field changes','Spectral analysis of its rings'], a: 1 },
    { q: 'In planetary science, what is differentiation?', o: ['Separation of a planet\'s interior into layers by density','Planet changing orbit','Formation of moons','A type of volcanic eruption'], a: 0 },
    { q: 'What is the Hill sphere?', o: ['Area where a body\'s gravity dominates satellite orbits','The visible surface of a star','The habitable zone','A type of crater'], a: 0 },
    { q: 'Which asteroid was the first to be orbited by a spacecraft?', o: ['Ceres','Bennu','Eros','Vesta'], a: 2 },
    { q: 'What is the Yarkovsky effect?', o: ['A force on asteroids due to thermal radiation','Magnetic braking of planets','Tidal locking mechanism','Solar wind erosion'], a: 0 },
    { q: 'Titan\'s atmospheric pressure at the surface is about how many times Earth\'s?', o: ['0.5×','1.5×','3×','10×'], a: 1 },
    { q: 'What is the Cassini Division?', o: ['A region in Jupiter\'s clouds','A gap in Saturn\'s rings','A boundary in the Kuiper Belt','The heliopause'], a: 1 },
    { q: 'What is believed to have caused Uranus\'s extreme axial tilt?', o: ['Gravitational pull of Neptune','A giant impact early in its history','Tidal forces from the Sun','Its ring system'], a: 1 },
    { q: 'The trojan asteroids of Jupiter orbit at which Lagrange points?', o: ['L1 and L2','L3 and L4','L4 and L5','L1 and L5'], a: 2 },
    { q: 'What isotope ratio is key evidence the Solar System formed from a molecular cloud?', o: ['Carbon-12/Carbon-14','Deuterium/Hydrogen','Uranium-235/238','Oxygen-16/18'], a: 1 },
    { q: 'Mars\'s Valles Marineris is roughly how long?', o: ['500 km','1,000 km','4,000 km','10,000 km'], a: 2 },
    { q: 'What mission discovered the Van Allen radiation belts?', o: ['Apollo 11','Explorer 1','Voyager 1','Sputnik 1'], a: 1 },
    { q: 'What is the primary composition of cometary nuclei?', o: ['Iron and nickel','Water ice, dust, and frozen gases','Pure hydrogen','Silicate rock'], a: 1 },
    { q: 'Which phenomenon explains why the Moon always shows the same face to Earth?', o: ['Synchronous rotation (tidal locking)','It doesn\'t rotate','Magnetic locking','Resonance with the Sun'], a: 0 },
    { q: 'What is the approximate escape velocity from Earth\'s surface?', o: ['5.2 km/s','8.4 km/s','11.2 km/s','15.0 km/s'], a: 2 },
    { q: 'Io\'s volcanism is primarily driven by what?', o: ['Radioactive decay','Solar heating','Tidal heating from Jupiter','Internal chemical reactions'], a: 2 },
    { q: 'The Nice model in planetary science explains what?', o: ['Formation of the Moon','Late Heavy Bombardment and migration of giant planets','Origin of comets','Creation of the Asteroid Belt'], a: 1 },
    { q: 'What is the heliopause?', o: ['The Sun\'s surface','Boundary where solar wind meets interstellar medium','The edge of the Oort Cloud','The closest point of Earth\'s orbit to the Sun'], a: 1 },
    { q: 'Saturn\'s moon Enceladus has geysers that contribute to which ring?', o: ['A ring','B ring','E ring','F ring'], a: 2 }
  ]
};

/* ============================================================
   3. STAR BACKGROUND CANVAS
   ============================================================ */
function initStarCanvas() {
  const canvas = document.getElementById('star-canvas');
  const ctx = canvas.getContext('2d');
  let stars = [];
  const COUNT = 280;

  function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
  function create() {
    stars = [];
    for (let i = 0; i < COUNT; i++) {
      stars.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height,
        r: Math.random() * 1.5 + 0.3, alpha: Math.random(), speed: Math.random() * 0.005 + 0.002 });
    }
  }
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const s of stars) {
      s.alpha += s.speed;
      const a = 0.3 + 0.7 * Math.abs(Math.sin(s.alpha));
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200,200,255,${a})`; ctx.fill();
    }
    requestAnimationFrame(draw);
  }
  resize(); create(); draw();
  window.addEventListener('resize', () => { resize(); create(); });
}

/* ============================================================
   4. NAVIGATION
   ============================================================ */
function initNavigation() {
  const toggle = document.getElementById('nav-toggle');
  const links = document.getElementById('nav-links');
  toggle.addEventListener('click', () => links.classList.toggle('active'));
  links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => links.classList.remove('active')));
  document.getElementById('nav-launch-ar').addEventListener('click', e => { e.preventDefault(); launchSolarSystem(); });
}

/* ============================================================
   5. MINI 3D PLANET PREVIEWS (Explore cards)
   Each card gets its own tiny Three.js scene + renderer
   ============================================================ */

// Store references so we can animate them all using ONE shared WebGLRenderer (prevents mobile 8-WebGL-context limit crash)
const miniPlanets = [];
let sharedMiniRenderer = null;

/**
 * Create a small rotating 3D sphere for a planet card using a single shared WebGLRenderer.
 * @param {HTMLElement} wrapEl  – the .planet-card-canvas-wrap container
 * @param {Object} data        – planet data entry
 */
function createMiniPlanet(wrapEl, data) {
  const size = 150;
  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.z = 3.2;

  if (!sharedMiniRenderer) {
    sharedMiniRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    sharedMiniRenderer.setSize(size, size);
    sharedMiniRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  // Lightweight 2D canvas in the card (uses 0 WebGL contexts!)
  const canvas2d = document.createElement('canvas');
  canvas2d.width = size * Math.min(window.devicePixelRatio, 2);
  canvas2d.height = size * Math.min(window.devicePixelRatio, 2);
  canvas2d.style.width = `${size}px`;
  canvas2d.style.height = `${size}px`;
  wrapEl.appendChild(canvas2d);
  const ctx2d = canvas2d.getContext('2d');

  scene.add(new THREE.AmbientLight(0xffffff, 0.85));
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
  dirLight.position.set(3, 2, 4);
  scene.add(dirLight);

  // Use procedural textures
  const tex = PLANET_TEXTURES[data.name];
  const geo = new THREE.SphereGeometry(1, 48, 48);
  const matProps = {
    color: 0xffffff,
    map: tex ? tex.map : null,
    roughness: data.name === 'Sun' ? 0.2 : 0.55,
    metalness: 0.05,
  };
  if (data.name === 'Sun') {
    matProps.emissive = new THREE.Color(0xff8800);
    matProps.emissiveIntensity = 1.6;
    matProps.emissiveMap = tex ? tex.map : null;
  } else {
    matProps.emissive = new THREE.Color(data.color);
    matProps.emissiveIntensity = 0.22;
    matProps.emissiveMap = tex ? tex.map : null;
  }
  if (tex && tex.bumpMap) {
    matProps.bumpMap = tex.bumpMap;
    matProps.bumpScale = 0.04;
  }
  const mat = new THREE.MeshStandardMaterial(matProps);
  const mesh = new THREE.Mesh(geo, mat);
  scene.add(mesh);

  if (data.name === 'Sun') {
    const g = new THREE.MeshBasicMaterial({ color: 0xffaa33, transparent: true, opacity: 0.12, side: THREE.BackSide });
    scene.add(new THREE.Mesh(new THREE.SphereGeometry(1.25, 32, 32), g));
  }
  if (data.hasRing) {
    const ringTex = generateRingTexture();
    const rg = new THREE.RingGeometry(1.3, 1.9, 64);
    const pos = rg.attributes.position;
    const uv = rg.attributes.uv;
    for (let i = 0; i < uv.count; i++) {
      const x = pos.getX(i), y = pos.getY(i);
      const dist = Math.sqrt(x * x + y * y);
      uv.setXY(i, (dist - 1.3) / 0.6, 0.5);
    }
    const rm = new THREE.MeshBasicMaterial({ map: ringTex, side: THREE.DoubleSide, transparent: true, opacity: 0.7 });
    const r = new THREE.Mesh(rg, rm); r.rotation.x = -Math.PI / 2.2; scene.add(r);
  }

  miniPlanets.push({ scene, camera, canvas2d, ctx2d, mesh });
}

/** Shared animation loop for all mini-planet canvases */
function animateMiniPlanets() {
  requestAnimationFrame(animateMiniPlanets);
  if (isOverlayOpen || !sharedMiniRenderer) return; // Pause card rendering when full 3D/AR overlay is active
  for (const mp of miniPlanets) {
    mp.mesh.rotation.y += 0.008;
    sharedMiniRenderer.render(mp.scene, mp.camera);
    mp.ctx2d.clearRect(0, 0, mp.canvas2d.width, mp.canvas2d.height);
    mp.ctx2d.drawImage(sharedMiniRenderer.domElement, 0, 0, mp.canvas2d.width, mp.canvas2d.height);
  }
}

/* ============================================================
   6. EXPLORE PLANET CARDS  (with 3D preview)
   ============================================================ */
function initPlanetCards() {
  const grid = document.getElementById('planets-grid');

  PLANET_DATA.forEach((planet, index) => {
    const card = document.createElement('div');
    card.className = 'planet-card';
    card.innerHTML = `
      <div class="planet-card-canvas-wrap" id="mini-planet-${index}"></div>
      <h3>${planet.name}</h3>
      <p class="planet-card-type">${planet.type}</p>
      <p class="planet-card-desc">${planet.description}</p>
      <button class="btn btn-secondary" data-planet="${index}">
        <i class="fas fa-search"></i> Explore
      </button>
    `;
    card.querySelector('button').addEventListener('click', e => { e.stopPropagation(); openPlanetModal(index); });
    card.addEventListener('click', () => openPlanetModal(index));
    grid.appendChild(card);

    // Create mini Three.js scene for this card
    const wrap = card.querySelector('.planet-card-canvas-wrap');
    createMiniPlanet(wrap, planet);
  });

  // Start shared animation loop for all mini planets
  animateMiniPlanets();
}

/* ============================================================
   7. PLANET DETAIL MODAL  (with 3D preview)
   ============================================================ */
let modalMiniPlanet = null; // track the current modal mini-renderer

function openPlanetModal(index) {
  const planet = PLANET_DATA[index];
  const modal = document.getElementById('planet-modal');

  // 3D preview in modal
  const wrap = document.getElementById('modal-planet-canvas-wrap');
  wrap.innerHTML = ''; // clear previous
  if (modalMiniPlanet) { // clean up old
    modalMiniPlanet.renderer.dispose();
    modalMiniPlanet = null;
  }

  // Create a larger mini-planet for the modal
  const size = 180;
  const sc = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  cam.position.z = 3.2;
  const ren = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  ren.setSize(size, size);
  ren.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  wrap.appendChild(ren.domElement);

  sc.add(new THREE.AmbientLight(0xffffff, 0.85));
  const dl = new THREE.DirectionalLight(0xffffff, 1.4);
  dl.position.set(3, 2, 4); sc.add(dl);

  // Use procedural textures for modal preview
  const tex = PLANET_TEXTURES[planet.name];
  const geo = new THREE.SphereGeometry(1, 64, 64);
  const matProps = {
    color: 0xffffff,
    map: tex ? tex.map : null,
    roughness: planet.name === 'Sun' ? 0.2 : 0.55,
    metalness: 0.05,
  };
  if (planet.name === 'Sun') {
    matProps.emissive = new THREE.Color(0xff8800);
    matProps.emissiveIntensity = 1.6;
    matProps.emissiveMap = tex ? tex.map : null;
  } else {
    matProps.emissive = new THREE.Color(planet.color);
    matProps.emissiveIntensity = 0.22;
    matProps.emissiveMap = tex ? tex.map : null;
  }
  if (tex && tex.bumpMap) {
    matProps.bumpMap = tex.bumpMap;
    matProps.bumpScale = 0.04;
  }
  const mat = new THREE.MeshStandardMaterial(matProps);
  const mesh = new THREE.Mesh(geo, mat);
  sc.add(mesh);

  if (planet.name === 'Sun') {
    const g = new THREE.MeshBasicMaterial({ color: 0xffaa33, transparent: true, opacity: 0.12, side: THREE.BackSide });
    sc.add(new THREE.Mesh(new THREE.SphereGeometry(1.25, 32, 32), g));
  }
  if (planet.hasRing) {
    const ringTex = generateRingTexture();
    const rg = new THREE.RingGeometry(1.3, 1.9, 64);
    const pos = rg.attributes.position;
    const uv = rg.attributes.uv;
    for (let ri = 0; ri < uv.count; ri++) {
      const rx = pos.getX(ri), ry = pos.getY(ri);
      const dist = Math.sqrt(rx * rx + ry * ry);
      uv.setXY(ri, (dist - 1.3) / 0.6, 0.5);
    }
    const rm = new THREE.MeshBasicMaterial({ map: ringTex, side: THREE.DoubleSide, transparent: true, opacity: 0.7 });
    const r = new THREE.Mesh(rg, rm); r.rotation.x = -Math.PI / 2.2; sc.add(r);
  }

  modalMiniPlanet = { scene: sc, camera: cam, renderer: ren, mesh };

  // Animate in the shared mini-planet loop
  miniPlanets.push(modalMiniPlanet);

  document.getElementById('modal-planet-name').textContent = planet.name;
  document.getElementById('modal-planet-type').textContent = planet.type;
  document.getElementById('modal-planet-desc').textContent = planet.description;

  document.getElementById('modal-stats').innerHTML = `
    <div class="modal-stat-item"><span class="modal-stat-label">Distance from Sun</span><span class="modal-stat-value">${planet.distanceFromSun}</span></div>
    <div class="modal-stat-item"><span class="modal-stat-label">Diameter</span><span class="modal-stat-value">${planet.diameter}</span></div>
    <div class="modal-stat-item"><span class="modal-stat-label">Moons</span><span class="modal-stat-value">${planet.moons}</span></div>
    <div class="modal-stat-item"><span class="modal-stat-label">Day Length</span><span class="modal-stat-value">${planet.dayLength}</span></div>
    <div class="modal-stat-item"><span class="modal-stat-label">Year Length</span><span class="modal-stat-value">${planet.yearLength}</span></div>
  `;

  document.getElementById('modal-facts').innerHTML = `
    <h4>Interesting Facts</h4>
    <ul>${planet.facts.map(f => `<li>${f}</li>`).join('')}</ul>
  `;

  document.getElementById('modal-explore-3d').onclick = () => { modal.classList.remove('active'); launchSolarSystem(index); };
  modal.classList.add('active');
}

function initModal() {
  const modal = document.getElementById('planet-modal');
  document.getElementById('modal-close').addEventListener('click', () => modal.classList.remove('active'));
  modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('active'); });
}

/* ============================================================
   8. QUIZ  (Easy / Medium / Hard — 10 per round)
   ============================================================ */
function initQuiz() {
  let difficulty = 'easy';
  let questions = [];
  let currentQ = 0;
  let score = 0;
  let answered = false;
  let timerInterval = null;
  let elapsedSec = 0;

  const startDiv  = document.getElementById('quiz-start');
  const activeDiv = document.getElementById('quiz-active');
  const resultDiv = document.getElementById('quiz-result');

  // Difficulty buttons
  const diffBtns = document.querySelectorAll('.btn-difficulty');
  const diffDesc  = document.getElementById('difficulty-desc');
  const descriptions = {
    easy:   '🌟 <strong>Easy</strong> — Basic solar system facts everyone should know.',
    medium: '⚡ <strong>Medium</strong> — Requires a solid understanding of space science.',
    hard:   '🔥 <strong>Hard</strong> — Expert-level questions for true space enthusiasts.'
  };

  diffBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      diffBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      difficulty = btn.dataset.difficulty;
      diffDesc.innerHTML = `<p>${descriptions[difficulty]}</p>`;
    });
  });

  document.getElementById('btn-start-quiz').addEventListener('click', startQuiz);
  document.getElementById('btn-retry-quiz').addEventListener('click', startQuiz);
  document.getElementById('btn-change-difficulty').addEventListener('click', () => {
    resultDiv.style.display = 'none';
    startDiv.style.display = 'block';
  });

  function startQuiz() {
    // Pick 10 random questions from the pool
    const pool = [...QUIZ_DATA[difficulty]];
    shuffle(pool);
    questions = pool.slice(0, 10);
    currentQ = 0; score = 0; answered = false;
    elapsedSec = 0;
    startDiv.style.display = 'none';
    resultDiv.style.display = 'none';
    activeDiv.style.display = 'block';

    // Badge
    const badge = document.getElementById('quiz-difficulty-badge');
    badge.textContent = difficulty.toUpperCase();
    badge.className = 'quiz-difficulty-badge ' + difficulty;

    // Timer
    clearInterval(timerInterval);
    document.getElementById('quiz-timer').textContent = '⏱ 0:00';
    timerInterval = setInterval(() => {
      elapsedSec++;
      const m = Math.floor(elapsedSec / 60);
      const s = String(elapsedSec % 60).padStart(2, '0');
      document.getElementById('quiz-timer').textContent = `⏱ ${m}:${s}`;
    }, 1000);

    showQuestion();
  }

  function showQuestion() {
    answered = false;
    const q = questions[currentQ];
    document.getElementById('quiz-counter').textContent = `Question ${currentQ + 1} / ${questions.length}`;
    document.getElementById('quiz-progress-bar').style.width = `${((currentQ + 1) / questions.length) * 100}%`;
    document.getElementById('quiz-question').textContent = q.q;

    const optDiv = document.getElementById('quiz-options');
    optDiv.innerHTML = '';
    q.o.forEach((opt, i) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-option';
      btn.textContent = `${String.fromCharCode(65 + i)}. ${opt}`;
      btn.addEventListener('click', () => selectAnswer(i, btn));
      optDiv.appendChild(btn);
    });
  }

  function selectAnswer(i, btn) {
    if (answered) return;
    answered = true;
    const q = questions[currentQ];
    const allBtns = document.querySelectorAll('.quiz-option');
    allBtns.forEach(b => b.classList.add('disabled'));
    if (i === q.a) { btn.classList.add('correct'); score++; }
    else { btn.classList.add('wrong'); allBtns[q.a].classList.add('correct'); }
    setTimeout(() => { currentQ++; currentQ < questions.length ? showQuestion() : showResult(); }, 1200);
  }

  function showResult() {
    clearInterval(timerInterval);
    activeDiv.style.display = 'none';
    resultDiv.style.display = 'block';
    document.getElementById('quiz-score').textContent = `${score} / ${questions.length}`;
    const m = Math.floor(elapsedSec / 60);
    const s = String(elapsedSec % 60).padStart(2, '0');
    document.getElementById('quiz-time').textContent = `Time: ${m}:${s}`;

    let title = '';
    if (score === 10) title = '🏆 Perfect Score! You\'re a Space Expert!';
    else if (score >= 7) title = '🌟 Great Job! Stellar knowledge!';
    else if (score >= 4) title = '🚀 Not Bad! Keep exploring!';
    else title = '🔭 Keep Learning! The cosmos awaits!';
    document.getElementById('quiz-result-title').textContent = title;

    // Submit score to backend (if logged in)
    submitQuizScore(difficulty, score, questions.length, elapsedSec);
  }
}

function shuffle(arr) { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } }

/* ============================================================
   9. THREE.JS FULL SOLAR SYSTEM  (3D / AR overlay)
   ============================================================ */
let scene, camera, renderer, controls;
let solarGroup;
let planetMeshes = [];
let animationPaused = false;
let animationSpeed = 0.5;
let showOrbits = true;
let showLabels = true;
let raycaster, mouse;
let labelSprites = [];
let isOverlayOpen = false;
let sceneInitialized = false;
let focusPlanetIndex = null;
let starPoints = null;

// Live AR Camera Background state
let arCameraActive = false;
let arCameraStream = null;
let arFacingMode = 'environment'; // default to rear camera on phones
let arNativeInputBound = false;

// Audio
let audioCtx = null, audioGain = null, audioOsc = null, soundOn = false;

function launchSolarSystem(focusIndex = null, autoStartARCam = true) {
  focusPlanetIndex = focusIndex;
  const overlay = document.getElementById('solar-overlay');
  overlay.style.display = 'block';
  isOverlayOpen = true;

  if (!sceneInitialized) {
    initThreeScene();
    sceneInitialized = true;
  }
  onWindowResize();

  // Automatically connect to live camera so planets appear in front of camera background
  if (autoStartARCam && !arCameraActive) {
    startARCamera();
  }

  if (focusPlanetIndex !== null && planetMeshes[focusPlanetIndex]) {
    setTimeout(() => focusOnPlanet(focusPlanetIndex), 500);
  }
}

function enableTransparentARBackground(titleText = 'SolarVerse – Live AR Camera') {
  const camBtn = document.getElementById('hud-ar-cam');
  const switchBtn = document.getElementById('hud-switch-cam');
  const titleEl = document.getElementById('hud-title');
  const promptBtn = document.getElementById('ar-cam-prompt-btn');

  arCameraActive = true;
  if (renderer) renderer.setClearColor(0x000000, 0);
  if (starPoints) starPoints.visible = false;
  document.getElementById('solar-overlay').style.background = 'transparent';

  if (camBtn) camBtn.classList.add('active');
  if (switchBtn) switchBtn.style.display = 'flex';
  if (titleEl) titleEl.textContent = titleText;
  if (promptBtn) promptBtn.style.display = 'none';
}

function bindARCameraHelpers() {
  if (arNativeInputBound) return;
  arNativeInputBound = true;

  const promptBtn = document.getElementById('ar-cam-prompt-btn');
  const nativeInput = document.getElementById('ar-native-cam-input');
  const video = document.getElementById('ar-camera-bg');
  const imgBg = document.getElementById('ar-camera-img-bg');

  if (promptBtn) {
    promptBtn.addEventListener('click', async () => {
      // First try direct WebRTC camera stream on user tap gesture
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          await startARCamera(true);
          if (arCameraActive) return;
        } catch (e) { /* fall through to native camera input */ }
      }
      // Fallback for plain HTTP LAN URLs on phones where getUserMedia is restricted: open native phone camera
      if (nativeInput) nativeInput.click();
    });
  }

  if (nativeInput) {
    nativeInput.addEventListener('change', e => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const objUrl = URL.createObjectURL(file);

      if (file.type.startsWith('video/')) {
        if (imgBg) imgBg.style.display = 'none';
        video.srcObject = null;
        video.src = objUrl;
        video.loop = true;
        video.muted = true;
        video.playsInline = true;
        video.classList.add('active');
        video.play().catch(() => {});
      } else {
        video.classList.remove('active');
        if (imgBg) {
          imgBg.src = objUrl;
          imgBg.style.display = 'block';
        }
      }
      enableTransparentARBackground('SolarVerse – Phone Camera AR');
    });
  }
}

/** Start live camera video stream behind the 3D Solar System planets */
async function startARCamera(fromUserTap = false) {
  bindARCameraHelpers();
  const video = document.getElementById('ar-camera-bg');
  const imgBg = document.getElementById('ar-camera-img-bg');
  const promptBtn = document.getElementById('ar-cam-prompt-btn');
  const nativeInput = document.getElementById('ar-native-cam-input');

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    console.warn('getUserMedia unavailable (likely plain HTTP on mobile); showing tap-to-open camera button.');
    if (promptBtn) promptBtn.style.display = 'flex';
    if (fromUserTap && nativeInput) nativeInput.click();
    return;
  }

  try {
    if (arCameraStream) {
      arCameraStream.getTracks().forEach(t => t.stop());
    }

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: arFacingMode }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
    } catch (innerErr) {
      // Fallback to any available camera (e.g. laptop webcam or front camera)
      stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    }

    if (imgBg) imgBg.style.display = 'none';
    arCameraStream = stream;
    video.srcObject = stream;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.muted = true;
    await video.play();
    video.classList.add('active');

    enableTransparentARBackground('SolarVerse – Live AR Camera');
  } catch (err) {
    console.warn('Could not auto-start camera for AR background:', err.message);
    if (promptBtn) promptBtn.style.display = 'flex';
    if (fromUserTap && nativeInput) nativeInput.click();
  }
}

/** Stop live camera video stream and restore starry 3D space background */
function stopARCamera() {
  const video = document.getElementById('ar-camera-bg');
  const imgBg = document.getElementById('ar-camera-img-bg');
  const camBtn = document.getElementById('hud-ar-cam');
  const switchBtn = document.getElementById('hud-switch-cam');
  const titleEl = document.getElementById('hud-title');
  const promptBtn = document.getElementById('ar-cam-prompt-btn');

  if (arCameraStream) {
    arCameraStream.getTracks().forEach(t => t.stop());
    arCameraStream = null;
  }
  if (video) {
    video.srcObject = null;
    video.removeAttribute('src');
    video.classList.remove('active');
  }
  if (imgBg) {
    imgBg.style.display = 'none';
  }
  if (promptBtn) {
    promptBtn.style.display = 'none';
  }
  arCameraActive = false;

  if (starPoints) starPoints.visible = true;
  document.getElementById('solar-overlay').style.background = '#000';

  if (camBtn) camBtn.classList.remove('active');
  if (switchBtn) switchBtn.style.display = 'none';
  if (titleEl) titleEl.textContent = 'SolarVerse – 3D Space Mode';
}

function toggleARCamera() {
  if (arCameraActive) stopARCamera();
  else startARCamera(true);
}

function switchARCameraFacing() {
  arFacingMode = arFacingMode === 'environment' ? 'user' : 'environment';
  if (arCameraActive) startARCamera(true);
}

function initThreeScene() {
  const overlay = document.getElementById('solar-overlay');
  bindARCameraHelpers();

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 26, 46);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 0); // Transparent so AR camera video shows behind planets
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const hudEl = overlay.querySelector('.solar-hud');
  overlay.insertBefore(renderer.domElement, hudEl);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = 0.08;
  controls.minDistance = 8; controls.maxDistance = 120;
  controls.enablePan = true;
  controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };

  // Rich cosmic lighting so planets are vibrant and never in black shadow
  scene.add(new THREE.AmbientLight(0xffffff, 0.8));
  scene.add(new THREE.HemisphereLight(0xffffff, 0x444466, 0.9));

  // Camera headlight so the side of every planet facing the viewer is naturally illuminated
  const cameraLight = new THREE.DirectionalLight(0xffffff, 1.4);
  cameraLight.position.set(0, 0, 1);
  camera.add(cameraLight);
  scene.add(camera);

  const sunLight = new THREE.PointLight(0xffe4a0, 3.5, 350, 0.5);
  scene.add(sunLight);

  // Starfield (shown in 3D space mode, hidden when live AR camera is active)
  const sg = new THREE.BufferGeometry();
  const sp = new Float32Array(3000 * 3);
  for (let i = 0; i < sp.length; i++) sp[i] = (Math.random() - 0.5) * 600;
  sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  starPoints = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 0.3, sizeAttenuation: true }));
  scene.add(starPoints);

  solarGroup = new THREE.Group();
  scene.add(solarGroup);

  planetMeshes = [];
  labelSprites = [];

  PLANET_DATA.forEach((data, i) => {
    const geo = new THREE.SphereGeometry(data.radius, 64, 64);
    const tex = PLANET_TEXTURES[data.name];
    const matProps = {
      color: 0xffffff,
      map: tex ? tex.map : null,
      roughness: data.name === 'Sun' ? 0.2 : 0.5,
      metalness: 0.05
    };
    if (data.name === 'Sun') {
      matProps.emissive = new THREE.Color(0xff8800);
      matProps.emissiveIntensity = 1.8;
      matProps.emissiveMap = tex ? tex.map : null;
    } else {
      matProps.emissive = new THREE.Color(data.color);
      matProps.emissiveIntensity = 0.25;
      matProps.emissiveMap = tex ? tex.map : null;
    }
    if (tex && tex.bumpMap) {
      matProps.bumpMap = tex.bumpMap;
      matProps.bumpScale = 0.03 * data.radius;
    }
    const mat = new THREE.MeshStandardMaterial(matProps);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.userData = { planetIndex: i };

    const orbitGroup = new THREE.Group();
    mesh.position.x = data.distance;
    orbitGroup.add(mesh);
    solarGroup.add(orbitGroup);

    if (data.hasRing) {
      const ringTex = generateRingTexture();
      const rg = new THREE.RingGeometry(data.radius * 1.3, data.radius * 2, 128);
      const pos = rg.attributes.position;
      const uv = rg.attributes.uv;
      for (let j = 0; j < uv.count; j++) {
        const rx = pos.getX(j), ry = pos.getY(j);
        const dist = Math.sqrt(rx * rx + ry * ry);
        uv.setXY(j, (dist - data.radius * 1.3) / (data.radius * 0.7), 0.5);
      }
      const rm = new THREE.MeshBasicMaterial({ map: ringTex, side: THREE.DoubleSide, transparent: true, opacity: 0.65 });
      const r = new THREE.Mesh(rg, rm); r.rotation.x = -Math.PI / 2.2; r.position.x = data.distance; orbitGroup.add(r);
    }

    if (data.name === 'Sun') {
      const gm = new THREE.MeshBasicMaterial({ color: 0xffaa33, transparent: true, opacity: 0.15, side: THREE.BackSide });
      mesh.add(new THREE.Mesh(new THREE.SphereGeometry(data.radius * 1.3, 32, 32), gm));
      // Second glow layer
      const gm2 = new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.06, side: THREE.BackSide });
      mesh.add(new THREE.Mesh(new THREE.SphereGeometry(data.radius * 1.8, 32, 32), gm2));
    }

    // Atmosphere glow for Earth
    if (data.name === 'Earth') {
      const atmoGeo = new THREE.SphereGeometry(data.radius * 1.04, 64, 64);
      const atmoMat = new THREE.MeshBasicMaterial({ color: 0x6699ff, transparent: true, opacity: 0.08, side: THREE.BackSide });
      const atmo = new THREE.Mesh(atmoGeo, atmoMat);
      atmo.position.x = data.distance;
      orbitGroup.add(atmo);
    }

    let orbitLine = null;
    if (data.distance > 0) {
      const oc = new THREE.EllipseCurve(0, 0, data.distance, data.distance, 0, 2 * Math.PI, false, 0);
      const pts = oc.getPoints(128);
      const lg = new THREE.BufferGeometry().setFromPoints(pts.map(p => new THREE.Vector3(p.x, 0, p.y)));
      orbitLine = new THREE.Line(lg, new THREE.LineBasicMaterial({ color: 0x4444aa, transparent: true, opacity: 0.3 }));
      solarGroup.add(orbitLine);
    }

    const label = createTextSprite(data.name);
    label.position.set(data.distance, data.radius + 1.2, 0);
    orbitGroup.add(label);
    labelSprites.push(label);

    planetMeshes.push({ mesh, data, orbitAngle: Math.random() * Math.PI * 2, orbitGroup, label, orbitLine });
  });

  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();
  renderer.domElement.addEventListener('click', onCanvasClick);
  renderer.domElement.addEventListener('touchend', onCanvasTouch);
  window.addEventListener('resize', onWindowResize);

  buildPlanetSelector();
  initHUDControls();
  animate();
}

function createTextSprite(text) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 64;
  const x = c.getContext('2d');
  x.font = '28px Orbitron, sans-serif';
  x.fillStyle = 'rgba(200,200,255,0.9)'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(text, 128, 32);
  const t = new THREE.CanvasTexture(c); t.minFilter = THREE.LinearFilter;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false }));
  s.scale.set(5, 1.25, 1);
  return s;
}

function animate() {
  requestAnimationFrame(animate);
  if (!animationPaused) {
    planetMeshes.forEach(p => {
      p.mesh.rotation.y += p.data.rotationSpeed * animationSpeed;
      if (p.data.distance > 0) {
        p.orbitAngle += p.data.orbitSpeed * 0.01 * animationSpeed;
        p.mesh.position.x = Math.cos(p.orbitAngle) * p.data.distance;
        p.mesh.position.z = Math.sin(p.orbitAngle) * p.data.distance;
        p.label.position.x = p.mesh.position.x;
        p.label.position.z = p.mesh.position.z;
        p.label.position.y = p.data.radius + 1.2;
      }
    });
  }
  controls.update();
  renderer.render(scene, camera);
}

function onCanvasClick(e) { handlePick(e.clientX, e.clientY); }
function onCanvasTouch(e) {
  if (e.changedTouches.length > 0) {
    const t = e.changedTouches[0];
    handlePick(t.clientX, t.clientY);
  }
}

function handlePick(cx, cy) {
  if (inspectActive) return; // ignore clicks while inspecting
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((cx - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((cy - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(planetMeshes.map(p => p.mesh));
  if (hits.length > 0) openInspectMode(hits[0].object.userData.planetIndex);
}

/* ============================================================
   PLANET INSPECT MODE
   Fullscreen close-up view with cursor-controlled rotation.
   ============================================================ */
let inspectActive = false;
let inspectScene, inspectCamera, inspectRenderer, inspectMesh, inspectRing;
let inspectDragging = false;
let inspectPrevX = 0, inspectPrevY = 0;
let inspectRotX = 0, inspectRotY = 0;
let inspectRAF = null;

function openInspectMode(index) {
  const data = PLANET_DATA[index];
  inspectActive = true;

  // Hide the orbit-controls HUD
  document.querySelector('.hud-bottom').style.display = 'none';
  document.getElementById('hud-planet-selector').style.display = 'none';
  document.getElementById('hud-info-card').style.display = 'none';

  // Create inspect overlay DOM
  const overlay = document.createElement('div');
  overlay.className = 'inspect-overlay';
  overlay.id = 'inspect-overlay';
  if (arCameraActive) {
    overlay.style.background = 'radial-gradient(ellipse at center, rgba(5,5,16,0.2) 0%, rgba(0,0,0,0.5) 100%)';
  }
  overlay.innerHTML = `
    <button class="inspect-back" id="inspect-back-btn"><i class="fas fa-arrow-left"></i></button>
    <div class="inspect-canvas-area" id="inspect-canvas-area">
      <span class="inspect-hint">🖱️ Drag to rotate · Scroll to zoom</span>
    </div>
    <div class="inspect-info">
      <h2>${data.name}</h2>
      <p class="inspect-type">${data.type}</p>
      <p class="inspect-desc">${data.description}</p>
      <div class="inspect-stats-grid">
        <div class="inspect-stat"><span class="inspect-stat-label">Distance</span><span class="inspect-stat-value">${data.distanceFromSun}</span></div>
        <div class="inspect-stat"><span class="inspect-stat-label">Diameter</span><span class="inspect-stat-value">${data.diameter}</span></div>
        <div class="inspect-stat"><span class="inspect-stat-label">Moons</span><span class="inspect-stat-value">${data.moons}</span></div>
        <div class="inspect-stat"><span class="inspect-stat-label">Day Length</span><span class="inspect-stat-value">${data.dayLength}</span></div>
        <div class="inspect-stat"><span class="inspect-stat-label">Year Length</span><span class="inspect-stat-value">${data.yearLength}</span></div>
      </div>
      <div>
        <h4 style="color:var(--accent-glow);font-family:var(--font-display);font-size:0.85rem;margin-bottom:8px;">Interesting Facts</h4>
        <ul class="inspect-facts">
          ${data.facts.map(f => `<li>${f}</li>`).join('')}
        </ul>
      </div>
    </div>
  `;
  document.getElementById('solar-overlay').querySelector('.solar-hud').appendChild(overlay);

  // Build the inspect 3D scene
  const canvasArea = document.getElementById('inspect-canvas-area');
  const w = canvasArea.clientWidth || 600;
  const h = canvasArea.clientHeight || 600;

  inspectScene = new THREE.Scene();
  inspectCamera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
  inspectCamera.position.z = 3.5;

  inspectRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  inspectRenderer.setClearColor(0x000000, 0);
  inspectRenderer.setSize(w, h);
  inspectRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  inspectRenderer.toneMapping = THREE.ACESFilmicToneMapping;
  canvasArea.insertBefore(inspectRenderer.domElement, canvasArea.firstChild);

  // Lighting
  inspectScene.add(new THREE.AmbientLight(0xffffff, 0.85));
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.5);
  keyLight.position.set(5, 3, 6);
  inspectScene.add(keyLight);
  const fillLight = new THREE.DirectionalLight(0x88aaff, 0.6);
  fillLight.position.set(-4, -2, -3);
  inspectScene.add(fillLight);

  // Planet sphere with procedural texture
  const tex = PLANET_TEXTURES[data.name];
  const geo = new THREE.SphereGeometry(1, 128, 128);
  const matProps = {
    color: 0xffffff,
    map: tex ? tex.map : null,
    roughness: data.name === 'Sun' ? 0.2 : 0.5,
    metalness: 0.05,
  };
  if (data.name === 'Sun') {
    matProps.emissive = new THREE.Color(0xff8800);
    matProps.emissiveIntensity = 1.6;
    matProps.emissiveMap = tex ? tex.map : null;
  } else {
    matProps.emissive = new THREE.Color(data.color);
    matProps.emissiveIntensity = 0.22;
    matProps.emissiveMap = tex ? tex.map : null;
  }
  if (tex && tex.bumpMap) {
    matProps.bumpMap = tex.bumpMap;
    matProps.bumpScale = 0.05;
  }
  inspectMesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial(matProps));
  inspectScene.add(inspectMesh);

  // Sun glow
  if (data.name === 'Sun') {
    const g1 = new THREE.MeshBasicMaterial({ color: 0xffaa33, transparent: true, opacity: 0.12, side: THREE.BackSide });
    inspectScene.add(new THREE.Mesh(new THREE.SphereGeometry(1.2, 32, 32), g1));
  }

  // Earth atmosphere
  if (data.name === 'Earth') {
    const atmo = new THREE.MeshBasicMaterial({ color: 0x6699ff, transparent: true, opacity: 0.1, side: THREE.BackSide });
    inspectScene.add(new THREE.Mesh(new THREE.SphereGeometry(1.03, 64, 64), atmo));
  }

  // Ring
  if (data.hasRing) {
    const ringTex = generateRingTexture();
    const rg = new THREE.RingGeometry(1.3, 2.0, 128);
    const pos = rg.attributes.position;
    const uv = rg.attributes.uv;
    for (let i = 0; i < uv.count; i++) {
      const rx = pos.getX(i), ry = pos.getY(i);
      const dist = Math.sqrt(rx * rx + ry * ry);
      uv.setXY(i, (dist - 1.3) / 0.7, 0.5);
    }
    inspectRing = new THREE.Mesh(rg, new THREE.MeshBasicMaterial({ map: ringTex, side: THREE.DoubleSide, transparent: true, opacity: 0.7 }));
    inspectRing.rotation.x = -Math.PI / 2.2;
    inspectScene.add(inspectRing);
  }

  // Rotation state — precise cursor-controlled
  let targetRotX = 0.3;   // vertical tilt
  let targetRotY = 0;     // horizontal spin
  let currentRotX = 0.3;
  let currentRotY = 0;
  let autoRotSpeed = 0.004; // slow auto-rotation
  let velocityX = 0, velocityY = 0; // momentum after release

  // Mouse / touch drag handlers for precise rotation
  const onDown = (e) => {
    inspectDragging = true;
    autoRotSpeed = 0; // stop auto-rotation while dragging
    velocityX = 0; velocityY = 0;
    const pt = e.touches ? e.touches[0] : e;
    inspectPrevX = pt.clientX; inspectPrevY = pt.clientY;
    e.preventDefault?.();
  };
  const onMove = (e) => {
    if (!inspectDragging) return;
    const pt = e.touches ? e.touches[0] : e;
    const dx = pt.clientX - inspectPrevX;
    const dy = pt.clientY - inspectPrevY;
    // Direct 1:1 mapping — each pixel of drag = precise rotation
    velocityY = dx * 0.008;
    velocityX = dy * 0.008;
    targetRotY += velocityY;
    targetRotX += velocityX;
    // Clamp vertical tilt to avoid flipping
    targetRotX = Math.max(-Math.PI * 0.45, Math.min(Math.PI * 0.45, targetRotX));
    inspectPrevX = pt.clientX; inspectPrevY = pt.clientY;
  };
  const onUp = () => {
    inspectDragging = false;
    autoRotSpeed = 0.004; // resume gentle auto-rotation
  };
  const onWheel = (e) => {
    inspectCamera.position.z += e.deltaY * 0.003;
    inspectCamera.position.z = Math.max(1.5, Math.min(8, inspectCamera.position.z));
    e.preventDefault();
  };

  canvasArea.addEventListener('mousedown', onDown);
  canvasArea.addEventListener('mousemove', onMove);
  canvasArea.addEventListener('mouseup', onUp);
  canvasArea.addEventListener('mouseleave', onUp);
  canvasArea.addEventListener('touchstart', onDown, { passive: false });
  canvasArea.addEventListener('touchmove', onMove, { passive: false });
  canvasArea.addEventListener('touchend', onUp);
  canvasArea.addEventListener('wheel', onWheel, { passive: false });

  // Animate with smooth interpolation
  function animateInspect() {
    inspectRAF = requestAnimationFrame(animateInspect);

    // Apply momentum when not dragging (flick-to-spin)
    if (!inspectDragging) {
      targetRotY += velocityY + autoRotSpeed;
      targetRotX += velocityX;
      targetRotX = Math.max(-Math.PI * 0.45, Math.min(Math.PI * 0.45, targetRotX));
      // Dampen momentum smoothly
      velocityX *= 0.94;
      velocityY *= 0.94;
    }

    // Smooth interpolation for buttery feel
    currentRotX += (targetRotX - currentRotX) * 0.12;
    currentRotY += (targetRotY - currentRotY) * 0.12;

    // Apply rotation
    inspectMesh.rotation.x = currentRotX;
    inspectMesh.rotation.y = currentRotY;

    // Sync ring rotation with planet
    if (inspectRing) {
      inspectRing.rotation.x = -Math.PI / 2.2 + currentRotX * 0.3;
      inspectRing.rotation.z = currentRotY * 0.15;
    }

    inspectRenderer.render(inspectScene, inspectCamera);
  }
  animateInspect();

  // Back button
  document.getElementById('inspect-back-btn').addEventListener('click', closeInspectMode);

  // Track visit
  trackPlanetVisit(data.name);
}

function closeInspectMode() {
  inspectActive = false;
  if (inspectRAF) cancelAnimationFrame(inspectRAF);
  if (inspectRenderer) inspectRenderer.dispose();
  const overlay = document.getElementById('inspect-overlay');
  if (overlay) overlay.remove();
  inspectMesh = null; inspectRing = null;
  inspectScene = null; inspectCamera = null; inspectRenderer = null;

  // Restore HUD
  document.querySelector('.hud-bottom').style.display = '';
  document.getElementById('hud-planet-selector').style.display = '';
}

/* Legacy info card (used by gesture point and planet selector) */
function showPlanetInfoCard(index) {
  openInspectMode(index);
}

function focusOnPlanet(index) {
  const p = planetMeshes[index];
  const target = new THREE.Vector3(); p.mesh.getWorldPosition(target);
  const off = p.data.radius * 4 + 5;
  camera.position.set(target.x + off, target.y + off * 0.5, target.z + off);
  controls.target.copy(target); controls.update();
  openInspectMode(index);
}

function buildPlanetSelector() {
  const c = document.getElementById('hud-planet-selector'); c.innerHTML = '';
  PLANET_DATA.forEach((p, i) => {
    const d = document.createElement('div');
    d.className = 'hud-planet-dot';
    d.style.background = `radial-gradient(circle at 35% 35%, ${lightenColor(p.color)}, #${p.color.toString(16).padStart(6,'0')})`;
    d.innerHTML = `<span class="dot-label">${p.name}</span>`;
    d.addEventListener('click', () => focusOnPlanet(i));
    c.appendChild(d);
  });
}

function initHUDControls() {
  document.getElementById('hud-back').addEventListener('click', () => {
    document.getElementById('solar-overlay').style.display = 'none'; isOverlayOpen = false;
    stopGestureTracking();
    stopARCamera();
  });

  // AR Camera & QR Controls
  const arCamBtn = document.getElementById('hud-ar-cam');
  if (arCamBtn) arCamBtn.addEventListener('click', toggleARCamera);

  const switchCamBtn = document.getElementById('hud-switch-cam');
  if (switchCamBtn) switchCamBtn.addEventListener('click', switchARCameraFacing);

  const qrBtn = document.getElementById('hud-qr');
  if (qrBtn) qrBtn.addEventListener('click', openQRModal);

  const pauseBtn = document.getElementById('hud-pause');
  pauseBtn.addEventListener('click', () => {
    animationPaused = !animationPaused;
    pauseBtn.innerHTML = animationPaused ? '<i class="fas fa-play"></i>' : '<i class="fas fa-pause"></i>';
  });

  document.querySelectorAll('.hud-speed-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.hud-speed-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      animationSpeed = parseFloat(btn.dataset.speed);
    });
  });

  const orbitsBtn = document.getElementById('hud-orbits'); orbitsBtn.classList.add('active');
  orbitsBtn.addEventListener('click', () => {
    showOrbits = !showOrbits; orbitsBtn.classList.toggle('active');
    planetMeshes.forEach(p => { if (p.orbitLine) p.orbitLine.visible = showOrbits; });
  });

  const labelsBtn = document.getElementById('hud-labels'); labelsBtn.classList.add('active');
  labelsBtn.addEventListener('click', () => {
    showLabels = !showLabels; labelsBtn.classList.toggle('active');
    labelSprites.forEach(s => { s.visible = showLabels; });
  });

  const soundBtn = document.getElementById('hud-sound');
  soundBtn.addEventListener('click', () => { soundOn = !soundOn; soundBtn.classList.toggle('active'); soundOn ? startAmbientSound() : stopAmbientSound(); });

  document.getElementById('hud-reset').addEventListener('click', () => {
    camera.position.set(0, 30, 50); controls.target.set(0, 0, 0); controls.update();
    document.getElementById('hud-info-card').style.display = 'none';
  });

  document.getElementById('hud-fullscreen').addEventListener('click', () => {
    if (!document.fullscreenElement) document.getElementById('solar-overlay').requestFullscreen().catch(() => {});
    else document.exitFullscreen();
  });

  document.getElementById('hud-info-close').addEventListener('click', () => { document.getElementById('hud-info-card').style.display = 'none'; });

  // Gesture toggle button
  document.getElementById('hud-gesture').addEventListener('click', toggleGestures);
}

function onWindowResize() {
  if (!camera || !renderer) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

/* ============================================================
   10. AMBIENT SOUND  (Web Audio API drone)
   ============================================================ */
function startAmbientSound() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  audioOsc = audioCtx.createOscillator(); audioOsc.type = 'sine'; audioOsc.frequency.setValueAtTime(55, audioCtx.currentTime);
  audioGain = audioCtx.createGain(); audioGain.gain.setValueAtTime(0, audioCtx.currentTime);
  audioGain.gain.linearRampToValueAtTime(0.08, audioCtx.currentTime + 1);
  const o2 = audioCtx.createOscillator(); o2.type = 'sine'; o2.frequency.setValueAtTime(82.5, audioCtx.currentTime);
  const g2 = audioCtx.createGain(); g2.gain.setValueAtTime(0.04, audioCtx.currentTime);
  audioOsc.connect(audioGain); audioGain.connect(audioCtx.destination);
  o2.connect(g2); g2.connect(audioCtx.destination);
  audioOsc.start(); o2.start(); audioOsc._o2 = o2; audioOsc._g2 = g2;
}
function stopAmbientSound() {
  if (!audioOsc) return;
  try {
    audioGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.5);
    audioOsc._g2.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.5);
    setTimeout(() => { try { audioOsc.stop(); audioOsc._o2.stop(); } catch(e){} audioOsc = null; }, 600);
  } catch(e) { audioOsc = null; }
}

/* ============================================================
   11. HAND GESTURE TRACKING  (MediaPipe Hands)
   ============================================================ */
let gestureActive = false;
let mpHands = null;
let mpCamera = null;
let prevHandX = null, prevHandY = null;

// Gesture state
let currentGesture = 'none';
let fistToggleReady = true; // debounce fist toggle

function toggleGestures() {
  const btn = document.getElementById('hud-gesture');
  if (!gestureActive) {
    startGestureTracking();
    btn.classList.add('active');
  } else {
    stopGestureTracking();
    btn.classList.remove('active');
  }
}

async function startGestureTracking() {
  const statusEl = document.getElementById('gesture-status');
  const videoEl = document.getElementById('gesture-video');
  const canvasEl = document.getElementById('gesture-canvas');

  // Check if MediaPipe Hands is available
  if (typeof window.Hands === 'undefined') {
    alert('Hand gesture tracking requires MediaPipe Hands. Make sure the CDN scripts loaded properly and you are on HTTPS.');
    return;
  }

  statusEl.style.display = 'flex';
  gestureActive = true;

  // Initialise MediaPipe Hands
  mpHands = new window.Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`
  });

  mpHands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.6,
    minTrackingConfidence: 0.5
  });

  mpHands.onResults(onHandResults);

  // Start camera
  try {
    mpCamera = new window.Camera(videoEl, {
      onFrame: async () => { if (mpHands && gestureActive) await mpHands.send({ image: videoEl }); },
      width: 320,
      height: 240
    });
    await mpCamera.start();
  } catch (err) {
    console.error('Camera error:', err);
    alert('Could not access camera. Please allow camera permission and use HTTPS.');
    gestureActive = false;
    statusEl.style.display = 'none';
  }
}

function stopGestureTracking() {
  gestureActive = false;
  if (mpCamera) { mpCamera.stop(); mpCamera = null; }
  mpHands = null;
  prevHandX = null; prevHandY = null;
  document.getElementById('gesture-status').style.display = 'none';
}

/** Process hand landmarks from MediaPipe */
function onHandResults(results) {
  const canvasEl = document.getElementById('gesture-canvas');
  const ctx = canvasEl.getContext('2d');
  canvasEl.width = 320; canvasEl.height = 240;
  ctx.clearRect(0, 0, 320, 240);

  if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
    updateGestureUI('none', '🖐️', 'No hand detected');
    prevHandX = null; prevHandY = null;
    return;
  }

  const lm = results.multiHandLandmarks[0]; // first hand

  // Draw landmarks on overlay canvas
  if (window.drawConnectors && window.drawLandmarks) {
    window.drawConnectors(ctx, lm, window.HAND_CONNECTIONS, { color: '#7c3aed', lineWidth: 2 });
    window.drawLandmarks(ctx, lm, { color: '#06b6d4', lineWidth: 1, radius: 3 });
  }

  // ── Determine gesture ──────────────────
  const gesture = classifyGesture(lm);
  applyGesture(gesture, lm);
}

/**
 * Classify the hand gesture from 21 landmarks.
 * Returns one of: 'open_palm', 'fist', 'point', 'pinch', 'peace', 'none'
 */
function classifyGesture(lm) {
  // Fingertip indices: thumb=4, index=8, middle=12, ring=16, pinky=20
  // PIP (second joint): thumb=3, index=6, middle=10, ring=14, pinky=18
  // MCP (knuckle): index=5, middle=9, ring=13, pinky=17

  const tips = [4, 8, 12, 16, 20];
  const pips = [3, 6, 10, 14, 18];

  // Check which fingers are extended (tip above pip in y)
  // Note: y is 0 at top in MediaPipe, so extended means tip.y < pip.y
  const extended = [];
  // Thumb: compare x distance from wrist (works for both hands roughly)
  const thumbExtended = Math.abs(lm[4].x - lm[2].x) > 0.06;
  extended.push(thumbExtended);
  for (let i = 1; i < 5; i++) {
    extended.push(lm[tips[i]].y < lm[pips[i]].y);
  }

  const extCount = extended.filter(Boolean).length;

  // Pinch: thumb tip and index tip very close
  const pinchDist = dist2D(lm[4], lm[8]);
  if (pinchDist < 0.06 && !extended[2] && !extended[3] && !extended[4]) {
    return 'pinch';
  }

  // Fist: no fingers extended
  if (extCount <= 1 && !extended[1] && !extended[2]) return 'fist';

  // Point: only index finger extended
  if (extended[1] && !extended[2] && !extended[3] && !extended[4]) return 'point';

  // Peace: index and middle extended, others closed
  if (extended[1] && extended[2] && !extended[3] && !extended[4]) return 'peace';

  // Open palm: most fingers extended
  if (extCount >= 4) return 'open_palm';

  return 'none';
}

function dist2D(a, b) { return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2); }

/** Apply the detected gesture to control the 3D scene */
function applyGesture(gesture, lm) {
  const wrist = lm[0]; // use wrist as reference point

  switch (gesture) {
    case 'open_palm': {
      updateGestureUI('open_palm', '🖐️', 'Rotating');
      // Map hand movement to orbit rotation
      if (prevHandX !== null && controls) {
        const dx = (wrist.x - prevHandX) * 5;
        const dy = (wrist.y - prevHandY) * 5;
        // Rotate the camera azimuthally and polar
        const spherical = new THREE.Spherical().setFromVector3(
          camera.position.clone().sub(controls.target)
        );
        spherical.theta -= dx * 0.05;
        spherical.phi -= dy * 0.05;
        spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));
        camera.position.copy(
          new THREE.Vector3().setFromSpherical(spherical).add(controls.target)
        );
        camera.lookAt(controls.target);
      }
      prevHandX = wrist.x; prevHandY = wrist.y;
      break;
    }
    case 'pinch': {
      updateGestureUI('pinch', '🤏', 'Zooming');
      // Use thumb-index distance change for zoom
      const pinchDist = dist2D(lm[4], lm[8]);
      if (prevHandX !== null) {
        const delta = (pinchDist - prevHandX) * 80;
        camera.position.lerp(controls.target, delta > 0 ? 0.02 : -0.02);
      }
      prevHandX = pinchDist; prevHandY = 0;
      break;
    }
    case 'point': {
      updateGestureUI('point', '👆', 'Selecting');
      // Use index fingertip position to raycast
      const ix = lm[8].x * 2 - 1;   // normalise to -1..1 (note: mirrored)
      const iy = -(lm[8].y * 2 - 1);
      mouse.set(-ix, iy); // mirror x
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(planetMeshes.map(p => p.mesh));
      if (hits.length > 0) showPlanetInfoCard(hits[0].object.userData.planetIndex);
      prevHandX = null; prevHandY = null;
      break;
    }
    case 'fist': {
      updateGestureUI('fist', '✊', animationPaused ? 'Paused' : 'Resumed');
      if (fistToggleReady) {
        animationPaused = !animationPaused;
        document.getElementById('hud-pause').innerHTML = animationPaused
          ? '<i class="fas fa-play"></i>' : '<i class="fas fa-pause"></i>';
        fistToggleReady = false;
        setTimeout(() => { fistToggleReady = true; }, 1500); // 1.5s debounce
      }
      prevHandX = null; prevHandY = null;
      break;
    }
    case 'peace': {
      updateGestureUI('peace', '✌️', 'Reset View');
      camera.position.set(0, 30, 50);
      controls.target.set(0, 0, 0); controls.update();
      document.getElementById('hud-info-card').style.display = 'none';
      prevHandX = null; prevHandY = null;
      break;
    }
    default:
      updateGestureUI('none', '🖐️', 'Move your hand');
      prevHandX = null; prevHandY = null;
  }
}

function updateGestureUI(gesture, icon, label) {
  if (currentGesture !== gesture) {
    currentGesture = gesture;
    document.getElementById('gesture-icon').textContent = icon;
    document.getElementById('gesture-label').textContent = label;
  }
}

/* ============================================================
   12. UTILITY FUNCTIONS
   ============================================================ */
function hexToRgba(hex, alpha) {
  const r = (hex >> 16) & 0xff, g = (hex >> 8) & 0xff, b = hex & 0xff;
  return `rgba(${r},${g},${b},${alpha})`;
}
function lightenColor(hex) {
  const r = Math.min(255, ((hex >> 16) & 0xff) + 80);
  const g = Math.min(255, ((hex >> 8) & 0xff) + 80);
  const b = Math.min(255, (hex & 0xff) + 80);
  return `rgb(${r},${g},${b})`;
}

/* ============================================================
   13. BACKEND API INTEGRATION
   ============================================================ */

// Auto-detect API base URL (same origin when served from Express)
const API_BASE = window.location.port === '3000'
  ? ''  // served from Express directly
  : 'http://localhost:3000'; // dev: frontend on different port

/** Helper: make authenticated API requests */
async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('sv_token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  } catch (err) {
    // If the server isn't running, fail silently (offline mode)
    if (err instanceof TypeError && err.message.includes('fetch')) {
      console.warn('Backend not available — running in offline mode.');
      return null;
    }
    throw err;
  }
}

/* ---------- AUTH STATE & LOCAL DATABASE ---------- */
let currentUser = null;

/** Get all registered users from localStorage (no default hardcoded password) */
function getUsersDB() {
  try {
    const db = JSON.parse(localStorage.getItem('sv_users_db_v2') || '{}');
    return db;
  } catch (e) {
    return {};
  }
}

/** Save a newly registered user to localStorage */
function saveUserToDB(username, email, password) {
  const db = getUsersDB();
  const key = email.toLowerCase().trim();
  db[key] = {
    username: username.trim(),
    email: email.trim(),
    password: password,
    registeredAt: new Date().toISOString()
  };
  localStorage.setItem('sv_users_db_v2', JSON.stringify(db));
  return db[key];
}

/** Record login history so previous login data is preserved and visible */
function recordLoginHistory(user) {
  let history = [];
  try {
    history = JSON.parse(localStorage.getItem('sv_login_history') || '[]');
  } catch (e) { history = []; }

  history.unshift({
    username: user.username,
    email: user.email,
    loginAt: new Date().toLocaleString()
  });
  // Keep last 20 logins
  localStorage.setItem('sv_login_history', JSON.stringify(history.slice(0, 20)));
}

/** Reveal the entire SolarVerse webpage after successful login */
function unlockMainApp(user) {
  currentUser = user;
  localStorage.setItem('sv_user', JSON.stringify(user));
  localStorage.setItem('sv_token', 'local-token-' + Date.now());
  recordLoginHistory(user);

  const gate = document.getElementById('auth-gate');
  const mainApp = document.getElementById('main-app');
  const modal = document.getElementById('auth-modal');

  if (modal) modal.classList.remove('active');
  if (mainApp) mainApp.style.display = 'block';

  if (gate) {
    gate.classList.add('hidden');
    setTimeout(() => { gate.style.display = 'none'; }, 400);
  }

  updateAuthUI(true);
  fetchLeaderboard(currentLBDifficulty);

  // Trigger resize so star canvas and 3D renderers adjust to full window
  setTimeout(() => {
    window.dispatchEvent(new Event('resize'));
  }, 60);
}

function updateAuthUI(loggedIn) {
  const label = document.getElementById('nav-auth-label');
  if (!label) return;
  if (loggedIn && currentUser) {
    label.textContent = currentUser.username || currentUser.email.split('@')[0];
  } else {
    label.textContent = 'Login';
  }
}

function logout() {
  localStorage.removeItem('sv_token');
  localStorage.removeItem('sv_user');
  currentUser = null;
  updateAuthUI(false);

  const dd = document.getElementById('profile-dropdown');
  if (dd) dd.style.display = 'none';

  // Show Auth Gate again for a new registration / login
  const gate = document.getElementById('auth-gate');
  const mainApp = document.getElementById('main-app');
  if (mainApp) mainApp.style.display = 'none';
  if (gate) {
    gate.style.display = 'flex';
    requestAnimationFrame(() => gate.classList.remove('hidden'));
    // Clear login inputs so a new login can be done cleanly
    const loginEmail = document.getElementById('gate-login-email');
    const loginPass  = document.getElementById('gate-login-password');
    if (loginEmail) loginEmail.value = '';
    if (loginPass)  loginPass.value = '';
    switchGateTab('login');
  }
}

/** Animated star background for the Auth Gate screen */
function initAuthStarCanvas() {
  const canvas = document.getElementById('auth-star-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let stars = [];
  const COUNT = 200;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  function create() {
    stars = [];
    for (let i = 0; i < COUNT; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.6 + 0.3,
        alpha: Math.random(),
        speed: Math.random() * 0.006 + 0.002
      });
    }
  }
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const s of stars) {
      s.alpha += s.speed;
      const a = 0.25 + 0.75 * Math.abs(Math.sin(s.alpha));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200,210,255,${a})`;
      ctx.fill();
    }
    requestAnimationFrame(draw);
  }
  resize(); create(); draw();
  window.addEventListener('resize', () => { resize(); create(); });
}

/** Switch between Register and Login tabs on the initial Auth Gate */
function switchGateTab(tabName, prefillEmail = '', statusMsg = '', isSuccess = false) {
  const tabLogin = document.getElementById('gate-tab-login');
  const tabReg   = document.getElementById('gate-tab-register');
  const formLogin = document.getElementById('gate-login-form');
  const formReg   = document.getElementById('gate-register-form');
  const msgLogin  = document.getElementById('gate-login-msg');
  const msgReg    = document.getElementById('gate-reg-msg');

  if (!tabLogin || !tabReg || !formLogin || !formReg) return;

  if (msgLogin) { msgLogin.textContent = ''; msgLogin.className = 'auth-msg'; }
  if (msgReg)   { msgReg.textContent = '';   msgReg.className = 'auth-msg'; }

  if (tabName === 'login') {
    tabLogin.classList.add('active');
    tabReg.classList.remove('active');
    formLogin.style.display = 'flex';
    formReg.style.display = 'none';
    const emailInput = document.getElementById('gate-login-email');
    const passInput  = document.getElementById('gate-login-password');
    if (passInput) passInput.value = ''; // Never auto-fill password; user must enter it
    if (prefillEmail && emailInput) {
      emailInput.value = prefillEmail;
      if (passInput) passInput.focus();
    }
    if (statusMsg && msgLogin) {
      msgLogin.textContent = statusMsg;
      msgLogin.className = 'auth-msg ' + (isSuccess ? 'success' : 'error');
    }
  } else {
    tabReg.classList.add('active');
    tabLogin.classList.remove('active');
    formReg.style.display = 'flex';
    formLogin.style.display = 'none';
    if (statusMsg && msgReg) {
      msgReg.textContent = statusMsg;
      msgReg.className = 'auth-msg ' + (isSuccess ? 'success' : 'error');
    }
  }
}

/* ---------- AUTH INITIALIZATION ---------- */
function initAuth() {
  initAuthStarCanvas();

  // 1. Auth Gate Elements (Full-screen initial page)
  const tabLogin = document.getElementById('gate-tab-login');
  const tabReg   = document.getElementById('gate-tab-register');
  const switchToLogin = document.getElementById('gate-switch-to-login');
  const switchToReg   = document.getElementById('gate-switch-to-register');
  const gateRegForm   = document.getElementById('gate-register-form');
  const gateLoginForm = document.getElementById('gate-login-form');

  if (tabLogin) tabLogin.addEventListener('click', () => switchGateTab('login'));
  if (tabReg)   tabReg.addEventListener('click', () => switchGateTab('register'));
  if (switchToLogin) switchToLogin.addEventListener('click', e => { e.preventDefault(); switchGateTab('login'); });
  if (switchToReg)   switchToReg.addEventListener('click', e => { e.preventDefault(); switchGateTab('register'); });

  // Gate Register Submit: Step 1 -> User registers their credentials, then switches to Login
  if (gateRegForm) {
    gateRegForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name     = document.getElementById('gate-reg-name').value.trim();
      const email    = document.getElementById('gate-reg-email').value.trim();
      const password = document.getElementById('gate-reg-password').value;
      const confirm  = document.getElementById('gate-reg-confirm').value;
      const msgEl    = document.getElementById('gate-reg-msg');

      if (!name || !email || !password) {
        msgEl.textContent = 'Please fill in all fields.';
        msgEl.className = 'auth-msg error';
        return;
      }
      if (password !== confirm) {
        msgEl.textContent = 'Passwords do not match! Please re-enter.';
        msgEl.className = 'auth-msg error';
        return;
      }

      // Save user credentials in local database
      saveUserToDB(name, email, password);

      // Optional background sync with server if running
      apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username: name, email, password })
      }).catch(() => {});

      gateRegForm.reset();

      // Switch to Login tab so user must now log in with their registered credentials
      switchGateTab(
        'login',
        email,
        '✅ Registration successful! Now please login with your registered email and password.',
        true
      );
    });
  }

  // Gate Login Submit: Step 2 -> Strictly verify against registered credentials
  if (gateLoginForm) {
    gateLoginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email    = document.getElementById('gate-login-email').value.trim();
      const password = document.getElementById('gate-login-password').value;
      const msgEl    = document.getElementById('gate-login-msg');

      const db = getUsersDB();
      const key = email.toLowerCase();
      const registeredUser = db[key];

      if (!registeredUser) {
        msgEl.textContent = '❌ Account not found! Please register first before logging in.';
        msgEl.className = 'auth-msg error';
        return;
      }

      if (registeredUser.password !== password) {
        msgEl.textContent = '❌ Wrong password! Please enter the exact password you used in Register.';
        msgEl.className = 'auth-msg error';
        return;
      }

      msgEl.textContent = '✅ Login successful! Opening SolarVerse...';
      msgEl.className = 'auth-msg success';
      gateLoginForm.reset();
      unlockMainApp({ username: registeredUser.username, email: registeredUser.email });
    });
  }

  // 2. In-App Auth Modal (accessible from navbar)
  const modal = document.getElementById('auth-modal');
  const modalTabs = modal ? modal.querySelectorAll('.auth-tab') : [];
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');

  document.getElementById('nav-auth-btn').addEventListener('click', () => {
    if (currentUser) {
      const dd = document.getElementById('profile-dropdown');
      if (dd.style.display === 'none') {
        document.getElementById('profile-username').textContent = currentUser.username;
        document.getElementById('profile-email').textContent = currentUser.email;
        fetchProfileStats();
        dd.style.display = 'block';
      } else {
        dd.style.display = 'none';
      }
    } else if (modal) {
      modal.classList.add('active');
    }
  });

  if (modal) {
    document.getElementById('auth-modal-close').addEventListener('click', () => modal.classList.remove('active'));
    modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('active'); });

    modalTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        modalTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        loginForm.style.display = tab.dataset.tab === 'login' ? 'flex' : 'none';
        registerForm.style.display = tab.dataset.tab === 'register' ? 'flex' : 'none';
        document.getElementById('login-error').textContent = '';
        document.getElementById('register-error').textContent = '';
      });
    });

    // Modal Login
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;
      const errEl = document.getElementById('login-error');
      errEl.style.color = '#ef4444';
      errEl.textContent = '';

      const db = getUsersDB();
      const user = db[email.toLowerCase()];

      if (!user) {
        errEl.textContent = '❌ Account not found! Please register first.';
        return;
      }
      if (user.password !== password) {
        errEl.textContent = '❌ Wrong password!';
        return;
      }

      loginForm.reset();
      unlockMainApp({ username: user.username, email: user.email });
    });

    // Modal Register
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const username = document.getElementById('reg-username').value.trim();
      const email    = document.getElementById('reg-email').value.trim();
      const password = document.getElementById('reg-password').value;
      saveUserToDB(username, email, password);
      registerForm.reset();
      // Switch modal to login tab with email pre-filled
      modalTabs.forEach(t => t.classList.toggle('active', t.dataset.tab === 'login'));
      loginForm.style.display = 'flex';
      registerForm.style.display = 'none';
      document.getElementById('login-email').value = email;
      document.getElementById('login-password').value = '';
      document.getElementById('login-error').style.color = '#00f5d4';
      document.getElementById('login-error').textContent = '✅ Registered! Now enter your password to login.';
    });
  }

  // Logout button
  document.getElementById('btn-logout').addEventListener('click', logout);

  // Close profile dropdown on outside click
  document.addEventListener('click', (e) => {
    const dd = document.getElementById('profile-dropdown');
    const btn = document.getElementById('nav-auth-btn');
    if (dd && dd.style.display !== 'none' && !dd.contains(e.target) && !btn.contains(e.target)) {
      dd.style.display = 'none';
    }
  });
}

async function fetchProfileStats() {
  // Preserve and display cumulative data from previous and current logins
  const localScores = JSON.parse(localStorage.getItem('sv_local_scores') || '[]');
  const localVisits = JSON.parse(localStorage.getItem('sv_local_visits') || '[]');
  document.getElementById('ps-quizzes').textContent = localScores.length;
  document.getElementById('ps-planets').textContent = localVisits.length;

  // Also show previous login info inside profile dropdown if available
  const history = JSON.parse(localStorage.getItem('sv_login_history') || '[]');
  let prevInfoEl = document.getElementById('profile-prev-logins');
  if (!prevInfoEl) {
    prevInfoEl = document.createElement('div');
    prevInfoEl.id = 'profile-prev-logins';
    prevInfoEl.style.cssText = 'margin-top:12px;padding-top:10px;border-top:1px solid rgba(255,255,255,0.1);font-size:0.76rem;color:var(--text-muted);max-height:90px;overflow-y:auto;';
    const statsEl = document.getElementById('profile-stats-mini');
    if (statsEl && statsEl.parentNode) {
      statsEl.parentNode.insertBefore(prevInfoEl, document.getElementById('btn-logout'));
    }
  }
  if (history.length > 1) {
    const prevList = history.slice(1, 5).map(h => `<div>• ${h.username} (${h.email})</div>`).join('');
    prevInfoEl.innerHTML = `<strong style="color:var(--accent-cyan);display:block;margin-bottom:4px;">Previous Logins:</strong>${prevList}`;
  } else {
    prevInfoEl.innerHTML = `<strong style="color:var(--accent-cyan);display:block;">Active Session</strong>`;
  }

  try {
    const data = await apiFetch('/api/auth/profile');
    if (data && data.user) {
      document.getElementById('ps-quizzes').textContent = data.user.stats.quizAttempts;
      document.getElementById('ps-planets').textContent = data.user.stats.planetsVisited;
    }
  } catch (e) { /* offline */ }
}

/* ---------- QUIZ SCORE SUBMISSION ---------- */
async function submitQuizScore(difficulty, score, total, timeSeconds) {
  // Always save locally so all previous & new users' scores appear on the leaderboard
  const localScores = JSON.parse(localStorage.getItem('sv_local_scores') || '[]');
  localScores.push({
    username: currentUser ? currentUser.username : 'Explorer',
    email: currentUser ? currentUser.email : '',
    difficulty,
    score,
    total,
    time_seconds: timeSeconds,
    created_at: new Date().toISOString()
  });
  localStorage.setItem('sv_local_scores', JSON.stringify(localScores));

  try {
    if (currentUser) {
      await apiFetch('/api/quiz/submit', {
        method: 'POST',
        body: JSON.stringify({ difficulty, score, total, timeSeconds })
      });
    }
  } catch (e) { /* offline */ }
  fetchLeaderboard(difficulty);
}

/* ---------- LEADERBOARD ---------- */
let currentLBDifficulty = 'easy';

function initLeaderboard() {
  const tabs = document.querySelectorAll('[data-lb]');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentLBDifficulty = tab.dataset.lb;
      fetchLeaderboard(currentLBDifficulty);
    });
  });
  fetchLeaderboard('easy');
}

async function fetchLeaderboard(difficulty) {
  const body = document.getElementById('leaderboard-body');
  let entries = [];

  try {
    const data = await apiFetch(`/api/quiz/leaderboard?difficulty=${difficulty}&limit=10`);
    if (data && data.leaderboard && data.leaderboard.length > 0) {
      entries = data.leaderboard;
    }
  } catch (e) { /* offline */ }

  // Fallback to local scores (retains data across all previous and current logins)
  if (entries.length === 0) {
    const localScores = JSON.parse(localStorage.getItem('sv_local_scores') || '[]');
    entries = localScores
      .filter(s => s.difficulty === difficulty)
      .sort((a, b) => b.score - a.score || a.time_seconds - b.time_seconds)
      .slice(0, 10);
  }

  if (entries.length === 0) {
    body.innerHTML = '<tr><td colspan="5" class="lb-empty">No scores yet — play a quiz to be the first!</td></tr>';
    return;
  }

  body.innerHTML = entries.map((entry, i) => {
    const rank = i + 1;
    const rankClass = rank <= 3 ? `rank-${rank}` : '';
    const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank;
    const m = Math.floor(entry.time_seconds / 60);
    const s = String(entry.time_seconds % 60).padStart(2, '0');
    const date = new Date(entry.created_at).toLocaleDateString();
    return `<tr class="${rankClass}">
      <td>${medal}</td>
      <td>${entry.username}</td>
      <td>${entry.score}/${entry.total}</td>
      <td>${m}:${s}</td>
      <td>${date}</td>
    </tr>`;
  }).join('');
}

/* ---------- PLANET VISIT TRACKING ---------- */
async function trackPlanetVisit(planetName) {
  const localVisits = JSON.parse(localStorage.getItem('sv_local_visits') || '[]');
  if (!localVisits.includes(planetName)) {
    localVisits.push(planetName);
    localStorage.setItem('sv_local_visits', JSON.stringify(localVisits));
  }
  if (!currentUser) return;
  try {
    await apiFetch('/api/progress/visit', {
      method: 'POST',
      body: JSON.stringify({ planetName })
    });
  } catch (e) { /* offline */ }
}

/* ============================================================
   14. PHONE QR CODE & AUTO AR CAMERA LAUNCH
   ============================================================ */
let detectedLanIP = '10.221.6.130'; // Detected Wi-Fi IPv4 address

function detectLocalLanIP() {
  try {
    const RTCPeer = window.RTCPeerConnection || window.webkitRTCPeerConnection;
    if (!RTCPeer) return;
    const pc = new RTCPeer({ iceServers: [] });
    pc.createDataChannel('');
    pc.createOffer().then(offer => pc.setLocalDescription(offer)).catch(() => {});
    pc.onicecandidate = ice => {
      if (!ice || !ice.candidate || !ice.candidate.candidate) return;
      const match = /([0-9]{1,3}(\.[0-9]{1,3}){3})/.exec(ice.candidate.candidate);
      if (match && match[1] && !match[1].startsWith('127.')) {
        detectedLanIP = match[1];
        pc.onicecandidate = null;
        pc.close();
      }
    };
  } catch (e) { /* ignore */ }
}
detectLocalLanIP();

function isARLaunchUrl() {
  const params = new URLSearchParams(window.location.search);
  return (
    params.get('ar') === '1' ||
    window.location.search.includes('ar=1') ||
    window.location.hash.toLowerCase().includes('ar')
  );
}

function buildPhoneARUrl() {
  try {
    const u = new URL(window.location.href);
    if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') {
      u.hostname = detectedLanIP;
    }
    u.searchParams.set('ar', '1');
    u.hash = 'ar';
    return u.toString();
  } catch (e) {
    return `http://${detectedLanIP}:5500/index.html?ar=1#ar`;
  }
}

function renderQRCode(urlText) {
  const container = document.getElementById('qr-code-container');
  if (!container) return;
  container.innerHTML = '';

  if (typeof window.qrcode === 'function') {
    try {
      const qr = window.qrcode(0, 'M');
      qr.addData(urlText);
      qr.make();
      container.innerHTML = qr.createSvgTag({ cellSize: 5, margin: 2, scalable: true });
      return;
    } catch (e) {
      console.warn('Local QR generator error, using fallback:', e);
    }
  }

  // Fallback image QR generator
  const img = document.createElement('img');
  img.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(urlText)}`;
  img.alt = 'Scan QR Code for Phone AR';
  container.appendChild(img);
}

function openQRModal(e) {
  if (e && e.preventDefault) e.preventDefault();
  const modal = document.getElementById('qr-modal');
  const input = document.getElementById('qr-url-input');
  if (!modal || !input) return;

  const url = buildPhoneARUrl();
  input.value = url;
  renderQRCode(url);
  modal.classList.add('active');
}

function launchDirectMobileAR(fromTap = false) {
  if (!currentUser) {
    unlockMainApp({ username: 'Mobile AR Explorer', email: 'ar@solarverse.app' });
  }
  launchSolarSystem(null, true);
  if (fromTap) {
    startARCamera(true);
  }
}

function initQRModal() {
  const modal = document.getElementById('qr-modal');
  const closeBtn = document.getElementById('qr-modal-close');
  const input = document.getElementById('qr-url-input');
  const copyBtn = document.getElementById('btn-copy-qr-url');
  const launchBtn = document.getElementById('btn-launch-ar-from-qr');
  const gateDirectArBtn = document.getElementById('gate-direct-ar-btn');

  ['gate-qr-btn', 'nav-open-qr', 'btn-hero-qr', 'hud-qr'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', openQRModal);
  });

  if (gateDirectArBtn) {
    gateDirectArBtn.addEventListener('click', () => launchDirectMobileAR(true));
  }

  if (closeBtn) closeBtn.addEventListener('click', () => modal.classList.remove('active'));
  if (modal) modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('active'); });

  if (input) {
    input.addEventListener('input', () => {
      const val = input.value.trim();
      if (val) renderQRCode(val);
    });
  }

  if (copyBtn && input) {
    copyBtn.addEventListener('click', () => {
      navigator.clipboard?.writeText(input.value).then(() => {
        copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
        setTimeout(() => { copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy'; }, 1800);
      }).catch(() => {
        input.select();
        document.execCommand('copy');
      });
    });
  }

  if (launchBtn) {
    launchBtn.addEventListener('click', () => {
      modal.classList.remove('active');
      launchDirectMobileAR(true);
    });
  }

  // Also listen for hashchange in case user adds #ar
  window.addEventListener('hashchange', () => {
    if (isARLaunchUrl()) launchDirectMobileAR(false);
  });
}

/* ============================================================
   15. INIT
   ============================================================ */
function initLaunchButton() {
  document.getElementById('btn-launch-ar').addEventListener('click', () => launchSolarSystem(null, true));
}

function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const id = anchor.getAttribute('href');
      if (id === '#') return;
      const el = document.querySelector(id);
      if (el) { e.preventDefault(); el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const autoLaunchAR = isARLaunchUrl();
  if (autoLaunchAR) {
    // Unlock immediately so login page never blocks QR code scan on phones
    unlockMainApp({ username: 'Mobile AR Explorer', email: 'ar@solarverse.app' });
  }

  preloadTextures(); // Generate procedural planet textures (fast 256x128 on mobile)
  initAuth();
  initQRModal();
  initLaunchButton();

  // If opened via QR code (?ar=1 or #ar), launch the 3D/AR Solar System right away!
  if (autoLaunchAR) {
    launchDirectMobileAR(false);
  }

  // Initialize remaining page sections
  initStarCanvas();
  initNavigation();
  initPlanetCards();
  initModal();
  initQuiz();
  initSmoothScroll();
  initLeaderboard();
  console.log('🪐 SolarVerse v8 — Mobile AR QR Launch & Shared WebGL Context Ready!');
});
