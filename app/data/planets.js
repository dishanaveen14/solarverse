/**
 * SolarVerse Astronomical Dataset
 * Accurate physical characteristics and orbital properties for celestial bodies.
 */

export const PLANETS = [
  {
    id: 'sun',
    name: 'Sun',
    type: 'Yellow Dwarf Star (G2V)',
    color: '#fbbf24',
    secondaryColor: '#ea580c',
    glowColor: 'rgba(251, 191, 36, 0.4)',
    radius: 4.8,
    orbitRadius: 0,
    orbitSpeed: 0,
    rotationSpeed: 0.002,
    diameter: '1,392,700 km',
    distanceFromSun: '0 km (Center)',
    orbitalPeriod: '— (Galactic orbit: 230M yrs)',
    dayLength: '25 – 35 Earth days',
    moons: 0,
    temperature: '5,500°C (Surface) / 15M°C (Core)',
    atmosphere: '73% Hydrogen, 25% Helium, trace plasma',
    summary: 'The radiant powerhouse at the core of our planetary system, containing 99.86% of all mass in the Solar System.',
    facts: [
      'Over 1.3 million Earths could fit inside the volume of the Sun.',
      'Photons born in the solar core take roughly 100,000 years to reach the surface, then just 8 minutes to travel to Earth.',
      'The solar wind sculpts the heliosphere, shielding all planets from deep galactic cosmic radiation.'
    ]
  },
  {
    id: 'mercury',
    name: 'Mercury',
    type: 'Terrestrial Planet',
    color: '#94a3b8',
    secondaryColor: '#475569',
    glowColor: 'rgba(148, 163, 184, 0.25)',
    radius: 0.8,
    orbitRadius: 9,
    orbitSpeed: 0.04,
    rotationSpeed: 0.004,
    diameter: '4,879 km',
    distanceFromSun: '57.9 million km (0.39 AU)',
    orbitalPeriod: '88 Earth days',
    dayLength: '59 Earth days',
    moons: 0,
    temperature: '-180°C to 430°C',
    atmosphere: 'Ultra-thin exosphere (Oxygen, Sodium, Hydrogen)',
    summary: 'A cratered, heavily iron-rich world experiencing the most violent temperature swings in the Solar System.',
    facts: [
      'Mercury has virtually no atmosphere to trap heat, causing 600°C swings between day and night.',
      'Despite proximity to the Sun, water ice exists permanently shielded inside deep polar craters.',
      'Its immense metallic iron core comprises nearly 85% of the planet\'s total radius.'
    ]
  },
  {
    id: 'venus',
    name: 'Venus',
    type: 'Terrestrial Planet',
    color: '#fde047',
    secondaryColor: '#ca8a04',
    glowColor: 'rgba(250, 204, 21, 0.3)',
    radius: 1.4,
    orbitRadius: 14,
    orbitSpeed: 0.025,
    rotationSpeed: -0.002, // Retrograde
    diameter: '12,104 km',
    distanceFromSun: '108.2 million km (0.72 AU)',
    orbitalPeriod: '225 Earth days',
    dayLength: '243 Earth days',
    moons: 0,
    temperature: '465°C (Constant)',
    atmosphere: '96.5% Carbon Dioxide, sulfuric acid clouds',
    summary: 'Earth’s twin in size and mass, encased in runaway greenhouse clouds that make it the hottest planet in the Solar System.',
    facts: [
      'Venus rotates backwards compared to most planets, with the Sun rising in the west and setting in the east.',
      'A single Venusian day lasts longer than an entire Venusian year.',
      'Surface atmospheric pressure equals the pressure found 900 meters deep in Earth\'s oceans.'
    ]
  },
  {
    id: 'earth',
    name: 'Earth',
    type: 'Terrestrial Planet',
    color: '#38bdf8',
    secondaryColor: '#16a34a',
    glowColor: 'rgba(56, 189, 248, 0.35)',
    radius: 1.5,
    orbitRadius: 20,
    orbitSpeed: 0.018,
    rotationSpeed: 0.015,
    diameter: '12,742 km',
    distanceFromSun: '149.6 million km (1.00 AU)',
    orbitalPeriod: '365.25 days',
    dayLength: '23 hrs 56 mins',
    moons: 1,
    temperature: '-88°C to 58°C (Avg: 15°C)',
    atmosphere: '78% Nitrogen, 21% Oxygen, 1% Argon & trace gases',
    summary: 'An ocean-draped haven of biodiversity, shielded by a robust magnetosphere and the only known cradle of life in the universe.',
    facts: [
      'Over 71% of the surface is covered in liquid water, unique among all known solar worlds.',
      'Earth’s molten nickel-iron outer core drives a global magnetic field that deflects lethal solar flares.',
      'The Moon stabilizes Earth\'s axial tilt, preserving a steady seasonal climate over billions of years.'
    ]
  },
  {
    id: 'mars',
    name: 'Mars',
    type: 'Terrestrial Planet',
    color: '#f87171',
    secondaryColor: '#b91c1c',
    glowColor: 'rgba(248, 113, 113, 0.3)',
    radius: 1.0,
    orbitRadius: 26,
    orbitSpeed: 0.014,
    rotationSpeed: 0.014,
    diameter: '6,779 km',
    distanceFromSun: '227.9 million km (1.52 AU)',
    orbitalPeriod: '687 Earth days',
    dayLength: '24 hrs 37 mins',
    moons: 2,
    temperature: '-125°C to 20°C (Avg: -63°C)',
    atmosphere: '95% Carbon Dioxide, 2.6% Nitrogen, 1.9% Argon',
    summary: 'The Red Planet: a rust-tinted desert realm harboring the tallest volcano and deepest canyon in the planetary system.',
    facts: [
      'Olympus Mons stands 21 km high—nearly three times the height of Mount Everest above sea level.',
      'Valles Marineris stretches over 4,000 km, plunging up to 7 km deep across the equator.',
      'Iron oxide (rust) in the surface dust gives Mars its signature crimson glow.'
    ]
  },
  {
    id: 'jupiter',
    name: 'Jupiter',
    type: 'Gas Giant',
    color: '#fb923c',
    secondaryColor: '#c2410c',
    glowColor: 'rgba(251, 146, 60, 0.3)',
    radius: 3.2,
    orbitRadius: 35,
    orbitSpeed: 0.008,
    rotationSpeed: 0.03,
    diameter: '139,820 km',
    distanceFromSun: '778.5 million km (5.20 AU)',
    orbitalPeriod: '11.86 Earth years',
    dayLength: '9 hrs 55 mins',
    moons: 95,
    temperature: '-110°C (Cloud tops)',
    atmosphere: '89% Hydrogen, 10% Helium, methane & ammonia',
    summary: 'The colossal king of planets, spinning at breakneck speed and shielding inner worlds from asteroid incursions.',
    facts: [
      'Jupiter rotates faster than any other planet, completing a rotation in less than 10 hours.',
      'The Great Red Spot is an anticyclonic storm larger than the entire Earth, raging for over 350 years.',
      'Its immense gravitational sphere of influence holds at least 95 confirmed natural satellites.'
    ]
  },
  {
    id: 'saturn',
    name: 'Saturn',
    type: 'Gas Giant',
    color: '#fde68a',
    secondaryColor: '#d97706',
    glowColor: 'rgba(253, 230, 138, 0.3)',
    radius: 2.7,
    orbitRadius: 46,
    orbitSpeed: 0.006,
    rotationSpeed: 0.025,
    hasRings: true,
    ringInnerRadius: 3.4,
    ringOuterRadius: 6.2,
    diameter: '116,460 km',
    distanceFromSun: '1.43 billion km (9.58 AU)',
    orbitalPeriod: '29.45 Earth years',
    dayLength: '10 hrs 33 mins',
    moons: 146,
    temperature: '-140°C (Cloud tops)',
    atmosphere: '96% Hydrogen, 3% Helium, trace hydrocarbons',
    summary: 'The jewel of the solar system, encircled by a breath-taking halo of billions of icy fragments and micro-moons.',
    facts: [
      'Saturn is the only planet in the Solar System with an average density lower than liquid water (0.687 g/cm³).',
      'The majestic ring system spans roughly 282,000 km across, yet measures less than 30 feet in thickness.',
      'Its largest moon, Titan, boasts a thick nitrogen atmosphere with lakes of liquid methane and ethane.'
    ]
  },
  {
    id: 'uranus',
    name: 'Uranus',
    type: 'Ice Giant',
    color: '#67e8f9',
    secondaryColor: '#0891b2',
    glowColor: 'rgba(103, 232, 249, 0.3)',
    radius: 2.0,
    orbitRadius: 56,
    orbitSpeed: 0.004,
    rotationSpeed: -0.018, // Retrograde & tilted
    hasRings: true,
    ringInnerRadius: 2.4,
    ringOuterRadius: 3.2,
    diameter: '50,724 km',
    distanceFromSun: '2.87 billion km (19.2 AU)',
    orbitalPeriod: '84 Earth years',
    dayLength: '17 hrs 14 mins',
    moons: 28,
    temperature: '-224°C (Lowest recorded)',
    atmosphere: '82.5% Hydrogen, 15.2% Helium, 2.3% Methane',
    summary: 'An aquamarine ice giant revolving on its side, shrouded in dynamic upper-atmospheric diamond clouds.',
    facts: [
      'Uranus features an extreme 97.8° axial tilt, effectively rolling along its orbital plane like a bowling ball.',
      'Methane gas in its upper atmosphere absorbs red wavelengths, giving the planet its serene cyan coloration.',
      'With atmospheric lows plunging to -224°C, Uranus holds the record for the coldest recorded planetary temperatures.'
    ]
  },
  {
    id: 'neptune',
    name: 'Neptune',
    type: 'Ice Giant',
    color: '#60a5fa',
    secondaryColor: '#1d4ed8',
    glowColor: 'rgba(96, 165, 250, 0.3)',
    radius: 1.9,
    orbitRadius: 66,
    orbitSpeed: 0.003,
    rotationSpeed: 0.02,
    diameter: '49,244 km',
    distanceFromSun: '4.50 billion km (30.1 AU)',
    orbitalPeriod: '164.8 Earth years',
    dayLength: '16 hrs 6 mins',
    moons: 16,
    temperature: '-218°C (Cloud tops)',
    atmosphere: '80% Hydrogen, 19% Helium, 1.5% Methane',
    summary: 'The distant blue sentinel of our system, lashed by supersonic winds faster than the speed of sound.',
    facts: [
      'Neptune endures the most violent winds in the Solar System, clocked up to a blistering 2,100 km/h (1,300 mph).',
      'It was the first planetary body located through mathematical deduction before optical telescope verification in 1846.',
      'Its largest moon, Triton, orbits in a retrograde direction and expels cryogenic nitrogen geysers.'
    ]
  }
];

export const APP_CONFIG = {
  appName: 'SolarVerse',
  version: '3.0.0',
  deployedUrl: 'https://solarverse-flame.vercel.app',
  tagline: 'Interactive 3D & WebAR Solar System Exploration Platform',
  githubUrl: 'https://github.com/dishanaveen14/solarverse'
};
